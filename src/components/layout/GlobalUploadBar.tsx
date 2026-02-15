
"use client";

import { useUpload } from "@/context/UploadContext";
import { cn } from "@/lib/utils";

/**
 * شريط النبض السيادي (Sovereign Pulse) - نسخة محسنة للأداء
 * يستخدم ترانسفورم بدلاً من فلاتر الرندرة الثقيلة.
 */
export function GlobalUploadBar() {
  const { isUploading, progress } = useUpload();

  if (!isUploading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2px] bg-black overflow-hidden">
      {/* الخط الأساسي */}
      <div 
        className="h-full bg-primary transition-all duration-500 ease-out relative"
        style={{ width: `${progress}%` }}
      >
        {/* وميض الفلاش (النبض السيادي) - أنيميشن بسيط وخفيف */}
        <div className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-upload-pulse" />
      </div>
      
      <style jsx global>{`
        @keyframes upload-pulse {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(400%); }
        }
        .animate-upload-pulse {
          animation: upload-pulse 1.5s infinite linear;
          will-change: transform;
        }
      `}</style>
    </div>
  );
}
