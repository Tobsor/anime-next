export type VoteType = 'up' | 'down';

export type VoteState = {
  up: number;
  down: number;
};

export type User = {
  id: string;
  name: string;
};

export type AnimeStartDate = {
  year?: number | null;
  month?: number | null;
  day?: number | null;
};

export type AnimeEntry = {
  id: number | string;
  title: string;
  coverImage?: string | null;
  description?: string | null;
  siteUrl?: string | null;
  genres?: string[];
  tags?: string[];
  episodes?: number | null;
  startDate?: AnimeStartDate | null;
  votes?: {
    up: number;
    down: number;
  };
};

export type UserVoteMap = Record<string, VoteState>;

export type StoredAnimeEntry = Omit<AnimeEntry, 'id' | 'description' | 'siteUrl'> & {
  id: string;
};

export type Group = {
  id: string;
  name: string;
  users: User[];
  plan: AnimeEntry[];
  completed: AnimeEntry[];
  votes?: Record<string, UserVoteMap>;
};

export type Store = {
  groups: Group[];
};

export type StoredGroup = Omit<Group, 'plan' | 'completed'> & {
  plan: StoredAnimeEntry[];
  completed: StoredAnimeEntry[];
};

export type StoredStore = {
  groups: StoredGroup[];
};

export type AniListMediaNode = {
  id: number;
  title?: {
    romaji?: string | null;
    english?: string | null;
  };
  coverImage?: {
    large?: string | null;
  };
  description?: string | null;
  siteUrl?: string | null;
  genres?: string[] | null;
  tags?: Array<{ name?: string | null }> | null;
  episodes?: number | null;
  startDate?: AnimeStartDate | null;
};

export function stripHtml(value?: string | null): string | null {
  if (!value) return null;
  return value.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/\s+\n/g, '\n').trim();
}

export function mapAniListMedia(media: AniListMediaNode): AnimeEntry {
  return {
    id: media.id,
    title: media.title?.english || media.title?.romaji || 'Unknown title',
    coverImage: media.coverImage?.large || null,
    description: stripHtml(media.description),
    siteUrl: media.siteUrl || null,
    genres: media.genres || [],
    tags: media.tags?.map((tag) => tag.name).filter((name): name is string => typeof name === 'string') || [],
    episodes: media.episodes ?? null,
    startDate: media.startDate || null,
    votes: { up: 0, down: 0 },
  };
}

export function mapAniListSearchResponse(data: any): AnimeEntry[] {
  const items = data?.data?.Page?.media ?? [];
  return items.map((media: AniListMediaNode) => mapAniListMedia(media));
}

export function toVoteCountMap(votes: Record<string, UserVoteMap> | undefined, userId: string): Record<string, VoteState> {
  return votes?.[userId] ?? {};
}

export function getVoteForAnime(votes: Record<string, UserVoteMap> | undefined, userId: string, animeId: string | number): VoteType | null {
  const userVotes = toVoteCountMap(votes, userId);
  const state = userVotes[String(animeId)] ?? { up: 0, down: 0 };

  if (state.up > 0 && state.up >= state.down) return 'up';
  if (state.down > 0 && state.down > state.up) return 'down';
  return null;
}

export function countUserVotesForGroup(votes: Record<string, UserVoteMap> | undefined, userId: string): { up: number; down: number } {
  const userVotes = toVoteCountMap(votes, userId);
  return Object.values(userVotes).reduce(
    (totals, voteState) => ({
      up: totals.up + (voteState.up ?? 0),
      down: totals.down + (voteState.down ?? 0),
    }),
    { up: 0, down: 0 },
  );
}
