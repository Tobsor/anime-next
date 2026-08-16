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
import { useAniList } from '../hooks/useAniList';
import AnimeCard from './AnimeCard';
import type { AnimeEntry } from '../lib/models';

export default function AddAnimeModal({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (anime: AnimeEntry) => void; }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<AnimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { searchAnime } = useAniList();
  const toast = useToast();

  async function search() {
    if (!q.trim()) {
      toast({ title: 'Enter a search term', status: 'warning' });
      return;
    }

    setLoading(true);

    try {
      const items = await searchAnime(q);
      setResults(items);
    } catch (error) {
      toast({ title: 'Error searching AniList', status: 'error' });
      setResults([]);
    } finally {
      setLoading(false);
    }
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void search();
                }
              }}
            />
            <Button onClick={() => void search()} isLoading={loading}>Search</Button>
            {loading && <Spinner mx="auto" />}
            {!loading && results.length === 0 && q && <Text color="gray.500">No results found</Text>}
            <VStack width="100%" align="stretch" spacing={3}>
              {results.map((anime) => (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  onAdd={() => {
                    onAdd(anime);
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
