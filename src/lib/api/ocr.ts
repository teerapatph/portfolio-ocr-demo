import { mockOcrData } from '../mockData';

export interface UploadedGroup {
  groupName: string;
  fileKeys: string[];
}

// Response types
export interface Dealer {
  id: string;
  name: string;
  address: string;
  tels: string[];
  taxId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  tels: string[];
  taxId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  receiptId: string;
  piece: string;
  price: number;
  total: number;
  type: string;
}

export interface OcrSummary {
  subtotal: string;
  subtotal_items: string;
  subtotal_qty: string;
  discount: string;
  grand_total: string;
  cash: string;
  change: string;
}

export interface OcrData {
  id: string;
  receiptId: string;
  receiptDate: string;
  createdAt: string;
  updatedAt: string;
  customerId: string;
  sourceImageKeys: string[];
  dealerId: string;
  dealer: Dealer;
  customer: Customer;
  global_average_confidence?: number;
  summary?: OcrSummary;
  items: Item[];
}

export interface OcrResponse {
  success: boolean;
  data: OcrData;
}

export interface OcrListResponse {
  success: boolean;
  data: OcrData[];
}

export interface JobStartResponse {
  success: boolean;
  data: {
    jobId: string;
  };
}

export interface JobStatus {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  data: OcrData[] | null;
  error: string | null;
}
export interface JobStatusResponse {
  success: boolean;
  data: JobStatus;
}

// Mock state for polling
let mockJobState: Record<string, { status: "PROCESSING" | "COMPLETED", data: OcrData[] | null }> = {};

export async function postOcr(fileKey: string): Promise<OcrResponse> {
  return new Promise(resolve => setTimeout(() => resolve({ success: true, data: mockOcrData[0] }), 1000));
}

export async function processReceiptsBatch(groups: UploadedGroup[]): Promise<OcrListResponse> {
  return new Promise(resolve => setTimeout(() => resolve({ success: true, data: mockOcrData }), 1500));
}

export async function startProcessReceiptsBatch(groups: UploadedGroup[]): Promise<JobStartResponse> {
  const mockJobId = "mock-job-" + Date.now();
  mockJobState[mockJobId] = { status: "PROCESSING", data: null };
  
  // Simulate it completing after 4 seconds
  setTimeout(() => {
    if (mockJobState[mockJobId]) {
      mockJobState[mockJobId] = { status: "COMPLETED", data: mockOcrData };
    }
  }, 4000);

  return new Promise(resolve => setTimeout(() => resolve({ success: true, data: { jobId: mockJobId } }), 500));
}

export async function getBatchStatus(jobId: string): Promise<JobStatusResponse> {
  const state = mockJobState[jobId] || { status: "COMPLETED", data: mockOcrData };
  return {
    success: true,
    data: {
      id: jobId,
      status: state.status,
      data: state.data,
      error: null
    }
  };
}

export async function getReceipts(): Promise<OcrListResponse> {
  return { success: true, data: mockOcrData };
}

export async function getReceipt(id: string): Promise<OcrResponse> {
  return { success: true, data: mockOcrData[0] };
}
