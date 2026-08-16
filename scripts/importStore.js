const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const storePath = path.join(process.cwd(), 'data', 'store.json');
  if (!fs.existsSync(storePath)) {
    console.error('No data/store.json found');
    process.exit(1);
  }

  const raw = fs.readFileSync(storePath, 'utf8');
  const store = JSON.parse(raw);
  if (!Array.isArray(store.groups)) {
    console.error('Invalid store format');
    process.exit(1);
  }

  console.log('Clearing DB (votes/animes/users/groups)');
  await prisma.vote.deleteMany();
  await prisma.anime.deleteMany();
  await prisma.user.deleteMany();
  await prisma.group.deleteMany();

  for (const g of store.groups) {
    console.log('Creating group', g.id);
    const createdGroup = await prisma.group.create({
      data: {
        id: g.id,
        name: g.name,
      },
    });

    if (Array.isArray(g.users)) {
      for (const u of g.users) {
        await prisma.user.create({ data: { id: u.id, name: u.name, groupId: createdGroup.id } });
      }
    }

    const createAnime = async (a, status) => {
      const animeId = String(a.id);
      await prisma.anime.create({
        data: {
          id: animeId,
          title: a.title || 'Untitled',
          coverImage: a.coverImage || null,
          genres: a.genres || [],
          tags: a.tags || [],
          episodes: a.episodes ?? null,
          startDate: a.startDate || null,
          votesUp: a.votes?.up ?? 0,
          votesDown: a.votes?.down ?? 0,
          status: status,
          groupId: createdGroup.id,
        },
      });
    };

    if (Array.isArray(g.plan)) {
      for (const a of g.plan) await createAnime(a, 'PLAN');
    }
    if (Array.isArray(g.completed)) {
      for (const a of g.completed) await createAnime(a, 'COMPLETED');
    }

    // Votes mapping: { userId: { animeId: { up, down }}}
    if (g.votes && typeof g.votes === 'object') {
      for (const [userId, animeMap] of Object.entries(g.votes)) {
        for (const [animeId, v] of Object.entries(animeMap || {})) {
          await prisma.vote.upsert({
            where: { userId_animeId: { userId: String(userId), animeId: String(animeId) } },
            update: { up: v.up ?? 0, down: v.down ?? 0 },
            create: { userId: String(userId), animeId: String(animeId), up: v.up ?? 0, down: v.down ?? 0 },
          });
        }
      }
    }
  }

  console.log('Import complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
