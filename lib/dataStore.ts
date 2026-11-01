import { Prisma } from '@prisma/client';
import type { StoredStore, StoredGroup, User, StoredAnimeEntry } from './models';
import { prisma } from './prisma';

function buildGroupVotes(group: any): Record<string, Record<string, { up: number; down: number }>> {
  const voteMap: Record<string, Record<string, { up: number; down: number }>> = {};

  for (const user of group.users || []) {
    voteMap[user.id] = {};
  }

  for (const anime of group.animes || []) {
    const animeId = String(anime.id);
    for (const vote of anime.votes || []) {
      const userId = vote.userId;
      voteMap[userId] ??= {};
      voteMap[userId][animeId] = {
        up: vote.up ?? 0,
        down: vote.down ?? 0,
      };
    }
  }

  return voteMap;
}

function mapDbGroupToStore(group: any): StoredGroup {
  return {
    id: group.id,
    name: group.name,
    users: (group.users || []).map((u: any) => ({ id: u.id, name: u.name })),
    plan: (group.animes || [])
      .filter((a: any) => a.status === 'PLAN')
      .map((a: any) => ({
        id: a.id,
        title: a.title,
        coverImage: a.coverImage || null,
        genres: a.genres || [],
        tags: a.tags || [],
        episodes: a.episodes ?? null,
        startDate: a.startDate || null,
        votes: { up: a.votesUp ?? 0, down: a.votesDown ?? 0 },
      })),
    completed: (group.animes || [])
      .filter((a: any) => a.status === 'COMPLETED')
      .map((a: any) => ({
        id: a.id,
        title: a.title,
        coverImage: a.coverImage || null,
        genres: a.genres || [],
        tags: a.tags || [],
        episodes: a.episodes ?? null,
        startDate: a.startDate || null,
        votes: { up: a.votesUp ?? 0, down: a.votesDown ?? 0 },
      })),
    votes: buildGroupVotes(group),
  };
}

export async function readStore(): Promise<StoredStore> {
  return readStoreDb();
}

export async function readStoreDb(): Promise<StoredStore> {
  const groups = await prisma.group.findMany({
    include: {
      users: true,
      animes: {
        include: { votes: true },
      },
    },
  });

  return { groups: groups.map(mapDbGroupToStore) };
}

function normalizeAnimeEntry(anime: StoredAnimeEntry): StoredAnimeEntry {
  return {
    id: String(anime.id),
    title: anime.title,
    coverImage: anime.coverImage ?? null,
    genres: Array.isArray(anime.genres) ? anime.genres : [],
    tags: Array.isArray((anime as any).tags) ? (anime as any).tags : [],
    episodes: anime.episodes ?? null,
    startDate: anime.startDate ?? null,
  };
}

export async function addAnimeToGroup(groupId: string, anime: StoredAnimeEntry) {
  const entry = normalizeAnimeEntry(anime);

  // A single insert avoids the full-store transaction and leaves existing votes
  // and completion status intact when a request is retried.
  await prisma.anime.createMany({
    data: [{
      id: entry.id,
      title: entry.title,
      coverImage: entry.coverImage,
      genres: entry.genres,
      tags: entry.tags,
      episodes: entry.episodes,
      startDate: entry.startDate ? (entry.startDate as Prisma.InputJsonValue) : Prisma.JsonNull,
      status: 'PLAN',
      groupId,
    }],
    skipDuplicates: true,
  });

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { users: true, animes: { include: { votes: true } } },
  });
  if (!group) throw new Error('Group not found');
  return mapDbGroupToStore(group);
}

async function persistGroups(store: StoredStore, replaceAll: boolean) {
  const operations: Prisma.PrismaPromise<unknown>[] = [];
  const groups = store.groups || [];
  const targetGroupIds = groups.map((group) => group.id);

  if (replaceAll) {
    const staleGroup = { notIn: targetGroupIds };
    operations.push(
      prisma.vote.deleteMany({ where: { OR: [
        { groupId: staleGroup },
        { user: { groupId: staleGroup } },
      ] } }),
      prisma.anime.deleteMany({ where: { groupId: staleGroup } }),
      prisma.user.deleteMany({ where: { groupId: staleGroup } }),
      prisma.group.deleteMany({ where: { id: staleGroup } }),
    );
  }

  for (const group of groups) {
    const userIds = (group.users || []).map((user) => user.id);
    const entries = new Map<string, { anime: StoredAnimeEntry; status: 'PLAN' | 'COMPLETED' }>();
    for (const anime of group.completed || []) {
      entries.set(String(anime.id), { anime, status: 'COMPLETED' });
    }
    for (const anime of group.plan || []) {
      entries.set(String(anime.id), { anime, status: 'PLAN' });
    }
    const animeIds = [...entries.keys()];
    const votes: Prisma.VoteCreateManyInput[] = [];
    const totals = new Map<string, { up: number; down: number }>();
    for (const [userId, voteMap] of Object.entries(group.votes ?? {})) {
      if (!userIds.includes(userId)) continue;
      for (const [animeId, state] of Object.entries(voteMap ?? {})) {
        if (!entries.has(animeId)) continue;
        const up = Number(state?.up ?? 0);
        const down = Number(state?.down ?? 0);
        votes.push({ groupId: group.id, userId, animeId, up, down });
        const total = totals.get(animeId) ?? { up: 0, down: 0 };
        totals.set(animeId, { up: total.up + up, down: total.down + down });
      }
    }

    operations.push(
      prisma.group.upsert({
        where: { id: group.id },
        update: { name: group.name },
        create: { id: group.id, name: group.name },
      }),
      prisma.vote.deleteMany({ where: { groupId: group.id } }),
      prisma.vote.deleteMany({ where: { user: { groupId: group.id, id: { notIn: userIds } } } }),
      prisma.user.deleteMany({ where: { groupId: group.id, id: { notIn: userIds } } }),
      prisma.anime.deleteMany({ where: { groupId: group.id, id: { notIn: animeIds } } }),
    );

    for (const user of group.users || []) {
      operations.push(prisma.user.upsert({
        where: { id: user.id },
        update: { name: user.name, groupId: group.id },
        create: { id: user.id, name: user.name, groupId: group.id },
      }));
    }

    for (const [id, { anime, status }] of entries) {
      const entry = normalizeAnimeEntry(anime);
      const total = totals.get(id) ?? { up: 0, down: 0 };
      const data = {
        title: entry.title,
        coverImage: entry.coverImage,
        genres: entry.genres,
        tags: entry.tags,
        episodes: entry.episodes,
        startDate: entry.startDate ? (entry.startDate as Prisma.InputJsonValue) : Prisma.JsonNull,
        status,
        votesUp: total.up,
        votesDown: total.down,
      };
      operations.push(prisma.anime.upsert({
        where: { groupId_id: { groupId: group.id, id } },
        update: data,
        create: { ...data, id, groupId: group.id },
      }));
    }
    if (votes.length) operations.push(prisma.vote.createMany({ data: votes }));
  }

  // Queue the writes as one atomic batch, without the interactive transaction's
  // short callback deadline or per-anime aggregate queries.
  await prisma.$transaction(operations);
}

export async function writeGroup(group: StoredGroup) {
  return persistGroups({ groups: [group] }, false);
}

export async function writeStoreDb(store: StoredStore) {
  return persistGroups(store, true);
}

export async function writeStore(store: StoredStore) {
  return writeStoreDb(store);
}

export type { StoredStore, StoredGroup, User, StoredAnimeEntry } from './models';
