'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Box,
  Icon,
  IconButton,
  FormControl,
  FormErrorMessage,
  Heading,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react';

export default function LandingPage() {
  const router = useRouter();
  const [groupId, setGroupId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const submitting = useRef(false);

  async function findGroup() {
    if (submitting.current) return;

    const id = groupId.trim();
    if (!id) {
      setError('Please enter your group ID.');
      return;
    }

    submitting.current = true;
    setIsLoading(true);
    setError('');

    try {
      const alternateId = id.startsWith('group-') ? id.slice('group-'.length) : `group-${id}`;
      const candidates = [id, alternateId].filter(Boolean);

      for (const candidate of candidates) {
        const response = await fetch(`/api/group/${encodeURIComponent(candidate)}`, { method: 'GET', cache: 'no-store' });
        if (response.status === 404) continue;
        if (!response.ok) throw new Error('Group lookup failed');

        const group = await response.json();
        if (group.id !== candidate) throw new Error('Invalid group response');

        router.push(`/${encodeURIComponent(group.id)}`);
        return;
      }
      setError('This group ID is not valid. Check the ID and try again.');
    } catch {
      setError('Unable to look up your group right now. Please try again.');
    } finally {
      submitting.current = false;
      setIsLoading(false);
    }
  }

  return (
    <Box as="main" position="relative" minH="100svh" px={{ base: 4, md: 8 }} pb={10}>
      <Box
        w="100%"
        maxW="1040px"
        mx="auto"
        display="grid"
        gridTemplateRows="minmax(min-content, calc(50svh - 24px)) auto"
        textAlign="center"
      >
        <Box alignSelf="end" pt={{ base: 8, md: 10 }} pb={6}>
        <Box display="flex" alignItems="center" justifyContent="center" gap={3} mb={8}>
          <Image src="/logo.png" alt="" width={56} height={56} style={{ objectFit: 'contain' }} />
          <Text color="accent.400" fontSize={{ base: 'lg', md: 'xl' }} fontWeight="600" letterSpacing="0.15em" textTransform="uppercase">
            Anime Next
          </Text>
        </Box>
        <Heading as="h1" fontSize={{ base: '40px', md: '72px' }} lineHeight="1.1" letterSpacing="-0.035em" color="gray.50">
          What should we{' '}
          <Box as="span" display="block" color="accent.300">watch next?</Box>
        </Heading>
        <Text id="group-instructions" mt={10} color="gray.300" fontSize={{ base: 'md', md: 'lg' }} mx="auto">
          Enter your group ID to open your group page and decide what to watch together.
        </Text>
        </Box>

        <Box role="search" aria-label="Find your group" w="100%" maxW="760px" mx="auto" aria-busy={isLoading}>
          <FormControl isInvalid={Boolean(error)}>
            <Stack direction="row" spacing={3}>
              <Input
                id="group-id"
                name="groupId"
                aria-label="Group ID"
                placeholder="Enter your group ID"
                value={groupId}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    void findGroup();
                  }
                }}
                onChange={(event) => {
                  setGroupId(event.target.value);
                  setError('');
                }}
                isReadOnly={isLoading}
                aria-describedby={`group-instructions${error ? ' group-error' : ''}`}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                size="lg"
                minW={0}
                bg="rgba(17, 24, 39, 0.9)"
                borderColor={error ? 'red.300' : 'rgba(167, 139, 250, 0.45)'}
                errorBorderColor="red.300"
                _hover={{ borderColor: error ? 'red.300' : 'accent.400' }}
                borderRadius="lg"
              />
              <IconButton
                type="button"
                onClick={() => void findGroup()}
                aria-label="Find group"
                title="Find group"
                size="lg"
                flexShrink={0}
                isLoading={isLoading}
                icon={
                  <Icon viewBox="0 0 24 24" boxSize={5} aria-hidden="true">
                    <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="m16 16 4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </Icon>
                }
              />
            </Stack>
            <FormErrorMessage id="group-error" role="alert" textAlign="left">{error}</FormErrorMessage>
          </FormControl>
        </Box>
      </Box>
    </Box>
  );
}
