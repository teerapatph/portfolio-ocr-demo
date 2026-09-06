import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      // [แก้ไขส่วนนี้] เพิ่ม toastOptions เพื่อกำหนดสี
      toastOptions={{
        classNames: {
          // 1. Toast ปกติ (Default)
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",

          // 2. สีของ Description (ข้อความรอง)
          description: "group-[.toast]:!text-zinc-700 font-medium",

          // 3. ปุ่ม Action (เช่น Undo) ให้เป็นสีเขียว
          actionButton:
            "group-[.toast]:bg-green-600 group-[.toast]:text-white hover:group-[.toast]:bg-green-700",

          // 4. ปุ่ม Cancel
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",

          // --- [ส่วนสำคัญ] กำหนดสีตามประเภท ---

          // Success: พื้นหลังเขียวอ่อน, ขอบเขียว, ตัวหนังสือเขียวเข้ม
          success:
            "group-[.toaster]:bg-green-50 group-[.toaster]:border-green-200 group-[.toaster]:text-green-900",

          // Error: พื้นหลังแดงอ่อน (แนะนำให้ Error เป็นสีแดงเพื่อให้ User ตกใจ/สังเกตเห็น)
          error:
            "group-[.toaster]:bg-red-50 group-[.toaster]:border-red-200 group-[.toaster]:text-red-900",

          // Warning: สีส้ม/เหลือง
          warning:
            "group-[.toaster]:bg-yellow-50 group-[.toaster]:border-yellow-200 group-[.toaster]:text-yellow-900",

          // Info: สีฟ้า
          info: "group-[.toaster]:bg-blue-50 group-[.toaster]:border-blue-200 group-[.toaster]:text-blue-900",
        },
      }}
      // กำหนดสี Icon ให้ตรงกับ Theme
      icons={{
        success: <CircleCheckIcon className="size-4 text-green-600" />, // ไอคอนสีเขียว
        info: <InfoIcon className="size-4 text-blue-600" />,
        warning: <TriangleAlertIcon className="size-4 text-yellow-600" />,
        error: <OctagonXIcon className="size-4 text-red-600" />,
        loading: (
          <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
