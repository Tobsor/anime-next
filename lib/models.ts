export type VoteType = 'up' | 'down';

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
  genres?: string[];
  episodes?: number | null;
  startDate?: AnimeStartDate | null;
  votes?: {
    up: number;
    down: number;
  };
};

export type UserVoteMap = Record<string, VoteType>;

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

export type AniListMediaNode = {
  id: number;
  title?: {
    romaji?: string | null;
    english?: string | null;
  };
  coverImage?: {
    large?: string | null;
  };
  genres?: string[] | null;
  episodes?: number | null;
  startDate?: AnimeStartDate | null;
};

export function mapAniListMedia(media: AniListMediaNode): AnimeEntry {
  return {
    id: media.id,
    title: media.title?.english || media.title?.romaji || 'Unknown title',
    coverImage: media.coverImage?.large || null,
    genres: media.genres || [],
    episodes: media.episodes ?? null,
    startDate: media.startDate || null,
    votes: { up: 0, down: 0 },
  };
}

export function mapAniListSearchResponse(data: any): AnimeEntry[] {
  const items = data?.data?.Page?.media ?? [];
  return items.map((media: AniListMediaNode) => mapAniListMedia(media));
}

export function toVoteCountMap(votes: Record<string, UserVoteMap> | undefined, userId: string): Record<string, VoteType> {
  return votes?.[userId] ?? {};
}

export function getVoteForAnime(votes: Record<string, UserVoteMap> | undefined, userId: string, animeId: string | number): VoteType | null {
  const userVotes = toVoteCountMap(votes, userId);
  const key = String(animeId);
  return userVotes[key] ?? null;
}

export function countUserVotesForGroup(votes: Record<string, UserVoteMap> | undefined, userId: string): { up: number; down: number } {
  const userVotes = toVoteCountMap(votes, userId);
  let up = 0;
  let down = 0;

  Object.values(userVotes).forEach((vote) => {
    if (vote === 'up') up += 1;
    if (vote === 'down') down += 1;
  });

  return { up, down };
}
