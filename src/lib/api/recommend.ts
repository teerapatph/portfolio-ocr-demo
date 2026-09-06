import { mockRecommendData } from '../mockData';

export interface SelectedProduct {
  customer: string;
  sales_district: string;
  product: string; // SKU
  material_brand: string;
  material_color: string;
  group_cat: string; // Category
  _category: string;
  category: string;
  group_mat: string;
  channel: string;
  total_qty_1y: number;
  price_per_unit: string;
  weight_per_unit: string;
  mock_stock: number;
  used_qty: number;
  used_final_price: number;
  _score: number;
  _cat: string;
  stock: number; // Volume
  price: number; // Baht
  final_price: number;
  total_weight: number;
  reason: string; // Reason text
}

export interface TruckOption {
  truck_type: string;
  truck_description: string;
  trucks_needed: number;
  max_weight: number;
  shipping_price: number;
  total_capacity?: number;
}

export interface TruckInfo {
  single_truck_option: TruckOption;
  multiple_trucks_option?: TruckOption;
}

export interface GroupData {
  group_id: number;
  selected_products: SelectedProduct[];
  group_total_price: number;
  group_total_weight: number;
  truck: TruckInfo;
  group_summary: string;
}

export interface RecommendResponse {
  customer: {
    id: string;
  };
  sale_target: number;
  group: GroupData;
}

export interface ProductRow {
  id: number | string;
  category: string;
  sku: string;
  volume: number;
  baht: number;
  reason: string;
  recommendType: string;
}

export const mapSelectedProductsToProductRows = (products: SelectedProduct[]): ProductRow[] => {
  return products.map((item) => ({
    id: item.product,
    category: item.group_cat || "N/A",
    sku: item.product,
    volume: item.used_qty,
    baht: parseFloat(item.price_per_unit) || 0,
    reason: item.reason,
    recommendType: item.category || "best",
  }));
};

export const getRecommendations = async (
  customerHANA: string,
  saleTarget: string,
  productGroup: string,
  bestSellerPct: number = 70,
  highPotentialPct: number = 30,
  additionalData: string = ""
): Promise<RecommendResponse | null> => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  return mockRecommendData(customerHANA, saleTarget);
};