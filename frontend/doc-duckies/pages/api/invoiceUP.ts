// pages/api/invoiceUP.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Storage } from '@google-cloud/storage';
import { Logging } from '@google-cloud/logging';
import formidable from 'formidable';
import fs from 'fs';
import axios from 'axios';

const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME || '');

const logging = new Logging();
const log = logging.log('docduckie-app-logs');

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
  const cloudFunctionUrl = 'https://us-central1-documentai-430918.cloudfunctions.net/doc_function';
  const response = await axios.post(cloudFunctionUrl, {
    pdf_gcs_uri: gsUrl,
  });

  return response.data;
};

const logAction = async (user: string, action: string, message: string, severity: 'INFO' | 'ERROR' | 'WARNING' = 'INFO') => {
  const entry = log.entry({
    resource: { type: 'global' },
    severity,
    jsonPayload: {
      user,
      action,
      message,
      timestamp: new Date().toISOString(),
    }
  });
  await log.write(entry);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    await logAction('System', 'Invalid Method', `Method ${req.method} Not Allowed for invoice upload`, 'ERROR');
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const form = formidable({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      await logAction('System', 'File Upload', 'Error parsing form', 'ERROR');
      return res.status(500).json({ error: 'Error parsing form' });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      await logAction('System', 'File Upload', 'No file uploaded', 'ERROR');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (file.mimetype !== 'application/pdf') {
      await logAction(Array.isArray(fields.user) ? fields.user[0] : (fields.user as string), 'File Upload', `Invalid file type: ${file.mimetype}`, 'ERROR');
      return res.status(400).json({ error: 'Invalid file type, only PDF files are allowed' });
    }

    try {
      const gsUrl = await uploadFileToGCS(file);
      fs.unlinkSync(file.filepath); // Clean up the temporary file
      const cloudFunctionResponse = await callCloudFunction(gsUrl);

      await logAction(Array.isArray(fields.user) ? fields.user[0] : (fields.user as string), 'File Upload', `File ${file.originalFilename} uploaded successfully`, 'INFO');

      res.status(200).json({
        message: 'File uploaded successfully and Cloud Function triggered',
        url: gsUrl,
        cloudFunctionResponse,
      });
    } catch (error: any) {
      console.error('Error uploading file or triggering Cloud Function:', error);
      await logAction('System', 'File Upload', `Error uploading file or triggering Cloud Function: ${error.message}`, 'ERROR');
      res.status(500).json({ error: 'Error uploading file or triggering Cloud Function' });
    }
  });
}
