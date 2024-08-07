// pages/api/logs.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Logging } from '@google-cloud/logging';

const logging = new Logging();
const log = logging.log('docduckie-app-logs');

const getLogs = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const [entries] = await log.getEntries({
      pageSize: 100,
      orderBy: 'timestamp desc',
    });

    const logs = entries.map(entry => {
      const { timestamp, severity, jsonPayload, textPayload, labels } = entry.metadata;
      
      let message = 'Every thing is fine';
      if (jsonPayload && jsonPayload.fields) {
        message = jsonPayload.fields.message?.stringValue || message;
      } else if (textPayload) {
        message = textPayload;
      }
      
      return {
        timestamp: new Date(timestamp).toISOString(),
        level: severity || 'DEFAULT',
        message,
        user: jsonPayload?.fields?.user?.stringValue || labels?.user || 'System',
        action: jsonPayload?.fields?.action?.stringValue || labels?.action || 'Unknown'
      };
    });

    console.log(`Retrieved ${logs.length} log entries`);

    res.status(200).json(logs);
  } catch (error: any) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs', details: error.message });
  }
};

export default getLogs;
