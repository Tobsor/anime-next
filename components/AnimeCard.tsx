import {
  Box,
  Image,
  Heading,
  Text,
  Badge,
  HStack,
  VStack,
  Button,
  ButtonGroup,
  Icon,
  IconButton,
  Spacer,
} from '@chakra-ui/react';
import type { AnimeEntry } from '../lib/models';

function ArrowUpIcon(props: any) {
  return (
    <Icon viewBox="0 0 24 24" {...props}>
      <path d="M12 4 19 13h-4v7H9v-7H5l7-9Z" fill="currentColor" />
    </Icon>
  );
}

function ArrowDownIcon(props: any) {
  return (
    <Icon viewBox="0 0 24 24" {...props}>
      <path d="M12 20 5 11h4V4h6v7h4l-7 9Z" fill="currentColor" />
    </Icon>
  );
}

function CheckIcon(props: any) {
  return (
    <Icon viewBox="0 0 24 24" {...props}>
      <path d="M6 12.5 10 16.5 18 8.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  );
}

export default function AnimeCard({ anime, onAdd, onUp, onDown, onComplete, onUndo, userVote, viewMode = 'detailed' }: { anime: AnimeEntry; onAdd?: () => void; onUp?: () => void; onDown?: () => void; onComplete?: () => void; onUndo?: () => void; userVote?: 'up' | 'down' | null; viewMode?: 'slim' | 'detailed'; }) {
  const hasUpVotes = (anime.votes?.up ?? 0) > 0;
  const hasDownVotes = (anime.votes?.down ?? 0) > 0;
  const isUpActive = userVote === 'up' || hasUpVotes;
  const isDownActive = userVote === 'down' || hasDownVotes;

  const actionGroup = (
    <HStack spacing={2} justify="flex-end">
      {onUp && (
        <ButtonGroup isAttached size="sm">
          <Button
            aria-label="Upvote"
            onClick={onUp}
            bg={isUpActive ? 'green.500' : 'rgba(17, 24, 39, 0.8)'}
            color={isUpActive ? 'white' : 'gray.200'}
            border="1px solid"
            borderColor={isUpActive ? 'green.400' : 'rgba(255,255,255,0.08)'}
            leftIcon={<ArrowUpIcon boxSize={4} />}
            w="34px"
            minW="34px"
            h="34px"
            p={0}
            borderRadius="md"
            _hover={{ bg: isUpActive ? 'green.400' : 'rgba(22, 29, 40, 0.9)' }}
            _active={{ bg: isUpActive ? 'green.600' : 'rgba(14, 18, 29, 0.95)' }}
          />
          <Button
            aria-label="Upvote count"
            pointerEvents="none"
            minW="34px"
            w="34px"
            h="34px"
            p={0}
            fontSize="xs"
            bg={isUpActive ? 'green.500' : 'rgba(17, 24, 39, 0.8)'}
            color={isUpActive ? 'white' : 'gray.200'}
            border="1px solid"
            borderColor={isUpActive ? 'green.400' : 'rgba(255,255,255,0.08)'}
            borderLeftWidth="0"
            borderRadius="md"
          >
            {anime.votes?.up ?? 0}
          </Button>
        </ButtonGroup>
      )}
      {onDown && (
        <ButtonGroup isAttached size="sm">
          <Button
            aria-label="Downvote"
            onClick={onDown}
            bg={isDownActive ? 'red.500' : 'rgba(17, 24, 39, 0.8)'}
            color={isDownActive ? 'white' : 'gray.200'}
            border="1px solid"
            borderColor={isDownActive ? 'red.400' : 'rgba(255,255,255,0.08)'}
            leftIcon={<ArrowDownIcon boxSize={4} />}
            w="34px"
            minW="34px"
            h="34px"
            p={0}
            borderRadius="md"
            _hover={{ bg: isDownActive ? 'red.400' : 'rgba(22, 29, 40, 0.9)' }}
            _active={{ bg: isDownActive ? 'red.600' : 'rgba(14, 18, 29, 0.95)' }}
          />
          <Button
            aria-label="Downvote count"
            pointerEvents="none"
            minW="34px"
            w="34px"
            h="34px"
            p={0}
            fontSize="xs"
            bg={isDownActive ? 'red.500' : 'rgba(17, 24, 39, 0.8)'}
            color={isDownActive ? 'white' : 'gray.200'}
            border="1px solid"
            borderColor={isDownActive ? 'red.400' : 'rgba(255,255,255,0.08)'}
            borderLeftWidth="0"
            borderRadius="md"
          >
            {anime.votes?.down ?? 0}
          </Button>
        </ButtonGroup>
      )}
      {onComplete && (
        <IconButton
          aria-label="Mark completed"
          size="sm"
          variant="ghost"
          bg="rgba(59, 130, 246, 0.18)"
          color="blue.300"
          border="1px solid"
          borderColor="rgba(96, 165, 250, 0.35)"
          icon={<CheckIcon boxSize={4} />}
          onClick={onComplete}
          w="34px"
          minW="34px"
          h="34px"
          p={0}
          borderRadius="md"
          _hover={{ bg: 'rgba(59, 130, 246, 0.28)' }}
          _active={{ bg: 'rgba(59, 130, 246, 0.35)' }}
        />
      )}
      {onUndo && userVote && <Button size="sm" variant="ghost" onClick={onUndo}>Undo</Button>}
    </HStack>
  );

  if (viewMode === 'slim') {
    return (
      <Box
        borderWidth="1px"
        borderRadius="2xl"
        overflowX="auto"
        overflowY="hidden"
        p={3}
        bg="rgba(12, 16, 24, 0.75)"
        borderColor="rgba(167, 139, 250, 0.18)"
        boxShadow="0 0 0 1px rgba(167, 139, 250, 0.08), 0 16px 36px rgba(91, 82, 229, 0.12)"
        css={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(167, 139, 250, 0.35) rgba(15, 23, 42, 0.8)' }}
      >
        <HStack align="stretch" spacing={3} minW="700px">
          <VStack align="start" spacing={2} flex="1 0 150px" minW="150px" justify="center" overflowX="auto" css={{ scrollbarWidth: 'thin', whiteSpace: 'nowrap' }}>
            <Heading size="sm" color="gray.200" noOfLines={1} fontSize="0.92rem">{anime.title}</Heading>
          </VStack>

          <VStack align="start" spacing={2} flex="1 0 100px" minW="100px" justify="center" overflowX="auto" css={{ scrollbarWidth: 'thin', whiteSpace: 'nowrap' }}>
            <HStack spacing={2} whiteSpace="nowrap">
              {(anime.genres || []).slice(0, 4).map((g) => (
                <Badge key={g} fontSize="0.68rem">{g}</Badge>
              ))}
            </HStack>
          </VStack>

          <VStack align="start" spacing={1} flex="1 0 100px" minW="100px" justify="center">
            <Text fontSize="0.76rem" color="gray.300">Ep: {anime.episodes ?? 'N/A'}</Text>
          </VStack>

          <VStack align="start" spacing={1} flex="1 0 100px" minW="100px" justify="center">
            <Text fontSize="0.76rem" color="gray.300">{anime.startDate?.year ?? 'N/A'}</Text>
          </VStack>

          <VStack align="start" spacing={1} flex="1 0 100px" minW="100px" justify="center">
            <Text fontSize="0.76rem" color="gray.300">Votes</Text>
          </VStack>

          <VStack align="end" spacing={2} flex="0 0 auto" justify="center" ml="auto">
            {onAdd && <Button size="sm" variant="solid" onClick={onAdd}>Add</Button>}
            {actionGroup}
          </VStack>
        </HStack>
      </Box>
    );
  }

  return (
    <Box
      borderWidth="1px"
      borderRadius="2xl"
      overflow="hidden"
      p={3}
      bg="rgba(12, 16, 24, 0.75)"
      borderColor="rgba(167, 139, 250, 0.18)"
      boxShadow="0 0 0 1px rgba(167, 139, 250, 0.08), 0 16px 36px rgba(91, 82, 229, 0.12)"
    >
      <VStack align="stretch" spacing={3} display={{ base: 'flex', md: 'flex' }}>
        <HStack align="stretch" spacing={3} w="100%">
          {anime.coverImage && (
            <Image
              src={anime.coverImage}
              alt={anime.title}
              boxSize={{ base: '72px', md: '100px' }}
              objectFit="cover"
              borderRadius="lg"
              border="1px solid"
              borderColor="rgba(167, 139, 250, 0.18)"
              flexShrink={0}
            />
          )}
          <VStack align="stretch" spacing={2} flex={1}>
            <HStack justify="space-between" align="start" spacing={2}>
              <Heading size="sm" color="gray.200" noOfLines={2}>{anime.title}</Heading>
              {onAdd && <Button size="sm" variant="solid" onClick={onAdd}>Add</Button>}
            </HStack>
            <HStack wrap="wrap" spacing={1}>
              {(anime.genres || []).slice(0, 3).map((g) => (
                <Badge key={g}>{g}</Badge>
              ))}
            </HStack>
            <VStack align="stretch" spacing={1}>
              <Text fontSize="sm" color="gray.300">Episodes: {anime.episodes ?? 'N/A'}</Text>
              <Text fontSize="sm" color="gray.300">Start: {anime.startDate?.year ?? 'N/A'}</Text>
            </VStack>
          </VStack>
        </HStack>
        <HStack justify="flex-end" w="100%">
          <Box transform="scale(0.9)" transformOrigin="right center">
            {actionGroup}
          </Box>
        </HStack>
      </VStack>
    </Box>
  );
}
