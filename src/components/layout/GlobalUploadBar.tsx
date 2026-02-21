
"use client";

import { useUpload } from "@/context/UploadContext";
import { cn } from "@/lib/utils";

/**
 * شريط النبض السيادي (Sovereign Pulse)
 * خط رقيق جداً (كالشعرة) مع وميض البرق السينمائي.
 */
export function GlobalUploadBar() {
  const { isUploading, progress } = useUpload();

  if (!isUploading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2.5px] bg-black/20 overflow-hidden pointer-events-none">
      <div 
        className="h-full bg-primary transition-all duration-700 ease-out relative shadow-[0_0_15px_#1E6FC9]"
        style={{ width: `${progress}%` }}
      >
        {/* وميض البرق الماسي */}
        <div className="absolute top-0 bottom-0 w-40 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-sovereign-lightning" />
      </div>
      
      <style jsx global>{`
        @keyframes sovereign-lightning {
          0% { transform: translateX(-150%); opacity: 0.5; }
          50% { opacity: 1; }
          100% { transform: translateX(400%); opacity: 0.5; }
        }
        .animate-sovereign-lightning {
          animation: sovereign-lightning 1.5s infinite cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
        }
      `}</style>
    </div>
  );
}
