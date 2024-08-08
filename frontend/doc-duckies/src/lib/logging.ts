// lib/logging.ts
export const logAction = async (message: string | undefined, severity: 'INFO' | 'ERROR' | 'WARNING' = 'INFO') => {
  if (typeof message !== 'string' || message.trim() === '') {
    console.warn('Attempted to log an empty or invalid message. Skipping.');
    return;
  }

  try {
    const response = await fetch('/api/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, severity }),
    });

    if (!response.ok) {
      throw new Error('Failed to create log entry');
    }

    console.log(`Log written: ${severity} - ${message}`);
  } catch (error) {
    console.error('Error writing log:', error);
  }
};

export const testLogAction = async () => {
  await logAction('This is a test log entry', 'INFO');
};