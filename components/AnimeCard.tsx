import React from 'react';
import {
  Box,
  Image,
  Heading,
  Text,
  Badge,
  HStack,
  VStack,
  Button,
  Spacer,
} from '@chakra-ui/react';

type Anime = {
  id: number | string;
  title: string;
  coverImage?: string;
  genres?: string[];
  episodes?: number | null;
  startDate?: { year?: number; month?: number; day?: number } | null;
  votes?: { up: number; down: number };
};

export default function AnimeCard({ anime, onAdd, onUp, onDown, onComplete, onUndo, userVote }: { anime: Anime; onAdd?: () => void; onUp?: () => void; onDown?: () => void; onComplete?: () => void; onUndo?: () => void; userVote?: 'up' | 'down' | null; }) {
  return (
    <Box borderWidth="1px" borderRadius="md" overflow="hidden" p={3} bg="white">
      <HStack align="start">
        {anime.coverImage && <Image src={anime.coverImage} alt={anime.title} boxSize="100px" objectFit="cover" />}
        <VStack align="start" spacing={1}>
          <Heading size="sm">{anime.title}</Heading>
          <HStack>
            {(anime.genres || []).slice(0,3).map(g => <Badge key={g}>{g}</Badge>)}
          </HStack>
          <Text fontSize="sm">Episodes: {anime.episodes ?? 'N/A'}</Text>
          <Text fontSize="sm">Start: {anime.startDate?.year ?? 'N/A'}</Text>
          <HStack>
            <Text fontSize="sm">Up: {anime.votes?.up ?? 0}</Text>
            <Text fontSize="sm">Down: {anime.votes?.down ?? 0}</Text>
          </HStack>
        </VStack>
        <Spacer />
        <VStack>
          {onAdd && <Button size="sm" colorScheme="blue" onClick={onAdd}>Add</Button>}
          {onUp && <Button size="sm" colorScheme={userVote === 'up' ? 'green' : undefined} onClick={onUp}>Up</Button>}
          {onDown && <Button size="sm" colorScheme={userVote === 'down' ? 'red' : undefined} onClick={onDown}>Down</Button>}
          {onUndo && userVote && <Button size="sm" onClick={onUndo}>Undo</Button>}
          {onComplete && <Button size="sm" onClick={onComplete}>Mark Completed</Button>}
        </VStack>
      </HStack>
    </Box>
  );
}
