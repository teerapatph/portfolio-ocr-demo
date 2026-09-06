import React, { useRef, useState, useCallback, useEffect } from "react";
import { uploadToS3 } from "@/lib/api/s3-upload";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileUp, X, GripVertical, Check, Camera, UploadCloud, SwitchCamera, Circle, Plus } from "lucide-react";
import Zoom from 'react-medium-image-zoom'; // 👈 Import Component
import 'react-medium-image-zoom/dist/styles.css'; // 👈 สำคัญมาก: Import CSS ด้วย
import { createPortal } from "react-dom";
import { v4 as uuidv4 } from "uuid";


// ✨ Import สิ่งที่จำเป็นจาก dnd-kit
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";


interface FileWithPreview {
  id: string; // ID เฉพาะสำหรับใช้เป็น key ใน list
  file: File;
  previewUrl: string;
  dataUrl?: string; // ✨ 1. เพิ่ม property สำหรับเก็บ Data URL (optional)
  isProcessing: boolean;
  status: "pending" | "uploading" | "success" | "error";
  errorMessage?: string;
  fileKey?: string;
}

interface ImageUploadProps {
  onUpload: (groups: UploadedGroup[]) => void | Promise<void>;
}
interface UploadedGroup {
  groupName: string;
  fileKeys: string[];
}

interface ReceiptGroup {
  id: string;
  name: string;
  files: FileWithPreview[];
}

// ✨ สร้าง Component ย่อยสำหรับ Item ที่ลากได้ (ย้ายมาอยู่นอก Component หลัก)
const SortableItem = ({ file, onRemove, index, onPreview }: { file: FileWithPreview, onRemove: () => void, index: number, onPreview: (url: string) => void }) => {
  const { // This should be file: FileWithPreview
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`relative aspect-square shadow-sm touch-none bg-gray-100 rounded-lg overflow-hidden transition-opacity ${isDragging ? 'opacity-30' : 'opacity-100'}`}
      onClick={() => onPreview(file.previewUrl)}
    >
      {/* --- ตัวเลขกำกับลำดับ --- */}
      <div className="absolute top-1 left-1 z-20 w-6 h-6 bg-green-600 text-white flex items-center justify-center rounded-full text-xs font-bold shadow-md select-none">
        {index + 1}
      </div>

      {/* --- ไอคอนสำหรับลาก (Grip) --- */}
      <div {...listeners} className="absolute bottom-1 left-1 z-20 p-1 bg-white/70 rounded-md cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5 text-gray-600" />
      </div>

      <img
        src={file.previewUrl}
        alt={file.file.name}
        className="w-full h-full object-cover rounded-md"
      />

      {/* --- ปุ่มลบ (เพิ่ม z-10) --- */}
      <button
        type="button"
        className="absolute top-1 right-1 bg-white/80 rounded-full p-0.5 z-10 hover:bg-red-100"
        onClick={(e) => {
          e.stopPropagation(); // 👈 สำคัญ: ป้องกันไม่ให้ Modal เปิดตอนกดลบ
          onRemove();
        }}
        aria-label="Remove image"
      >
        <X className="w-5 h-5 text-red-500" />
      </button>

      {/* ... Overlay สถานะ ... */}
      {file.isProcessing && <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg pointer-events-none"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin"></div><span className="text-xs text-gray-600 ml-2">Processing...</span></div>}
      {file.status === "uploading" && <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg pointer-events-none"><div className="w-8 h-8 border-2 border-green-200 border-t-green-600 rounded-full animate-spin"></div></div>}
      {file.status === "success" && <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center rounded-lg pointer-events-none"><div className="bg-green-600 rounded-full p-1"><Check color="white" /></div></div>}
      {file.status === "error" && <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center text-white text-xs font-bold p-1 text-center rounded-lg pointer-events-none">Upload Failed</div>}
    </div>
  );
};

const ImageUpload: React.FC<ImageUploadProps> = ({ onUpload }) => {
  //รวบ State
  const [receiptGroups, setReceiptGroups] = useState<ReceiptGroup[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [targetGroupId, setTargetGroupId] = useState<string | null>(null);

  //Image Modal
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrlForModal, setImageUrlForModal] = useState<string | null>(null);
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [scale, setScale] = useState(1);
  const initialPinchState = useRef<{ distance: number, scale: number } | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);

  useEffect(() => {
    return () => {
      receiptGroups.forEach(group => group.files.forEach(file => URL.revokeObjectURL(file.previewUrl)));
    };
  }, [receiptGroups]);
  
  // 👇 วาง useEffect block ทั้งหมดนี้ไว้ที่นี่
  useEffect(() => {
    const htmlElement = document.documentElement;
    
    // เมื่อ modal เปิด
    if (showImageModal) {
      document.body.classList.add('modal-open');
      htmlElement.classList.add('modal-open');
    } else {
      // เมื่อ modal ปิด
      document.body.classList.remove('modal-open');
      htmlElement.classList.remove('modal-open');
    }

    // Cleanup function
    return () => {
      document.body.classList.remove('modal-open');
      htmlElement.classList.remove('modal-open');
    };
  }, [showImageModal]);

  // ✨ เพิ่ม useEffect สำหรับ CameraModal เพื่อป้องกันการ scroll ✨
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isCameraOpen) {
      document.body.classList.add('modal-open');
      htmlElement.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
      htmlElement.classList.remove('modal-open');
    }

    // Cleanup function
    return () => {
      document.body.classList.remove('modal-open');
      htmlElement.classList.remove('modal-open');
    };
  }, [isCameraOpen]);

  // --- Logic ทั้งหมด (ย้าย handleDragEnd มาไว้ที่นี่) ---
  const handleDragEnd = (event: DragEndEvent, groupId: string) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setReceiptGroups((groups) => {
        const groupIndex = groups.findIndex(g => g.id === groupId);
        if (groupIndex === -1) return groups;

        const group = groups[groupIndex];
        const oldIndex = group.files.findIndex((file) => file.id === active.id);
        const newIndex = group.files.findIndex((file) => file.id === over.id);

        const reorderedFiles = arrayMove(group.files, oldIndex, newIndex);

        const newGroups = [...groups];
        newGroups[groupIndex] = { ...group, files: reorderedFiles };
        return newGroups;
      });
    }
  };

  const handleFiles = (incomingFiles: File[]) => {
    // ✨ 2. ปรับปรุง handleFiles ให้สร้าง Data URL ด้วย
    const newFileWrappers: FileWithPreview[] = [];

    incomingFiles.forEach(file => {
      const fileWrapper: FileWithPreview = {
        id: uuidv4(),
        file: file,
        previewUrl: URL.createObjectURL(file), // ใช้สำหรับ thumbnail เพื่อประสิทธิภาพ
        isProcessing: true,
        status: "pending",
      };
      newFileWrappers.push(fileWrapper);

      // สร้าง Data URL สำหรับ Modal โดยเฉพาะ
      const reader = new FileReader();
      reader.onload = (event) => {
        fileWrapper.dataUrl = event.target?.result as string;
        fileWrapper.isProcessing = false;
        // อัปเดต state ของ component เพื่อให้ UI re-render และเอา overlay ออก
        setReceiptGroups(currentGroups =>
          currentGroups.map(group => ({
            ...group,
            files: group.files.map(f =>
              f.id === fileWrapper.id ? { ...f, dataUrl: fileWrapper.dataUrl, isProcessing: false } : f
            )
          }))
        );
      };
      reader.onerror = () => {
        fileWrapper.isProcessing = false;
      };
      reader.readAsDataURL(file);
    });

    setReceiptGroups((currentGroups) => {
      // ✨ ตรวจสอบว่ามี target group ที่จะเพิ่มไฟล์เข้าไปหรือไม่
      if (targetGroupId) {
        // --- Logic สำหรับเพิ่มไฟล์ในกลุ่มเดิม ---
        return currentGroups.map(group => {
          if (group.id === targetGroupId) {
            return { ...group, files: [...group.files, ...newFileWrappers] };
          }
          return group;
        });
      } else {
        // --- Logic สำหรับสร้างกลุ่มใหม่ (เหมือนเดิม) ---
        const newGroupName = `ใบเสร็จที่ ${currentGroups.length + 1}`;
        const newGroup: ReceiptGroup = {
          id: uuidv4(), // ✨ เพิ่ม id
          name: newGroupName,           // ✨ เพิ่ม name
          files: newFileWrappers
        };
        return [...currentGroups, newGroup];
      }
    });

    newFileWrappers.forEach(uploadFile);
  };
  // ✨ เพิ่มฟังก์ชันสำหรับเปิด Modal
  const handlePreviewClick = (file: FileWithPreview) => {
    if (file.isProcessing || !file.dataUrl) {
      console.warn("Preview is not ready yet.");
      return;
    }

    setImageUrlForModal(file.dataUrl || file.previewUrl);
    setShowImageModal(true);
    // Reset pan/zoom state
    setScale(1);
    setDragOffset({ x: 0, y: 0 });
  };

  // ฟังก์ชัน uploadFile ต้องแก้ไขเล็กน้อยเพื่ออัปเดต State ที่ซ้อนกัน
  const uploadFile = async (fileWrapper: FileWithPreview) => {
    const updateStatus = (
      status: FileWithPreview["status"],
      extra: Partial<FileWithPreview> = {}
    ) => {
      setReceiptGroups((groups) =>
        groups.map((g) => ({
          ...g,
          files: g.files.map((f) =>
            f.id === fileWrapper.id ? { ...f, status, ...extra } : f
          ),
        }))
      );
    };

    updateStatus("uploading");
    try {
      const fileKey = await uploadToS3(fileWrapper.file);
      updateStatus("success", { fileKey });
    } catch (err) {
      updateStatus("error", { errorMessage: "Upload failed" });
    }
  };

  // // 🔄 แก้ไข handleFileChange และ handleDrop ให้เรียกใช้ handleFiles
  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const files = e.target.files;
  //   if (files) {
  //     handleFiles(Array.from(files));
  //   }
  // };
  // เราต้องเรียกใช้ handleFiles จาก handleFileChange
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(Array.from(files));
    }
    // Reset input เพื่อให้เลือกไฟล์เดิมซ้ำได้
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files) {
      handleFiles(Array.from(files));
    }
  };

  // old section code //

  // const handleFile = async (file: File) => {
  //   setError(null);
  //   setLoading(true);
  //   // Preview
  //   const reader = new FileReader();
  //   reader.onload = (event) => {
  //     setPreview(event.target?.result as string);
  //   };
  //   reader.readAsDataURL(file);
  //   try {
  //     // Upload to S3
  //     const fileKey = await uploadToS3(file);
  //     setTimeout(() => setLoading(false), 500);
  //     onUpload(file, URL.createObjectURL(file), fileKey);
  //   } catch (err) {
  //     setLoading(false);
  //     setError(
  //       "Upload failed: " +
  //         (err instanceof Error ? err.message : "Unknown error")
  //     );
  //   }
  // };

  // const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     await handleFile(file);
  //   }
  // };

  // const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
  //   e.preventDefault();
  //   setDragActive(false);
  //   const file = e.dataTransfer.files?.[0];
  //   if (file) {
  //     await handleFile(file);
  //   }
  // };

  // old section code //

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  // const handleReset = () => {
  //   setPreview(null);
  //   setLoading(false);
  //   setError(null);
  //   if (inputRef.current) inputRef.current.value = "";
  // };
  // 🔄 แก้ไขฟังก์ชันนี้เพื่อรับ id ของไฟล์ที่ต้องการลบ
  // const handleRemoveFile = (idToRemove: string) => {
  //   setFiles((prevFiles) => prevFiles.filter((file) => file.id !== idToRemove));
  // };

  const handleRemoveFile = (groupId: string, fileId: string) => {
    setReceiptGroups((currentGroups) => {
      // ขั้นตอนที่ 1: สร้าง Array ใหม่พร้อมกับลบไฟล์ที่ต้องการออก
      const updatedGroups = currentGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            files: group.files.filter((file) => file.id !== fileId),
          };
        }
        return group;
      });

      // ขั้นตอนที่ 2: กรองกลุ่มที่ไม่มีไฟล์เหลืออยู่ออกไป
      return updatedGroups.filter((group) => group.files.length > 0);
    });
  };
  const handleRemoveGroup = (groupIdToRemove: string) => {
    setReceiptGroups((currentGroups) =>
      currentGroups.filter((group) => group.id !== groupIdToRemove)
    );
  };

  // Component ใหม่สำหรับ Camera Modal
  const CameraModal = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const cropFrameRef = useRef<HTMLDivElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [frameMode, setFrameMode] = useState<'portrait' | 'landscape'>('portrait');

    useEffect(() => {
      let activeStream: MediaStream | null = null;
      const openCamera = async () => {
        try {
          // Use portrait as default, landscape if toggled
          const constraints = {
            video: {
              facingMode: facingMode,
              width: { ideal: 4096 },
              height: { ideal: frameMode === 'portrait' ? 2160 : 1440 },
              aspectRatio: { ideal: frameMode === 'portrait' ? 9 / 16 : 16 / 9 },
            },
          };
          const newStream = await navigator.mediaDevices.getUserMedia(constraints);
          if (videoRef.current) {
            videoRef.current.srcObject = newStream;
          }
          activeStream = newStream;
          setStream(newStream);
        } catch (err) {
          if (err instanceof Error) {
            console.error(`Error accessing camera: [${err.name}] ${err.message}`);
          } else {
            console.error("An unknown error occurred while accessing the camera:", err);
          }
          alert("ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบการอนุญาตในเบราว์เซอร์ของคุณ");
          setIsCameraOpen(false);
        }
      };

      openCamera();

      return () => {
        if (activeStream) {
          activeStream.getTracks().forEach(track => track.stop());
        }
      };
    }, [facingMode, frameMode]);

    const handleCapture = () => {
      if (videoRef.current && canvasRef.current && cropFrameRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const cropFrame = cropFrameRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Native video size
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        // Displayed video size (container)
        const videoRect = video.getBoundingClientRect();
        // Crop frame on screen
        const frameRect = cropFrame.getBoundingClientRect();

        // --- Calculate visible area of video (object-fit: cover) ---
        const videoAspect = videoWidth / videoHeight;
        const containerAspect = videoRect.width / videoRect.height;
        let visibleWidth, visibleHeight, offsetX, offsetY;
        if (videoAspect > containerAspect) {
          // Video is wider than container: height fits, width overflows
          visibleHeight = videoRect.height;
          visibleWidth = videoRect.height * videoAspect;
          offsetX = (videoRect.width - visibleWidth) / 2;
          offsetY = 0;
        } else {
          // Video is taller than container: width fits, height overflows
          visibleWidth = videoRect.width;
          visibleHeight = videoRect.width / videoAspect;
          offsetX = 0;
          offsetY = (videoRect.height - visibleHeight) / 2;
        }

        // Map cropFrame to visible video area
        const cropLeft = frameRect.left - (videoRect.left + offsetX);
        const cropTop = frameRect.top - (videoRect.top + offsetY);
        const cropW = frameRect.width;
        const cropH = frameRect.height;

        // Calculate relative position in visible video area
        const relX = cropLeft / visibleWidth;
        const relY = cropTop / visibleHeight;
        const relW = cropW / visibleWidth;
        const relH = cropH / visibleHeight;

        // Map to native video resolution
        const cropX = relX * videoWidth;
        const cropY = relY * videoHeight;
        const cropWidth = relW * videoWidth;
        const cropHeight = relH * videoHeight;

        // Set canvas size
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        context.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

        canvas.toBlob((blob) => {
          if (blob) {
            const fileName = `capture-${new Date().toISOString()}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            handleFiles([file]);
            setIsCameraOpen(false); // ปิด Modal หลังถ่ายภาพ
          }
        }, 'image/jpeg', 1.0);
      }
    };

    const toggleCamera = () => {
      setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    };

    // Toggle between portrait and landscape frame
    const toggleFrameMode = () => {
      setFrameMode(prev => (prev === 'portrait' ? 'landscape' : 'portrait'));
    };

    // Frame CSS based on mode
    const frameClass = frameMode === 'portrait'
      ? 'w-[40vw] min-w-[200px] max-w-xs h-[500px]' // Narrower but keeps aspect ratio
      : 'w-[85vw] max-w-2xl aspect-[16/9]'; // Landscape stays the same
    const frameLabel = frameMode === 'portrait' ? 'กรอบแนวตั้ง (Portrait)' : 'กรอบแนวนอน (Landscape)';

    return createPortal(
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <Button variant="ghost" size="icon" onClick={toggleFrameMode} title="สลับกรอบแนวตั้ง/แนวนอน">
            {frameMode === 'portrait' ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-white"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 6v12"/><path d="M16 6v12"/></svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-white"><rect x="6" y="3" width="12" height="18" rx="2"/><path d="M6 8h12"/><path d="M6 16h12"/></svg>
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsCameraOpen(false)}>
            <X className="w-8 h-8 text-white" />
          </Button>
        </div>

        <div className="relative w-full h-full flex items-center justify-center">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />

          {/* --- กรอบสี่เหลี่ยม --- */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-20">
            <div
              ref={cropFrameRef}
              className={`${frameClass} border-4 border-dashed border-white/80 rounded-2xl shadow-2xl bg-black/10 relative`}
            >
              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white font-semibold bg-black/50 px-3 py-1 rounded-md text-center w-max">
                {frameLabel}<br />จัดใบเสร็จให้อยู่ในกรอบ
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-6">
            {/* ปุ่มสลับกล้อง */}
            <Button variant="outline" size="icon" className="rounded-full w-12 h-12 bg-white/20 border-white/30 hover:bg-white/30" onClick={toggleCamera}>
              <SwitchCamera className="w-6 h-6 text-white" />
            </Button>

            {/* ปุ่มถ่ายภาพ */}
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-16 h-16 p-1 bg-transparent border-4 border-white hover:bg-white/20"
              onClick={handleCapture}
            >
              <Circle className="w-full h-full text-white fill-current" />
            </Button>

            {/* Placeholder เพื่อให้ปุ่มถ่ายภาพอยู่ตรงกลาง */}
            <div className="w-12 h-12" />
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>,
      document.body
    );
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* --- ส่วน Input ที่ซ่อนไว้ --- */}
      <input
        type="file"
        multiple
        className="hidden"
        ref={inputRef}
        onChange={handleFileChange}
        aria-label="Select image file"
      />

      {/* --- 1. แสดงเมื่อยังไม่มีกลุ่ม (Dropzone เริ่มต้น) --- */}
      {receiptGroups.length === 0 && (
        <div
          className={`w-full max-w-lg flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-colors duration-200 bg-white/80 ${dragActive ? "border-green-600 bg-green-50/80" : "border-green-200"}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="text-center mb-6">
            <FileUp className="w-12 h-12 text-green-400 mb-2 mx-auto" />
            <span className="text-green-700 font-semibold text-lg">
              {dragActive ? "วางไฟล์ที่นี่..." : "เริ่มต้นใช้งาน"}
            </span>
            <span className="block text-gray-500 text-sm mt-1">
              ลากไฟล์มาวาง หรือเลือกวิธีอัปโหลดด้านล่าง
            </span>
          </div>
          <div className="w-full flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="flex-1 py-6 text-base" onClick={() => inputRef.current?.click()}>
              <UploadCloud className="w-5 h-5 mr-2" />
              อัปโหลดไฟล์
            </Button>
            <Button size="lg" variant="outline" className="flex-1 py-6 text-base" onClick={() => setIsCameraOpen(true)}>
              <Camera className="w-5 h-5 mr-2" />
              ถ่ายภาพด้วยกล้อง
            </Button>
          </div>
        </div>
      )}
      {isCameraOpen && <CameraModal />}

      {/* --- 2. Staging Area แบบมีกลุ่ม (แสดงเมื่อมีไฟล์แล้ว) --- */}
      {receiptGroups.length > 0 && (
        <div className="w-full max-w-4xl mt-4 space-y-6">
          {/* --- วน Loop สร้างการ์ดสำหรับแต่ละกลุ่ม --- */}
          {receiptGroups.map((group, groupIndex) => (
            <DndContext
              key={group.id}
              collisionDetection={closestCenter}
              onDragEnd={(event) => handleDragEnd(event, group.id)} // 👈 ส่ง group.id ไปด้วย
            >
              <div
                key={group.id}
                className="p-4 border rounded-xl bg-white shadow-md"
              >
                <div className="flex flex-wrap justify-between items-center mb-4">
                  <input
                    type="text"
                    value={group.name}
                    // onChange={(e) => handleGroupNameChange(group.id, e.target.value)} // Optional: ทำให้ชื่อกลุ่มแก้ไขได้
                    className="text-xl font-bold text-gray-800 bg-transparent border-none focus:ring-0"
                    readOnly
                  />
                  {/* Optional: ปุ่มลบกลุ่ม (ถ้าไม่ใช่กลุ่มสุดท้าย) */}
                  {receiptGroups.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleRemoveGroup(group.id);
                      }}
                    >
                      ลบกลุ่มนี้
                    </Button>
                  )}
                </div>

                {/* --- ตารางแสดงรูปภาพในกลุ่มนี้ --- */}
                <SortableContext items={group.files} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {/* ✨ นี่คือ Loop ที่ถูกต้องและสะอาด ✨ */}
                    {group.files.map((fileWrapper, index) => (
                      <SortableItem
                        key={fileWrapper.id}
                        file={fileWrapper}
                        onRemove={() => handleRemoveFile(group.id, fileWrapper.id)}
                        index={index}
                        onPreview={() => handlePreviewClick(fileWrapper)}
                      />
                    ))}
                    {/* ✨ ปุ่ม "เพิ่ม" แบบใหม่พร้อมเมนูย่อย ✨ */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-500 hover:text-blue-600 transition-colors"
                        >
                          <Plus className="w-8 h-8" />
                          <span className="text-xs font-semibold mt-2">เพิ่ม</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => {
                          setTargetGroupId(group.id);
                          inputRef.current?.click();
                        }}>
                          <UploadCloud className="mr-2 h-4 w-4" />
                          <span>อัปโหลดไฟล์</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setTargetGroupId(group.id);
                          setIsCameraOpen(true);
                        }}>
                          <Camera className="mr-2 h-4 w-4" />
                          <span>ถ่ายภาพด้วยกล้อง</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </SortableContext>
              </div>
            </DndContext>
          ))
          }

          {/* --- ปุ่มควบคุมหลัก --- */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            {/* ✨ เปลี่ยนปุ่ม "เพิ่มใบเสร็จใหม่" ให้เป็น DropdownMenu ✨ */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  className="flex-1"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" /> เพิ่มใบเสร็จใหม่
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => {
                  setTargetGroupId(null); // บอกว่ากำลังจะสร้างกลุ่มใหม่
                  inputRef.current?.click();
                }}>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  <span>อัปโหลดไฟล์</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setTargetGroupId(null); // บอกว่ากำลังจะสร้างกลุ่มใหม่
                  setIsCameraOpen(true);
                }}>
                  <Camera className="mr-2 h-4 w-4" />
                  <span>ถ่ายภาพด้วยกล้อง</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              type="button"
              className="flex-1"
              onClick={() => {

                const successfulGroups: UploadedGroup[] = receiptGroups
                  .map((group) => ({
                    groupName: group.name,
                    fileKeys: group.files
                      .filter((f) => f.status === "success" && f.fileKey)
                      .map((f) => f.fileKey as string),
                  }))
                  .filter((g) => g.fileKeys.length > 0);


                
                onUpload(successfulGroups);
              }}
              disabled={receiptGroups
                .flatMap((g) => g.files)
                .some(
                  (f) => f.status === "uploading" || f.status === "pending"
                )}
            >
              ยืนยันและดำเนินการต่อ
            </Button>
          </div>
        </div >
      )}
      {/* Image Modal  */}
      {showImageModal && imageUrlForModal && (
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowImageModal(false)}>
            <div className="relative max-w-[90vw] max-h-[90vh] p-4">
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-2 right-2 z-10 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors duration-200"
                aria-label="Close modal"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setScale(1); setDragOffset({ x: 0, y: 0 }); }}
                className="absolute top-2 left-2 z-10 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors duration-200 text-white text-xs font-semibold"
                aria-label="Reset zoom"
              >
                Reset Zoom
              </button>
              <div
                style={{
                  cursor: isDraggingModal ? 'grabbing' : 'grab',
                  overflow: 'hidden',
                  width: '80vw',
                  height: '80vh',
                  maxWidth: 900,
                  maxHeight: 900,
                  position: 'relative',
                  touchAction: 'none', // ✨ ป้องกันการซูมของเบราว์เซอร์
                }}
                onMouseDown={(e) => {
                  setIsDraggingModal(true);
                  setDragStart({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
                }}
                onMouseMove={(e) => {
                  if (isDraggingModal && dragStart) {
                    setDragOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
                  }
                }}
                onMouseUp={() => setIsDraggingModal(false)}
                onMouseLeave={() => setIsDraggingModal(false)}
                onTouchStart={(e) => {
                  // Pan (1 finger)
                  if (e.touches.length === 1) {
                    setIsDraggingModal(true);
                    const touch = e.touches[0];
                    setDragStart({ x: touch.clientX - dragOffset.x, y: touch.clientY - dragOffset.y });
                  }
                  // Pinch (2 fingers)
                  if (e.touches.length === 2) {
                    e.preventDefault(); // Prevent default browser actions like page zoom
                    const dx = e.touches[0].clientX - e.touches[1].clientX;
                    const dy = e.touches[0].clientY - e.touches[1].clientY;
                    initialPinchState.current = {
                      distance: Math.sqrt(dx * dx + dy * dy),
                      scale: scale
                    };
                  }
                }}
                onTouchMove={(e) => {
                  // Pan (1 finger)
                  if (isDraggingModal && dragStart && e.touches.length === 1) {
                    const touch = e.touches[0];
                    setDragOffset({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y });
                  }
                  // Pinch (2 fingers)
                  if (e.touches.length === 2 && initialPinchState.current) {
                    e.preventDefault();
                    const dx = e.touches[0].clientX - e.touches[1].clientX;
                    const dy = e.touches[0].clientY - e.touches[1].clientY;
                    const newDistance = Math.sqrt(dx * dx + dy * dy);
                    const newScale = initialPinchState.current.scale * (newDistance / initialPinchState.current.distance);
                    setScale(Math.max(1, Math.min(newScale, 5)));
                  }
                }}
                onTouchEnd={() => {
                  setIsDraggingModal(false);
                  initialPinchState.current = null; // Reset pinch state
                }}
                onClick={e => e.stopPropagation()}
                onWheel={(e) => {
                  e.stopPropagation(); // ใช้ onWheel และ stopPropagation เพื่อให้ทำงานได้ดีขึ้น
                  let newScale = scale + (e.deltaY < 0 ? 0.1 : -0.1);
                  newScale = Math.max(1, Math.min(newScale, 5));
                  setScale(Number(newScale.toFixed(2)));
                }}
                tabIndex={0}
              >
                <img
                  src={imageUrlForModal}
                  alt="Receipt full size"
                  className="max-w-none max-h-none object-contain rounded-lg select-none"
                  style={{
                    transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(${scale})`,
                    userSelect: 'none',
                    pointerEvents: 'auto',
                    width: '100%',
                    height: '100%',
                    transition: isDraggingModal ? 'none' : 'transform 0.2s',
                  }}
                  draggable={false}
                />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs rounded px-2 py-1 select-none pointer-events-none">
                  Zoom: {Math.round(scale * 100)}%
                </div>
              </div>
            </div>
          </div>,
          document.body
        ))}
    </div >
  );
};

export default ImageUpload;
