# DocDuckies

## Overview

DocDuckies is a web application that allows users to upload PDF documents and extract key financial data from them. The application uses Google Cloud's Document AI service to process the documents and stores the extracted data for later retrieval.

<img width="1440" alt="Screenshot 2024-11-28 at 1 00 20 AM" src="https://github.com/user-attachments/assets/05d0b838-865b-41a6-885b-e4e5cc7d0e24">

## Project Structure

The project is divided into two main components:

1. **Frontend**: The frontend is built using Next.js and React. It provides the user interface for uploading documents, viewing extracted data, and downloading the data in CSV format.

2. **Backend**: The backend is responsible for handling the document upload, triggering the Google Cloud Document AI service, and storing the extracted data. It is built using Next.js API routes.

## Getting Started

### Prerequisites

- Node.js (version 14 or later)
- Google Cloud SDK
- A Google Cloud Platform account with the Document AI and Cloud Storage APIs enabled

### Installation

#### Frontend

1. Navigate to the `frontend/doc-duckies` directory:
   ```
   cd frontend/doc-duckies
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file in the `frontend/doc-duckies` directory and add the necessary environment variables:
   ```
   GCS_BUCKET_NAME=your-gcs-bucket-name
   OUTPUT_BUCKET_NAME=your-output-bucket-name
   ```
4. Start the development server:
   ```
   npm run dev
   ```

#### Backend

1. Navigate to the `backend` directory:
   ```
   cd backend
   ```
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Create a `.env.yaml` file in the `backend` directory and add the necessary environment variables:
   ```
   GCS_BUCKET_NAME: your-gcs-bucket-name
   OUTPUT_BUCKET_NAME: your-output-bucket-name
   ```
4. Start the development server:
   ```
   python app.py
   ```

## Deployment

DocDuckies is designed to be deployed using Vercel for the frontend and Google Cloud Run for the backend.

### Vercel (Frontend)

1. Create a new Vercel project and connect it to your GitHub repository.
2. Configure the project settings:
   - **Root Directory**: `frontend/doc-duckies`
   - **Build Command**: `npm run build`
   - **Output Directory**: `out`
3. Add the necessary environment variables in the Vercel project settings.
4. Deploy the project.

### Google Cloud Run (Backend)

1. Create a new Google Cloud Run service and configure it to use your backend code.
2. Add the necessary environment variables to the service configuration.
3. Deploy the service.

## Contributing

We welcome contributions to the DocDuckies project. If you find any issues or have suggestions for improvements, please feel free to create a new issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
