// pages/api/invoiceUP.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Storage } from '@google-cloud/storage';
import { Logging } from '@google-cloud/logging';
import formidable from 'formidable';
import fs from 'fs';
import axios from 'axios';
import { logAction } from '@/lib/logging';


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




export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    await logAction('Invalid method for invoice upload', 'ERROR');
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const form = formidable({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      await logAction(`Error parsing form: ${err.message}`, 'ERROR');
      return res.status(500).json({ error: 'Error parsing form' });
    }

    const user = Array.isArray(fields.user) ? fields.user[0] : fields.user;

    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      await logAction('No file uploaded', 'ERROR');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (file.mimetype !== 'application/pdf') {
      await logAction(`Invalid file type: ${file.mimetype}`, 'ERROR');
      return res.status(400).json({ error: 'Invalid file type, only PDF files are allowed' });
    }

    try {
      const gsUrl = await uploadFileToGCS(file);
      fs.unlinkSync(file.filepath); // Clean up the temporary file
      const cloudFunctionResponse = await callCloudFunction(gsUrl);

      await logAction(`File ${file.originalFilename} uploaded successfully`, 'INFO');

      res.status(200).json({
        message: 'File uploaded successfully and Cloud Function triggered',
        url: gsUrl,
        cloudFunctionResponse,
      });
    } catch (error: any) {
      await logAction(`Error uploading file or triggering Cloud Function: ${error.message}`, 'ERROR');
      res.status(500).json({ error: 'Error uploading file or triggering Cloud Function' });
    }
  });
}