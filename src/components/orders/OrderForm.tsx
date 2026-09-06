import { useState, useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { NumericFormat } from "react-number-format"; // import
import {
  searchCustomers,
  type SalesCustomer,
  searchProducts,
  type Product,
} from "@/lib/api/customer";

import {
  getRecommendations,
  type ProductRow,
  type RecommendResponse,
  type GroupData,
  mapSelectedProductsToProductRows,
} from "@/lib/api/recommend";

import { runManualFilter } from "@/lib/api/manualFilter";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Check,
  X,
  ChevronsUpDown,
  ChevronDownIcon,
  PlusCircle,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Info,
  Truck as TruckIcon,
  Percent,
  PieChart,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";
interface ProductTableProps {
  title: string;
  data: ProductRow[];
  total: number;
}

interface RecommendationItem {
  key: string;
  title: string;
  data: GroupData;
}

const ProductTable: React.FC<ProductTableProps> = ({ title, data, total }) => (
  <div className="mt-4">
    <h3 className="font-semibold mb-2">{title}</h3>

    {/* Wrapper with overflow */}
    <div className="relative max-h-[500px] overflow-auto rounded-md shadow-sm bg-white">
      <Table className="w-full [&_tr]:border-0">
        <TableHeader>
          <TableRow className="group bg-zinc-200 hover:bg-zinc-300 transition-colors">
            {/* --- Column 1: Product Category (Desktop only) --- */}
            <TableHead
              className={cn(
                "text-center align-middle text-[0.8rem]",
                "w-[120px] min-w-[120px] max-w-[120px]",
                // Sticky at left-0 on desktop
                "sticky z-20 left-0 bg-zinc-200",
                "group-hover:bg-zinc-300 transition-colors",
                // Hide on mobile
                "hidden md:table-cell"
              )}
            >
              <div className="flex flex-col items-center justify-center gap-0.5 mt-0.5 mb-0.5">
                <span>Product Category</span>
              </div>
            </TableHead>

            {/* --- Column 2: SKU (Always visible + Sticky) --- */}
            <TableHead
              className={cn(
                "text-center align-middle",
                "w-[150px] min-w-[150px]",
                // Sticky: left-0 on mobile, left-[120px] on desktop (after Category column)
                "sticky z-20 bg-zinc-200 group-hover:bg-zinc-300 transition-colors",
                "left-0 md:left-[120px]"

                // Shadow on the right edge
              )}
            >
              SKU
            </TableHead>

            {/* --- Normal Columns --- */}
            <TableHead className="text-center  min-w-[80px]">Volume</TableHead>
            <TableHead className="text-center  min-w-[100px]">Baht</TableHead>
            {/* --- Normal Columns: Reason To Buy --- */}
            <TableHead
              className={cn(
                "text-center  border-r ",
                "min-w-[60px] md:min-w-[200px]" // ปรับความกว้าง mobile ให้พอใส่คำว่า View
              )}
            >
              <span className="hidden md:inline">Reason To Buy</span>
              {/* Mobile: แสดงคำว่า Reason สั้นๆ */}
              <span className="md:hidden text-xs">Reason</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((item) => (
            <TableRow
              key={item.id}
              className="group hover:bg-green-50 transition-colors"
            >
              {/* --- Body 1: Category (ซ่อนบนมือถือ show บน desktop) --- */}
              <TableCell
                className={cn(
                  "text-left align-middle text-sm",
                  "hidden md:table-cell max-w-[120px]", // <--- ซ่อนบนมือถือ
                  "sticky z-10 left-0 bg-white",
                  "group-hover:bg-green-50 transition-colors",
                  "w-[120px] max-w-[120px] truncate pr-2"
                )}
              >
                {item.category}
              </TableCell>

              {/* --- Body 2: SKU (รวมร่าง!) --- */}
              <TableCell
                className={cn(
                  "text-left align-middle",
                  "sticky z-10 bg-white ",
                  // มือถือชิดซ้ายสุด, Desktop ขยับไป
                  "left-0 md:left-[120px]  ",
                  "group-hover:bg-green-50 transition-colors"
                )}
              >
                <div className="flex flex-col">
                  {/* 1. บรรทัดบน: SKU (ตัวหนา สีเข้ม) */}
                  <span className=" text-sm">{item.sku}</span>

                  {/* 2. บรรทัดล่าง: Category (โชว์เฉพาะมือถือ md:hidden, ตัวเล็ก สีจาง) */}
                  <span className="md:hidden text-xs text-zinc-500 mt-0.5">
                    {item.category}
                  </span>
                </div>
              </TableCell>

              {/* --- Normal Columns --- */}
              <TableCell className="text-right align-middle text-xs md:text-sm">
                {item.volume}
              </TableCell>
              <TableCell className="text-right align-middle text-xs md:text-sm">
                {(item.baht * item.volume).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell className="text-left align-middle text-xs md:text-sm border-r border-gray-200">
                {/* Desktop: ข้อความเต็ม */}
                <span className="hidden md:inline text-left">
                  {item.reason}
                </span>

                {/* Mobile: ปุ่มคำว่า "View" */}
                <div className="md:hidden flex justify-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      {/* ใช้ variant="link" หรือ "outline" เล็กๆ */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-green-600 font-bold underline decoration-dotted"
                      >
                        View
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="left"
                      className="w-[200px] text-sm p-3"
                    >
                      <p className="font-semibold mb-1 text-green-700">
                        Reason To Buy:
                      </p>
                      {item.reason}
                    </PopoverContent>
                  </Popover>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>

        {/* --- Footer --- */}
        <TableFooter className="bg-gray-50 sticky bottom-0 z-20">
          <TableRow>
            {/* 1. ช่อง Category (ซ่อนบนมือถือ) */}
            {/* ต้องใส่ z-30 เพื่อให้มุมซ้ายล่าง (จุดตัดของ Sticky แนวตั้งและแนวนอน) ลอยอยู่บนสุด */}
            <TableCell
              className={cn(
                "hidden md:table-cell border-t align-middle",
                "sticky left-0 z-30 bg-gray-50" // <--- สำคัญ: z-30 และ bg-gray-50
              )}
            >
              <span className="font-bold text-zinc-500 pl-2">Total</span>
            </TableCell>

            {/* 2. ช่อง SKU (บนมือถือจะเป็นช่องแรกสุด) */}
            <TableCell
              className={cn(
                "border-t align-middle",
                "sticky z-30 bg-gray-50", // <--- สำคัญ: z-30 และ bg-gray-50
                "left-0 md:left-[120px]" // ระยะ Sticky แนวนอน
              )}
            >
              <span className="md:hidden font-bold text-zinc-500 text-xs">
                Total
              </span>
            </TableCell>

            {/* 3. Column Volume */}
            <TableCell className="bg-gray-50 border-t"></TableCell>

            {/* 4. Column Baht (ยอดเงินรวม) */}
            <TableCell className="text-right font-bold text-green-700 text-sm md:text-base align-middle bg-gray-50 border-t">
              {data
                .reduce((sum, item) => sum + item.baht * item.volume, 0)
                .toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </TableCell>

            {/* 5. Column Reason */}
            <TableCell className="bg-gray-50 border-t"></TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  </div>
);

// 1. เพิ่มตารางราคาไว้ด้านบนไฟล์ หรือภายใน OrderForm (ก่อน return)
const SHIPPING_RATES: Record<string, number> = {
  "รถกระบะ 4 ล้อ": 500,
  "รถบรรทุก 6 ล้อ": 1200,
  "รถบรรทุก 10 ล้อ": 2000,
  "รถพ่วง 18 ล้อ": 3500,
  "รถกระบะ 4 ล้อ (3 คัน)": 1500,
};

const PRODUCT_GROUPS = [
  { value: "All", label: "Select All" }, // ตัวเลือกพิเศษ
  { value: "Board", label: "Board" },
  { value: "CRT", label: "CRT" },
  { value: "FRT", label: "FRT" },
  { value: "Infill", label: "Infill" },
  { value: "LWR", label: "LWR" },
  { value: "Others", label: "Others" },
  { value: "Paint", label: "Paint" },
  { value: "Ply", label: "Ply" },
  { value: "Wood", label: "Wood" },
];

const normalizeRecommendData = (
  data: RecommendResponse | null
): RecommendationItem[] => {
  // เช็คว่ามี data และมี object 'group' หรือไม่
  if (!data || !data.group) return [];

  // สร้าง Array ที่มีสมาชิกตัวเดียวจาก data.group
  return [
    {
      key: `recommend-group-single`, // ใช้ key แบบ static เพราะมีอันเดียว
      title: `Recommended Order`, // ตั้งชื่อหัวข้อการ์ด
      data: data.group, // ข้อมูลสินค้า
    },
  ];
};

const sortProductRows = (rows: ProductRow[]) => {
  return [...rows].sort((a, b) => {
    // 1. คำนวณยอดรวมของแต่ละสินค้า (ราคาต่อหน่วย x จำนวน)
    const totalA = a.baht * a.volume;
    const totalB = b.baht * b.volume;

    // 2. เปรียบเทียบค่า (เรียงจาก มาก -> น้อย)
    return totalB - totalA;
  });
};

// --- Component หลักของหน้า Order ---
export function OrderForm() {
  const [step, setStep] = useState("recommend");

  // --- [Change 2] แก้ไข State ของ Combobox ---
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<SalesCustomer | null>(null);
  const [searchQuery, setSearchQuery] = useState(""); // State สำหรับเก็บค่าที่พิมพ์ค้นหา

  // State สำหรับเก็บผลลัพธ์
  const [customers, setCustomers] = useState<SalesCustomer[]>([]);
  // State สำหรับเช็คว่ากำลังโหลด
  const [isLoading, setIsLoading] = useState(false);

  const [saleTarget, setSaleTarget] = useState("");
  const [productGroup, setProductGroup] = useState<string[]>(["All"]);
  // นี่คือ State ที่จะเก็บ "สินค้า" ทั้งหมดที่ผู้ใช้ติ๊กถูก
  const [selectedProducts, setSelectedProducts] = useState<ProductRow[]>([]);

  // state นี้จะเป็น 'true' เมื่อกด Recommend และ 'false' เมื่อกด Reset
  const [showRecommendList, setShowRecommendList] = useState(false);

  // [เพิ่ม] State สำหรับเช็คว่าปุ่ม Recommend ควรถูก disabled หรือไม่
  const isRecommendDisabled = !value || !saleTarget;

  const [isRecommendLoading, setIsRecommendLoading] = useState(false); // loading spinner
  const [recommendData, setRecommendData] = useState<ProductRow[]>([]); // To store n8n results

  // --- [เพิ่ม] States ใหม่สำหรับ Manual Filter (หน้าที่ 2) ---
  const [manualSoldTo, setManualSoldTo] = useState<SalesCustomer | null>(null);
  const [manualShipTo, setManualShipTo] = useState<SalesCustomer | null>(null);

  // [เพิ่ม] State สำหรับควบคุมการเปิด-ปิด Popover ของหน้า 2
  const [manualSoldToOpen, setManualSoldToOpen] = useState(false);
  const [manualShipToOpen, setManualShipToOpen] = useState(false);

  // Delivery Date
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Sales Order Kg
  const [salesOrderKg, setSalesOrderKg] = useState<string>(""); // (จะเก็บค่า "<=400" หรือ ">400")

  // State สำหรับ Loading ตอนกด Next (หน้า 2)
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  // --- [เพิ่ม] States สำหรับ Flow ใหม่ หน้า 2 ---
  const [paymentTerm, setPaymentTerm] = useState<string>("");
  const [transportation, setTransportation] = useState<string>("");

  // --- [เพิ่ม] States สำหรับ Flow ใหม่ หน้า 3 (เพิ่มสินค้า) ---
  const [isAddProductOpen, setAddProductOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [searchedProducts, setSearchedProducts] = useState<Product[]>([]);

  // State สำหรับจัดการ Dialog ลบสินค้า
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductRow | null>(
    null
  );
  const [deleteReason, setDeleteReason] = useState(""); // เก็บข้อความเหตุผล

  // [เพิ่ม] State ใหม่สำหรับเก็บ Full Response และตัวเลือก Group
  const [fullRecommendData, setFullRecommendData] =
    useState<RecommendResponse | null>(null);
  const [selectedGroupType, setSelectedGroupType] = useState<
    "primary" | "alternative"
  >("primary");

  // --- [NEW] State สำหรับ Port Percent ---
  // Default ให้เป็น 80/20 หรือ 70/30 ตาม Business logic ทั่วไป
  const [bestSellerPct, setBestSellerPct] = useState<number>(100);

  // High Potential ไม่ต้องมี State แยก เพราะมันคือ (100 - bestSellerPct) เสมอ
  const highPotentialPct = 100 - bestSellerPct;

  const handlePercentChange = (value: string | number) => {
    let num = Number(value);
    // กันไม่ให้กรอกเกิน 100 หรือต่ำกว่า 0
    if (num > 100) num = 100;
    if (num < 0) num = 0;
    setBestSellerPct(num);
  };

  const [additionalData, setAdditionalData] = useState("");

  const handleProductSelect = (product: ProductRow, isSelected: boolean) => {
    setSelectedProducts((prevSelected) => {
      if (isSelected) {
        // เพิ่มสินค้าถ้ายังไม่มี
        return [...prevSelected, product];
      } else {
        // ลบสินค้าออกถ้าติ๊กออก
        return prevSelected.filter((p) => p.id !== product.id);
      }
    });
  };

  // --- [เพิ่ม] ฟังก์ชันสำหรับเพิ่มสินค้าในหน้า 3 ---
  const handleAddProductToOrder = (product: Product) => {
    const newProductRow: ProductRow = {
      id: product.sku, // ใช้ SKU เป็น ID ที่ไม่ซ้ำกัน
      category: product.groupCat || "N/A",
      sku: product.sku,
      volume: 1, // เริ่มต้นที่ 1
      baht: product.price, // ใช้ราคาจาก product
      reason: "Added manually",
    };
    setSelectedProducts((prev) => [...prev, newProductRow]);
    setAddProductOpen(false); // ปิด Popover
    setProductSearchQuery(""); // ล้างค่าค้นหา
  };

  // 1. ฟังก์ชันเมื่อกดปุ่มถังขยะ (Trigger)
  const handleClickDelete = (product: ProductRow) => {
    // ถ้าเป็นของที่ Add เอง ลบเลยไม่ต้องถาม
    if (product.reason === "Added manually") {
      setSelectedProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success("Deleted manually added item."); // (Optional)
      return;
    }

    // ถ้าเป็นของ Recommend -> เปิด Dialog ถามเหตุผล
    setProductToDelete(product);
    setDeleteReason(""); // ล้างค่าเก่า
    setDeleteDialogOpen(true);
  };

  // --- [เพิ่ม] ฟังก์ชันสำหรับอัปเดตจำนวนสินค้าในหน้า 3 ---
  const handleUpdateProductQuantity = (
    productId: string,
    newQuantity: number
  ) => {
    setSelectedProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, volume: newQuantity >= 1 ? newQuantity : 1 }
          : p
      )
    );
  };

  // หน้า 1
  useEffect(() => {
    if (!searchQuery && !open && !manualSoldToOpen && !manualShipToOpen) {
      setCustomers([]);
      return;
    }

    setIsLoading(true);

    const delayDebounceFn = setTimeout(() => {
      searchCustomers(searchQuery).then((apiData) => {
        // เปลี่ยนชื่อตัวแปรเป็น apiData เพื่อไม่ให้งง

        // ------------------------------------------------------------
        // 🛠️ [Fix] กำหนดข้อมูล 3 ตัวนี้แบบ Hardcode ไปเลย (เพื่อความชัวร์)
        // ------------------------------------------------------------

        // ⚠️ คุณต้องเปลี่ยน "ชื่อร้าน..." ให้ตรงกับชื่อจริงใน DB นะครับ
        const pinnedCustomers = [
          {
            customerHANA: "1002023",
            name: "Demo Customer A", //
            id: "1002023",
          },
          {
            customerHANA: "1000516",
            name: "Demo Customer B", //
            id: "1000516",
          },
          {
            customerHANA: "1000022",
            name: "Demo Customer C", //
            id: "1000022",
          },
          {
            customerHANA: "1000828",
            name: "Demo Customer D", //
            id: "1000828",
          },
          {
            customerHANA: "1001673",
            name: "Demo Customer E",
            id: "1001673",
          },
        ] as any[];

        // ------------------------------------------------------------
        // การรวมข้อมูล: เอา 3 ตัวบนตั้ง + ข้อมูลจาก API (ที่ตัด 3 ตัวนี้ออกกันซ้ำ)
        // ------------------------------------------------------------

        const targetIds = ["1000022", "1000828", "1001673"];

        // กรองเอาข้อมูลจาก API ที่ 'ไม่ใช่' 3 คนนี้ (เพื่อไม่ให้โชว์ซ้ำ)
        const otherCustomers = apiData.filter(
          (c) => !targetIds.includes(c.customerHANA)
        );

        // รวมร่าง: เอา Pinned ขึ้นก่อนเสมอ
        setCustomers([...pinnedCustomers, ...otherCustomers]);

        setIsLoading(false);
      });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, open, manualSoldToOpen, manualShipToOpen]);

  // [แก้ไข] ปรับ Logic การดึงข้อมูล Product ให้เหมือนกับ Customer
  useEffect(() => {
    // 1. ถ้า Popover ปิดอยู่ และไม่มีการพิมพ์ค้นหา ก็ไม่ต้องทำอะไร
    if (!isAddProductOpen) {
      setSearchedProducts([]); // ล้างข้อมูลเมื่อปิด Popover
      return;
    }

    // 2. แสดง Loading และใช้ Debounce
    setIsLoading(true);
    const debounce = setTimeout(() => {
      // 3. เรียก API เพื่อดึงข้อมูล
      searchProducts(productSearchQuery).then((data) => {
        setSearchedProducts(data);
        setIsLoading(false);
      });
    }, 300);

    return () => clearTimeout(debounce);
  }, [productSearchQuery, isAddProductOpen]);

  // --- [NEW] Auto-fill Sale Target for Demo Customer (1000012) ---
  useEffect(() => {
    if (value?.customerHANA === "1000012") {
      // กำหนดค่าตายตัวเป็น 300000 เลย ไม่ต้องสุ่ม
      setSaleTarget("300000");

      toast.info("Auto-filled Sale Target", {
        description: "Set target to 300,000 for demo customer.",
        duration: 3000,
      });
    }
  }, [value]); // ทำงานเมื่อเปลี่ยนลูกค้า (value)

  // 1. คำนวณวันที่เริ่มต้นที่อนุญาตให้เลือก (Lead time logic)
  const today = new Date();
  const minSelectableDate = new Date(today);

  // บวกจำนวนวันที่ต้องการล่วงหน้า (เช่น 2 หรือ 3 วัน)
  // ตัวอย่าง: ถ้าวันนี้วันที่ 18 เลือกได้ตั้งแต่วันที่ 21 เป็นต้นไป (+3 วัน)
  minSelectableDate.setDate(today.getDate() + 3);

  // ฟังก์ชันที่ 1: ผูกกับปุ่มถังขยะในตาราง
  const initiateDelete = (product: ProductRow) => {
    // กรณี 1: สินค้าที่ User เพิ่มเอง (Manual) -> ลบเลย ไม่ต้องถาม
    if (product.reason === "Added manually") {
      setSelectedProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success("Item removed", {
        description: `${product.sku} has been removed.`,
      });
      return;
    }

    // กรณี 2: สินค้าจาก Recommend -> เปิด Dialog ถามเหตุผล
    setProductToDelete(product);
    setDeleteReason(""); // ล้างข้อความเก่าทิ้ง
    setDeleteDialogOpen(true); // เปิด Dialog
  };

  // ฟังก์ชันที่ 2: ผูกกับปุ่ม "Confirm Remove" ใน Dialog
  const confirmDelete = () => {
    if (!productToDelete) return;

    // เช็คว่ากรอกเหตุผลหรือยัง
    if (!deleteReason.trim()) {
      toast.error("Please provide a reason.");
      return;
    }

    // --- LOGIC การลบจริง ---
    console.log(
      `[POC Log] User deleted ${productToDelete.sku}. Reason: ${deleteReason}`
    );

    setSelectedProducts((prev) =>
      prev.filter((p) => p.id !== productToDelete.id)
    );

    toast.success("Item removed", {
      description: `Removed ${productToDelete.sku} from the list.`,
    });

    // ปิด Dialog และล้างค่า
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };
  // 1. คำนวณราคาสินค้าทั้งหมด
  const productTotal = selectedProducts.reduce(
    (sum, item) => sum + item.baht * item.volume,
    0
  );

  // 2. ดึงราคาขนส่งจากตาราง SHIPPING_RATES โดยใช้ key จาก state 'transportation'
  // ถ้าหาไม่เจอ หรือยังไม่ได้เลือก ให้เป็น 0
  const shippingCost = SHIPPING_RATES[transportation] || 0;

  // 3. รวมเป็นยอดสุทธิ
  const grandTotal = productTotal + shippingCost;

  // ฟังก์ชันจัดการเมื่อ User คลิกเลือก Group
  const handleGroupSelect = (currentValue: string) => {
    setProductGroup((prev) => {
      // กรณี 1: กดปุ่ม "Select All"
      if (currentValue === "All") {
        // ถ้า "All" ถูกเลือกอยู่แล้ว -> กดอีกทีคือยกเลิกทั้งหมด (Empty) หรือจะบังคับให้เลือกสักอย่างก็ได้
        if (prev.includes("All")) return [];
        return ["All"]; // ถ้ายังไม่เลือก -> เคลียร์ตัวอื่น เลือกแค่ All
      }

      // กรณี 2: กดเลือก Group อื่นๆ
      let newGroups = [...prev];

      // ถ้ามี "All" ค้างอยู่ ให้เอาออกก่อน เพราะเรากำลังเลือกแบบเจาะจง
      if (newGroups.includes("All")) {
        newGroups = [];
      }

      if (newGroups.includes(currentValue)) {
        // ถ้ามีอยู่แล้ว ให้เอาออก (Uncheck)
        newGroups = newGroups.filter((item) => item !== currentValue);
      } else {
        // ถ้ายังไม่มี ให้ใส่เพิ่ม (Check)
        newGroups.push(currentValue);
      }

      // (Optional) ถ้าไม่เหลืออะไรเลย จะให้กลับไปเป็น All ไหม?
      // if (newGroups.length === 0) return ["All"];

      return newGroups;
    });
  };

  return (
    <div className="w-full">
      <Tabs value={step} onValueChange={setStep} className="w-full">
        {/* ========= ขั้นตอนที่ 1: Recommend ========= */}
        <TabsContent value="recommend">
          <Card className="border-none shadow-none md:border md:shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 mb-4">
              <CardTitle>Order Recommend</CardTitle>
              <Button 
                variant="outline"
                className="bg-green-50 border-green-500 text-green-700 hover:bg-green-100 shadow-sm"
                onClick={() => {
                  setValue({
                    customerHANA: "1002023",
                    name: "Demo Customer A",
                    channel: "Retail",
                    salesOffice: "BKK",
                    salesGroup: "Group 1"
                  } as SalesCustomer);
                  setSaleTarget("4000000");
                  setProductGroup(["All"]);
                  toast.success("1-Click Demo activated! Please click Recommend.");
                }}
              >
                🚀 1-Click Demo Fill
              </Button>
              {/* --- [แก้ไข] ย้ายปุ่ม Manual Filter มาไว้ที่นี่และเปลี่ยนเป็น Text Link --- */}
              {/* <Button
                    variant="link"
                    className="p-0 h-auto text-blue-600"
                    onClick={() => {
                      setSelectedProducts([]); // ล้างค่าเก่าก่อนเริ่ม Flow ใหม่
                      setStep("manual-filter"); // ไปยังหน้า Manual Filter ใหม่
                    }}
                  >
                    Manual Filter
                  </Button> */}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  {/* [Change] เพิ่ม space */}
                  <Label htmlFor="customer" className="block mb-2">
                    Customer
                  </Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                      >
                        {value
                          ? `${value.customerHANA} : ${value.name}`
                          : "Select customer..."}
                        <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        {/* ให้ค่าที่พิมพ์ไปผูกกับ state 'searchQuery' */}
                        <CommandInput
                          placeholder="Search customer..."
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                        />
                        <CommandList>
                          {isLoading && <div className="p-2">Loading...</div>}

                          {!isLoading && (
                            <CommandEmpty>
                              {searchQuery
                                ? "No customer found."
                                : "Type to search..."}
                            </CommandEmpty>
                          )}

                          <CommandGroup>
                            {customers.map((customer) => (
                              <CommandItem
                                key={customer.customerHANA}
                                value={`${customer.customerHANA} : ${customer.name}`}
                                onSelect={() => {
                                  setValue(customer); // <-- [สำคัญ] เก็บ "customer" object ทั้งก้อน
                                  setOpen(false);

                                  // ==========================================
                                  // 🛠️ [แก้ไขตรงนี้] Logic สำหรับ Auto-fill Target
                                  // ==========================================

                                  // 1. กำหนด Mapping ระหว่าง ID กับ ยอดเงิน (String ไม่ต้องใส่ Comma)
                                  const targetMapping: Record<string, string> =
                                    {
                                      "1002023": "4000000", // 4 ล้าน
                                      "1000516": "5900000", // 5.9 ล้าน
                                      // "1000022": "50000",  // (อันเดิมที่มีอยู่ ถ้ายังใช้ก็ใส่เพิ่มได้)
                                    };

                                  // 2. ตรวจสอบว่า ID ที่เลือก มีใน Mapping ไหม
                                  const autoTarget =
                                    targetMapping[customer.customerHANA];

                                  if (autoTarget) {
                                    setSaleTarget(autoTarget);

                                    // (Optional) แจ้งเตือนเล็กน้อยให้คน Present รู้ว่าค่าเปลี่ยนแล้ว
                                    toast.info("Auto-filled Target", {
                                      description: `Set target to ${parseInt(
                                        autoTarget
                                      ).toLocaleString()}`,
                                      duration: 2000,
                                    });
                                  } else {
                                    setSaleTarget(""); // ถ้าไม่ใช่ลูกค้าพิเศษ ให้เคลียร์ค่า หรือใส่ 0
                                  }
                                  // ==========================================
                                }}
                                className="py-2 data-[selected=true]:bg-green-50 data-[selected=true]:text-green-900"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    "text-green-600",
                                    // เปรียบเทียบ ID จาก 'value' object
                                    value?.customerHANA ===
                                      customer.customerHANA
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {`${customer.customerHANA} : ${customer.name}`}
                                  </span>
                                  {/* <span className="text-xs text-muted-foreground">
                                    {`${customer.channel} | ${customer.salesOffice} | ${customer.salesGroup}`}
                                  </span> */}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {/* ตรวจสอบว่า 'value' (ลูกค้าที่ถูกเลือก) มีข้อมูลหรือไม่ถ้ามี ให้แสดง Description นี้*/}
                  {/* {value && (
                    <p className="text-sm text-muted-foreground mt-2 px-1">
                      <strong>Channel:</strong> {value.channel || "N/A"} |
                      <strong> Office:</strong> {value.salesOffice || "N/A"} |
                      <strong> Group:</strong> {value.salesGroup || "N/A"}
                    </p>
                  )} */}
                </div>
                <div>
                  {/* [Change] เพิ่ม space */}
                  <Label htmlFor="sale-target" className="block mb-2">
                    Propose Sale Target
                  </Label>
                  <NumericFormat
                    id="sale-target"
                    placeholder="Enter target amount"
                    value={saleTarget}
                    thousandSeparator="," // ใส่ comma ให้
                    decimalScale={2} // ทศนิยม 2 ตำแหน่ง (ถ้าไม่เอาก็ลบออก)
                    allowNegative={false} // ห้ามติดลบ
                    customInput={Input} // 👈 บอกให้มันใช้หน้าตาของ shadcn Input
                    className="bg-white" // ใส่ class เพิ่มได้ตามปกติ
                    onValueChange={(values) => {
                      // Library จะส่งค่ามาให้ 2 แบบ:
                      // values.formattedValue = "4,000,000" (เอาไว้โชว์)
                      // values.value = "4000000" (ตัวเลขดิบๆ)

                      setSaleTarget(values.value); // ✅ เก็บค่าดิบ (Clean) ลง State ได้เลย ไม่ต้องไป replace เองทีหลัง
                    }}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="block mb-2">Product Group</Label>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between h-auto min-h-10 bg-white hover:bg-gray-100"
                      >
                        <div className="flex flex-wrap gap-1 items-center text-left">
                          {productGroup.length > 0 ? (
                            // กรณีเลือก "All" แสดง Badge เดียว
                            productGroup.includes("All") ? (
                              <Badge
                                variant="secondary"
                                className="rounded-sm px-1 font-normal"
                              >
                                All Groups
                              </Badge>
                            ) : (
                              // กรณีเลือกหลายอัน แสดง Badge เรียงกัน
                              productGroup.map((item) => (
                                <Badge
                                  variant="secondary"
                                  key={item}
                                  className="rounded-sm px-1 font-normal bg-green-100 text-green-800 hover:bg-green-200"
                                >
                                  {item}
                                  <span
                                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleGroupSelect(item);
                                    }}
                                  >
                                    <X className="h-3 w-3 text-green-800" />
                                  </span>
                                </Badge>
                              ))
                            )
                          ) : (
                            <span className="text-muted-foreground">
                              Select groups...
                            </span>
                          )}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start"
                    >
                      <Command>
                        {/* ไม่มี Search ก็ได้ถ้ารายการไม่เยอะ แต่ใส่ไว้ก็ดี */}
                        {/* <CommandInput placeholder="Search group..." /> */}
                        <CommandList>
                          <CommandGroup>
                            {PRODUCT_GROUPS.map((group) => {
                              const isSelected = productGroup.includes(
                                group.value
                              );
                              return (
                                <CommandItem
                                  key={group.value}
                                  value={group.value}
                                  onSelect={() =>
                                    handleGroupSelect(group.value)
                                  }
                                >
                                  <div
                                    className={cn(
                                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                      isSelected
                                        ? "bg-green-600 border-green-600 text-white"
                                        : "border-primary opacity-50 [&_svg]:invisible"
                                    )}
                                  >
                                    <Check
                                      className={cn("h-4 w-4")}
                                      color="white"
                                    />
                                  </div>
                                  <span>{group.label}</span>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* 1.2 ส่วน Percent Inputs (ลบ Slider เดิมทิ้ง แล้วใส่ก้อนนี้แทน) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="best-seller" className="text-green-700">
                      Best Seller (%)
                    </Label>
                    <Input
                      id="best-seller"
                      type="number"
                      min={0}
                      max={100}
                      value={bestSellerPct}
                      onChange={(e) => handlePercentChange(e.target.value)}
                      // ปรับแต่งสีเขียว
                      className="font-semibold text-green-700 border-green-200 focus-visible:ring-green-500 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="high-potential" className="text-blue-600">
                      High Potential (%)
                    </Label>
                    <Input
                      id="high-potential"
                      type="number"
                      value={highPotentialPct}
                      readOnly
                      // ปรับแต่งสีน้ำเงิน + พื้นหลังเทาอ่อน (readOnly)
                      className="font-semibold text-blue-600 border-blue-200  cursor-default"
                      tabIndex={-1}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2 mt-6">
                {" "}
                {/* mt-6 เพื่อเว้นระยะห่างจากข้างบน */}
                <Label htmlFor="additional-data">Additional Data</Label>
                <Textarea
                  id="additional-data"
                  placeholder="Enter any additional information..."
                  className="resize-none min-h-[100px] bg-white" // กำหนดความสูงและพื้นหลัง
                  value={additionalData}
                  onChange={(e) => setAdditionalData(e.target.value)}
                />
              </div>
              <div className="md:col-span-2 flex flex-col sm:flex-row justify-center items-center gap-3 mt-6">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-full sm:w-auto">
                        <Button
                          className="w-full sm:w-[160px] bg-green-600 text-white hover:bg-green-700"
                          onClick={async () => {
                            if (isRecommendDisabled) return;

                            setIsRecommendLoading(true);
                            setShowRecommendList(false);
                            setFullRecommendData(null); // Clear data ก่อน

                            // เรียก API
                            const data = await getRecommendations(
                              value!.customerHANA,
                              saleTarget,
                              productGroup,
                              bestSellerPct, // <--- เพิ่ม
                              highPotentialPct // <--- เพิ่ม (หรือส่งแค่ bestSeller แล้วไปคำนวณที่หลังบ้านก็ได้)
                            );

                            if (data) {
                              setFullRecommendData(data); // เก็บข้อมูลทั้งหมด
                              setSelectedGroupType("primary"); // Default เลือก Primary
                              setShowRecommendList(true);
                            }

                            setIsRecommendLoading(false);
                          }}
                          disabled={isRecommendDisabled || isRecommendLoading}
                          style={{
                            cursor: isRecommendDisabled
                              ? "not-allowed"
                              : "pointer",
                          }}
                        >
                          {/* 👇 แก้ไขตรงนี้ครับ ใช้ <Spinner /> ของคุณ 👇 */}
                          {isRecommendLoading ? (
                            <>
                              <Spinner />
                              Recommending...
                            </>
                          ) : (
                            "Recommend"
                          )}
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {isRecommendDisabled && (
                      <TooltipContent side="bottom">
                        <p>Please select a customer and enter a sale target.</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-[120px] border-dashed"
                  onClick={() => {
                    // [แก้ไข 2] ล้างค่าทุกอย่างให้หมด (Results + Filters)

                    // 1. ล้างผลลัพธ์
                    setShowRecommendList(false);
                    setFullRecommendData(null);
                    setRecommendData([]);
                    setSelectedProducts([]);

                    // 2. ล้าง Filter กลับเป็นค่าเริ่มต้น
                    setProductGroup(["All"]); // กลับเป็น Select All
                    setBestSellerPct(100); // กลับเป็น 100%
                    setAdditionalData(""); // ล้างข้อความ

                    // (Optional) ถ้าอยากล้าง Target ด้วย ให้เอา Comment ออก
                    // setSaleTarget("");

                    toast.info("Filters and results have been reset.");
                  }}
                  // ปุ่ม Reset จะกดได้ก็ต่อเมื่อมี list โชว์อยู่ หรือ มีการเลือก filter ไปแล้ว (productGroup ไม่ใช่ค่าเริ่มต้น)
                  disabled={
                    (!showRecommendList &&
                      productGroup.includes("All") &&
                      bestSellerPct === 100 &&
                      !additionalData) ||
                    isRecommendLoading
                  }
                >
                  Reset
                </Button>

                {/* <div className="absolute top-0 right-0 p-2  hover:opacity-100 transition-opacity z-50">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      // 1. Mock ค่า Customer เพื่อไม่ให้ error
                      if (!value) {
                        setValue({
                          customerHANA: "MOCK-CUST",
                          name: "Mock Customer Ltd.",
                        } as SalesCustomer);
                      }

                      // 2. Load Mock Data
                      setFullRecommendData(MOCK_DATA_V2);
                      setShowRecommendList(true);

                      // (Optional) Toast แจ้งเตือน
                      toast.success("Loaded Mock Data V2", { duration: 2000 });
                    }}
                  >
                    🐞 Mock Data
                  </Button>
                </div> */}
              </div>

              {showRecommendList && fullRecommendData && (
                <div className="mt-6 space-y-8">
                  {normalizeRecommendData(fullRecommendData).map(
                    (group, index) => (
                      <RecommendCard
                        key={group.key}
                        group={group}
                        index={index}
                        onCheck={(products, truckDescription) => {
                          // Logic เมื่อ User กด Check

                          // 1. เรียงลำดับสินค้า
                          const sortedRows = sortProductRows(products);

                          // 2. Set State สินค้าที่เลือก
                          setSelectedProducts(sortedRows);

                          // 3. Set State รถขนส่ง (รับค่ามาจาก RecommendCard)
                          setTransportation(truckDescription);

                          // 4. เปลี่ยนหน้าไป Details
                          setStep("details");
                        }}
                      />
                    )
                  )}
                </div>
              )}
              {/* Old Table List}
              {showRecommendList && (
                <ProductTable
                  title="Recommend Lists"
                  data={recommendData} // <-- 9. Use data from state
                  total={recommendData.reduce(
                    (sum, item) => sum + item.baht,
                    0
                  )} // Calculate total from new data
                  showCheckboxes={false}
                  onProductSelect={handleProductSelect}
                />
              )}
              {/* <ProductTable
                title="Wish Lists"
                data={wishData}
                total={25000.0}
                showCheckboxes={true}
                onProductSelect={handleProductSelect}
              /> */}
            </CardContent>
            {/* <CardFooter className="flex justify-center pt-6 pb-6">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full md:w-[200px]">
                      <Button
                        className={cn(
                          "bg-green-600 text-white hover:bg-green-700 transition-all shadow-lg",
                          "w-full"
                        )}
                        onClick={() => {
                          if (!fullRecommendData) return;

                          // 1. ดึงกลุ่มข้อมูลตามที่ User เลือก (Primary หรือ Alternative)
                          const selectedGroupData =
                            selectedGroupType === "primary"
                              ? fullRecommendData.group_primary
                              : fullRecommendData.group_alternative;

                          // 2. set selectedProducts (แปลงข้อมูลก่อน)
                          const productRows = mapSelectedProductsToProductRows(
                            selectedGroupData.selected_products
                          );
                          setSelectedProducts(productRows);

                          // 3. set Transportation จาก truck_suggestion ของกลุ่มนั้น
                          setTransportation(
                            selectedGroupData.truck_suggestion.truck_description
                          );

                          // 4. ไปหน้าถัดไป
                          setStep("details");
                        }}
                        // ปิดปุ่มถ้าไม่มีข้อมูล
                        disabled={
                          !showRecommendList || !value || !fullRecommendData
                        }
                      >
                        Check
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {/* แสดง Tooltip เมื่อยังไม่ได้เลือก Customer */}
            {/* {!value && (
                    <TooltipContent>
                      Please select Customer first.
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </CardFooter> */}
          </Card>
        </TabsContent>

        {/* ========= ขั้นตอนที่ 2: Details Form ========= */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            {/* --- [ยกเครื่อง] หน้า 2 เป็นหน้ากรอกข้อมูลการจัดส่ง --- */}
            <CardContent className="grid md:grid-cols-2 gap-6">
              {/* --- Sold To (Locked) --- */}
              <div>
                <Label className="block mb-2">Sold To</Label>
                <Input
                  value={
                    value
                      ? `${value.customerHANA} : ${value.name}`
                      : "Please select a customer on the first page."
                  }
                  disabled
                />
                {/* <Popover
                      open={false} // ล็อคไม่ให้เปิด
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {manualSoldTo
                            ? `${value?.customerHANA} | ${value?.name}`
                            : "Please select customer in previous step"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                    </Popover> */}
                {/* {value && (
                  <p className="text-sm text-muted-foreground mt-2 px-1">
                    <strong>Channel:</strong> {value.channel || "N/A"}
                  </p>
                )} */}
              </div>

              {/* --- Ship To (เลือกใหม่ได้) --- */}
              <div>
                <Label className="block mb-2">Ship To</Label>
                {/* คัดลอก JSX จาก Customer Combobox มาอีกครั้ง */}
                <Popover
                  open={manualShipToOpen}
                  onOpenChange={setManualShipToOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {manualShipTo
                        ? `${manualShipTo.customerHANA} : ${manualShipTo.name}`
                        : "Select customer..."}
                      <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search customer..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandList>
                        {isLoading && <div className="p-2">Loading...</div>}
                        {!isLoading && (
                          <CommandEmpty>
                            {searchQuery
                              ? "No customer found."
                              : "Type to search..."}
                          </CommandEmpty>
                        )}
                        <CommandGroup>
                          {customers.map((customer) => (
                            <CommandItem
                              key={customer.customerHANA}
                              value={`${customer.customerHANA} : ${customer.name}`}
                              onSelect={() => {
                                setManualShipTo(customer);
                                setManualShipToOpen(false); // <-- [แก้ไข] ปิด Popover ของตัวเอง
                              }}
                              className="py-2"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  "text-green-600",
                                  manualShipTo?.customerHANA ===
                                    customer.customerHANA
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {`${customer.customerHANA} : ${customer.name}`}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {/* {manualShipTo && (
                  <p className="text-sm text-muted-foreground mt-2 px-1">
                    <strong>Channel:</strong> {manualShipTo.channel || "N/A"}
                  </p>
                )} */}
              </div>

              {/* --- [เพิ่ม] Payment Term --- */}
              <div>
                <Label className="block mb-2">Payment Type</Label>
                <Select value={paymentTerm} onValueChange={setPaymentTerm}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select payment type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* --- [เพิ่ม] Transportation --- */}
              <div>
                <Label className="block mb-2">Transportation</Label>
                <Select
                  value={transportation}
                  onValueChange={setTransportation}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select transportation..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="รถกระบะ 4 ล้อ">รถกระบะ 4 ล้อ</SelectItem>
                    <SelectItem value="รถบรรทุก 6 ล้อ">
                      รถบรรทุก 6 ล้อ
                    </SelectItem>
                    <SelectItem value="รถบรรทุก 10 ล้อ">
                      รถบรรทุก 10 ล้อ
                    </SelectItem>
                    <SelectItem value="รถพ่วง 18 ล้อ">รถพ่วง 18 ล้อ</SelectItem>
                    <SelectItem value="รถกระบะ 4 ล้อ (3 คัน)">
                      รถกระบะ 4 ล้อ (3 คัน)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* --- Delivery Date --- */}
              <div>
                <Label htmlFor="delivery-date" className="block mb-2">
                  Delivery Date
                </Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="delivery-date"
                      className={cn(
                        "w-full justify-between font-normal", // (ใช้ w-full ให้เต็ม)
                        !deliveryDate && "text-muted-foreground"
                      )}
                    >
                      {/* [แก้ไข] ใช้ .toLocaleDateString() 
                          (เหมือนใน Calendar22)
                        */}
                      {deliveryDate
                        ? deliveryDate.toLocaleDateString("en-GB")
                        : "Select date"}

                      {/* [แก้ไข] ใช้ ChevronDownIcon (เหมือนใน Calendar22) */}
                      <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="start"
                  >
                    <Calendar
                      toYear={2026}
                      mode="single"
                      selected={deliveryDate} // 1. ผูกกับ State 'deliveryDate'
                      captionLayout="dropdown" // 2. (ใช้ Prop จาก Calendar22)
                      // 2. [แก้ไข] เพิ่มบรรทัดนี้เพื่อปิดการเลือกวันก่อนหน้า
                      disabled={{ before: minSelectableDate }}
                      onSelect={(date) => {
                        setDeliveryDate(date);
                        setDatePickerOpen(false);
                      }}
                      onSelect={(date) => {
                        setDeliveryDate(date); // 3. อัปเดต State 'deliveryDate'
                        setDatePickerOpen(false); // 4. ปิด Popover (เหมือนใน Calendar22)
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-6 md:flex-row-reverse md:justify-between">
              {/* [Button: Next] */}
              <Button
                className="w-full md:w-[180px] bg-green-600 text-white hover:bg-green-700 shadow-sm justify-center items-center" // [เติม] justify-center items-center
                onClick={() => setStep("confirm")}
                disabled={
                  !manualShipTo ||
                  !paymentTerm ||
                  !transportation ||
                  !deliveryDate
                }
              >
                <span className="flex items-center gap-2">
                  {" "}
                  {/* [แนะนำ] ห่อด้วย span เพื่อจัดระยะห่างให้สวยงาม */}
                  Next <ChevronRight className="h-4 w-4" />
                </span>
              </Button>

              {/* [Button: Back] */}
              <Button
                variant="outline"
                className="w-full md:w-[180px] justify-center items-center" // [เติม] justify-center items-center
                onClick={() => setStep("recommend")}
              >
                <span className="flex items-center gap-2">
                  {" "}
                  {/* [แนะนำ] ห่อด้วย span เพื่อจัดระยะห่างให้สวยงาม */}
                  <ChevronLeft className="h-4 w-4" /> Back
                </span>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ========= [เพิ่ม] ขั้นตอนที่ 1.2: Manual Filter Confirmation ========= */}
        <TabsContent value="manual-confirm">
          <Card>
            <CardHeader>
              <CardTitle>Order Confirmation (Manual Filter)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* --- แสดงรายละเอียดของ Filters ที่เลือก --- */}
              <h3 className="font-semibold text-lg">Filter Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold">Sold To:</p>
                  <p className="ml-2">
                    {manualSoldTo
                      ? `${manualSoldTo.customerHANA} | ${manualSoldTo.name}`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Ship To:</p>
                  <p className="ml-2">
                    {manualShipTo
                      ? `${manualShipTo.customerHANA} | ${manualShipTo.name}`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Invoice Date:</p>
                  <p className="ml-2">
                    {deliveryDate
                      ? deliveryDate.toLocaleDateString("en-GB")
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Sales Order Kg:</p>
                  <p className="ml-2">{salesOrderKg || "N/A"}</p>
                </div>
              </div>
            </CardContent>
            <CardContent>
              <h3 className="font-semibold text-lg">Filtered Items</h3>
              <div className="mt-4 w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="group">
                      <TableHead className="w-[120px]">SKU</TableHead>
                      <TableHead className="w-[120px]">Quantity</TableHead>
                      <TableHead className="w-[120px]">Price</TableHead>
                      <TableHead className="w-[120px]">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedProducts.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{item.sku}</span>
                            <span className="text-xs text-muted-foreground">
                              {item.category}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.volume}
                            onChange={(e) =>
                              handleUpdateProductQuantity(
                                item.id,
                                parseInt(e.target.value)
                              )
                            }
                            className="w-24"
                            min="1"
                          />
                        </TableCell>
                        <TableCell>
                          {item.baht.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          {(item.baht * item.volume).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="align-middle text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => initiateDelete(item)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-2">
              <Button className="w-full bg-green-600 text-white hover:bg-green-700">
                Submit Order
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setStep("manual-filter")} // กลับไปหน้า Manual Filter
              >
                Back
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ========= ขั้นตอนที่ 3: Confirm ========= */}
        {/* --- [ยกเครื่อง] แทนที่ JSX ของหน้าที่ 3 ทั้งหมด --- */}
        <TabsContent value="confirm">
          <Card>
            <CardHeader>
              <CardTitle>Order Confirmation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* --- แสดงรายละเอียดของ Filters ที่เลือก --- */}
              <h3 className="font-semibold text-lg">Order Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold">Sold To:</p>
                  <p className="ml-2">
                    {value ? `${value.customerHANA} : ${value.name}` : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Ship To:</p>
                  <p className="ml-2">
                    {manualShipTo // ใช้ manualShipTo เพราะ ShipTo เลือกใหม่
                      ? `${manualShipTo.customerHANA} : ${manualShipTo.name}`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Payment Type:</p>
                  <p className="ml-2">{paymentTerm || "N/A"}</p>
                </div>
                <div>
                  <p className="font-semibold">Transportation:</p>
                  <p className="ml-2">{transportation || "N/A"}</p>
                </div>
                <div>
                  <p className="font-semibold">Delivery Date:</p>
                  <p className="ml-2">
                    {deliveryDate
                      ? deliveryDate.toLocaleDateString("en-GB")
                      : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardContent>
              <h3 className="font-semibold text-lg">Order Items</h3>
              {/* [แก้ไข 1] Wrapper: ลบ border, เพิ่ม overflow, max-h, bg-white, shadow */}
              <div className="mt-4 overflow-auto relative max-h-[500px] rounded-md shadow-sm bg-white">
                {/* 2. ใช้ <table> ธรรมดา แทน <Table> ของ shadcn */}
                <table className="w-full text-sm text-left caption-bottom">
                  {/* [แก้ไข 3] Header: ลบ border-b, ใส่ Sticky, Freeze Column 1 (SKU) */}
                  <TableHeader>
                    <TableRow className="bg-green-600 hover:bg-green-700 group transition-colors">
                      {/* --- Column 1: SKU (Freeze) --- */}
                      <TableHead
                        className={cn(
                          "text-center text-white align-middle",
                          "w-[150px] min-w-[150px]", // ปรับขนาดให้พอดี
                          "sticky left-0 top-0 z-50",
                          " bg-green-600 group-hover:bg-green-700 transition-colors" // Freeze
                        )}
                      >
                        SKU
                      </TableHead>

                      {/* --- Column 2: Quantity --- */}
                      <TableHead className="w-[120px] min-w-[120px] text-center text-white sticky top-0 z-40 bg-green-600 group-hover:bg-green-700 transition-colors">
                        Quantity
                      </TableHead>

                      {/* --- Column 3: Price --- */}
                      <TableHead className="w-[120px] min-w-[120px] text-center text-white sticky top-0 z-40 bg-green-600 group-hover:bg-green-700 transition-colors">
                        Price
                      </TableHead>

                      {/* --- Column 4: Total --- */}
                      <TableHead className="w-[120px] min-w-[120px] text-center text-white sticky top-0 z-40 bg-green-600 group-hover:bg-green-700 transition-colors">
                        Total
                      </TableHead>

                      {/* --- Column 5: Delete Button --- */}
                      <TableHead className="w-[50px] min-w-[50px] text-center text-white sticky top-0 z-40 bg-green-600 group-hover:bg-green-700 transition-colors"></TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {selectedProducts.map((item) => (
                      <TableRow key={item.id} className="hover:bg-green-50/50">
                        {/* --- Body 1: SKU (Freeze) --- */}
                        <TableCell
                          className={cn(
                            "text-left sticky left-0 z-30 bg-white" // Freeze + bg-white
                            // เงาขอบขวา
                          )}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{item.sku}</span>
                            <span className="text-xs text-muted-foreground">
                              {item.category}
                            </span>
                          </div>
                        </TableCell>

                        {/* --- Body 2: Quantity --- */}
                        <TableCell className="text-center align-middle">
                          <Input
                            type="number"
                            value={item.volume}
                            onChange={(e) =>
                              handleUpdateProductQuantity(
                                item.id,
                                parseInt(e.target.value)
                              )
                            }
                            className="w-24 mx-auto text-right h-8 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [appearance:textfield]"
                            min="1"
                          />
                        </TableCell>

                        {/* --- Body 3: Price --- */}
                        <TableCell className="text-right align-middle">
                          {item.baht.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>

                        {/* --- Body 4: Total --- */}
                        <TableCell className="text-right align-middle">
                          {(item.baht * item.volume).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>

                        {/* --- Body 5: Delete --- */}
                        <TableCell className="text-center align-middle">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-red-50 hover:text-red-600 transition-colors"
                            onClick={() => handleClickDelete(item)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>

                  {/* --- Footer --- */}
                  <TableFooter className="bg-gray-50 sticky bottom-0 z-50 shadow-inner">
                    {/* --- Row 1: Subtotal (Product Cost) --- */}
                    <TableRow>
                      <TableCell
                        colSpan={3} // รวมคอลัมน์ SKU, Qty, Price
                        className="text-right font-medium text-muted-foreground align-middle pr-4"
                      >
                        Subtotal (Products)
                      </TableCell>
                      <TableCell className="text-right font-medium text-gray-900 align-middle">
                        {productTotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="bg-gray-50"></TableCell>
                    </TableRow>

                    {/* --- Row 2: Shipping Cost --- */}
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-right font-medium text-muted-foreground align-middle pr-4"
                      >
                        Shipping Cost ({transportation || "-"})
                      </TableCell>
                      <TableCell className="text-right font-medium text-gray-900 align-middle">
                        {shippingCost.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="bg-gray-50"></TableCell>
                    </TableRow>

                    {/* --- Row 3: Grand Total --- */}
                    <TableRow className="bg-green-100/50 border-t border-green-200">
                      <TableCell
                        colSpan={3}
                        className="text-right font-bold text-green-800 align-middle pr-4 text-base"
                      >
                        Grand Total
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-700 text-lg align-middle">
                        {grandTotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="bg-green-100/50"></TableCell>
                    </TableRow>
                  </TableFooter>
                </table>
              </div>
              {/* --- [เพิ่ม] ปุ่มและ Popover สำหรับเพิ่มสินค้า --- */}
              <div className="mt-4">
                <Popover
                  open={isAddProductOpen}
                  onOpenChange={setAddProductOpen}
                >
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Product
                    </Button>
                  </PopoverTrigger>
                  {/* [แก้ไข] เพิ่ม side="bottom" และ align="start" เพื่อบังคับให้ dropdown แสดงด้านล่างเสมอ */}
                  {/* [แก้ไข] ปรับความกว้างสำหรับ Mobile: w-[300px] md:w-[400px] */}
                  <PopoverContent
                    className="w-[300px] md:w-[400px] p-0"
                    side="top"
                    align="start"
                  >
                    {/* [แก้ไข] เพิ่ม prop `filter` เพื่อปิดการกรองข้อมูลของ Command component */}
                    <Command>
                      <CommandInput
                        placeholder="Search product SKU or name..."
                        value={productSearchQuery}
                        onValueChange={setProductSearchQuery} // [แก้ไข] ลบ property ที่พิมพ์ผิดออก
                      />
                      {/* --- [แก้ไข] ปรับปรุง UI ตอนโหลดและแสดงผล --- */}
                      <div className="max-h-[300px] overflow-y-auto">
                        {isLoading ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            Searching for products...
                          </div>
                        ) : (
                          <>
                            <CommandEmpty>No product found.</CommandEmpty>
                            <CommandGroup>
                              {searchedProducts.map((product) => (
                                <CommandItem
                                  value={`${product.sku} ${product.name}`} // [สำคัญ] เพิ่ม value ให้ Command กรองข้อมูลได้
                                  key={product.sku}
                                  onSelect={() =>
                                    handleAddProductToOrder(product)
                                  }
                                  className="flex flex-col items-start" // จัดเรียงแนวตั้ง
                                >
                                  {/* บรรทัดที่ 1: SKU, Name, Price */}
                                  <span className="font-medium">
                                    {product.sku} - {product.name} (
                                    {product.price.toFixed(2)} Baht)
                                  </span>
                                  {/* บรรทัดที่ 2: Group Cat, Group Mat */}
                                  <span className="text-xs text-muted-foreground">
                                    {product.groupCat || "N/A"} |{" "}
                                    {product.groupMat || "N/A"}
                                  </span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </>
                        )}
                      </div>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pt-6 md:flex-row-reverse md:justify-between">
              {/* [Button: Submit Order] */}
              <Button
                className="w-full md:w-[200px] bg-green-600 text-white hover:bg-green-700 shadow-md justify-center items-center"
                onClick={() => {
                  // --- เรียกใช้ Sonner Toast ---
                  toast.success("Order Submitted Successfully!", {
                    description: `We have received your order for ${
                      value?.customerHANA || "Customer"
                    }.`,
                    duration: 4000, // แสดง 4 วินาที
                  });
                }}
              >
                <span className="flex items-center gap-2">
                  Confirm Order <Check className="h-4 w-4" />
                </span>
              </Button>

              {/* [Button: Back] */}
              <Button
                variant="outline"
                className="w-full md:w-[200px] justify-center items-center"
                onClick={() => setStep("details")}
              >
                <span className="flex items-center gap-2">
                  <ChevronLeft className="h-4 w-4" /> Back
                </span>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      {/* ================= Dialog ลบสินค้า ================= */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Remove Item
            </DialogTitle>
            <DialogDescription>
              Please specify why you want to remove{" "}
              <span className="font-bold text-foreground">
                {productToDelete?.sku}
              </span>
              . This helps us improve future recommendations.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-3">
            <div className="grid gap-2">
              <Label htmlFor="reason" className="text-left">
                Reason for removal <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="e.g. Stock overflow, Price too high, Not needed..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="resize-none focus-visible:ring-red-500" // Focus สีแดงสื่อถึงการลบ
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            {/* ปุ่ม Cancel */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>

            {/* ปุ่ม Confirm */}
            <Button
              type="button"
              variant="destructive" // ใช้ธีมสีแดงของ shadcn
              onClick={confirmDelete}
              className="w-full sm:w-auto"
              disabled={!deleteReason.trim()} // บังคับให้พิมพ์ก่อนถึงจะกดได้
            >
              Confirm Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- [NEW] Component ย่อยสำหรับแสดงผลแต่ละ Card และจัดการตัวเลือกรถ ---
interface RecommendCardProps {
  group: RecommendationItem;
  index: number;
  onCheck: (selectedProducts: ProductRow[], truckDescription: string) => void;
}

const RecommendCard: React.FC<RecommendCardProps> = ({
  group,
  index,
  onCheck,
}) => {
  // ดึงข้อมูลรถ (เน้น Single Option เป็นหลักเพื่อนำไปโชว์หัวข้อ)
  const singleOption = group.data.truck.single_truck_option;

  // 1. ส่วนแสดงผลบน Header (โชว์จำนวนคันด้วยเพื่อให้ User เห็นชัดเจน)
  const headerDisplay = singleOption
    ? `${singleOption.truck_description} (${singleOption.trucks_needed} คัน)`
    : "Standard Delivery";

  // 2. [แก้ไข] ส่งค่า truck_description ไปตรงๆ เลย
  // เพราะค่าจาก API ตรงกับ value ใน <SelectItem> หน้า 2 แล้ว
  const valueToSend = singleOption?.truck_description || "";

  // 1. แปลงข้อมูลทั้งหมด
  const allProducts = mapSelectedProductsToProductRows(
    group.data.selected_products || []
  );

  // 2. [สำคัญ] แยกสินค้าเป็น 2 กอง ตามค่า recommendType ("best" vs "potential")
  const bestSellerItems = sortProductRows(
    allProducts.filter((p) => p.recommendType === "best")
  );
  const highPotentialItems = sortProductRows(
    allProducts.filter((p) => p.recommendType === "potential")
  );
  // ✅ [เพิ่ม] ฟังก์ชันสำหรับ Export Excel
  const handleExportExcel = () => {
    // 1. เตรียมข้อมูลสำหรับ Excel
    const excelData = allProducts.map((item) => ({
      Type: item.recommendType === "best" ? "Best Seller" : "High Potential",
      SKU: item.sku,
      Category: item.category,
      Quantity: item.volume,
      "Unit Price": item.baht,
      "Total Price": item.baht * item.volume,
      Reason: item.reason,
    }));

    // 2. สร้าง Worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // [Optional] ปรับความกว้างคอลัมน์นิดหน่อยให้สวยงาม
    const wscols = [
      { wch: 15 }, // Type
      { wch: 20 }, // SKU
      { wch: 15 }, // Category
      { wch: 10 }, // Qty
      { wch: 10 }, // Price
      { wch: 12 }, // Total
      { wch: 40 }, // Reason
    ];
    worksheet["!cols"] = wscols;

    // 3. สร้าง Workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Recommended Order");

    // 4. ตั้งชื่อไฟล์ (ใช้วันที่ปัจจุบัน + ชื่อกลุ่ม)
    const dateStr = new Date().toISOString().split("T")[0];
    const fileName = `Order_${group.title}_${dateStr}.xlsx`;

    // 5. ดาวน์โหลด
    XLSX.writeFile(workbook, fileName);

    // แจ้งเตือน user (ถ้าต้องการ)
    toast.success("Exported successfully", { description: fileName });
  };
  return (
    <Card className="p-0 border shadow-md hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden">
      {/* --- Header: ชื่อกลุ่ม + ข้อมูลรถ --- */}
      <CardHeader className="pb-2 p-4 md:p-6 border-b bg-green-600 rounded-t-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          {/* ซ้าย: Recommend #... */}
          <CardTitle className="text-xl font-bold text-white">
            {group.title}
          </CardTitle>

          {/* ขวา: ข้อมูลรถ (ย้ายกลับมาที่นี่) */}
          <div className="flex items-center gap-2 text-sm md:text-base">
            <TruckIcon className="h-5 w-5 text-white/90" />
            <span className="font-bold text-white">{headerDisplay}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-8">
        {/* ตารางสินค้า */}

        {/* ✅ [เพิ่มใหม่] ส่วนตารางที่ 1: Best Seller */}
        {bestSellerItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1 border-l-4 border-green-500 pl-3">
              <h4 className="text-lg font-bold text-green-800">
                Best Seller Items
              </h4>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 hover:bg-green-100"
              >
                {bestSellerItems.length} SKUs
              </Badge>
            </div>
            <ProductTable
              title=""
              data={bestSellerItems}
              total={bestSellerItems.reduce(
                (sum, item) => sum + item.baht * item.volume,
                0
              )}
            />
          </div>
        )}

        {/* ✅ [เพิ่มใหม่] ส่วนตารางที่ 2: High Potential */}
        {highPotentialItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1 border-l-4 border-blue-500 pl-3">
              <h4 className="text-lg font-bold text-blue-800">
                High Potential Items
              </h4>
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-800 hover:bg-blue-100"
              >
                {highPotentialItems.length} SKUs
              </Badge>
            </div>
            <ProductTable
              title=""
              data={highPotentialItems}
              total={highPotentialItems.reduce(
                (sum, item) => sum + item.baht * item.volume,
                0
              )}
            />
          </div>
        )}
        {/* <ProductTable
          title=""
          data={sortProductRows(
            mapSelectedProductsToProductRows(group.data.selected_products || [])
          )}
          total={group.data.group_total_price || 0}
        /> */}

        {/* --- Group Summary (แสดงเหตุผล) --- */}
        {group.data.group_summary && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-3">
            <Info className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-800 text-sm mb-1">
                Why this set?
              </h4>
              <p className="text-sm text-yellow-700 leading-relaxed">
                {group.data.group_summary}
              </p>
            </div>
          </div>
        )}
      </CardContent>

      {/* ✅ [แก้ไข] CardFooter: เพิ่มปุ่ม Export */}
      <CardFooter className="flex flex-col sm:flex-row justify-center items-center gap-3 pb-6 pt-2 bg-gray-50/30 rounded-b-lg px-6">
        {/* ปุ่ม Export Excel (เพิ่มใหม่) */}
        <Button
          size="lg"
          variant="outline"
          className="w-full sm:w-[160px] border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 gap-2"
          onClick={handleExportExcel}
        >
          <Download className="h-4 w-4" />
          Export Excel
        </Button>

        <Button
          size="lg"
          className="w-full md:w-[200px] border border-green-600 text-green-600 hover:bg-green-50 hover:text-green-600 font-semibold shadow-md"
          variant="outline"
          onClick={() => {
            // // ส่งรายการสินค้า และ ข้อมูลรถ (ตัวที่โชว์บน Header) ไปหน้าถัดไป
            // onCheck(
            //   mapSelectedProductsToProductRows(
            //     group.data.selected_products || []
            //   ),
            //   valueToSend
            // );

            onCheck(allProducts, valueToSend);
          }}
        >
          Check
        </Button>
      </CardFooter>
    </Card>
  );
};
