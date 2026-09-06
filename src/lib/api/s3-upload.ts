// Response type from the upload API
interface UploadResponse {
  success: boolean;
  data: {
    fileKey: string;
    fileName: string;
    contentType: string;
  };
}

export async function uploadToS3(file: File): Promise<string> {
  // Simulate network upload delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return `mock-file-key-${Date.now()}`;
}
