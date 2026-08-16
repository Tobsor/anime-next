'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Button,
  Input,
  Textarea,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  useToast,
} from '@chakra-ui/react';
import type { Group, User } from '../../lib/models';

export default function AdminPage() {
  const [adminPass, setAdminPass] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (authenticated) {
      void loadStore();
    }
  }, [authenticated]);

  const loadStore = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/store');
      if (!response.ok) throw new Error('Failed to load store');
      const data = await response.json();
      setGroups(data.groups || []);
    } catch (error) {
      toast({ title: 'Failed to load admin store', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const saveStore = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPass,
        },
        body: JSON.stringify({ groups }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(data.error || 'Failed to save');
      }

      toast({ title: 'Store saved', status: 'success' });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Failed to save', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const addGroup = () => {
    const id = `group-${Date.now()}`;
    setGroups((current) => [...current, { id, name: 'New Group', users: [], plan: [], completed: [], votes: {} }]);
  };

  const updateGroup = (index: number, field: keyof Group, value: string) => {
    setGroups((current) => current.map((group, groupIndex) => groupIndex === index ? { ...group, [field]: value } : group));
  };

  const deleteGroup = (index: number) => {
    setGroups((current) => current.filter((_, groupIndex) => groupIndex !== index));
  };

  const addUser = (groupIndex: number) => {
    setGroups((current) =>
      current.map((group, index) => {
        if (index !== groupIndex) return group;
        return {
          ...group,
          users: [...group.users, { id: `user-${Date.now()}`, name: 'New User' }],
        };
      }),
    );
  };

  const updateUser = (groupIndex: number, userIndex: number, field: keyof User, value: string) => {
    setGroups((current) =>
      current.map((group, index) => {
        if (index !== groupIndex) return group;
        return {
          ...group,
          users: group.users.map((user, innerIndex) =>
            innerIndex === userIndex ? { ...user, [field]: value } : user,
          ),
        };
      }),
    );
  };

  const removeUser = (groupIndex: number, userIndex: number) => {
    setGroups((current) =>
      current.map((group, index) => {
        if (index !== groupIndex) return group;
        return {
          ...group,
          users: group.users.filter((_, innerIndex) => innerIndex !== userIndex),
        };
      }),
    );
  };

  if (!authenticated) {
    return (
      <Box p={6}>
        <Heading mb={4}>Admin - Enter Password</Heading>
        <HStack>
          <Input
            type="password"
            placeholder="Admin password"
            value={adminPass}
            onChange={(event) => setAdminPass(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') setAuthenticated(true);
            }}
          />
          <Button onClick={() => setAuthenticated(true)}>Login</Button>
        </HStack>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Heading mb={4}>Admin</Heading>
      <Tabs>
        <TabList>
          <Tab>Groups</Tab>
          <Tab>Raw JSON</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <VStack align="stretch" spacing={4}>
              <Button onClick={addGroup} colorScheme="blue">Add Group</Button>

              {groups.map((group, groupIndex) => (
                <Box key={group.id} borderWidth="1px" p={4} borderRadius="md">
                  <HStack mb={3}>
                    <Input value={group.id} isReadOnly flex={1} />
                    <Input
                      value={group.name}
                      onChange={(event) => updateGroup(groupIndex, 'name', event.target.value)}
                      flex={1}
                    />
                    <Button colorScheme="red" onClick={() => deleteGroup(groupIndex)}>Delete</Button>
                  </HStack>

                  <Heading size="sm" mb={2}>Users</Heading>
                  <VStack align="stretch" mb={3}>
                    {group.users.map((user, userIndex) => (
                      <HStack key={`${group.id}-${user.id}`}>
                        <Input
                          value={user.id}
                          onChange={(event) => updateUser(groupIndex, userIndex, 'id', event.target.value)}
                          flex={1}
                        />
                        <Input
                          value={user.name}
                          onChange={(event) => updateUser(groupIndex, userIndex, 'name', event.target.value)}
                          flex={1}
                        />
                        <Button colorScheme="red" onClick={() => removeUser(groupIndex, userIndex)}>Remove</Button>
                      </HStack>
                    ))}
                  </VStack>

                  <Button onClick={() => addUser(groupIndex)}>Add User</Button>
                </Box>
              ))}

              <Button onClick={saveStore} isLoading={loading} colorScheme="green">Save All Changes</Button>
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack align="stretch" spacing={4}>
              <Textarea
                value={JSON.stringify({ groups }, null, 2)}
                onChange={(event) => {
                  try {
                    const parsed = JSON.parse(event.target.value);
                    setGroups(parsed.groups || []);
                  } catch (error) {
                    // ignore invalid JSON while typing
                  }
                }}
                fontFamily="mono"
                height="480px"
              />
              <Button onClick={saveStore} isLoading={loading} colorScheme="green">Save JSON</Button>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
