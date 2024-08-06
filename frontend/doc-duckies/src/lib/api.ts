import { FinancialData } from '@/components/charts/data';

// login func
export async function loginUser(email: string, password: string) {
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Failed to login');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
}


// upload func 
export async function handleFileUpload(file: File): Promise<FinancialData> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/invoiceUP', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    const data = await response.json();
    return data.cloudFunctionResponse.extracted_data; // Return only the extracted data
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

// downloadCSV func


export async function downloadCSV() {
  try {
    const response = await fetch('/api/downloadCSV', {
      method: 'GET',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to download CSV: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'financial_data.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading CSV:', error);
    throw error;
  }
}