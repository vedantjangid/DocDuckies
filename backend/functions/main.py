import json
import os
import logging
from google.cloud import storage
from google.cloud import documentai_v1 as documentai
import pandas as pd
import functions_framework
import yaml
 
# Configure logging
logging.basicConfig(level=logging.INFO)
 
# Load environment variables from .env.yaml
with open(".env.yaml", "r") as env_file:
    env_vars = yaml.safe_load(env_file)
 
# Set environment variables
PROJECT_ID = env_vars["PROJECT_ID"]
OUTPUT_BUCKET_NAME = env_vars["OUTPUT_BUCKET_NAME"]
PROCESSOR_ID = env_vars["PROCESSOR_ID"]
PROCESSOR_LOCATION = env_vars.get("PROCESSOR_LOCATION", "us")  # Default to 'us' if not specified
 
# Initialize Google Cloud Storage client
storage_client = storage.Client()
 
# Initialize Document AI client
docai_client = documentai.DocumentProcessorServiceClient()
 
@functions_framework.http
def process_pdf(request):
    try:
        # Parse request JSON
        request_json = request.get_json(silent=True)
        if not request_json or 'pdf_gcs_uri' not in request_json:
            return json.dumps({"error": "Missing PDF GCS URI in request"}), 400
 
        pdf_gcs_uri = request_json['pdf_gcs_uri']
        logging.info(f"Processing PDF from URI: {pdf_gcs_uri}")
 
        # Download the PDF file from the provided GCS URI
        pdf_content = gcs_download_file_from_uri(pdf_gcs_uri)
 
        # Process the PDF with Document AI
        name = f"projects/{PROJECT_ID}/locations/{PROCESSOR_LOCATION}/processors/{PROCESSOR_ID}"
        raw_document = documentai.RawDocument(content=pdf_content, mime_type='application/pdf')
        request = documentai.ProcessRequest(name=name, raw_document=raw_document)
        result = docai_client.process_document(request=request)
        document = result.document
 
        # Extract text and form fields from the document
        extracted_data = extract_form_fields(document)
 
        # If no form fields were extracted, fallback to extracting all text
        if not extracted_data:
            logging.warning("No form fields found. Extracting all text.")
            extracted_data = extract_all_text(document)
 
        logging.info(f"Extracted data: {json.dumps(extracted_data, indent=2)}")
 
        # Convert data to DataFrame
        df = pd.DataFrame(extracted_data)
 
        # Convert DataFrame to CSV
        csv_data = df.to_csv(index=False)
 
        # Upload CSV to the output bucket
        csv_filename = f"{os.path.basename(pdf_gcs_uri).rsplit('.', 1)[0]}.csv"
        csv_gcs_uri = upload_to_gcs(csv_data, csv_filename, OUTPUT_BUCKET_NAME)
 
        logging.info(f"CSV file uploaded to: {csv_gcs_uri}")
        return json.dumps({"csv_gcs_uri": csv_gcs_uri})
 
    except Exception as e:
        logging.error(f"Error processing PDF: {str(e)}", exc_info=True)
        return json.dumps({"error": str(e)}), 500
 
def gcs_download_file_from_uri(gcs_uri):
    """Downloads a file from Google Cloud Storage using a GCS URI."""
    try:
        bucket_name = gcs_uri.split('/')[2]
        blob_name = '/'.join(gcs_uri.split('/')[3:])
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(blob_name)
        return blob.download_as_bytes()
    except Exception as e:
        logging.error(f"Error downloading file from URI {gcs_uri}: {str(e)}", exc_info=True)
        raise
 
def upload_to_gcs(data, filename, bucket_name):
    """Uploads a file to Google Cloud Storage."""
    try:
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(filename)
        blob.upload_from_string(data, content_type='text/csv')
        return f"gs://{bucket_name}/{filename}"
    except Exception as e:
        logging.error(f"Error uploading file {filename} to bucket {bucket_name}: {str(e)}", exc_info=True)
        raise
 
def extract_form_fields(document):
    """Extracts form fields from the processed document."""
    form_fields = []
    for page in document.pages:
        page_fields = {}
        for form_field in page.form_fields:
            field_name = form_field.field_name.text_anchor.content.strip()
            field_value = form_field.field_value.text_anchor.content.strip()
            if field_name and field_value:
                page_fields[field_name] = field_value
        if page_fields:
            form_fields.append(page_fields)
    logging.info(f"Extracted {len(form_fields)} pages with form fields")
    return form_fields
 
def extract_all_text(document):
    """Extracts all text from the document."""
    all_text = []
    for page in document.pages:
        page_text = page.text
        all_text.append({"page_number": page.page_number, "text": page_text.strip()})
    logging.info(f"Extracted text from {len(all_text)} pages")
    return all_text