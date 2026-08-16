import { NextResponse } from 'next/server';
import { readStore, writeStore, readStoreDb, writeStoreDb } from '../../../../lib/dataStore';
import type { Store } from '../../../../lib/models';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin';

function requireAdminPassword(request: Request) {
  const adminHeader = request.headers.get('x-admin-password');

  if (!adminHeader || adminHeader !== ADMIN_PASSWORD) {
    return false;
  }

  return true;
}

export async function GET(request: Request) {
  if (!requireAdminPassword(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (process.env.DATABASE_URL) {
      const store = await readStoreDb();
      return NextResponse.json(store, { status: 200 });
    }

    return NextResponse.json(readStore(), { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!requireAdminPassword(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = (await request.json()) as { groups?: Store['groups'] };
    if (!Array.isArray(payload.groups)) {
      return NextResponse.json({ error: 'Invalid store payload' }, { status: 400 });
    }

    const store: Store = { groups: payload.groups };

    if (process.env.DATABASE_URL) {
      await writeStoreDb(store);
    } else {
      writeStore(store);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
