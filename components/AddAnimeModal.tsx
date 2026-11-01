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

export default function AddAnimeModal({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (anime: AnimeEntry) => Promise<void> | void; }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<AnimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  async function handleAddAnime(anime: AnimeEntry) {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await onAdd(anime);
      onClose();
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Failed to add anime', status: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={isSubmitting ? () => {} : onClose} closeOnOverlayClick={!isSubmitting} closeOnEsc={!isSubmitting} size="xl">
      <ModalOverlay bg="rgba(2, 4, 10, 0.72)" />
      <ModalContent
        bg="rgba(10, 14, 22, 0.92)"
        border="1px solid"
        borderColor="rgba(167, 139, 250, 0.22)"
        borderRadius="2xl"
        boxShadow="0 0 0 1px rgba(167, 139, 250, 0.12), 0 18px 48px rgba(91, 82, 229, 0.25)"
      >
        <ModalHeader color="white">Add anime</ModalHeader>
        <ModalBody position="relative">
          {isSubmitting && (
            <VStack
              position="fixed"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              width="220px"
              maxW="calc(100vw - 32px)"
              height="140px"
              bg="rgba(3, 7, 18, 0.82)"
              border="1px solid"
              borderColor="rgba(167, 139, 250, 0.28)"
              borderRadius="xl"
              boxShadow="0 18px 44px rgba(15, 23, 42, 0.55)"
              zIndex={1300}
              justify="center"
              spacing={3}
            >
              <Spinner size="lg" color="brand.300" />
              <Text color="gray.200">Adding anime...</Text>
            </VStack>
          )}

          <VStack spacing={4} align="stretch" opacity={isSubmitting ? 0.35 : 1} pointerEvents={isSubmitting ? 'none' : 'auto'}>
            <Input
              placeholder="Search anime by title"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              isDisabled={isSubmitting}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void search();
                }
              }}
            />
            <Button onClick={() => void search()} isLoading={loading} isDisabled={isSubmitting} variant="solid">Search</Button>
            {loading && <Spinner mx="auto" color="brand.300" />}
            {!loading && results.length === 0 && q && <Text color="gray.400">No results found</Text>}
            <VStack width="100%" align="stretch" spacing={3}>
              {results.map((anime) => (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  isLoading={isSubmitting}
                  onAdd={isSubmitting ? undefined : () => void handleAddAnime(anime)}
                />
              ))}
            </VStack>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose} isDisabled={isSubmitting}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
