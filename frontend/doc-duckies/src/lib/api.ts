import { FinancialData } from '@/components/charts/data';


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