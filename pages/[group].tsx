import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Heading, Button, VStack, HStack, Text, useToast } from '@chakra-ui/react';
import UserSelectModal from '../components/UserSelectModal';
import AddAnimeModal from '../components/AddAnimeModal';
import AnimeCard from '../components/AnimeCard';

type User = { id: string; name: string };
type Anime = {
  id: number | string;
  title: string;
  coverImage?: string;
  genres?: string[];
  episodes?: number | null;
  startDate?: { year?: number; month?: number; day?: number } | null;
  votes?: { up: number; down: number };
};

export default function GroupPage({}) {
  const router = useRouter();
  const { group } = router.query;
  const toast = useToast();
  const [currentGroup, setCurrentGroup] = useState<any | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserModalOpen, setUserModalOpen] = useState(false);
  const [isAddOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (!group || Array.isArray(group)) return;

    async function load() {
      const res = await fetch(`/api/group/${group}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentGroup(data);
      }

      const saved = localStorage.getItem(`anime-next:user:${group}`);
      if (saved) {
        try {
          setSelectedUser(JSON.parse(saved));
        } catch {}
      } else {
        setUserModalOpen(true);
      }
    }
    load();
  }, [group]);

  // Sort plan by votes: higher upvotes first, then lower downvotes, then items with no votes at end
  const sortedPlan = useMemo(() => {
    if (!currentGroup?.plan) return [];
    return [...currentGroup.plan].sort((a: any, b: any) => {
      const aUp = a.votes?.up || 0;
      const bUp = b.votes?.up || 0;
      const aDown = a.votes?.down || 0;
      const bDown = b.votes?.down || 0;
      const aTotal = aUp - aDown;
      const bTotal = bUp - bDown;

      if (aTotal !== bTotal) return bTotal - aTotal;
      if (aUp !== bUp) return bUp - aUp;
      return aDown - bDown;
    });
  }, [currentGroup?.plan]);

  function onSelectUser(u: User) {
    setSelectedUser(u);
    localStorage.setItem(`anime-next:user:${group}`, JSON.stringify(u));
    setUserModalOpen(false);
  }

  async function addAnimeToPlan(anime: Anime) {
    if (!group || Array.isArray(group)) return;
    try {
      const res = await fetch(`/api/group/${group}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', payload: { anime } }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCurrentGroup(updated);
        toast({ title: 'Added to plan', status: 'success' });
      } else {
        toast({ title: 'Failed to add', status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Error', status: 'error' });
    }
  }

  async function completeAnime(animeId: number | string) {
    if (!group || Array.isArray(group) || !selectedUser) return;
    try {
      const res = await fetch(`/api/group/${group}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', payload: { animeId } }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCurrentGroup(updated);
        toast({ title: 'Marked as completed', status: 'success' });
      } else {
        toast({ title: 'Failed to complete', status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Error', status: 'error' });
    }
  }

  async function handleVote(animeId: number | string, type: 'up' | 'down') {
    if (!group || Array.isArray(group) || !selectedUser) return;
    try {
      const res = await fetch(`/api/group/${group}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vote', payload: { userId: selectedUser.id, animeId, type } }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCurrentGroup(updated);
      } else {
        const err = await res.json();
        toast({ title: err.error || 'Failed to vote', status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Error', status: 'error' });
    }
  }

  async function handleUndo(animeId: number | string) {
    if (!group || Array.isArray(group) || !selectedUser) return;
    try {
      const res = await fetch(`/api/group/${group}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'undo', payload: { userId: selectedUser.id, animeId } }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCurrentGroup(updated);
        toast({ title: 'Vote undone', status: 'success' });
      } else {
        toast({ title: 'Failed to undo', status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Error', status: 'error' });
    }
  }

  function getUserVote(animeId: number | string): 'up' | 'down' | null {
    if (!selectedUser || !currentGroup?.votes) return null;
    const userVotes = currentGroup.votes[selectedUser.id];
    if (!userVotes) return null;
    return userVotes[String(animeId)] || null;
  }

  if (!currentGroup) return <Text>Loading...</Text>;

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
            {sortedPlan.map((a: Anime) => (
              <AnimeCard
                key={a.id}
                anime={a}
                onUp={() => handleVote(a.id, 'up')}
                onDown={() => handleVote(a.id, 'down')}
                onUndo={() => handleUndo(a.id)}
                onComplete={() => completeAnime(a.id)}
                userVote={getUserVote(a.id)}
              />
            ))}
          </VStack>
        </VStack>
        <VStack flex={1} align="stretch">
          <Heading size="md">Completed</Heading>
          <VStack align="stretch" spacing={3}>
            {currentGroup.completed?.length === 0 && <Text color="gray.500">No completed items</Text>}
            {(currentGroup.completed || []).map((a: Anime) => (
              <AnimeCard key={a.id} anime={a} />
            ))}
          </VStack>
        </VStack>
      </HStack>

      <UserSelectModal isOpen={isUserModalOpen} onClose={() => setUserModalOpen(false)} users={currentGroup.users} onSelect={onSelectUser} />
      <AddAnimeModal isOpen={isAddOpen} onClose={() => setAddOpen(false)} onAdd={addAnimeToPlan} />
    </Box>
  );
}
