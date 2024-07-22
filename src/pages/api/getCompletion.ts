import type { NextApiRequest, NextApiResponse } from 'next';
import { main } from '../../lib/groqService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const result = await main();
    res.status(200).json({ content: result });
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
}
