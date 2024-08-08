// pages/api/downloadCSV.ts
// pages/api/downloadCSV.ts
// pages/api/downloadCSV.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Storage } from '@google-cloud/storage';
import { parse } from 'json2csv';
import { logAction } from '@/lib/logging';  // Import the logAction function

const storage = new Storage();
const bucket = storage.bucket(process.env.OUTPUT_BUCKET_NAME || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    await logAction('Method Not Allowed', `Method ${req.method} Not Allowed for CSV download`, 'ERROR');
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const user = req.query.user as string;

  try {
    console.log('Fetching files from Google Cloud Storage...');
    const [files] = await bucket.getFiles();
    console.log(`Found ${files.length} files`);

    if (files.length === 0) {
      await logAction(`No files found for user: ${user}`, 'No files found in the bucket', 'WARNING');
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
      await logAction(`CSV Downloaded by user: ${user}`, `Downloaded CSV file: ${latestFile.name}`, 'INFO');
      return res.status(200).send(fileContent);
    }

    console.log('Parsing JSON content...');
    let data;
    try {
      data = JSON.parse(fileContent);
    } catch (parseError: any) {
      console.error('Error parsing JSON:', parseError);
      await logAction(`Error parsing JSON for user: ${user}`, `Error parsing JSON: ${parseError.message}`, 'ERROR');
      return res.status(500).json({ error: 'Error parsing file content', details: parseError.message });
    }

    console.log('Converting JSON to CSV...');
    let csv;
    try {
      csv = parse(data);
    } catch (csvError: any) {
      console.error('Error converting to CSV:', csvError);
      await logAction(`Error converting JSON to CSV for user: ${user}`, `Error converting to CSV: ${csvError.message}`, 'ERROR');
      return res.status(500).json({ error: 'Error converting to CSV', details: csvError.message });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${latestFile.name.replace('.json', '.csv')}`);
    console.log('Sending CSV data...');
    await logAction(`CSV Downloaded by user: ${user}`, `Downloaded CSV file: ${latestFile.name.replace('.json', '.csv')}`, 'INFO');
    res.status(200).send(csv);
  } catch (error: any) {
    console.error('Error generating CSV:', error);
    await logAction(`Error generating CSV for user: ${user}`, `Error generating CSV: ${error.message}`, 'ERROR');
    res.status(500).json({ error: 'Error generating CSV', details: error.message });
  }
}
