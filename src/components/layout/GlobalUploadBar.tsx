
"use client";

import { useUpload } from "@/context/UploadContext";
import { cn } from "@/lib/utils";

export function GlobalUploadBar() {
  const { isUploading, progress } = useUpload();

  if (!isUploading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2px] bg-zinc-900 overflow-hidden">
      {/* الخط الأساسي */}
      <div 
        className="h-full bg-primary transition-all duration-500 ease-out relative shadow-[0_0_8px_#1E6FC9]"
        style={{ width: `${progress}%` }}
      >
        {/* وميض الفلاش (النبض السيادي) */}
        <div className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-upload-flash" />
      </div>
      
      {/* ستايل الأنيميشن */}
      <style jsx global>{`
        @keyframes upload-flash {
          0% { left: -150px; }
          100% { left: 100%; }
        }
        .animate-upload-flash {
          animation: upload-flash 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
}
