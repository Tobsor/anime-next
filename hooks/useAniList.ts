'use client';

import { useCallback } from 'react';
import { mapAniListSearchResponse, type AnimeEntry } from '../lib/models';

const SEARCH_QUERY = `
  query ($search: String) {
    Page(perPage: 10) {
      media(search: $search, type: ANIME) {
        id
        title {
          romaji
          english
        }
        coverImage {
          large
        }
        genres
        tags {
          name
        }
        episodes
        startDate {
          year
          month
          day
        }
      }
    }
  }
`;

export function useAniList() {
  const searchAnime = useCallback(async (searchTerm: string): Promise<AnimeEntry[]> => {
    if (!searchTerm.trim()) {
      return [];
    }

    const response = await fetch('/api/anilist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: SEARCH_QUERY,
        variables: { search: searchTerm },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to search AniList');
    }

    const data = await response.json();
    return mapAniListSearchResponse(data);
  }, []);

  return { searchAnime };
}
