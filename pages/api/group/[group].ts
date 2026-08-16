import type { NextApiRequest, NextApiResponse } from 'next';
import { readStore, writeStore, Store } from '../../../lib/dataStore';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { group } = req.query;
  if (!group || Array.isArray(group)) return res.status(400).json({ error: 'Invalid group' });

  const store = readStore();
  const gidx = store.groups.findIndex((g) => g.id === group);
  if (gidx === -1) return res.status(404).json({ error: 'Group not found' });

  if (req.method === 'GET') {
    return res.status(200).json(store.groups[gidx]);
  }

  if (req.method === 'POST') {
    const { action, payload } = req.body || {};
    const groupObj = store.groups[gidx];

    if (action === 'add') {
      const anime = payload?.anime;
      if (!anime) return res.status(400).json({ error: 'Missing anime' });
      // initialize votes
      anime.votes = anime.votes || { up: 0, down: 0 };
      groupObj.plan.push(anime);
      writeStore(store);
      return res.status(200).json(groupObj);
    }

    if (action === 'complete') {
      const animeId = payload?.animeId;
      if (!animeId) return res.status(400).json({ error: 'Missing animeId' });
      const idx = groupObj.plan.findIndex((a: any) => String(a.id) === String(animeId));
      if (idx === -1) return res.status(400).json({ error: 'Anime not in plan' });
      const [item] = groupObj.plan.splice(idx, 1);
      groupObj.completed.push(item);
      writeStore(store);
      return res.status(200).json(groupObj);
    }

    if (action === 'vote') {
      const { userId, animeId, type } = payload || {};
      if (!userId || !animeId || !type) return res.status(400).json({ error: 'Missing vote payload' });

      groupObj.votes = groupObj.votes || {};
      groupObj.votes[userId] = groupObj.votes[userId] || {};
      const userVotes = groupObj.votes[userId];
      const existing = userVotes[String(animeId)];

      // Count current totals for this user
      let upCount = 0;
      let downCount = 0;
      for (const k of Object.keys(userVotes)) {
        const v = userVotes[k];
        if (v === 'up') upCount++;
        if (v === 'down') downCount++;
      }

      // find anime in plan
      const aidx = groupObj.plan.findIndex((a: any) => String(a.id) === String(animeId));
      if (aidx === -1) return res.status(400).json({ error: 'Anime not in plan' });
      const anime = groupObj.plan[aidx];
      anime.votes = anime.votes || { up: 0, down: 0 };

      if (existing === type) {
        // already same vote -> no-op
        return res.status(200).json(groupObj);
      }

      // if switching vote from other type
      if (existing && existing !== type) {
        // decrement previous
        if (existing === 'up') {
          anime.votes.up = Math.max(0, (anime.votes.up || 0) - 1);
          upCount = Math.max(0, upCount - 1);
        } else if (existing === 'down') {
          anime.votes.down = Math.max(0, (anime.votes.down || 0) - 1);
          downCount = Math.max(0, downCount - 1);
        }
      }

      // enforce limits if adding new vote
      if (!existing) {
        if (type === 'up' && upCount >= 5) {
          return res.status(400).json({ error: 'Upvote limit reached' });
        }
        if (type === 'down' && downCount >= 3) {
          return res.status(400).json({ error: 'Downvote limit reached' });
        }
      }

      // apply new vote
      userVotes[String(animeId)] = type;
      if (type === 'up') anime.votes.up = (anime.votes.up || 0) + 1;
      if (type === 'down') anime.votes.down = (anime.votes.down || 0) + 1;

      writeStore(store);
      return res.status(200).json(groupObj);
    }

    if (action === 'undo') {
      const { userId, animeId } = payload || {};
      if (!userId || !animeId) return res.status(400).json({ error: 'Missing undo payload' });
      groupObj.votes = groupObj.votes || {};
      const userVotes = groupObj.votes[userId] || {};
      const existing = userVotes[String(animeId)];
      if (!existing) return res.status(400).json({ error: 'No vote to undo' });

      // find anime
      const aidx = groupObj.plan.findIndex((a: any) => String(a.id) === String(animeId));
      if (aidx === -1) return res.status(400).json({ error: 'Anime not in plan' });
      const anime = groupObj.plan[aidx];
      anime.votes = anime.votes || { up: 0, down: 0 };

      if (existing === 'up') anime.votes.up = Math.max(0, (anime.votes.up || 0) - 1);
      if (existing === 'down') anime.votes.down = Math.max(0, (anime.votes.down || 0) - 1);

      delete userVotes[String(animeId)];
      writeStore(store);
      return res.status(200).json(groupObj);
    }

    return res.status(400).json({ error: 'Unknown action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
