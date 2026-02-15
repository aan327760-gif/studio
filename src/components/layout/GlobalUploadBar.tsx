
"use client";

import { useUpload } from "@/context/UploadContext";
import { cn } from "@/lib/utils";

/**
 * شريط النبض السيادي (Sovereign Pulse) - نسخة النخبة
 * خط رقيق جداً (بسمك الشعرة) مع وميض فلاش سينمائي.
 */
export function GlobalUploadBar() {
  const { isUploading, progress } = useUpload();

  if (!isUploading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2.5px] bg-black/20 overflow-hidden">
      {/* الشعرة المضيئة */}
      <div 
        className="h-full bg-primary transition-all duration-700 ease-out relative shadow-[0_0_10px_#1E6FC9]"
        style={{ width: `${progress}%` }}
      >
        {/* وميض الفلاش الماسي (The Diamond Flash) */}
        <div className="absolute top-0 bottom-0 w-40 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-sovereign-flash" />
      </div>
      
      <style jsx global>{`
        @keyframes sovereign-flash {
          0% { transform: translateX(-150%); opacity: 0.3; }
          50% { opacity: 1; }
          100% { transform: translateX(400%); opacity: 0.3; }
        }
        .animate-sovereign-flash {
          animation: sovereign-flash 2s infinite cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
        }
      `}</style>
    </div>
  );
}
