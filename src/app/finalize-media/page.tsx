
"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import { 
  ArrowLeft, 
  Smile, 
  Type, 
  Sparkles, 
  Music, 
  Layers, 
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

    // Calculate percentage based on current mouse/touch position
    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;

    // Strict constraints: Keep the text within 15% - 85% of the screen
    // This ensures the text handles don't go off-screen and remain draggable
    setTextPos({
      x: Math.max(15, Math.min(85, x)),
      y: Math.max(15, Math.min(85, y))
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
            transition: isDragging ? 'none' : 'all 0.1s cubic-bezier(0.2, 0, 0, 1)'
          }}
          onMouseDown={onStartDrag}
          onTouchStart={onStartDrag}
        >
          <span className={cn(
            "text-xl font-black text-center px-4 py-2 rounded-xl break-words max-w-[70vw] drop-shadow-2xl shadow-black",
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
      <div className="relative z-10 flex-1 flex flex-col justify-center px-4 gap-6">
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
              "h-10 w-10 flex items-center justify-center rounded-xl backdrop-blur-md transition-all shadow-xl border border-white/10",
              action.active ? "bg-primary border-primary scale-110" : "bg-black/30 group-hover:bg-black/50"
            )}>
              <action.icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white drop-shadow-lg">
                {action.label}
              </span>
              {action.active && <span className="text-[7px] text-primary font-black uppercase tracking-widest drop-shadow-md">نشط</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Right Next Button */}
      <div className="relative z-10 p-6 flex justify-end">
        <Button 
          onClick={handleNext}
          className="rounded-full bg-white text-black hover:bg-zinc-200 px-10 py-6 text-lg font-black shadow-2xl transition-transform active:scale-95"
        >
          {imageUrl || videoUrl ? "التالي" : "تخطي"}
        </Button>
      </div>

      {/* Text Tool Dialog - Improved for Mobile */}
      <Dialog open={isTextDialogOpen} onOpenChange={setIsTextDialogOpen}>
        <DialogContent className="bg-zinc-950/95 backdrop-blur-2xl border-zinc-800 text-white w-[92%] max-w-[400px] rounded-[2rem] p-6 focus:outline-none">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-center font-bold text-lg">أضف نصاً</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="relative">
              <Input 
                placeholder="اكتب شيئاً..." 
                value={textOverlay} 
                onChange={(e) => setTextOverlay(e.target.value)}
                className={cn(
                  "bg-zinc-900/50 border-none rounded-2xl h-14 text-center text-xl font-bold focus-visible:ring-1 focus-visible:ring-primary placeholder:opacity-20",
                  textColor
                )}
                autoFocus
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">الألوان</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "h-8 rounded-full px-3 text-[9px] font-black transition-all", 
                    textBg ? "bg-primary text-white" : "bg-zinc-900 text-zinc-500"
                  )}
                  onClick={() => setTextBg(!textBg)}
                >
                  خلفية النص
                </Button>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 shrink-0 transition-all active:scale-90",
                      color.replace('text-', 'bg-'),
                      textColor === color ? "border-white scale-110" : "border-transparent opacity-60"
                    )}
                    onClick={() => setTextColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1 rounded-xl font-bold h-12 text-zinc-500 hover:bg-zinc-900" onClick={() => setIsTextDialogOpen(false)}>
                إلغاء
              </Button>
              <Button className="flex-1 rounded-xl font-black bg-primary hover:bg-primary/90 h-12 shadow-lg shadow-primary/10" onClick={applyText}>
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
