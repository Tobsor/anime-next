import { NextResponse } from 'next/server';
import { readStore, writeStore } from '../../../../lib/dataStore';
import { getVoteForAnime, type AnimeEntry, type Group, type VoteType } from '../../../../lib/models';

export async function GET(_request: Request, { params }: { params: { group: string } }) {
  const store = readStore();
  const group = store.groups.find((entry) => entry.id === params.group);

  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  return NextResponse.json(group, { status: 200 });
}

async function handleAddAnime(group: Group, anime: AnimeEntry) {
  const nextGroup = { ...group, plan: [...group.plan, { ...anime, votes: anime.votes ?? { up: 0, down: 0 } }] };
  return nextGroup;
}

async function handleCompleteAnime(group: Group, animeId: string | number) {
  const nextPlan = group.plan.filter((anime) => String(anime.id) !== String(animeId));
  const completedAnime = group.plan.find((anime) => String(anime.id) === String(animeId));

  if (!completedAnime) {
    throw new Error('Anime not found in plan');
  }

  return {
    ...group,
    plan: nextPlan,
    completed: [...group.completed, completedAnime],
  };
}

async function handleVote(group: Group, userId: string, animeId: string | number, type: VoteType) {
  const userVotes = group.votes?.[userId] ?? {};
  const existingVote = getVoteForAnime(group.votes, userId, animeId);

  if (existingVote === type) {
    return group;
  }

  const nextPlan = group.plan.map((anime) => {
    if (String(anime.id) !== String(animeId)) return anime;

    const votes = anime.votes ?? { up: 0, down: 0 };
    const nextVotes = { ...votes };

    if (existingVote === 'up') nextVotes.up = Math.max(0, nextVotes.up - 1);
    if (existingVote === 'down') nextVotes.down = Math.max(0, nextVotes.down - 1);

    if (type === 'up') nextVotes.up += 1;
    if (type === 'down') nextVotes.down += 1;

    return { ...anime, votes: nextVotes };
  });

  const upCount = Object.values(userVotes).filter((vote) => vote === 'up').length;
  const downCount = Object.values(userVotes).filter((vote) => vote === 'down').length;

  if (!existingVote && type === 'up' && upCount >= 5) {
    throw new Error('Upvote limit reached');
  }

  if (!existingVote && type === 'down' && downCount >= 3) {
    throw new Error('Downvote limit reached');
  }

  const nextVotes = {
    ...(group.votes ?? {}),
    [userId]: {
      ...(userVotes ?? {}),
      [String(animeId)]: type,
    },
  };

  return {
    ...group,
    plan: nextPlan,
    votes: nextVotes,
  };
}

async function handleUndoVote(group: Group, userId: string, animeId: string | number) {
  const currentVote = getVoteForAnime(group.votes, userId, animeId);

  if (!currentVote) {
    throw new Error('No vote to undo');
  }

  const nextPlan = group.plan.map((anime) => {
    if (String(anime.id) !== String(animeId)) return anime;
    const votes = anime.votes ?? { up: 0, down: 0 };
    const nextVotes = { ...votes };

    if (currentVote === 'up') nextVotes.up = Math.max(0, nextVotes.up - 1);
    if (currentVote === 'down') nextVotes.down = Math.max(0, nextVotes.down - 1);

    return { ...anime, votes: nextVotes };
  });

  const nextVotes = { ...(group.votes ?? {}) };
  if (nextVotes[userId]) {
    delete nextVotes[userId][String(animeId)];
  }

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
        updatedGroup = await handleAddAnime(store.groups[groupIndex], payload.anime);
        break;
      case 'complete':
        updatedGroup = await handleCompleteAnime(store.groups[groupIndex], payload.animeId);
        break;
      case 'vote':
        updatedGroup = await handleVote(store.groups[groupIndex], payload.userId, payload.animeId, payload.type);
        break;
      case 'undo':
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
