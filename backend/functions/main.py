# cloud function 

import json
import os
import logging
from google.cloud import storage
from google.cloud import documentai_v1 as documentai
import functions_framework
import yaml
import csv
import io

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

        logging.info("Document AI processing complete.")

        # Extract fields from the document
        extracted_data = extract_fields(document)

        # Perform calculations
        calculated_data = perform_calculations(extracted_data)

        # Combine extracted and calculated data
        final_data = {**extracted_data, **calculated_data}

        logging.info(f"Final data: {json.dumps(final_data, indent=2)}")

        # Upload JSON to the output bucket
        json_filename = f"{os.path.basename(pdf_gcs_uri).rsplit('.', 1)[0]}.json"
        json_gcs_uri = upload_to_gcs(json.dumps(final_data, indent=2), json_filename, OUTPUT_BUCKET_NAME, 'json')

        # Upload CSV to the output bucket
        csv_filename = f"{os.path.basename(pdf_gcs_uri).rsplit('.', 1)[0]}.csv"
        csv_gcs_uri = upload_to_gcs(json.dumps(final_data), csv_filename, OUTPUT_BUCKET_NAME, 'csv')

        logging.info(f"JSON file uploaded to: {json_gcs_uri}")
        logging.info(f"CSV file uploaded to: {csv_gcs_uri}")
        
        return json.dumps({
            "json_gcs_uri": json_gcs_uri,
            "csv_gcs_uri": csv_gcs_uri,
            "extracted_data": final_data
        })

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

def json_to_csv(json_data):
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=json_data.keys())
    writer.writeheader()
    writer.writerow(json_data)
    return output.getvalue()

def upload_to_gcs(data, filename, bucket_name, file_type):
    """Uploads a file to Google Cloud Storage."""
    try:
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(filename)
        if file_type == 'csv':
            csv_data = json_to_csv(json.loads(data))
            blob.upload_from_string(csv_data, content_type='text/csv')
        else:
            blob.upload_from_string(data, content_type='application/json')
        return f"gs://{bucket_name}/{filename}"
    except Exception as e:
        logging.error(f"Error uploading file {filename} to bucket {bucket_name}: {str(e)}", exc_info=True)
        raise

def extract_fields(document):
    """Extracts specified fields from the processed document."""
    fields = {
        "Capital": [],
        "Investments": [],
        "Net-Profit": [],
        "Total-Assets": [],
        "Total-Expenditure": [],
        "Total-Income": [],
        "Total-Liabilities": [],
        "Year": []
    }

    for entity in document.entities:
        field_name = entity.type_
        if field_name in fields:
            fields[field_name].append(entity.mention_text)

    # Convert lists to single values if only one item is present
    for field, values in fields.items():
        if len(values) == 1:
            fields[field] = values[0]
        elif len(values) == 0:
            fields[field] = None
        # If there are multiple values, keep it as a list

    return fields

def perform_calculations(data):
    """Performs financial calculations based on extracted data."""
    calculations = {}

    def safe_convert(value):
        if isinstance(value, list):
            # If it's a list, convert the first non-null value
            for v in value:
                if v is not None:
                    try:
                        return float(v.replace(',', ''))
                    except ValueError:
                        continue
            return None
        elif value:
            try:
                return float(value.replace(',', ''))
            except ValueError:
                return None
        return None

    # Convert string values to float for calculations
    capital = safe_convert(data.get('Capital'))
    investments = safe_convert(data.get('Investments'))
    net_profit = safe_convert(data.get('Net-Profit'))
    total_assets = safe_convert(data.get('Total-Assets'))
    total_expenditure = safe_convert(data.get('Total-Expenditure'))
    total_income = safe_convert(data.get('Total-Income'))
    total_liabilities = safe_convert(data.get('Total-Liabilities'))

    # Perform calculations only if values are not None
    if capital is not None and total_liabilities is not None and total_liabilities != 0:
        calculations['Current-Ratio'] = capital / total_liabilities
        calculations['Quick-Ratio'] = capital / total_liabilities

    if net_profit is not None and total_income is not None and total_income != 0:
        calculations['Net-Profit-Margin'] = (net_profit / total_income) * 100

    if net_profit is not None and total_assets is not None and total_assets != 0:
        calculations['Return-on-Assets'] = net_profit / total_assets

    if net_profit is not None and capital is not None and capital != 0:
        calculations['Return-on-Equity'] = net_profit / capital

    if total_liabilities is not None and capital is not None and capital != 0:
        calculations['Debt-to-Equity-Ratio'] = total_liabilities / capital

    if total_liabilities is not None and total_assets is not None and total_assets != 0:
        calculations['Debt-to-Assets-Ratio'] = total_liabilities / total_assets

    if total_income is not None and total_assets is not None and total_assets != 0:
        calculations['Total-Asset-Turnover-Ratio'] = total_income / total_assets

    return calculations