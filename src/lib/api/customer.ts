import { mockCustomers, mockProducts } from '../mockData';

export interface SalesCustomer {
  customerHANA: string;
  name: string;
  channel: string;
  salesOffice: string;
  salesGroup: string;
}
export interface Product {
  sku: string;
  name: string;
  price: number;
  groupCat?: string | null;
  groupMat?: string | null;
}

export const searchCustomers = async (searchQuery: string) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  if (!searchQuery) return mockCustomers;
  const lowerQuery = searchQuery.toLowerCase();
  return mockCustomers.filter(c => 
    c.name.toLowerCase().includes(lowerQuery) || c.customerHANA.includes(lowerQuery)
  );
};

export async function searchProducts(query: string): Promise<Product[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  if (!query) return mockProducts;
  const lowerQuery = query.toLowerCase();
  return mockProducts.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) || p.sku.toLowerCase().includes(lowerQuery)
  );
}