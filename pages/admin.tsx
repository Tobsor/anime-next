import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Button,
  Input,
  Textarea,
  Text,
  useToast,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';

type User = { id: string; name: string };
type Anime = {
  id: number | string;
  title: string;
  coverImage?: string;
  genres?: string[];
  episodes?: number | null;
  startDate?: { year?: number; month?: number; day?: number } | null;
};
type Group = {
  id: string;
  name: string;
  users: User[];
  plan: Anime[];
  completed: Anime[];
  votes?: Record<string, Record<string, 'up' | 'down'>>;
};

export default function AdminPage() {
  const [adminPass, setAdminPass] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (authenticated) {
      loadStore();
    }
  }, [authenticated]);

  async function loadStore() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/store');
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch (err) {
      toast({ title: 'Failed to load store', status: 'error' });
    }
    setLoading(false);
  }

  async function saveStore() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPass },
        body: JSON.stringify({ groups }),
      });
      if (res.ok) {
        toast({ title: 'Store saved', status: 'success' });
      } else {
        toast({ title: 'Failed to save', status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Error saving', status: 'error' });
    }
    setLoading(false);
  }

  function addGroup() {
    const id = `group-${Date.now()}`;
    setGroups([...groups, { id, name: 'New Group', users: [], plan: [], completed: [] }]);
  }

  function updateGroup(idx: number, field: string, value: any) {
    const updated = [...groups];
    (updated[idx] as any)[field] = value;
    setGroups(updated);
  }

  function deleteGroup(idx: number) {
    setGroups(groups.filter((_, i) => i !== idx));
  }

  function addUserToGroup(groupIdx: number) {
    const updated = [...groups];
    updated[groupIdx].users.push({ id: `user-${Date.now()}`, name: 'New User' });
    setGroups(updated);
  }

  function updateUser(groupIdx: number, userIdx: number, field: string, value: string) {
    const updated = [...groups];
    (updated[groupIdx].users[userIdx] as any)[field] = value;
    setGroups(updated);
  }

  function removeUser(groupIdx: number, userIdx: number) {
    const updated = [...groups];
    updated[groupIdx].users.splice(userIdx, 1);
    setGroups(updated);
  }

  if (!authenticated) {
    return (
      <Box p={6}>
        <Heading mb={4}>Admin - Enter Password</Heading>
        <HStack>
          <Input
            type="password"
            placeholder="Admin password"
            value={adminPass}
            onChange={(e) => setAdminPass(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && setAuthenticated(true)}
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
              <Button onClick={addGroup} colorScheme="blue">
                Add Group
              </Button>
              {groups.map((g, gidx) => (
                <Box key={g.id} borderWidth="1px" p={4} borderRadius="md">
                  <HStack mb={3}>
                    <Input
                      value={g.id}
                      isReadOnly
                      size="sm"
                      flex={1}
                      placeholder="Group ID"
                    />
                    <Input
                      value={g.name}
                      onChange={(e) => updateGroup(gidx, 'name', e.target.value)}
                      size="sm"
                      flex={1}
                      placeholder="Group name"
                    />
                    <Button size="sm" colorScheme="red" onClick={() => deleteGroup(gidx)}>
                      Delete
                    </Button>
                  </HStack>

                  <Heading size="sm" mb={2}>
                    Users
                  </Heading>
                  <VStack align="stretch" mb={3}>
                    {g.users.map((u, uidx) => (
                      <HStack key={u.id}>
                        <Input
                          value={u.id}
                          onChange={(e) => updateUser(gidx, uidx, 'id', e.target.value)}
                          size="sm"
                          placeholder="User ID"
                          flex={1}
                        />
                        <Input
                          value={u.name}
                          onChange={(e) => updateUser(gidx, uidx, 'name', e.target.value)}
                          size="sm"
                          placeholder="User name"
                          flex={1}
                        />
                        <Button
                          size="sm"
                          colorScheme="red"
                          onClick={() => removeUser(gidx, uidx)}
                        >
                          Remove
                        </Button>
                      </HStack>
                    ))}
                  </VStack>
                  <Button size="sm" onClick={() => addUserToGroup(gidx)}>
                    Add User
                  </Button>
                </Box>
              ))}
              <Button onClick={saveStore} isLoading={loading} colorScheme="green">
                Save All Changes
              </Button>
            </VStack>
          </TabPanel>
          <TabPanel>
            <VStack align="stretch" spacing={4}>
              <Textarea
                value={JSON.stringify({ groups }, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setGroups(parsed.groups || []);
                  } catch {}
                }}
                height="500px"
                fontFamily="monospace"
              />
              <Button onClick={saveStore} isLoading={loading} colorScheme="green">
                Save JSON
              </Button>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

