import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
  VStack,
  Spinner,
  Text,
  useToast,
} from '@chakra-ui/react';
import AnimeCard from './AnimeCard';

type Anime = {
  id: number | string;
  title: string;
  coverImage?: string;
  genres?: string[];
  episodes?: number | null;
  startDate?: { year?: number; month?: number; day?: number } | null;
  votes?: { up: number; down: number };
};

export default function AddAnimeModal({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (anime: Anime) => void; }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function search() {
    if (!q.trim()) {
      toast({ title: 'Enter a search term', status: 'warning' });
      return;
    }
    setLoading(true);
    const query = `
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
    try {
      const resp = await fetch('/api/anilist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { search: q } }),
      });
      const data = await resp.json();
      const items = data?.data?.Page?.media || [];
      const mapped: Anime[] = items.map((r: any) => ({
        id: r.id,
        title: r.title?.english || r.title?.romaji || 'Unknown',
        coverImage: r.coverImage?.large,
        genres: r.genres || [],
        episodes: r.episodes,
        startDate: r.startDate,
        votes: { up: 0, down: 0 },
      }));
      setResults(mapped);
    } catch (err) {
      toast({ title: 'Error searching', status: 'error' });
    }
    setLoading(false);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add anime</ModalHeader>
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Input
              placeholder="Search anime by title"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && search()}
            />
            <Button onClick={search} isLoading={loading}>
              Search
            </Button>
            {loading && <Spinner mx="auto" />}
            {!loading && results.length === 0 && q && <Text color="gray.500">No results found</Text>}
            <VStack width="100%" align="stretch" spacing={3}>
              {results.map((r) => (
                <AnimeCard
                  key={r.id}
                  anime={r}
                  onAdd={() => {
                    onAdd(r);
                    onClose();
                  }}
                />
              ))}
            </VStack>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
