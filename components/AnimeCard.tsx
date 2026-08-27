import { useState } from 'react';
import {
  Box,
  Image,
  Heading,
  Text,
  Badge,
  HStack,
  VStack,
  Button,
  Icon,
  IconButton,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
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

function LinkIcon(props: any) {
  return (
    <Icon viewBox="0 0 24 24" {...props}>
      <path d="M10 13a5 5 0 0 0 7.07 0l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-2 2A5 5 0 0 0 12 20.07l1.15-1.15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  );
}

function AnimeDetailModal({ anime, isOpen, onClose }: { anime: AnimeEntry; isOpen: boolean; onClose: () => void; }) {
  const metadata = [
    { label: 'Episodes', value: anime.episodes ?? 'N/A' },
    { label: 'Start', value: anime.startDate?.year ?? 'N/A' },
    { label: 'Genres', value: (anime.genres ?? []).slice(0, 5).join(', ') || 'N/A' },
  ];

  const renderCover = () => anime.coverImage ? (
    <Image
      src={anime.coverImage}
      alt={anime.title}
      w={{ base: '104px', md: '204px' }}
      h={{ base: '148px', md: '292px' }}
      objectFit="cover"
      borderRadius="lg"
      border="1px solid"
      borderColor="rgba(167, 139, 250, 0.2)"
      flexShrink={0}
    />
  ) : null;

  const renderMetadata = () => (
    <VStack align="stretch" spacing={2} flex={1} minW={0}>
      {metadata.map((item) => (
        <Box key={item.label}>
          <Text fontSize="xs" color="gray.500" textTransform="uppercase">{item.label}</Text>
          <Text fontSize="sm" color="gray.200">{item.value}</Text>
        </Box>
      ))}
    </VStack>
  );

  const summary = anime.description?.trim() || 'No summary available.';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" isCentered scrollBehavior="inside">
      <ModalOverlay bg="rgba(2, 4, 10, 0.72)" />
      <ModalContent bg="rgba(10, 14, 22, 0.96)" border="1px solid" borderColor="rgba(167, 139, 250, 0.22)">
        <ModalHeader pr={12}>{anime.title}</ModalHeader>
        <ModalCloseButton color="gray.200" />
        <ModalBody pb={6}>
          <HStack display={{ base: 'none', md: 'flex' }} align="start" spacing={6}>
            <VStack align="stretch" spacing={4} w="204px" flexShrink={0}>
              {renderCover()}
              {renderMetadata()}
            </VStack>
            <VStack align="stretch" spacing={4} flex={1}>
              <Text color="gray.200" lineHeight="1.7">{summary}</Text>
              {anime.siteUrl && (
                <Button
                  as={Link}
                  href={anime.siteUrl}
                  isExternal
                  alignSelf="flex-start"
                  colorScheme="brand"
                  rightIcon={<LinkIcon boxSize={4} />}
                  textDecoration="none"
                  _hover={{ textDecoration: 'none' }}
                >
                  Open on AniList
                </Button>
              )}
            </VStack>
          </HStack>

          <VStack display={{ base: 'flex', md: 'none' }} align="stretch" spacing={5}>
            <HStack align="start" spacing={4}>
              {renderCover()}
              {renderMetadata()}
            </HStack>
            <Text color="gray.200" lineHeight="1.7">{summary}</Text>
            {anime.siteUrl && (
              <Button
                as={Link}
                href={anime.siteUrl}
                isExternal
                alignSelf="flex-start"
                colorScheme="brand"
                rightIcon={<LinkIcon boxSize={4} />}
                textDecoration="none"
                _hover={{ textDecoration: 'none' }}
              >
                Open on AniList
              </Button>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default function AnimeCard({ anime, onAdd, onUp, onDown, onComplete, onUndo, userVote, viewMode = 'detailed', isLoading = false, pendingAction = null }: { anime: AnimeEntry; onAdd?: () => void; onUp?: () => void; onDown?: () => void; onComplete?: () => void; onUndo?: () => void; userVote?: 'up' | 'down' | null; viewMode?: 'slim' | 'detailed'; isLoading?: boolean; pendingAction?: 'up' | 'down' | 'complete' | 'undo' | null; }) {
  const [isDetailOpen, setDetailOpen] = useState(false);
  const hasUpVotes = (anime.votes?.up ?? 0) > 0;
  const hasDownVotes = (anime.votes?.down ?? 0) > 0;
  const isUpActive = userVote === 'up' || hasUpVotes;
  const isDownActive = userVote === 'down' || hasDownVotes;
  const disableAll = isLoading || !!pendingAction;

  const actionGroup = (
    <HStack spacing={2} justify="flex-end">
      {onUp && (
        <Button
          aria-label={`Upvote, ${anime.votes?.up ?? 0} votes`}
          onClick={onUp}
          isLoading={pendingAction === 'up'}
          isDisabled={disableAll}
          bg={isUpActive ? 'green.500' : 'rgba(17, 24, 39, 0.8)'}
          color={isUpActive ? 'white' : 'gray.200'}
          border="1px solid"
          borderColor={isUpActive ? 'green.400' : 'rgba(255,255,255,0.08)'}
          leftIcon={<ArrowUpIcon boxSize={4} />}
          minW="64px"
          h="34px"
          px={3}
          borderRadius="md"
          _hover={{ bg: isUpActive ? 'green.400' : 'rgba(22, 29, 40, 0.9)' }}
          _active={{ bg: isUpActive ? 'green.600' : 'rgba(14, 18, 29, 0.95)' }}
        >
          {anime.votes?.up ?? 0}
        </Button>
      )}
      {onDown && (
        <Button
          aria-label={`Downvote, ${anime.votes?.down ?? 0} votes`}
          onClick={onDown}
          isLoading={pendingAction === 'down'}
          isDisabled={disableAll}
          bg={isDownActive ? 'red.500' : 'rgba(17, 24, 39, 0.8)'}
          color={isDownActive ? 'white' : 'gray.200'}
          border="1px solid"
          borderColor={isDownActive ? 'red.400' : 'rgba(255,255,255,0.08)'}
          leftIcon={<ArrowDownIcon boxSize={4} />}
          minW="64px"
          h="34px"
          px={3}
          borderRadius="md"
          _hover={{ bg: isDownActive ? 'red.400' : 'rgba(22, 29, 40, 0.9)' }}
          _active={{ bg: isDownActive ? 'red.600' : 'rgba(14, 18, 29, 0.95)' }}
        >
          {anime.votes?.down ?? 0}
        </Button>
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
          isLoading={pendingAction === 'complete'}
          isDisabled={disableAll}
          w="34px"
          minW="34px"
          h="34px"
          p={0}
          borderRadius="md"
          _hover={{ bg: 'rgba(59, 130, 246, 0.28)' }}
          _active={{ bg: 'rgba(59, 130, 246, 0.35)' }}
        />
      )}
    </HStack>
  );

  const undoButton = onUndo && userVote ? (
    <Button size="sm" variant="ghost" onClick={onUndo} isLoading={pendingAction === 'undo'} isDisabled={disableAll}>
      Undo
    </Button>
  ) : null;

  if (viewMode === 'slim') {
    return (
      <>
        <Box
          borderWidth="1px"
          borderRadius="2xl"
          flexShrink={0}
          minH="72px"
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
              <Box
                as="button"
                type="button"
                aria-label={`View details for ${anime.title}`}
                onClick={() => setDetailOpen(true)}
                textAlign="left"
                borderRadius="md"
                maxW="100%"
                _focus={{ boxShadow: '0 0 0 3px rgba(167, 139, 250, 0.28)' }}
              >
                <Heading size="sm" color="gray.200" noOfLines={1} fontSize="0.92rem">{anime.title}</Heading>
              </Box>
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
              {undoButton}
              {actionGroup}
            </VStack>
          </HStack>
        </Box>
        <AnimeDetailModal anime={anime} isOpen={isDetailOpen} onClose={() => setDetailOpen(false)} />
      </>
    );
  }

  return (
    <>
      <Box
        borderWidth="1px"
        borderRadius="2xl"
        flexShrink={0}
        minH={{ base: '156px', md: 'auto' }}
        overflow="hidden"
        p={3}
        bg="rgba(12, 16, 24, 0.75)"
        borderColor="rgba(167, 139, 250, 0.18)"
        boxShadow="0 0 0 1px rgba(167, 139, 250, 0.08), 0 16px 36px rgba(91, 82, 229, 0.12)"
      >
        <HStack display={{ base: 'none', md: 'flex' }} align="stretch" justify="space-between" spacing={4} w="100%">
          <HStack align="stretch" spacing={3} flex={1} minW={0}>
            {anime.coverImage && (
              <Box
                as="button"
                type="button"
                aria-label={`View details for ${anime.title}`}
                onClick={() => setDetailOpen(true)}
                borderRadius="lg"
                flexShrink={0}
                _focus={{ boxShadow: '0 0 0 3px rgba(167, 139, 250, 0.28)' }}
              >
                <Image
                  src={anime.coverImage}
                  alt={anime.title}
                  boxSize={{ base: '72px', md: '100px' }}
                  objectFit="cover"
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="rgba(167, 139, 250, 0.18)"
                />
              </Box>
            )}
            <VStack align="stretch" spacing={2} flex={1}>
              <Heading size="sm" color="gray.200" noOfLines={2}>{anime.title}</Heading>
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

          <VStack align="end" justify={undoButton ? 'space-between' : 'flex-end'} spacing={2} flexShrink={0}>
            {undoButton}
            <VStack align="end" spacing={2}>
              {onAdd && <Button size="sm" variant="solid" onClick={onAdd}>Add</Button>}
              <Box transform="scale(0.9)" transformOrigin="right center">
                {actionGroup}
              </Box>
            </VStack>
          </VStack>
        </HStack>

        <VStack align="stretch" spacing={3} display={{ base: 'flex', md: 'none' }}>
          <HStack align="stretch" spacing={3} w="100%">
            {anime.coverImage && (
              <Box
                as="button"
                type="button"
                aria-label={`View details for ${anime.title}`}
                onClick={() => setDetailOpen(true)}
                borderRadius="lg"
                flexShrink={0}
                _focus={{ boxShadow: '0 0 0 3px rgba(167, 139, 250, 0.28)' }}
              >
                <Image
                  src={anime.coverImage}
                  alt={anime.title}
                  boxSize={{ base: '72px', md: '100px' }}
                  objectFit="cover"
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="rgba(167, 139, 250, 0.18)"
                />
              </Box>
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
            {undoButton}
            <Box transform="scale(0.9)" transformOrigin="right center">
              {actionGroup}
            </Box>
          </HStack>
        </VStack>
      </Box>
      <AnimeDetailModal anime={anime} isOpen={isDetailOpen} onClose={() => setDetailOpen(false)} />
    </>
  );
}
