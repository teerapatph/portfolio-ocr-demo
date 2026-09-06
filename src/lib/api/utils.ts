
import axios from 'axios';

/**
 * Handle API/axios errors and return a user-friendly error or rethrow.
 */
export function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Server responded with a status code out of 2xx
      throw new Error(
        error.response.data?.message ||
        `API Error: ${error.response.status} ${error.response.statusText}`
      );
    } else if (error.request) {
      // No response received
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something happened in setting up the request
      throw new Error(`Request error: ${error.message}`);
    }
  } else if (error instanceof Error) {
    throw error;
  } else {
    throw new Error('An unknown error occurred.');
  }
}
