
"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import { 
  ArrowLeft, 
  Smile, 
  Type, 
  Sparkles, 
  Music, 
  FastForward, 
  Layers, 
  Grid2X2,
  Check,
  X,
  Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TEXT_COLORS = [
  "text-white",
  "text-black",
  "text-primary",
  "text-red-500",
  "text-yellow-400",
  "text-green-500",
  "text-purple-500",
  "text-orange-500",
  "text-pink-500"
];

function FinalizeMediaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const imageUrl = searchParams.get("image");
  const videoUrl = searchParams.get("video");
  const filterClass = searchParams.get("filter") || "filter-none";

  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
  const [textOverlay, setTextOverlay] = useState("");
  const [textColor, setTextColor] = useState("text-white");
  const [textBg, setTextBg] = useState(false);
  
  const [finalText, setFinalText] = useState("");
  const [finalColor, setFinalColor] = useState("text-white");
  const [finalBg, setFinalBg] = useState(false);
  
  // Coordinates in percentage (0 to 100)
  const [textPos, setTextPos] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);

  const handleNext = () => {
    const params = new URLSearchParams();
    if (imageUrl) params.set("image", imageUrl);
    if (videoUrl) params.set("video", videoUrl);
    if (filterClass) params.set("filter", filterClass);
    if (finalText) {
      params.set("textOverlay", finalText);
      params.set("textColor", finalColor);
      params.set("textBg", finalBg.toString());
      params.set("textX", textPos.x.toString());
      params.set("textY", textPos.y.toString());
    }
    router.push(`/create-post?${params.toString()}`);
  };

  const handleUnderDev = (feature: string) => {
    toast({
      title: "قيد التطوير",
      description: `ميزة ${feature} ستتوفر قريباً في التحديث القادم.`,
    });
  };

  const applyText = () => {
    setFinalText(textOverlay);
    setFinalColor(textColor);
    setFinalBg(textBg);
    setIsTextDialogOpen(false);
  };

  // Dragging logic
  const onStartDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (finalText) {
      setIsDragging(true);
    }
  };

  const onDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    // Constrain to bounds
    setTextPos({
      x: Math.max(10, Math.min(90, x)),
      y: Math.max(10, Math.min(90, y))
    });
  };

  const onStopDrag = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className="flex flex-col h-screen bg-black text-white max-w-md mx-auto relative overflow-hidden select-none touch-none"
      ref={containerRef}
      onMouseMove={onDrag}
      onMouseUp={onStopDrag}
      onTouchMove={onDrag}
      onTouchEnd={onStopDrag}
    >
      {/* Background Media */}
      <div className="absolute inset-0 z-0">
        {imageUrl && (
          <img src={imageUrl} alt="Finalize" className={cn("w-full h-full object-cover", filterClass)} />
        )}
        {videoUrl && (
          <video 
            src={videoUrl} 
            className="w-full h-full object-cover" 
            autoPlay 
            muted 
            loop 
            playsInline
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
      </div>

      {/* Text Overlay Render - Draggable Area */}
      {finalText && (
        <div 
          className={cn(
            "absolute z-30 pointer-events-auto cursor-grab active:cursor-grabbing",
            isDragging && "scale-110 opacity-70"
          )}
          style={{ 
            left: `${textPos.x}%`, 
            top: `${textPos.y}%`, 
            transform: 'translate(-50%, -50%)',
            transition: isDragging ? 'none' : 'all 0.1s ease-out'
          }}
          onMouseDown={onStartDrag}
          onTouchStart={onStartDrag}
        >
          <span className={cn(
            "text-2xl font-black text-center px-4 py-2 rounded-xl break-words max-w-[80vw] whitespace-nowrap drop-shadow-2xl shadow-black",
            finalColor,
            finalBg ? "bg-black/60 backdrop-blur-md border border-white/10" : ""
          )}>
            {finalText}
          </span>
          {isDragging && (
            <div className="absolute -inset-2 border-2 border-white/30 border-dashed rounded-2xl" />
          )}
        </div>
      )}

      {/* Top Header */}
      <header className="relative z-10 p-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="rounded-full text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-7 w-7" />
        </Button>
      </header>

      {/* Left Sidebar Actions */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-4 gap-7">
        {[
          { icon: Type, label: "الكتابة", onClick: () => setIsTextDialogOpen(true), active: !!finalText },
          { icon: Layers, label: "الفلاتر", onClick: () => router.back(), active: filterClass !== "filter-none" },
          { icon: Smile, label: "ملصقات", onClick: () => handleUnderDev("الملصقات") },
          { icon: Sparkles, label: "تأثيرات", onClick: () => handleUnderDev("التأثيرات") },
          { icon: Music, label: "موسيقى", onClick: () => handleUnderDev("الموسيقى") },
        ].map((action) => (
          <div 
            key={action.label} 
            className="flex items-center gap-4 group cursor-pointer w-fit"
            onClick={action.onClick}
          >
            <div className={cn(
              "h-11 w-11 flex items-center justify-center rounded-2xl backdrop-blur-md transition-all shadow-xl border border-white/10",
              action.active ? "bg-primary border-primary scale-110" : "bg-black/30 group-hover:bg-black/50"
            )}>
              <action.icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white drop-shadow-lg">
                {action.label}
              </span>
              {action.active && <span className="text-[8px] text-primary font-black uppercase tracking-widest drop-shadow-md">نشط</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Text Hint */}
      {finalText && !isDragging && (
        <div className="relative z-10 w-full text-center pb-2 animate-pulse">
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
            اسحب النص لتحريكه
          </span>
        </div>
      )}

      {/* Bottom Right Next Button */}
      <div className="relative z-10 p-6 flex justify-end">
        <Button 
          onClick={handleNext}
          className="rounded-full bg-white text-black hover:bg-zinc-200 px-12 py-7 text-xl font-black shadow-2xl transition-transform active:scale-95"
        >
          {imageUrl || videoUrl ? "التالي" : "تخطي"}
        </Button>
      </div>

      {/* Text Tool Dialog */}
      <Dialog open={isTextDialogOpen} onOpenChange={setIsTextDialogOpen}>
        <DialogContent className="bg-zinc-950/95 backdrop-blur-2xl border-zinc-800 text-white max-w-[90%] rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-center font-black text-xl">أضف نصاً فوق الوسائط</DialogTitle>
          </DialogHeader>
          <div className="space-y-8 mt-6">
            <div className="relative">
              <Input 
                placeholder="اكتب شيئاً..." 
                value={textOverlay} 
                onChange={(e) => setTextOverlay(e.target.value)}
                className={cn(
                  "bg-zinc-900/50 border-none rounded-3xl h-16 text-center text-2xl font-black focus-visible:ring-2 focus-visible:ring-primary placeholder:opacity-30",
                  textColor
                )}
                autoFocus
              />
            </div>
            
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">الألوان</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "h-9 rounded-full px-4 text-[10px] font-black transition-all", 
                    textBg ? "bg-primary text-white" : "bg-zinc-900 text-zinc-500"
                  )}
                  onClick={() => setTextBg(!textBg)}
                >
                  خلفية النص
                </Button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "h-10 w-10 rounded-full border-4 shrink-0 transition-all active:scale-90 shadow-lg",
                      color.replace('text-', 'bg-'),
                      textColor === color ? "border-white scale-110" : "border-transparent opacity-80"
                    )}
                    onClick={() => setTextColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="ghost" className="flex-1 rounded-2xl font-bold h-14 text-zinc-400" onClick={() => setIsTextDialogOpen(false)}>
                إلغاء
              </Button>
              <Button className="flex-1 rounded-2xl font-black bg-primary hover:bg-primary/90 h-14 shadow-lg shadow-primary/20" onClick={applyText}>
                تطبيق
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function FinalizeMediaPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-white">Loading Editor...</div>}>
      <FinalizeMediaContent />
    </Suspense>
  );
}
