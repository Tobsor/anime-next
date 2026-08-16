import type { NextApiRequest, NextApiResponse } from 'next';

const ANILIST_URL = 'https://graphql.anilist.co';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { query, variables } = req.body;
    if (!query) return res.status(400).json({ error: 'Missing query' });

    const response = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
