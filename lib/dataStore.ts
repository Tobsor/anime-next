import fs from 'fs';
import path from 'path';
import type { Store } from './models';

const STORE_PATH = path.join(process.cwd(), 'data', 'store.json');

let memoryFallback: Store | null = null;

export function readStore(): Store {
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

export function writeStore(store: Store) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    memoryFallback = store;
  }
}

export type { Store, Group, User, AnimeEntry, VoteType } from './models';
