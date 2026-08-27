import type { AnimeEntry, Group, StoredGroup } from './models';
import { stripHtml } from './models';

const ANILIST_URL = 'https://graphql.anilist.co';

const ANIME_DETAILS_QUERY = `
  query ($ids: [Int]) {
    Page(perPage: 50) {
      media(id_in: $ids, type: ANIME) {
        id
        description(asHtml: false)
        siteUrl
      }
    }
  }
`;

function toAniListId(id: string | number): number | null {
  const value = typeof id === 'number' ? id : Number(id);
  return Number.isInteger(value) && value > 0 ? value : null;
}

async function fetchAniListDetails(ids: number[]): Promise<Map<string, Pick<AnimeEntry, 'description' | 'siteUrl'>>> {
  const details = new Map<string, Pick<AnimeEntry, 'description' | 'siteUrl'>>();

  for (let index = 0; index < ids.length; index += 50) {
    const response = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: ANIME_DETAILS_QUERY,
        variables: { ids: ids.slice(index, index + 50) },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch AniList anime details');
    }

    const data = await response.json();
    const items = data?.data?.Page?.media ?? [];
    for (const media of items as Array<{ id: number; description?: string | null; siteUrl?: string | null }>) {
      details.set(String(media.id), {
        description: stripHtml(media.description),
        siteUrl: media.siteUrl || null,
      });
    }
  }

  return details;
}

export async function enrichGroupWithAniListDetails(group: StoredGroup): Promise<Group> {
  const ids = Array.from(
    new Set(
      [...(group.plan || []), ...(group.completed || [])]
        .map((anime) => toAniListId(anime.id))
        .filter((id): id is number => id !== null),
    ),
  );

  let details = new Map<string, Pick<AnimeEntry, 'description' | 'siteUrl'>>();
  if (ids.length > 0) {
    try {
      details = await fetchAniListDetails(ids);
    } catch (error) {
      console.warn('Failed to enrich anime details from AniList', error);
    }
  }

  const enrichAnime = (anime: StoredGroup['plan'][number]): AnimeEntry => ({
    ...anime,
    ...(details.get(String(anime.id)) ?? { description: null, siteUrl: null }),
  });

  return {
    ...group,
    plan: (group.plan || []).map(enrichAnime),
    completed: (group.completed || []).map(enrichAnime),
  };
}
