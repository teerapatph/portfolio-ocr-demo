import React from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { OcrData, Item } from "@/lib/api/ocr";
import { Target, Box, List } from "lucide-react";

interface ProductTableProps {
  ocrData: OcrData;
}

const getTotal = (arr: Item[]) => arr.reduce((sum, item) => sum + (item.total || 0), 0);

const currency = (n: number | undefined) => n !== undefined ? n.toLocaleString('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 2 }) : '-';

const ProductCard: React.FC<{ item: Item; color: string }> = ({ item, color }) => (
  <div className={`flex flex-col gap-1 p-4 rounded-xl shadow border border-${color}-200 bg-${color}-50/60 mb-2`}>
    <div className={`font-bold text-${color}-800 text-base`}>{item.name}</div>
    <div className={`text-${color}-700 text-sm`}>Piece: {item.piece}</div>
    <div className={`text-${color}-700 text-sm`}>Price/pc: {currency(item.price)}</div>
    <div className={`text-${color}-900 font-bold text-right`}>Total: {currency(item.total)}</div>
  </div>
);

const ProductTable: React.FC<ProductTableProps> = ({ ocrData }) => {
  const target = ocrData.items.filter(i => i.type === "TARGET");
  const other = ocrData.items.filter(i => i.type !== "TARGET");
  const totalTarget = getTotal(target);
  const totalOther = getTotal(other);
  const totalAll = totalTarget + totalOther;

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8">
        <Tabs defaultValue="target" className="w-full" aria-label="Product Tabs">
          <TabsList className="flex w-full justify-center gap-2 bg-white/90 rounded-2xl mb-6 p-2 shadow-lg border border-green-200 text-lg font-bold">
            <TabsTrigger value="target" className="flex-1 rounded-xl flex items-center gap-2 py-3 px-4 transition-all data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 text-green-700 hover:bg-green-100" aria-label="Our Products"><Target className="inline-block mb-1 w-5 h-5" /> Our Products</TabsTrigger>
            <TabsTrigger value="other" className="flex-1 rounded-xl flex items-center gap-2 py-3 px-4 transition-all data-[state=active]:bg-yellow-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 text-yellow-700 hover:bg-yellow-100" aria-label="Other Products"><Box className="inline-block mb-1 w-5 h-5" /> Other Products</TabsTrigger>
            <TabsTrigger value="summary" className="flex-1 rounded-xl flex items-center gap-2 py-3 px-4 transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105 text-blue-700 hover:bg-blue-100" aria-label="Summary"><List className="inline-block mb-1 w-5 h-5" /> Summary</TabsTrigger>
          </TabsList>

          {/* Target Tab */}
          <TabsContent value="target" className="animate-fade-in">
            <div className="w-full bg-gradient-to-br from-green-50 to-white rounded-3xl shadow-xl p-4 sm:p-6 border border-green-200">
              <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center gap-2"><Target className="w-6 h-6" /> Our Products</h2>
              {/* Mobile: Card layout */}
              <div className="block sm:hidden">
                {target.length > 0 ? (
                  <>
                    {target.map((item) => (
                      <ProductCard key={item.id} item={item} color="green" />
                    ))}
                    <div className="flex justify-between items-center mt-2 p-3 rounded-xl bg-green-100 font-bold text-green-900">
                      <span>Total Target</span>
                      <span>{currency(totalTarget)}</span>
                    </div>
                  </>
                ) : (
                  <div className="py-6 px-6 text-gray-400 italic text-center bg-green-50 rounded-b-2xl">No products found</div>
                )}
              </div>
              {/* Desktop: Table layout */}
              <div className="hidden sm:block overflow-x-auto">
                <Table className="w-full min-w-[600px] bg-white rounded-2xl shadow border border-green-100">
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-green-600 to-green-400 text-white rounded-t-2xl">
                      <TableHead className="py-4 px-6 text-lg font-bold rounded-tl-2xl text-left">Product</TableHead>
                      <TableHead className="py-4 px-6 text-lg font-bold text-center">Piece</TableHead>
                      <TableHead className="py-4 px-6 text-lg font-bold text-center">Price/pc</TableHead>
                      <TableHead className="py-4 px-6 text-lg font-bold rounded-tr-2xl text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {target.length > 0 ? (
                      target.map((item, i) => (
                        <TableRow key={item.id} className={`transition-all duration-200 ${i % 2 === 0 ? 'bg-green-50/60' : 'bg-white'} hover:bg-green-100/80 border-b border-green-100`}>
                          <TableCell className="py-3 px-6 text-left font-medium text-green-900 whitespace-pre-line">{item.name}</TableCell>
                          <TableCell className="py-3 px-6 text-center text-green-700">{item.piece}</TableCell>
                          <TableCell className="py-3 px-6 text-center text-green-800">{currency(item.price)}</TableCell>
                          <TableCell className="py-3 px-6 text-right text-green-900 font-bold">{currency(item.total)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="py-6 px-6 text-gray-400 italic text-center bg-green-50 rounded-b-2xl">No products found</TableCell>
                      </TableRow>
                    )}
                    <TableRow className="bg-green-100 font-bold">
                      <TableCell colSpan={3} className="py-3 px-6 text-right">Total Target</TableCell>
                      <TableCell className="py-3 px-6 text-right text-green-900">{currency(totalTarget)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Other Tab */}
          <TabsContent value="other" className="animate-fade-in">
            <div className="w-full bg-gradient-to-br from-yellow-50 to-white rounded-3xl shadow-xl p-4 sm:p-6 border border-yellow-200">
              <h2 className="text-2xl font-bold text-yellow-700 mb-4 flex items-center gap-2"><Box className="w-6 h-6" /> Other Products</h2>
              {/* Mobile: Card layout */}
              <div className="block sm:hidden">
                {other.length > 0 ? (
                  <>
                    {other.map((item) => (
                      <ProductCard key={item.id} item={item} color="yellow" />
                    ))}
                    <div className="flex justify-between items-center mt-2 p-3 rounded-xl bg-yellow-100 font-bold text-yellow-900">
                      <span>Total Other</span>
                      <span>{currency(totalOther)}</span>
                    </div>
                  </>
                ) : (
                  <div className="py-6 px-6 text-gray-400 italic text-center bg-yellow-50 rounded-b-2xl">No other products found</div>
                )}
              </div>
              {/* Desktop: Table layout */}
              <div className="hidden sm:block overflow-x-auto">
                <Table className="w-full min-w-[600px] bg-white rounded-2xl shadow border border-yellow-100">
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-yellow-600 to-yellow-400 text-white rounded-t-2xl">
                      <TableHead className="py-4 px-6 text-lg font-bold rounded-tl-2xl text-left">Product</TableHead>
                      <TableHead className="py-4 px-6 text-lg font-bold text-center">Piece</TableHead>
                      <TableHead className="py-4 px-6 text-lg font-bold text-center">Price/pc</TableHead>
                      <TableHead className="py-4 px-6 text-lg font-bold rounded-tr-2xl text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {other.length > 0 ? (
                      other.map((item, i) => (
                        <TableRow key={item.id} className={`transition-all duration-200 ${i % 2 === 0 ? 'bg-yellow-50/60' : 'bg-white'} hover:bg-yellow-100/80 border-b border-yellow-100`}>
                          <TableCell className="py-3 px-6 text-left font-medium text-yellow-900 whitespace-pre-line">{item.name}</TableCell>
                          <TableCell className="py-3 px-6 text-center text-yellow-700">{item.piece}</TableCell>
                          <TableCell className="py-3 px-6 text-center text-yellow-800">{currency(item.price)}</TableCell>
                          <TableCell className="py-3 px-6 text-right text-yellow-900 font-bold">{currency(item.total)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="py-6 px-6 text-gray-400 italic text-center bg-yellow-50 rounded-b-2xl">No other products found</TableCell>
                      </TableRow>
                    )}
                    <TableRow className="bg-yellow-100 font-bold">
                      <TableCell colSpan={3} className="py-3 px-6 text-right">Total Other</TableCell>
                      <TableCell className="py-3 px-6 text-right text-yellow-900">{currency(totalOther)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary" className="animate-fade-in">
            <div className="w-full max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-white rounded-3xl shadow-xl p-4 sm:p-6 border border-blue-200">
              <h2 className="text-2xl font-bold text-blue-700 mb-4 flex items-center gap-2"><List className="w-6 h-6" /> Summary</h2>
              <Table className="w-full min-w-[400px] bg-white rounded-2xl shadow border border-blue-100">
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-t-2xl">
                    <TableHead className="py-4 px-6 text-lg font-bold rounded-tl-2xl text-center">Target Total</TableHead>
                    <TableHead className="py-4 px-6 text-lg font-bold text-center">Other Total</TableHead>
                    <TableHead className="py-4 px-6 text-lg font-bold rounded-tr-2xl text-center">Grand Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-blue-50 font-bold">
                    <TableCell className="py-4 px-6 text-blue-700 font-bold text-center">{currency(totalTarget)}</TableCell>
                    <TableCell className="py-4 px-6 text-blue-700 font-bold text-center">{currency(totalOther)}</TableCell>
                    <TableCell className="py-4 px-6 text-blue-900 font-extrabold text-center">{currency(totalAll)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-blue-50">
                    <TableCell className="py-2 px-6 text-blue-700 text-center">{target.length} Items</TableCell>
                    <TableCell className="py-2 px-6 text-blue-700 text-center">{other.length} Items</TableCell>
                    <TableCell className="py-2 px-6 text-blue-900 text-center">{target.length + other.length} Items</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductTable;
