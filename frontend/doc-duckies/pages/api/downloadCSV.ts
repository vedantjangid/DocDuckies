// pages/api/downloadCSV.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Storage } from '@google-cloud/storage';
import { Logging } from '@google-cloud/logging';
import { parse } from 'json2csv';

const storage = new Storage();
const bucket = storage.bucket(process.env.OUTPUT_BUCKET_NAME || '');

const logging = new Logging();
const log = logging.log('docduckie-app-logs');

const logAction = async (user: string, action: string, message: string) => {
  const entry = log.entry({ resource: { type: 'global' } }, {
    severity: 'INFO',
    user,
    action,
    message,
  });
  await log.write(entry);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    await logAction('System', 'Invalid Method', `Method ${req.method} Not Allowed for CSV download`);
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    console.log('Fetching files from Google Cloud Storage...');
    const [files] = await bucket.getFiles();
    console.log(`Found ${files.length} files`);

    if (files.length === 0) {
      await logAction('System', 'CSV Download', 'No files found in the bucket');
      return res.status(404).json({ error: 'No files found in the bucket' });
    }

    const sortedFiles = files.sort((a, b) => {
      const timeA = a.metadata.timeCreated;
      const timeB = b.metadata.timeCreated;
      if (!timeA && !timeB) return 0;
      if (!timeA) return 1;
      if (!timeB) return -1;
      return timeB.localeCompare(timeA);
    });

    const latestFile = sortedFiles[0];
    console.log(`Latest file: ${latestFile.name}`);

    console.log('Downloading file content...');
    const [content] = await latestFile.download();
    const fileContent = content.toString();
    console.log('File content downloaded');

    if (fileContent.trim().startsWith('C')) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${latestFile.name}`);
      await logAction(req.query.user as string, 'CSV Download', `Downloaded CSV file: ${latestFile.name}`);
      return res.status(200).send(fileContent);
    }

    console.log('Parsing JSON content...');
    let data;
    try {
      data = JSON.parse(fileContent);
    } catch (parseError: any) {
      console.error('Error parsing JSON:', parseError);
      await logAction('System', 'CSV Download', `Error parsing JSON: ${parseError.message}`);
      return res.status(500).json({ error: 'Error parsing file content', details: parseError.message });
    }

    console.log('Converting JSON to CSV...');
    let csv;
    try {
      csv = parse(data);
    } catch (csvError: any) {
      console.error('Error converting to CSV:', csvError);
      await logAction('System', 'CSV Download', `Error converting to CSV: ${csvError.message}`);
      return res.status(500).json({ error: 'Error converting to CSV', details: csvError.message });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${latestFile.name.replace('.json', '.csv')}`);
    console.log('Sending CSV data...');
    await logAction(req.query.user as string, 'CSV Download', `Downloaded CSV file: ${latestFile.name.replace('.json', '.csv')}`);
    res.status(200).send(csv);
  } catch (error: any) {
    console.error('Error generating CSV:', error);
    await logAction('System', 'CSV Download', `Error generating CSV: ${error.message}`);
    res.status(500).json({ error: 'Error generating CSV', details: error.message });
  }
}
