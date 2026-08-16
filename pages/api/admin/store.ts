import type { NextApiRequest, NextApiResponse } from 'next';
import { readStore, writeStore, Store } from '../../../lib/dataStore';

const ADMIN_HEADER = 'x-admin-password';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const store = readStore();

  if (req.method === 'GET') {
    return res.status(200).json(store);
  }

  // For any write actions require admin password
  const provided = req.headers[ADMIN_HEADER];
  const adminPass = process.env.ADMIN_PASSWORD || 'admin';
  if (!provided || provided !== adminPass) {
    return res.status(401).json({ error: 'Unauthorized (missing or wrong admin password header)' });
  }

  if (req.method === 'POST') {
    // Replace entire store (simple approach for prototype)
    const incoming = req.body as Store;
    writeStore(incoming);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
