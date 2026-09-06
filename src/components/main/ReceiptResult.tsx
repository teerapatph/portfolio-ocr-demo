import { useState } from "react";
import type { OcrData } from "@/lib/api/ocr";
import ProductTable from "./product-table";
import ConfidenceBadge from "./ConfidenceBadge";
import { AlertTriangle, ReceiptText, Tag, CircleDollarSign, Coins, ShoppingCart, Hash, FileText, CalendarDays, Sparkles, Store, User } from "lucide-react";
 
// Interface สำหรับ Props ที่จะรับเข้ามา
interface ReceiptResultProps {
  ocrData: OcrData;
  receiptNumber: number;
  onImageClick: (url: string, receiptId?: string) => void;
}

const currency = (n: number | undefined) => n !== undefined ? n.toLocaleString('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 2 }) : '-';

const ReceiptResult: React.FC<ReceiptResultProps> = ({ ocrData, receiptNumber, onImageClick }) => {
    // ✨ สร้าง State activeIndex ไว้ที่นี่ ✨
    const [activeIndex, setActiveIndex] = useState(0);

    // ดึง URL ของรูปที่กำลัง Active อยู่
    const hasImages = ocrData.sourceImageKeys && ocrData.sourceImageKeys.length > 0;
    const activeImageUrl = hasImages ? ocrData.sourceImageKeys?.[activeIndex] : undefined;
    
    // --- ✨ 1. คำนวณยอดรวมจากรายการสินค้า และเปรียบเทียบกับ Subtotal ของ Summary ✨ ---
    const calculatedTotal = ocrData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const ocrSubtotalString = ocrData.summary?.subtotal;
    const ocrSubtotal = ocrSubtotalString ? parseFloat(ocrSubtotalString.replace(/,/g, '')) : 0;

    // เปรียบเทียบโดยใช้ค่า epsilon เล็กน้อยเพื่อป้องกันปัญหา floating point
    const totalsMatch = Math.abs(calculatedTotal - ocrSubtotal) < 0.01;

    // ถ้าค่าใน summary เป็น 0.00 แต่ค่าที่คำนวณได้มีค่ามากกว่า 0 ให้ถือว่าไม่ตรงกันเสมอ
    // เพื่อจัดการกรณีที่ OCR ไม่สามารถอ่าน summary ได้
    const isMismatch = ocrSubtotal > 0 && !totalsMatch;

    
    // ✨ ลบการป้องกันที่ทำให้ Component หยุดทำงานทั้งหมดออกไป
    // if (!ocrData || !ocrData.sourceImageKeys || ocrData.sourceImageKeys.length === 0) {
    //     return <div>No images available for this receipt.</div>;
    // }
    return (
        <div className="w-full">
            {/* <h2 className="text-2xl font-bold text-center mb-6 text-green-800">
                ผลลัพธ์สำหรับใบเสร็จที่ {receiptNumber}
            </h2> */}

            {/* ✨ เพิ่มเงื่อนไข: แสดงส่วนของรูปภาพก็ต่อเมื่อมีรูปภาพเท่านั้น ✨ */}
            {hasImages && (
                <div className="w-full flex flex-col items-center mb-10">
                    {/* 1. ภาพพรีวิวหลัก */}
                    <div className="w-full max-w-lg mb-4">
                        <img
                            src={activeImageUrl}
                            alt="Receipt preview"
                            className="w-full aspect-video object-contain border-2 border-gray-200 rounded-xl shadow-lg bg-white cursor-pointer"
                            onClick={() => activeImageUrl && onImageClick(activeImageUrl, ocrData.id)}
                        />
                    </div>

                    {/* 2. แถบรูปภาพย่อ */}
                    <div className="flex overflow-x-auto gap-2 p-2 w-full max-w-lg">
                        {ocrData.sourceImageKeys?.map((imageKey, imgIndex) => (
                            <img
                                key={imageKey}
                                src={imageKey}
                                alt={`Thumbnail ${imgIndex + 1}`}
                                className={`w-16 h-16 object-cover rounded-md cursor-pointer flex-shrink-0 border-2 transition-all ${activeIndex === imgIndex ? 'border-green-500' : 'border-transparent'}`}
                                onClick={() => {
                                    setActiveIndex(imgIndex);
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Receipt Details & Participants Card */}
            <div className="w-full max-w-4xl mx-auto bg-white/95 backdrop-blur-sm border border-gray-200/80 rounded-2xl shadow-lg p-6 space-y-8">
                {/* === HEADER ของใบเสร็จ === */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-gray-200">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-800">
                            ผลลัพธ์สำหรับใบเสร็จที่ {receiptNumber}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            <span className="font-semibold">ID:</span> <span className="font-mono">{ocrData.receiptId || 'N/A'}</span>
                        </p>
                    </div>
                    <div className="flex-shrink-0 flex flex-col sm:items-end gap-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CalendarDays className="w-4 h-4 text-gray-500" />
                            <span>{ocrData.receiptDate || 'No Date'}</span>
                        </div>
                        <ConfidenceBadge score={ocrData.global_average_confidence} />
                    </div>
                </div>

                {/* === ข้อมูลผู้ขายและลูกค้า === */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* --- การ์ดผู้ขาย (Dealer) --- */}
                    <div className="bg-green-50/50 border border-green-200/80 rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600">
                                <Store className="w-5 h-5" />
                            </span>
                            <h3 className="text-lg font-semibold text-green-800">Dealer</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <p><strong className="font-medium text-gray-600">Name:</strong> <span className="text-gray-800">{ocrData.dealer?.name || '-'}</span></p>
                            <p><strong className="font-medium text-gray-600">Address:</strong> <span className="text-gray-700">{ocrData.dealer?.address || '-'}</span></p>
                            <p><strong className="font-medium text-gray-600">Tax ID:</strong> <span className="font-mono text-gray-700">{ocrData.dealer?.taxId && ocrData.dealer.taxId.length <= 13 ? ocrData.dealer.taxId : '-'}</span></p>
                            {ocrData.dealer?.tels?.length > 0 && (
                                <p><strong className="font-medium text-gray-600">Tel:</strong> <span className="text-gray-700">{ocrData.dealer.tels.join(", ")}</span></p>
                            )}
                        </div>
                    </div>

                    {/* --- การ์ดลูกค้า (Customer) --- */}
                    <div className="bg-blue-50/50 border border-blue-200/80 rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                                <User className="w-5 h-5" />
                            </span>
                            <h3 className="text-lg font-semibold text-blue-800">Customer</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <p><strong className="font-medium text-gray-600">Name:</strong> <span className="text-gray-800">{ocrData.customer?.name || '-'}</span></p>
                            <p><strong className="font-medium text-gray-600">Address:</strong> <span className="text-gray-700">{ocrData.customer?.address || '-'}</span></p>
                            <p><strong className="font-medium text-gray-600">Tax ID:</strong> <span className="font-mono text-gray-700">{ocrData.customer?.taxId && ocrData.customer.taxId.length <= 13 ? ocrData.customer.taxId : '-'}</span></p>
                            {ocrData.customer?.tels?.length > 0 && (
                                <p><strong className="font-medium text-gray-600">Tel:</strong> <span className="text-gray-700">{ocrData.customer.tels.join(", ")}</span></p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full xl:max-w-[1800px] mx-auto mt-10">
                <ProductTable ocrData={ocrData} />

                {/* --- ✨ 2. แสดง Alert หากยอดรวมไม่ตรงกัน ✨ --- */}
                {isMismatch && (
                    <div className="w-full xl:max-w-[1800px] mx-auto mt-6 flex justify-end">
                        <div className="w-full max-w-sm bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertTriangle className="h-5 w-5 text-yellow-500" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-800 font-semibold">
                                        ยอดรวมไม่ตรงกัน: ยอดจากรายการสินค้าคือ <span className="font-bold">{currency(calculatedTotal)}</span> แต่ยอดรวมก่อนส่วนลด (Subtotal) จากใบเสร็จคือ <span className="font-bold">{currency(ocrSubtotal)}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* --- OCR Summary Section --- */}
                {ocrData.summary && (
                    <div className="w-full xl:max-w-[1800px] mx-auto mt-4 flex justify-end">
                        <div className="w-full max-w-sm bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-5 border border-slate-200 shadow-lg">
                            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <ReceiptText className="w-6 h-6 text-slate-600" />
                                <span>OCR Summary</span>
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-white/60">
                                    <span className="flex items-center gap-2 text-slate-600 font-medium"><ShoppingCart className="w-4 h-4" /> Subtotal</span>
                                    <span className="font-mono font-semibold text-slate-800">{ocrData.summary.subtotal || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg bg-white/60">
                                    <span className="flex items-center gap-2 text-slate-600 font-medium"><Tag className="w-4 h-4" /> Discount</span>
                                    <span className="font-mono font-semibold text-slate-800">{ocrData.summary.discount || 'N/A'}</span>
                                </div>

                                <div className="flex items-center justify-between p-2 rounded-lg bg-white/60">
                                    <span className="flex items-center gap-2 text-slate-600 font-medium"><CircleDollarSign className="w-4 h-4" /> Grand Total</span>
                                    <span className="font-mono font-semibold text-slate-800">{ocrData.summary.grand_total || 'N/A'}</span>
                                </div>

                                {/* Payment Details */}
                                <div className="border-t border-slate-200 pt-3 space-y-3">
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/60">
                                        <span className="flex items-center gap-2 text-slate-600 font-medium"><Coins className="w-4 h-4" /> Cash</span>
                                        <span className="font-mono font-semibold text-slate-800">{ocrData.summary.cash || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/60">
                                        <span className="flex items-center gap-2 text-slate-600 font-medium"><Coins className="w-4 h-4" /> Change</span>
                                        <span className="font-mono font-semibold text-slate-800">{ocrData.summary.change || 'N/A'}</span>
                                    </div>
                                </div>

                                {/* Item/Qty Count */}
                                <div className="border-t border-slate-200 pt-3 grid grid-cols-2 gap-3">
                                    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/60">
                                        <span className="flex items-center gap-1 text-slate-500 text-xs font-medium"><Hash className="w-3 h-3" /> Total Items</span>
                                        <span className="font-mono font-bold text-slate-700 text-base">{ocrData.summary.subtotal_items || 'N/A'}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/60">
                                        <span className="flex items-center gap-1 text-slate-500 text-xs font-medium"><Hash className="w-3 h-3" /> Total Qty</span>
                                        <span className="font-mono font-bold text-slate-700 text-base">{ocrData.summary.subtotal_qty || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReceiptResult;