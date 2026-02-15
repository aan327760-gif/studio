
"use client";

import { useUpload } from "@/context/UploadContext";
import { cn } from "@/lib/utils";

/**
 * شريط النبض السيادي (Sovereign Pulse)
 * خط رقيق بسمك الشعرة مع وميض فلاش يعكس حركة البيانات في الخلفية.
 */
export function GlobalUploadBar() {
  const { isUploading, progress } = useUpload();

  if (!isUploading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2px] bg-black overflow-hidden">
      {/* الخط الأساسي */}
      <div 
        className="h-full bg-primary transition-all duration-700 ease-out relative shadow-[0_0_10px_#1E6FC9]"
        style={{ width: `${progress}%` }}
      >
        {/* وميض الفلاش (النبض السيادي) */}
        <div className="absolute top-0 bottom-0 w-40 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-upload-pulse" />
      </div>
      
      <style jsx global>{`
        @keyframes upload-pulse {
          0% { left: -200px; opacity: 0; }
          50% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        .animate-upload-pulse {
          animation: upload-pulse 1.2s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}
