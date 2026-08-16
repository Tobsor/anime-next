import fs from 'fs';
import path from 'path';
import type { Store, Group, User, AnimeEntry } from './models';
import { prisma } from './prisma';

const STORE_PATH = path.join(process.cwd(), 'data', 'store.json');

let memoryFallback: Store | null = null;

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
    votes: {},
  };
}

export function readStore(): Store {
  // Prefer DB-backed store if DATABASE_URL is available
  if (process.env.DATABASE_URL) {
    return { groups: [] };
  }

  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Store;
    return parsed;
  } catch (err) {
    if (memoryFallback) return memoryFallback;
    const defaultStore: Store = { groups: [] };
    try {
      fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
      fs.writeFileSync(STORE_PATH, JSON.stringify(defaultStore, null, 2), 'utf-8');
    } catch (e) {
      memoryFallback = defaultStore;
    }
    return defaultStore;
  }
}

export async function readStoreDb(): Promise<Store> {
  const groups = await prisma.group.findMany({ include: { users: true, animes: true } });
  return { groups: groups.map(mapDbGroupToStore) };
}

export async function writeStoreDb(store: Store) {
  // Simple strategy: delete existing groups and re-create from payload
  // WARNING: This is admin-only and intended for small prototype datasets
  await prisma.vote.deleteMany();
  await prisma.anime.deleteMany();
  await prisma.user.deleteMany();
  await prisma.group.deleteMany();

  for (const g of store.groups) {
    await prisma.group.create({
      data: {
        id: g.id,
        name: g.name,
        users: {
          create: (g.users || []).map((u: User) => ({ id: u.id, name: u.name })),
        },
        animes: {
          create: (g.plan || [])
            .concat(g.completed || [])
            .map((a: AnimeEntry) => ({
              id: String(a.id),
              title: a.title,
              coverImage: a.coverImage ?? null,
              genres: a.genres ?? [],
              tags: (a as any).tags ?? [],
              episodes: a.episodes ?? null,
              startDate: a.startDate ?? null,
              votesUp: a.votes?.up ?? 0,
              votesDown: a.votes?.down ?? 0,
              status: (g.plan || []).some((p) => String(p.id) === String(a.id)) ? 'PLAN' : 'COMPLETED',
            })),
        },
      },
    });
  }
}

export function writeStore(store: Store) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    memoryFallback = store;
  }
}

export type { Store, Group, User, AnimeEntry } from './models';
