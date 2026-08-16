import { NextResponse } from 'next/server';
import { readStore, writeStore } from '../../../../lib/dataStore';
import { countUserVotesForGroup, type AnimeEntry, type Group, type VoteType } from '../../../../lib/models';

export async function GET(_request: Request, { params }: { params: { group: string } }) {
  const store = readStore();
  const group = store.groups.find((entry) => entry.id === params.group);

  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  return NextResponse.json(group, { status: 200 });
}

function normalizeAnimePayload(rawAnime: Partial<AnimeEntry> | undefined): AnimeEntry {
  if (!rawAnime || typeof rawAnime !== 'object') {
    throw new Error('Invalid anime payload');
  }

  const title = typeof rawAnime.title === 'string' && rawAnime.title.trim() ? rawAnime.title.trim() : 'Untitled anime';
  const id = rawAnime.id ?? `anime-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id,
    title,
    coverImage: rawAnime.coverImage ?? null,
    genres: Array.isArray(rawAnime.genres) ? rawAnime.genres.filter((genre): genre is string => typeof genre === 'string') : [],
    episodes: typeof rawAnime.episodes === 'number' ? rawAnime.episodes : null,
    startDate: rawAnime.startDate ?? null,
    votes: {
      up: Number(rawAnime.votes?.up ?? 0) || 0,
      down: Number(rawAnime.votes?.down ?? 0) || 0,
    },
  };
}

async function handleAddAnime(group: Group, anime: AnimeEntry | undefined) {
  const normalizedAnime = normalizeAnimePayload(anime);
  const plan = Array.isArray(group.plan) ? group.plan : [];

  return { ...group, plan: [...plan, normalizedAnime] };
}

async function handleCompleteAnime(group: Group, animeId: string | number) {
  const plan = Array.isArray(group.plan) ? group.plan : [];
  const completed = Array.isArray(group.completed) ? group.completed : [];
  const nextPlan = plan.filter((anime) => String(anime.id) !== String(animeId));
  const completedAnime = plan.find((anime) => String(anime.id) === String(animeId));

  if (!completedAnime) {
    throw new Error('Anime not found in plan');
  }

  const nextVotes = { ...(group.votes ?? {}) };
  Object.keys(nextVotes).forEach((userId) => {
    const voteMap = nextVotes[userId];
    if (!voteMap || typeof voteMap !== 'object') return;
    delete voteMap[String(animeId)];
  });

  const releasedAnime = {
    ...completedAnime,
    votes: { up: 0, down: 0 },
  };

  return {
    ...group,
    plan: nextPlan,
    completed: [...completed, releasedAnime],
    votes: nextVotes,
  };
}

async function handleVote(group: Group, userId: string, animeId: string | number, type: VoteType) {
  const safePlan = Array.isArray(group.plan) ? group.plan : [];
  const userVotes = group.votes?.[userId] ?? {};
  const animeVotes = userVotes[String(animeId)] ?? { up: 0, down: 0 };
  const totals = countUserVotesForGroup(group.votes, userId);

  if (type === 'up' && totals.up >= 5) {
    throw new Error('Upvote limit reached');
  }

  if (type === 'down' && totals.down >= 3) {
    throw new Error('Downvote limit reached');
  }

  const nextPlan = safePlan.map((anime) => {
    if (String(anime.id) !== String(animeId)) return anime;

    const votes = anime.votes ?? { up: 0, down: 0 };
    const nextVotes = { ...votes };

    if (type === 'up') nextVotes.up += 1;
    if (type === 'down') nextVotes.down += 1;

    return { ...anime, votes: nextVotes };
  });

  const nextUserVotes = {
    ...(group.votes ?? {}),
    [userId]: {
      ...userVotes,
      [String(animeId)]: {
        up: animeVotes.up + (type === 'up' ? 1 : 0),
        down: animeVotes.down + (type === 'down' ? 1 : 0),
      },
    },
  };

  return {
    ...group,
    plan: nextPlan,
    votes: nextUserVotes,
  };
}

async function handleUndoVote(group: Group, userId: string, animeId: string | number) {
  const userVotes = group.votes?.[userId] ?? {};
  const animeVotes = userVotes[String(animeId)] ?? { up: 0, down: 0 };
  const userUpVotes = Math.max(0, animeVotes.up ?? 0);
  const userDownVotes = Math.max(0, animeVotes.down ?? 0);

  if (userUpVotes === 0 && userDownVotes === 0) {
    throw new Error('No vote to undo');
  }

  const nextPlan = (Array.isArray(group.plan) ? group.plan : []).map((anime) => {
    if (String(anime.id) !== String(animeId)) return anime;

    const votes = anime.votes ?? { up: 0, down: 0 };
    return {
      ...anime,
      votes: {
        up: Math.max(0, votes.up - userUpVotes),
        down: Math.max(0, votes.down - userDownVotes),
      },
    };
  });

  const nextVotes = { ...(group.votes ?? {}) };
  if (!nextVotes[userId]) nextVotes[userId] = {} as any;
  delete nextVotes[userId][String(animeId)];

  return {
    ...group,
    plan: nextPlan,
    votes: nextVotes,
  };
}

export async function POST(request: Request, { params }: { params: { group: string } }) {
  try {
    const store = readStore();
    const groupIndex = store.groups.findIndex((entry) => entry.id === params.group);

    if (groupIndex === -1) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const body = await request.json();
    const { action, payload } = body ?? {};
    let updatedGroup: Group;

    switch (action) {
      case 'add':
        if (!payload || typeof payload.anime === 'undefined') {
          return NextResponse.json({ error: 'Anime payload required' }, { status: 400 });
        }
        updatedGroup = await handleAddAnime(store.groups[groupIndex], payload.anime);
        break;
      case 'complete':
        if (!payload || typeof payload.animeId === 'undefined') {
          return NextResponse.json({ error: 'Anime id required' }, { status: 400 });
        }
        updatedGroup = await handleCompleteAnime(store.groups[groupIndex], payload.animeId);
        break;
      case 'vote':
        if (!payload || typeof payload.userId === 'undefined' || typeof payload.animeId === 'undefined' || typeof payload.type === 'undefined') {
          return NextResponse.json({ error: 'Vote payload required' }, { status: 400 });
        }
        updatedGroup = await handleVote(store.groups[groupIndex], payload.userId, payload.animeId, payload.type);
        break;
      case 'undo':
        if (!payload || typeof payload.userId === 'undefined' || typeof payload.animeId === 'undefined') {
          return NextResponse.json({ error: 'Undo payload required' }, { status: 400 });
        }
        updatedGroup = await handleUndoVote(store.groups[groupIndex], payload.userId, payload.animeId);
        break;
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    store.groups[groupIndex] = updatedGroup;
    writeStore(store);
    return NextResponse.json(updatedGroup, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
