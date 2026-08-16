'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Box, Heading, Button, VStack, HStack, Text, useToast } from '@chakra-ui/react';
import UserSelectModal from '../../components/UserSelectModal';
import AddAnimeModal from '../../components/AddAnimeModal';
import AnimeCard from '../../components/AnimeCard';
import type { AnimeEntry, Group, User, VoteType } from '../../lib/models';

export default function GroupPage() {
  const params = useParams<{ group: string }>();
  const groupId = params?.group ?? '';
  const toast = useToast();
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserModalOpen, setUserModalOpen] = useState(false);
  const [isAddOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (!groupId) return;

    const loadGroup = async () => {
      const response = await fetch(`/api/group/${groupId}`);
      if (!response.ok) return;
      const data = await response.json();
      setCurrentGroup(data);

      const saved = window.localStorage.getItem(`anime-next:user:${groupId}`);
      if (saved) {
        try {
          setSelectedUser(JSON.parse(saved));
        } catch (error) {
          window.localStorage.removeItem(`anime-next:user:${groupId}`);
        }
      } else {
        setUserModalOpen(true);
      }
    };

    loadGroup();
  }, [groupId]);

  const sortedPlan = useMemo(() => {
    if (!currentGroup?.plan) return [];
    return [...currentGroup.plan].sort((a, b) => {
      const aVote = (a.votes?.up ?? 0) - (a.votes?.down ?? 0);
      const bVote = (b.votes?.up ?? 0) - (b.votes?.down ?? 0);

      if (aVote !== bVote) return bVote - aVote;
      if ((a.votes?.up ?? 0) !== (b.votes?.up ?? 0)) return (b.votes?.up ?? 0) - (a.votes?.up ?? 0);
      return (a.votes?.down ?? 0) - (b.votes?.down ?? 0);
    });
  }, [currentGroup?.plan]);

  const getUserVote = (animeId: string | number): VoteType | null => {
    if (!selectedUser || !currentGroup?.votes) return null;
    return currentGroup.votes[selectedUser.id]?.[String(animeId)] ?? null;
  };

  const onSelectUser = (user: User) => {
    setSelectedUser(user);
    window.localStorage.setItem(`anime-next:user:${groupId}`, JSON.stringify(user));
    setUserModalOpen(false);
  };

  const addAnimeToPlan = async (anime: AnimeEntry) => {
    const response = await fetch(`/api/group/${groupId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', payload: { anime } }),
    });

    if (!response.ok) {
      toast({ title: 'Failed to add anime', status: 'error' });
      return;
    }

    const updated = await response.json();
    setCurrentGroup(updated);
    toast({ title: 'Anime added', status: 'success' });
  };

  const completeAnime = async (animeId: string | number) => {
    if (!selectedUser) return;
    const response = await fetch(`/api/group/${groupId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete', payload: { animeId } }),
    });

    if (!response.ok) {
      toast({ title: 'Failed to complete', status: 'error' });
      return;
    }

    const updated = await response.json();
    setCurrentGroup(updated);
    toast({ title: 'Marked as completed', status: 'success' });
  };

  const handleVote = async (animeId: string | number, type: VoteType) => {
    if (!selectedUser) return;

    const response = await fetch(`/api/group/${groupId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'vote',
        payload: { userId: selectedUser.id, animeId, type },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to vote' }));
      toast({ title: errorData.error || 'Failed to vote', status: 'error' });
      return;
    }

    const updated = await response.json();
    setCurrentGroup(updated);
  };

  const handleUndoVote = async (animeId: string | number) => {
    if (!selectedUser) return;

    const response = await fetch(`/api/group/${groupId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'undo',
        payload: { userId: selectedUser.id, animeId },
      }),
    });

    if (!response.ok) {
      toast({ title: 'Failed to undo vote', status: 'error' });
      return;
    }

    const updated = await response.json();
    setCurrentGroup(updated);
  };

  if (!currentGroup) {
    return <Text>Loading...</Text>;
  }

  return (
    <Box p={6}>
      <Heading mb={4}>{currentGroup.name}</Heading>
      {selectedUser && <Text mb={4} fontSize="sm" color="gray.600">Logged in as: {selectedUser.name}</Text>}

      <HStack spacing={8} align="start">
        <VStack flex={1} align="stretch">
          <HStack justify="space-between">
            <Heading size="md">Plan to watch</Heading>
            <Button onClick={() => setAddOpen(true)}>Add</Button>
          </HStack>
          <VStack align="stretch" spacing={3}>
            {sortedPlan.length === 0 && <Text color="gray.500">No items yet</Text>}
            {sortedPlan.map((anime) => (
              <AnimeCard
                key={anime.id}
                anime={anime}
                onUp={() => handleVote(anime.id, 'up')}
                onDown={() => handleVote(anime.id, 'down')}
                onUndo={() => handleUndoVote(anime.id)}
                onComplete={() => completeAnime(anime.id)}
                userVote={getUserVote(anime.id)}
              />
            ))}
          </VStack>
        </VStack>

        <VStack flex={1} align="stretch">
          <Heading size="md">Completed</Heading>
          <VStack align="stretch" spacing={3}>
            {currentGroup.completed.length === 0 && <Text color="gray.500">No completed items</Text>}
            {currentGroup.completed.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </VStack>
        </VStack>
      </HStack>

      <UserSelectModal
        isOpen={isUserModalOpen}
        onClose={() => setUserModalOpen(false)}
        users={currentGroup.users}
        onSelect={onSelectUser}
      />

      <AddAnimeModal isOpen={isAddOpen} onClose={() => setAddOpen(false)} onAdd={addAnimeToPlan} />
    </Box>
  );
}
