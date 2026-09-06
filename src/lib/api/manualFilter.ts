import axios from "axios";
import type { ProductRow } from "./recommend"; // [สำคัญ] Import Type 'ProductRow' มาใช้ซ้ำ

const API_URL = import.meta.env.PUBLIC_API_BASE_URL;
const BASE_PATH = "/api/manual-filter"; // <--- Path ใหม่

// Type สำหรับ Combobox
export interface Party { id: string; name: string; }

// 4. (ฟังก์ชันหลัก) Run Filter
// (รับ Filters และส่งกลับ Top 2 Products)
export const runManualFilter = async (filters: any): Promise<ProductRow[]> => {
  try {
    const res = await axios.post(`${API_URL}${BASE_PATH}/run`, filters);
    return res.data; // คาดหวัง ProductRow[] กลับมา
  } catch (e) { 
    console.error("Manual filter run failed:", e);
    return []; 
  }
};