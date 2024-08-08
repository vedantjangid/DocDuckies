// pages/api/log.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { Logging } from '@google-cloud/logging';

const logging = new Logging();
const log = logging.log('docduckie-app-logs');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { message, severity } = req.body;

    try {
      const entry = log.entry({
        resource: { type: 'global' },
        severity: severity || 'INFO',
        jsonPayload: {
          message,
          timestamp: new Date().toISOString(),
        },
      });

      await log.write(entry);
      res.status(200).json({ message: 'Log entry created successfully' });
    } catch (error) {
      console.error('Error creating log entry:', error);
      res.status(500).json({ error: 'Failed to create log entry' });
    }
  } else if (req.method === 'GET') {
    try {
      const [entries] = await log.getEntries({
        pageSize: 100,
        orderBy: 'timestamp desc',
        filter: 'severity >= DEFAULT',
      });

      const logs = entries
        .map(entry => ({
          timestamp: new Date(entry.metadata.timestamp).toISOString(),
          level: entry.metadata.severity,
          message: (entry.data as any).jsonPayload?.message || '',
        }))
        .filter(log => log.message.trim() !== '')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      res.status(200).json(logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
