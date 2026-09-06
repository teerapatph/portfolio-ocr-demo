import { useState, useEffect, useRef } from "react";
import { postOcr } from "@/lib/api/ocr";
import type { OcrData, UploadedGroup, JobStatus } from "@/lib/api/ocr";
import ImageUpload from "./main/image-upload"; // ✨ 1. Import API ใหม่
import ProductTable from "./main/product-table";
import { X, Clock } from "lucide-react"; // เพิ่ม Clock icon
import { startProcessReceiptsBatch, getBatchStatus } from "@/lib/api/ocr"; // ✨ 1. Import API ใหม่
import { Button } from "@/components/ui/button";
import ReceiptResult from "./main/ReceiptResult";
import { Progress } from "@/components/ui/progress"; // ✨ 1. Import Progress component

const Main = () => {
  const [uploaded, setUploaded] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [ocrResults, setOcrResults] = useState<OcrData[] | null>(null);
  const [loadingOcr, setLoadingOcr] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  // For pan/drag
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [scale, setScale] = useState(1);
  const initialPinchState = useRef<{ distance: number; scale: number } | null>(
    null
  );
  const [progress, setProgress] = useState(0); // ✨ 2. เพิ่ม State สำหรับ Progress Bar
  const [lastUploadAttempt, setLastUploadAttempt] = useState<
    UploadedGroup[] | null
  >(null);
  const [jobId, setJobId] = useState<string | null>(null); // ✨ 3. เพิ่ม State สำหรับเก็บ Job ID
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null); // Ref for polling interval

  // 👇 2. วาง useEffect block ทั้งหมดนี้ไว้ที่นี่
  useEffect(() => {
    // เมื่อ modal เปิด (showImageModal เป็น true)
    if (showImageModal) {
      // เพิ่ม class 'modal-open' ไปที่ <body>
      document.body.classList.add("modal-open");
    } else {
      // เมื่อ modal ปิด (showImageModal เป็น false)
      // ลบ class 'modal-open' ออกจาก <body>
      document.body.classList.remove("modal-open");
    }

    // Cleanup function: จะทำงานเมื่อ component ถูก unmount
    // เพื่อให้แน่ใจว่า class จะถูกลบออกเสมอ ป้องกันหน้าค้าง
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [showImageModal]); // 👈 สั่งให้ effect นี้ทำงานทุกครั้งที่ค่า showImageModal เปลี่ยน

  const handleImagePreview = (url: string, receiptId?: string) => {
    // ✨ ปรับปรุง: ถ้ามี receiptId ให้ไปหา URL ที่ถูกต้องจาก ocrResults
    // เพื่อให้แน่ใจว่าเราใช้ Presigned URL จาก S3 ไม่ใช่ blob URL เก่า
    const result = ocrResults?.find((r) => r.id === receiptId); // ใช้ optional chaining
    const finalUrl =
      result?.sourceImageKeys?.find((key) =>
        key.includes(url.split("/").pop()?.split("?")[0] || "")
      ) || url;

    setImageUrl(finalUrl); // ตั้งค่า URL ที่จะแสดง
    setShowImageModal(true); // สั่งให้ Modal เปิด
    // Reset pan/zoom state ของ Modal ทุกครั้งที่เปิดรูปใหม่
    setScale(1);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleBatchUpload = async (groups: UploadedGroup[]) => {
    setUploaded(true);
    setShowResult(false);
    setOcrResults(null);
    setError(null);
    setProgress(0);
    setLoadingOcr(true);
    setLastUploadAttempt(groups);

    try {
      // ✨ 4. เรียก API ตัวใหม่เพื่อ "เริ่มงาน" และรับ Job ID กลับมา
      const res = await startProcessReceiptsBatch(groups);
      const receivedJobId = res.data.jobId;
      setJobId(receivedJobId);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "OCR failed. Please try again."
      );
      // หากการ "เริ่มงาน" ล้มเหลว ให้หยุด loading และแสดง error
      setLoadingOcr(false);
      setShowResult(true);
    }
  };

  const handleRetry = () => {
    // ✨ เปลี่ยนให้ปุ่ม Retry ทำการ Reset กลับไปหน้าอัปโหลดเริ่มต้น
    handleReset();
  };

  const handleReset = () => {
    setUploaded(false);
    setImageUrl(null);
    setShowResult(false);
    setError(null);
    setShowImageModal(false);
    setProgress(0);
    setOcrResults(null); // ล้างผลลัพธ์เก่า
    setLastUploadAttempt(null); // ✨ ล้างข้อมูลสำหรับ Retry
    setJobId(null); // ✨ ล้าง Job ID
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
  };

  // ✨ 5. เพิ่ม useEffect สำหรับควบคุมการเคลื่อนไหวของ Progress Bar
  useEffect(() => {
    if (loadingOcr && !jobId) {
      // Animate progress while waiting for jobId
      setProgress(10); // เริ่มต้นที่ 10%
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 30) {
            clearInterval(timer); // Stop at 30% and wait for polling to take over
            return 30;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      return () => clearInterval(timer); // Cleanup เมื่อ component unmount หรือ loadingOcr เป็น false
    }
  }, [loadingOcr, jobId]);

  // Database Polling Logic
  useEffect(() => {
    if (!jobId) return;

    const pollStatus = async () => {
      try {
        const res = await getBatchStatus(jobId);
        const job: JobStatus = res.data;

        if (job.status === "COMPLETED" || job.status === "FAILED") {
          if (pollingIntervalRef.current)
            clearInterval(pollingIntervalRef.current);

          if (job.status === "COMPLETED") {
            setProgress(100);
            setOcrResults(job.data || []);
          } else {
            // failed
            setError(job.error || "Processing failed for an unknown reason.");
            setOcrResults(job.data || []); // Show partial results if any
          }

          setTimeout(() => {
            setLoadingOcr(false);
            setShowResult(true);
          }, 500); // Delay for progress bar animation
        } else {
          // 'pending' or 'processing'
          // A simple progress simulation. A more advanced version could use sub-job counts.
          setProgress((prev) => Math.min(95, prev + 5));
        }
      } catch (e) {
        if (pollingIntervalRef.current)
          clearInterval(pollingIntervalRef.current);
        setError(e instanceof Error ? e.message : "Failed to get job status.");
        setLoadingOcr(false);
        setShowResult(true);
      }
    };

    // Start polling immediately and then set an interval
    setProgress(35);
    pollStatus();
    pollingIntervalRef.current = setInterval(pollStatus, 3000); // Poll every 3 seconds

    // Cleanup on unmount or when jobId changes
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [jobId]);

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-green-200 via-white to-blue-200 flex flex-col items-center justify-start overflow-x-hidden">
      
      {/* Navigation to Orders */}
      <div className="absolute top-4 right-4 z-20">
        <a href="/orders">
          <Button variant="outline" className="bg-white/80 backdrop-blur-sm border-green-300 text-green-800 hover:bg-green-50 shadow-sm font-semibold">
            AI Recommendations ➔
          </Button>
        </a>
      </div>

      {/* Hero Header */}
      <header className="w-full flex flex-col items-center justify-center py-8 px-4 bg-transparent select-none">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="flex-shrink-0">
            <img
              src="/demo-logo.svg"
              alt="Demo Logo"
              className="h-24 w-auto object-contain drop-shadow-lg"
            />
          </div>
          {/* <span className="text-4xl sm:text-5xl font-extrabold text-green-800 tracking-tight drop-shadow-xl leading-tight">DEMO OCR</span> */}
        </div>
        <span className="text-lg sm:text-2xl font-medium text-green-700/80 text-center max-w-xl drop-shadow-sm">
          Upload your receipt and instantly get a beautiful, clear product
          summary. Fast, accurate, and delightful.
        </span>
      </header>
      {/* Floating Card */}
      <main className="flex-1 w-full flex flex-col items-center justify-start">
        <section className="relative w-full max-w-2xl md:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-auto bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl p-4 sm:p-8 flex flex-col items-center gap-10 border border-green-100 mt-0 mb-12 -mt-8 z-10 animate-fade-in-up">
          {/* Upload Section */}
          {!uploaded && (
            <div className="w-full flex flex-col items-center gap-4">
              <ImageUpload onUpload={handleBatchUpload} />
              
              {/* 1-Click Demo Button */}
              <div className="w-full max-w-lg mt-2 px-6">
                <Button 
                  variant="outline" 
                  className="w-full bg-green-50 border-green-500 text-green-700 hover:bg-green-100 hover:text-green-800 shadow-sm"
                  size="lg"
                  onClick={() => {
                     const dummyGroup = {
                       groupName: "Demo Receipt",
                       fileKeys: ["mock-receipt-image"]
                     };
                     handleBatchUpload([dummyGroup]);
                  }}
                >
                  🚀 1-Click Demo Upload & Process
                </Button>
              </div>
            </div>
          )}
          {/* Progress Section */}
          {uploaded && loadingOcr && !error && (
            <div className="w-full flex flex-col items-center gap-8 mt-4">
              {/* ✨ 6. แสดง Progress Bar */}
              <div className="w-full max-w-md">
                <Progress value={progress} className="w-full" />
                <p className="text-right text-sm text-gray-500 mt-2 font-mono">
                  {Math.round(progress)}%
                </p>
              </div>
              {/* Status Messages */}
              <div className="text-center space-y-2">
                <div className="text-green-700 text-xl font-semibold">
                  <Clock className="w-6 h-6 animate-spin" />
                  <span>กำลังประมวลผลใบเสร็จ...</span>
                </div>
                <div className="text-gray-600 text-base font-medium max-w-md">
                  ขั้นตอนนี้อาจใช้เวลาประมาณ 1-3 นาที
                  <br />
                  ระบบกำลังทำงานเบื้องหลัง กรุณาอย่าปิดหน้านี้
                </div>
              </div>
            </div>
          )}

          {/* Error Section */}
          {uploaded && error && (
            <div className="w-full flex flex-col items-center gap-6 mt-4 text-center">
              <div className="w-16 h-16 flex items-center justify-center bg-red-100 rounded-full">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-red-700">
                  An Error Occurred
                </h2>
                <p className="text-gray-600 max-w-md">{error}</p>
              </div>
              <Button
                variant="destructive"
                size="lg"
                onClick={handleRetry} // ✨ onClick เรียกใช้ handleRetry ที่ถูกแก้ไขแล้ว
                className="text-base font-semibold w-36"
              >
                ลองอีกครั้ง
              </Button>
            </div>
          )}

          {/* Result Section */}
          {uploaded && showResult && !loadingOcr && !error && (
            <>
              <div className="flex flex-col items-center w-full gap-10 mt-4">
                {ocrResults && ocrResults.length > 0 ? (
                  ocrResults.map((ocrData, index) => (
                    <div key={ocrData.id || index} className="w-full">
                      <ReceiptResult
                        ocrData={ocrData}
                        receiptNumber={index + 1}
                        onImageClick={(url) =>
                          handleImagePreview(url, ocrData.id)
                        }
                      />
                      {index < ocrResults.length - 1 && (
                        <hr className="w-full my-8 border-t-2 border-gray-200" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-10">
                    ยังไม่มีผลลัพธ์ (นี่คือส่วนที่จะแสดงผลเมื่อ Polling
                    เสร็จสมบูรณ์)
                  </div>
                )}
              </div>

              <div className="w-full flex justify-center mt-12 border-t border-gray-200 pt-8">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleReset}
                  className="text-base font-semibold"
                >
                  อัปโหลดอีกครั้ง
                </Button>
              </div>
            </>
          )}
        </section>
      </main>
      {/* Image Modal */}
      {showImageModal && imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh] p-4">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-2 right-2 z-10 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors duration-200"
              aria-label="Close modal"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setScale(1);
                setDragOffset({ x: 0, y: 0 });
              }}
              className="absolute top-2 left-2 z-10 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors duration-200 text-white text-xs font-semibold"
              aria-label="Reset zoom"
            >
              Reset Zoom
            </button>
            <div
              style={{
                cursor: isDragging ? "grabbing" : "grab",
                overflow: "hidden",
                width: "80vw",
                height: "80vh",
                maxWidth: 900,
                maxHeight: 900,
                position: "relative",
                touchAction: "none", // ✨ ป้องกันการซูมของเบราว์เซอร์
              }}
              onMouseDown={(e) => {
                setIsDragging(true);
                setDragStart({
                  x: e.clientX - dragOffset.x,
                  y: e.clientY - dragOffset.y,
                });
              }}
              onMouseMove={(e) => {
                if (isDragging && dragStart) {
                  setDragOffset({
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y,
                  });
                }
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onTouchStart={(e) => {
                // Pan (1 finger)
                if (e.touches.length === 1) {
                  setIsDragging(true);
                  const touch = e.touches[0];
                  setDragStart({
                    x: touch.clientX - dragOffset.x,
                    y: touch.clientY - dragOffset.y,
                  });
                }
                // Pinch (2 fingers)
                if (e.touches.length === 2) {
                  e.preventDefault(); // Prevent default browser actions like page zoom
                  const dx = e.touches[0].clientX - e.touches[1].clientX;
                  const dy = e.touches[0].clientY - e.touches[1].clientY;
                  initialPinchState.current = {
                    distance: Math.sqrt(dx * dx + dy * dy),
                    scale: scale,
                  };
                }
              }}
              onTouchMove={(e) => {
                // Pan (1 finger)
                if (isDragging && dragStart && e.touches.length === 1) {
                  const touch = e.touches[0];
                  setDragOffset({
                    x: touch.clientX - dragStart.x,
                    y: touch.clientY - dragStart.y,
                  });
                }
                // Pinch (2 fingers)
                if (e.touches.length === 2 && initialPinchState.current) {
                  e.preventDefault();
                  const dx = e.touches[0].clientX - e.touches[1].clientX;
                  const dy = e.touches[0].clientY - e.touches[1].clientY;
                  const newDistance = Math.sqrt(dx * dx + dy * dy);
                  const newScale =
                    initialPinchState.current.scale *
                    (newDistance / initialPinchState.current.distance);
                  setScale(Math.max(1, Math.min(newScale, 5)));
                }
              }}
              onTouchEnd={() => {
                setIsDragging(false);
                initialPinchState.current = null; // Reset pinch state
              }}
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => {
                e.stopPropagation(); // ใช้ onWheel และ stopPropagation เพื่อให้ทำงานได้ดีขึ้น
                let newScale = scale + (e.deltaY < 0 ? 0.1 : -0.1);
                newScale = Math.max(1, Math.min(newScale, 5));
                setScale(Number(newScale.toFixed(2)));
              }}
              tabIndex={0}
            >
              <img
                src={imageUrl}
                alt="Receipt full size"
                className="max-w-none max-h-none object-contain rounded-lg shadow-2xl select-none"
                style={{
                  transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(${scale})`,
                  userSelect: "none",
                  pointerEvents: "auto",
                  width: "100%",
                  height: "100%",
                  transition: isDragging ? "none" : "transform 0.2s",
                }}
                draggable={false}
              />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs rounded px-2 py-1 select-none pointer-events-none">
                Zoom: {Math.round(scale * 100)}%
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Decorative background pattern */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-30 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-green-200 via-white to-blue-200" />
      {/* Footer */}
      <footer className="w-full py-6 text-gray-400 text-xs text-center bg-transparent select-none z-20 relative">
        Demo Company &copy; 2025. All rights reserved.
      </footer>
    </div>
  );
};

export default Main;
