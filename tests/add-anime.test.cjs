const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function loadModule(path, dependencies) {
  const source = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  });
  return exports;
}

test('adding anime inserts only the new entry and preserves existing votes on retry', async () => {
  const animes = [{ id: '1', title: 'Existing', status: 'COMPLETED', votesUp: 2, votes: [] }];
  const group = { id: 'group', name: 'Group', users: [], animes };
  let inserts = 0;
  const { addAnimeToGroup } = loadModule('lib/dataStore.ts', {
    '@prisma/client': { Prisma: { JsonNull: null } },
    './prisma': { prisma: {
      anime: { async createMany({ data, skipDuplicates }) {
        assert.equal(skipDuplicates, true);
        assert.equal(data.length, 1);
        const entry = data[0];
        if (!animes.some((anime) => anime.id === entry.id)) {
          animes.push({ ...entry, votes: [], votesUp: 0 });
          inserts++;
        }
      } },
      group: { async findUnique() { return group; } },
      $transaction() { throw new Error('Must not rewrite the store'); },
    } },
  });
  const result = await addAnimeToGroup('group', { id: '2', title: 'New', tags: ['Adventure'] });
  assert.equal(result.plan[0].id, '2');
  assert.equal(result.plan[0].tags[0], 'Adventure');
  assert.equal(result.completed[0].votes.up, 2);
  await addAnimeToGroup('group', { id: '2', title: 'Retry' });
  const retry = await addAnimeToGroup('group', { id: '1', title: 'Existing retry' });
  assert.equal(inserts, 1);
  assert.equal(retry.completed[0].votes.up, 2);
  assert.equal(retry.plan.length, 1);
});

test('add route bypasses full-store writes and returns persisted group', async () => {
  const group = { id: 'group', plan: [], completed: [] };
  const persisted = { ...group, plan: [{ id: '2', title: 'New' }] };
  const { POST } = loadModule('app/api/group/[group]/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, ...options }) } },
    '../../../../lib/dataStore': {
      readStore: async () => ({ groups: [group] }),
      writeGroup() { throw new Error('Must not rewrite the group when adding'); },
      async addAnimeToGroup(groupId, anime) {
        assert.equal(groupId, 'group');
        assert.equal(anime.id, '2');
        return persisted;
      },
    },
    '../../../../lib/anilist': { enrichGroupWithAniListDetails: async (value) => value },
    '../../../../lib/models': {},
  });
  const result = await POST({ json: async () => ({ action: 'add', payload: { anime: { id: 2, title: 'New' } } }) }, { params: { group: 'group' } });
  assert.equal(result.status, 200);
  assert.equal(result.body, persisted);
});

test('database: shared titles keep group votes and completion independent', { skip: !process.env.TEST_DATABASE }, async () => {
  const { PrismaClient, Prisma } = require('@prisma/client');
  const { randomUUID } = require('node:crypto');
  const prisma = new PrismaClient();
  const prefix = `regression-${randomUUID()}`;
  const groupIds = [`${prefix}-a`, `${prefix}-b`];
  const animeId = `${prefix}-anime`;
  const { addAnimeToGroup, writeGroup } = loadModule('lib/dataStore.ts', {
    '@prisma/client': { Prisma }, './prisma': { prisma },
  });
  try {
    for (const id of groupIds) {
      await prisma.group.create({ data: { id, name: 'Regression test' } });
    }
    const anime = { id: animeId, title: 'Shared title' };
    const first = await addAnimeToGroup(groupIds[0], anime);
    const second = await addAnimeToGroup(groupIds[1], anime);
    assert.equal(first.plan[0].id, animeId);
    assert.equal(second.plan[0].id, animeId);

    const userId = `${prefix}-user`;
    first.users = [{ id: userId, name: 'Test user' }];
    first.votes = { [userId]: { [animeId]: { up: 2, down: 1 } } };
    await writeGroup(first);
    const retry = await addAnimeToGroup(groupIds[0], anime);
    assert.equal(retry.plan[0].votes.up, 2);
    const other = await addAnimeToGroup(groupIds[1], anime);
    assert.equal(other.plan[0].votes.up, 0);
    assert.equal(Object.keys(other.votes).length, 0);

    first.completed = first.plan;
    first.plan = [];
    first.votes = {};
    await writeGroup(first);
    const completed = await addAnimeToGroup(groupIds[0], anime);
    assert.equal(completed.completed.length, 1);
    assert.equal(completed.plan.length, 0);
    assert.equal((await addAnimeToGroup(groupIds[1], anime)).plan.length, 1);

    first.completed = [];
    await writeGroup(first);
    assert.equal(await prisma.anime.count({ where: { groupId: groupIds[0] } }), 0);
    assert.equal(await prisma.anime.count({ where: { groupId: groupIds[1] } }), 1);
  } finally {
    await prisma.$transaction([
      prisma.vote.deleteMany({ where: { groupId: { in: groupIds } } }),
      prisma.anime.deleteMany({ where: { groupId: { in: groupIds } } }),
      prisma.user.deleteMany({ where: { groupId: { in: groupIds } } }),
      prisma.group.deleteMany({ where: { id: { in: groupIds } } }),
    ]);
    await prisma.$disconnect();
  }
});
