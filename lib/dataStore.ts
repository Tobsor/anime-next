import fs from 'fs';
import path from 'path';

const STORE_PATH = path.join(process.cwd(), 'data', 'store.json');

export type User = { id: string; name: string };
export type AnimeEntry = {
  id: number | string;
  title: string;
  coverImage?: string;
  genres?: string[];
  episodes?: number | null;
  startDate?: { year?: number; month?: number; day?: number } | null;
  votes?: { up: number; down: number };
};

export type Group = {
  id: string;
  name: string;
  users: User[];
  plan: AnimeEntry[];
  completed: AnimeEntry[];
  votes?: { [userId: string]: { [animeId: string]: 'up' | 'down' } };
};

export type Store = {
  groups: Group[];
};

let memoryFallback: Store | null = null;

export function readStore(): Store {
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Store;
    return parsed;
  } catch (err) {
    if (memoryFallback) return memoryFallback;
    // If not present, create a default store
    const defaultStore: Store = { groups: [] };
    try {
      fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
      fs.writeFileSync(STORE_PATH, JSON.stringify(defaultStore, null, 2), 'utf-8');
    } catch (e) {
      // if filesystem not writable (serverless), keep in memory
      memoryFallback = defaultStore;
    }
    return defaultStore;
  }
}

export function writeStore(store: Store) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    memoryFallback = store;
  }
}
