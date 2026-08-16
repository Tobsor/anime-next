import { Prisma } from '@prisma/client';
import type { Store, Group, User, AnimeEntry } from './models';
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

function mapDbGroupToStore(group: any): Group {
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

export async function readStore(): Promise<Store> {
  return readStoreDb();
}

export async function readStoreDb(): Promise<Store> {
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

function normalizeAnimeEntry(anime: AnimeEntry) {
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

export async function writeStoreDb(store: Store) {
  const targetGroupIds = (store.groups || []).map((group) => group.id);

  await prisma.$transaction(async (tx) => {
    const staleGroups = await tx.group.findMany({
      where: {
        id: {
          notIn: targetGroupIds.length > 0 ? targetGroupIds : ['__none__'],
        },
      },
    });

    for (const staleGroup of staleGroups) {
      await tx.vote.deleteMany({
        where: {
          OR: [{ user: { groupId: staleGroup.id } }, { anime: { groupId: staleGroup.id } }],
        },
      });
      await tx.anime.deleteMany({ where: { groupId: staleGroup.id } });
      await tx.user.deleteMany({ where: { groupId: staleGroup.id } });
      await tx.group.delete({ where: { id: staleGroup.id } });
    }

    for (const group of store.groups || []) {
      await tx.group.upsert({
        where: { id: group.id },
        update: { name: group.name },
        create: { id: group.id, name: group.name },
      });

      const userIds = (group.users || []).map((user) => user.id);
      const existingUsers = await tx.user.findMany({ where: { groupId: group.id } });
      const staleUsers = existingUsers.filter((user) => !userIds.includes(user.id));

      for (const staleUser of staleUsers) {
        await tx.vote.deleteMany({ where: { userId: staleUser.id } });
        await tx.user.delete({ where: { id: staleUser.id } });
      }

      for (const user of group.users || []) {
        await tx.user.upsert({
          where: { id: user.id },
          update: { name: user.name, groupId: group.id },
          create: { id: user.id, name: user.name, groupId: group.id },
        });
      }

      const animeEntries = [...(group.plan || []), ...(group.completed || [])];
      const animeIds = animeEntries.map((anime) => String(anime.id));
      const existingAnimes = await tx.anime.findMany({ where: { groupId: group.id } });
      const staleAnimes = existingAnimes.filter((anime) => !animeIds.includes(anime.id));

      for (const staleAnime of staleAnimes) {
        await tx.vote.deleteMany({ where: { animeId: staleAnime.id } });
        await tx.anime.delete({ where: { id: staleAnime.id } });
      }

      for (const anime of animeEntries) {
        const status = (group.plan || []).some((planAnime) => String(planAnime.id) === String(anime.id)) ? 'PLAN' : 'COMPLETED';
        const entry = normalizeAnimeEntry(anime);
        const startDateValue = entry.startDate ? (entry.startDate as Prisma.InputJsonValue) : Prisma.JsonNull;

        await tx.anime.upsert({
          where: { id: String(anime.id) },
          update: {
            title: entry.title,
            coverImage: entry.coverImage,
            genres: entry.genres,
            tags: entry.tags,
            episodes: entry.episodes,
            startDate: startDateValue,
            status,
            groupId: group.id,
          },
          create: {
            id: entry.id,
            title: entry.title,
            coverImage: entry.coverImage,
            genres: entry.genres,
            tags: entry.tags,
            episodes: entry.episodes,
            startDate: startDateValue,
            status,
            groupId: group.id,
          },
        });
      }

      const validVotes = new Map<string, { up: number; down: number }>();
      for (const [userId, voteMap] of Object.entries(group.votes ?? {})) {
        for (const [animeId, voteState] of Object.entries(voteMap ?? {})) {
          validVotes.set(`${userId}::${animeId}`, {
            up: Number(voteState?.up ?? 0),
            down: Number(voteState?.down ?? 0),
          });
        }
      }

      const existingVotes = await tx.vote.findMany({
        where: {
          user: { groupId: group.id },
          anime: { groupId: group.id },
        },
      });

      const staleVoteIds = existingVotes
        .filter((vote) => !validVotes.has(`${vote.userId}::${vote.animeId}`))
        .map((vote) => vote.id);

      if (staleVoteIds.length > 0) {
        await tx.vote.deleteMany({ where: { id: { in: staleVoteIds } } });
      }

      for (const [voteKey, voteState] of validVotes.entries()) {
        const [userId, animeId] = voteKey.split('::');
        if (!userId || !animeId) continue;

        await tx.vote.upsert({
          where: {
            userId_animeId: {
              userId,
              animeId,
            },
          },
          update: {
            up: voteState.up,
            down: voteState.down,
          },
          create: {
            userId,
            animeId,
            up: voteState.up,
            down: voteState.down,
          },
        });
      }

      for (const anime of animeEntries) {
        const animeId = String(anime.id);
        const totals = await tx.vote.aggregate({
          where: { animeId },
          _sum: { up: true, down: true },
        });

        await tx.anime.update({
          where: { id: animeId },
          data: {
            votesUp: totals._sum.up ?? 0,
            votesDown: totals._sum.down ?? 0,
          },
        });
      }
    }
  });
}

export async function writeStore(store: Store) {
  return writeStoreDb(store);
}

export type { Store, Group, User, AnimeEntry } from './models';
