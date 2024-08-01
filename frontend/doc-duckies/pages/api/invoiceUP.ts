import type { NextApiRequest, NextApiResponse } from 'next';
import { Storage } from '@google-cloud/storage';
import formidable from 'formidable';
import fs from 'fs';

// Initialize Google Cloud Storage
const storage = new Storage();
const bucket = storage.bucket('document-ai-financial-storage'); // Replace with your bucket name

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(500).json({ error: 'Error parsing form' });
        return;
      }

      const file = Array.isArray(files.file) ? files.file[0] : files.file;

      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      try {
        // Upload file to Google Cloud Storage
        await bucket.upload(file.filepath, {
          destination: `invoices/${file.originalFilename}`,
        });

        // Clean up the temporary file
        fs.unlinkSync(file.filepath);

        res.status(200).json({ message: 'File uploaded successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Error uploading file' });
      }
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}