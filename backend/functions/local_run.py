import os
import yaml
import json
import requests
from functions_framework import create_app

# Load environment variables from .env.yaml
with open(".env.yaml", "r") as env_file:
    env_vars = yaml.safe_load(env_file)

# Set environment variables
for key, value in env_vars.items():
    os.environ[key] = value

# Import the Cloud Function
from main import process_pdf

# Create the app
app = create_app(target='process_pdf', source='main.py', signature_type='http')

def test_process_pdf():
    # Test data
    test_data = {
        "pdf_gcs_uri": "gs://document-ai-financial-storage/Balance-Sheet-Example.pdf"
    }

    # Send a POST request to the local server
    response = requests.post('http://localhost:8080', json=test_data)

    # Print the response
    print(f"Status Code: {response.status_code}")
    print("Response:")
    print(json.dumps(response.json(), indent=2))

if __name__ == '__main__':
    import threading
    import time

    # Start the Flask app in a separate thread
    threading.Thread(target=app.run, kwargs={'host': '0.0.0.0', 'port': 8080}, daemon=True).start()

    # Wait for the server to start
    time.sleep(2)

    # Run the test
    test_process_pdf()