'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Heading,
  Button,
  VStack,
  HStack,
  Text,
  useToast,
  ButtonGroup,
  Icon,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Tag,
  TagLabel,
} from '@chakra-ui/react';
import UserSelectModal from '../../components/UserSelectModal';
import AddAnimeModal from '../../components/AddAnimeModal';
import AnimeCard from '../../components/AnimeCard';
import type { AnimeEntry, Group, User, VoteType } from '../../lib/models';

function ToggleIcon({ children }: { children: React.ReactNode }) {
  return <Icon boxSize={4}>{children}</Icon>;
}

function MultiFilter({ label, options, selected, onChange }: { label: string; options: string[]; selected: string[]; onChange: (next: string[]) => void; }) {
  return (
    <Popover placement="bottom-start" matchWidth>
      <PopoverTrigger>
        <HStack spacing={2} align="stretch">
          <Button
            variant="outline"
            borderColor="rgba(167, 139, 250, 0.2)"
            bg="rgba(17, 24, 39, 0.75)"
            color="gray.100"
            justifyContent="flex-start"
            minH="52px"
            h="auto"
            px={3}
            py={2}
            flex="1"
            _hover={{ bg: 'rgba(17, 24, 39, 0.9)' }}
            _focus={{ boxShadow: '0 0 0 1px rgba(167, 139, 250, 0.35)' }}
          >
            <VStack align="stretch" spacing={1} w="100%">
              <Text fontSize="xs" color="gray.400" align="left">{label}</Text>
              {selected.length === 0 ? (
                <Text fontSize="sm" color="gray.400" align="left">Select {label.toLowerCase()}</Text>
              ) : (
                <HStack spacing={1} wrap="wrap" align="flex-start">
                  {selected.map((value) => (
                    <Tag key={value} size="sm" borderRadius="full" variant="subtle" bg="rgba(109, 94, 255, 0.18)" color="purple.100">
                      <TagLabel>{value}</TagLabel>
                    </Tag>
                  ))}
                </HStack>
              )}
            </VStack>
          </Button>
          {selected.length > 0 && (
            <IconButton
              aria-label={`Clear ${label}`}
              icon={<Icon viewBox="0 0 24 24"><path d="M6 6 18 18M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></Icon>}
              variant="ghost"
              color="gray.300"
              border="1px solid"
              borderColor="rgba(167, 139, 250, 0.2)"
              bg="rgba(17, 24, 39, 0.75)"
              minW="52px"
              h="52px"
              onClick={() => onChange([])}
            />
          )}
        </HStack>
      </PopoverTrigger>
      <PopoverContent bg="rgba(9, 12, 18, 0.98)" borderColor="rgba(167, 139, 250, 0.2)" width="260px" maxH="280px" overflowY="auto">
        <PopoverBody p={2}>
          <VStack align="stretch" spacing={1}>
            {options.length === 0 && <Text fontSize="sm" color="gray.400">No options available</Text>}
            {options.map((option) => {
              const checked = selected.includes(option);
              return (
                <Button
                  key={option}
                  size="sm"
                  justifyContent="space-between"
                  variant="ghost"
                  bg={checked ? 'rgba(109, 94, 255, 0.18)' : 'transparent'}
                  color={checked ? 'white' : 'gray.200'}
                  onClick={() => {
                    const next = checked ? selected.filter((item) => item !== option) : [...selected, option];
                    onChange(next);
                  }}
                >
                  <Text>{option}</Text>
                  {checked && <Icon viewBox="0 0 24 24" boxSize={4} color="purple.200"><path d="M5 12.5 9.5 17 19 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Icon>}
                </Button>
              );
            })}
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

export default function GroupPage() {
  const params = useParams<{ group: string }>();
  const groupId = params?.group ?? '';
  const toast = useToast();
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserModalOpen, setUserModalOpen] = useState(false);
  const [isAddOpen, setAddOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'slim' | 'detailed'>('detailed');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<{ animeId: string | number; action: 'up' | 'down' | 'complete' | 'undo' } | null>(null);

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

  const allGenres = useMemo(() => {
    if (!currentGroup?.plan) return [];
    return Array.from(new Set(currentGroup.plan.flatMap((anime) => anime.genres ?? []))).sort((a, b) => a.localeCompare(b));
  }, [currentGroup?.plan]);

  const sortedPlan = useMemo(() => {
    if (!currentGroup?.plan) return [];

    return [...currentGroup.plan]
      .filter((anime) => {
        return selectedGenres.length === 0 || selectedGenres.some((genre) => (anime.genres ?? []).includes(genre));
      })
      .sort((a, b) => {
        const aVote = (a.votes?.up ?? 0) - (a.votes?.down ?? 0);
        const bVote = (b.votes?.up ?? 0) - (b.votes?.down ?? 0);

        if (aVote !== bVote) return bVote - aVote;
        if ((a.votes?.up ?? 0) !== (b.votes?.up ?? 0)) return (b.votes?.up ?? 0) - (a.votes?.up ?? 0);
        return (a.votes?.down ?? 0) - (b.votes?.down ?? 0);
      });
  }, [currentGroup?.plan, selectedGenres]);

  const getUserVote = (animeId: string | number): VoteType | null => {
    if (!selectedUser || !currentGroup?.votes) return null;
    const animeVote = currentGroup.votes[selectedUser.id]?.[String(animeId)] ?? { up: 0, down: 0 };
    if (animeVote.up > 0 && animeVote.up >= animeVote.down) return 'up';
    if (animeVote.down > 0 && animeVote.down > animeVote.up) return 'down';
    return null;
  };

  const voteBudget = useMemo(() => {
    if (!selectedUser || !currentGroup?.votes) {
      return { up: 5, down: 3 };
    }

    const totals = Object.values(currentGroup.votes[selectedUser.id] ?? {}).reduce(
      (sum, vote) => ({
        up: sum.up + (vote?.up ?? 0),
        down: sum.down + (vote?.down ?? 0),
      }),
      { up: 0, down: 0 },
    );

    return {
      up: Math.max(0, 5 - totals.up),
      down: Math.max(0, 3 - totals.down),
    };
  }, [currentGroup?.votes, selectedUser]);

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
    setPendingAction({ animeId, action: 'complete' });

    try {
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
    } finally {
      setPendingAction((current) => current && current.animeId === animeId ? null : current);
    }
  };

  const handleVote = async (animeId: string | number, type: VoteType) => {
    if (!selectedUser) return;
    setPendingAction({ animeId, action: type });

    try {
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
    } finally {
      setPendingAction((current) => current && current.animeId === animeId ? null : current);
    }
  };

  const handleUndoVote = async (animeId: string | number) => {
    if (!selectedUser) return;
    setPendingAction({ animeId, action: 'undo' });

    try {
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
    } finally {
      setPendingAction((current) => current && current.animeId === animeId ? null : current);
    }
  };

  if (!currentGroup) {
    return <Text>Loading...</Text>;
  }

  return (
    <Box p={{ base: 4, md: 8 }} minH="100vh">
      <Box maxW="1200px" mx="auto" pt={4}>
        <Box
          bg="rgba(8, 11, 18, 0.72)"
          borderRadius="2xl"
          border="1px solid"
          borderColor="rgba(167, 139, 250, 0.2)"
          boxShadow="0 0 0 1px rgba(167, 139, 250, 0.12), 0 18px 42px rgba(91, 82, 229, 0.18)"
          p={{ base: 4, md: 6 }}
        >
          <Heading mb={1} fontSize={{ base: '2xl', md: '4xl' }} color="gray.200" textAlign="center">{currentGroup.name}</Heading>
          {selectedUser && <Text mb={5} fontSize="sm" color="gray.300" textAlign="center">Logged in as: {selectedUser.name}</Text>}

          <HStack justify="flex-end" mb={6}>
            <ButtonGroup isAttached variant="ghost" border="1px solid" borderColor="rgba(167, 139, 250, 0.2)" borderRadius="lg" overflow="hidden">
              <Button
                onClick={() => setViewMode('slim')}
                bg={viewMode === 'slim' ? 'rgba(109, 94, 255, 0.18)' : 'rgba(17, 24, 39, 0.7)'}
                color={viewMode === 'slim' ? 'white' : 'gray.200'}
                leftIcon={
                  <ToggleIcon>
                    <path d="M5 6.5h14M5 12h10M5 17.5h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </ToggleIcon>
                }
              >
                Slim
              </Button>
              <Button
                onClick={() => setViewMode('detailed')}
                bg={viewMode === 'detailed' ? 'rgba(109, 94, 255, 0.18)' : 'rgba(17, 24, 39, 0.7)'}
                color={viewMode === 'detailed' ? 'white' : 'gray.200'}
                leftIcon={
                  <ToggleIcon>
                    <path d="M4 7.5h16v9H4zM7 5h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </ToggleIcon>
                }
              >
                Detailed
              </Button>
            </ButtonGroup>
          </HStack>

          <VStack spacing={8} align="stretch">
            <VStack flex={1} align="stretch" minW="100%">
              <HStack justify="space-between" align="center" px={1}>
                <Heading size="md" color="gray.200" textAlign="center">Plan to watch</Heading>
                <Button onClick={() => setAddOpen(true)} variant="ghost">Add</Button>
              </HStack>
              {selectedUser && (
                <Text fontSize="sm" color="gray.300" px={1}>
                  Voting budget: {voteBudget.up} up / {voteBudget.down} down left
                </Text>
              )}
              <HStack spacing={3} align="stretch" px={1} wrap="wrap">
                <Box flex="1 1 220px">
                  <MultiFilter label="Tags" options={allGenres} selected={selectedGenres} onChange={setSelectedGenres} />
                </Box>
              </HStack>
              <VStack align="stretch" spacing={3} pr={1}>
                {sortedPlan.length === 0 && <Text color="gray.400">No items yet</Text>}
                {sortedPlan.map((anime) => (
                  <AnimeCard
                    key={anime.id}
                    anime={anime}
                    viewMode={viewMode}
                    onUp={() => handleVote(anime.id, 'up')}
                    onDown={() => handleVote(anime.id, 'down')}
                    onUndo={() => handleUndoVote(anime.id)}
                    onComplete={() => completeAnime(anime.id)}
                    userVote={getUserVote(anime.id)}
                    pendingAction={pendingAction && pendingAction.animeId === anime.id ? pendingAction.action : null}
                  />
                ))}
              </VStack>
            </VStack>

            <VStack flex={1} align="stretch" minW="100%">
              <Heading size="md" color="gray.200" px={1} textAlign="center">Completed</Heading>
              <VStack align="stretch" spacing={3} pr={1}>
                {currentGroup.completed.length === 0 && <Text color="gray.400">No completed items</Text>}
                {currentGroup.completed.map((anime) => (
                  <AnimeCard key={anime.id} anime={anime} viewMode={viewMode} />
                ))}
              </VStack>
            </VStack>
          </VStack>
        </Box>

        <UserSelectModal
          isOpen={isUserModalOpen}
          onClose={() => setUserModalOpen(false)}
          users={currentGroup.users}
          onSelect={onSelectUser}
        />

        <AddAnimeModal isOpen={isAddOpen} onClose={() => setAddOpen(false)} onAdd={addAnimeToPlan} />
      </Box>
    </Box>
  );
}
