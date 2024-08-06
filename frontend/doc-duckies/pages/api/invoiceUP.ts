// invoiceUP.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { Storage } from '@google-cloud/storage';
import formidable from 'formidable';
import fs from 'fs';
import axios from 'axios';

// Initialize Google Cloud Storage
const storage = new Storage();
const bucket = storage.bucket('document-ai-financial-storage'); 

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadFileToGCS = async (file: formidable.File) => {
  const [fileUpload] = await bucket.upload(file.filepath, {
    destination: `invoices/${file.originalFilename}`,
  });

  return `gs://${bucket.name}/${fileUpload.name}`;
};

const callCloudFunction = async (gsUrl: string) => {
  const cloudFunctionUrl = 'https://us-central1-documentai-430918.cloudfunctions.net/process_pdf';
  const response = await axios.post(cloudFunctionUrl, {
    pdf_gcs_uri: gsUrl,
  });

  return response.data;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const form = formidable({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ error: 'Error parsing form' });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const gsUrl = await uploadFileToGCS(file);
      fs.unlinkSync(file.filepath); // Clean up the temporary file
      const cloudFunctionResponse = await callCloudFunction(gsUrl);

      return res.status(200).json({
        message: 'File uploaded successfully and Cloud Function triggered',
        url: gsUrl,
        cloudFunctionResponse,
      });
    } catch (error) {
      console.error('Error uploading file or triggering Cloud Function:', error);
      return res.status(500).json({ error: 'Error uploading file or triggering Cloud Function' });
    }
  });
}