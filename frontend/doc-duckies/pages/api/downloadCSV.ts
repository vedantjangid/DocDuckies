// pages/api/downloadCSV.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { Storage } from '@google-cloud/storage';
import { parse } from 'json2csv';

const storage = new Storage();
const bucket = storage.bucket('output-document-ai-financial-storage');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    console.log('Fetching files from Google Cloud Storage...');
    const [files] = await bucket.getFiles();
    console.log(`Found ${files.length} files`);

    if (files.length === 0) {
      return res.status(404).json({ error: 'No files found in the bucket' });
    }

    // Sort files by creation time, handling potential undefined values
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

    // Download the file content
    console.log('Downloading file content...');
    const [content] = await latestFile.download();
    const fileContent = content.toString();
    console.log('File content downloaded');

    // Check if the content is already in CSV format
    if (fileContent.trim().startsWith('C')) {
      // If it's already CSV, just send it
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${latestFile.name}`);
      return res.status(200).send(fileContent);
    }

    // If not CSV, try to parse as JSON
    console.log('Parsing JSON content...');
    let data;
    try {
      data = JSON.parse(fileContent);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      return res.status(500).json({ error: 'Error parsing file content', details: parseError.message });
    }

    // Convert JSON to CSV
    console.log('Converting JSON to CSV...');
    let csv;
    try {
      csv = parse(data);
    } catch (csvError) {
      console.error('Error converting to CSV:', csvError);
      return res.status(500).json({ error: 'Error converting to CSV', details: csvError.message });
    }

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${latestFile.name.replace('.json', '.csv')}`);

    // Send the CSV data
    console.log('Sending CSV data...');
    res.status(200).send(csv);
  } catch (error) {
    console.error('Error generating CSV:', error);
    res.status(500).json({ error: 'Error generating CSV', details: error.message });
  }
}