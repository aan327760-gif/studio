"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import { 
  ArrowLeft, 
  Type, 
  Layers, 
  Flame,
  Zap,
  Sparkles,
  Diamond,
  Wind,
  Rainbow,
  Sun,
  Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const TEXT_COLORS = [
  "text-white", "text-black", "text-primary", "text-red-500", "text-yellow-400", 
  "text-green-500", "text-purple-500", "text-orange-500", "text-pink-500"
];

const TEXT_EFFECTS = [
  { id: "effect-flame", name: "لهب خفيف", icon: Flame },
  { id: "effect-lightning", name: "برق خلفي", icon: Zap },
  { id: "effect-sparkle", name: "بريق متحرك", icon: Sparkles },
  { id: "effect-glass", name: "زجاج شفاف", icon: Diamond },
  { id: "effect-cinematic", name: "دخول سينمائي", icon: Wind },
  { id: "effect-rainbow", name: "تدرج لوني", icon: Rainbow },
  { id: "effect-gold", name: "وهج ذهبي", icon: Sun },
  { id: "effect-neon", name: "نيون داكن", icon: Moon },
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
  const [textEffect, setTextEffect] = useState("");
  const [textBg, setTextBg] = useState(false);
  
  const [finalText, setFinalText] = useState("");
  const [finalColor, setFinalColor] = useState("text-white");
  const [finalBg, setFinalBg] = useState(false);
  const [finalEffect, setFinalEffect] = useState("");
  
  const [textPos, setTextPos] = useState({ x: 50, y: 30 });
  const [isDraggingText, setIsDraggingText] = useState(false);

  const handleNext = () => {
    const params = new URLSearchParams();
    if (imageUrl) params.set("image", imageUrl);
    if (videoUrl) params.set("video", videoUrl);
    if (filterClass) params.set("filter", filterClass);
    if (finalText) {
      params.set("textOverlay", finalText);
      params.set("textColor", finalColor);
      params.set("textBg", finalBg.toString());
      params.set("textEffect", finalEffect);
      params.set("textX", textPos.x.toString());
      params.set("textY", textPos.y.toString());
    }
    router.push(`/create-post?${params.toString()}`);
  };

  const handleGlobalDrag = (e: any) => {
    if (!isDraggingText || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;
    
    x = Math.max(10, Math.min(90, x));
    y = Math.max(10, Math.min(90, y));

    setTextPos({ x, y });
  };

  return (
    <div 
      className="flex flex-col h-screen bg-black text-white max-w-md mx-auto relative overflow-hidden select-none touch-none"
      ref={containerRef}
      onMouseMove={handleGlobalDrag}
      onMouseUp={() => setIsDraggingText(false)}
      onTouchMove={handleGlobalDrag}
      onTouchEnd={() => setIsDraggingText(false)}
    >
      <div className="absolute inset-0 z-0">
        {imageUrl && (
          <img src={imageUrl} alt="Finalize" className={cn("w-full h-full object-cover", filterClass)} />
        )}
        {videoUrl && (
          <video src={videoUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/40" />
      </div>

      {finalText && (
        <div 
          className={cn(
            "absolute z-30 pointer-events-auto cursor-grab active:cursor-grabbing transition-transform touch-none", 
            isDraggingText && "scale-110 ring-2 ring-primary rounded-xl",
            finalEffect
          )}
          style={{ 
            left: `${textPos.x}%`, 
            top: `${textPos.y}%`, 
            transform: 'translate(-50%, -50%)',
            touchAction: 'none'
          }}
          onMouseDown={(e) => { e.stopPropagation(); setIsDraggingText(true); }}
          onTouchStart={(e) => { e.stopPropagation(); setIsDraggingText(true); }}
        >
          <span className={cn(
            "text-2xl font-black text-center px-4 py-2 rounded-xl break-words max-w-[80vw] drop-shadow-2xl block",
            finalColor,
            finalBg ? "bg-black/60 backdrop-blur-md border border-white/10" : ""
          )}>
            {finalText}
          </span>
        </div>
      )}

      <header className="relative z-50 p-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-black/40 backdrop-blur-md">
          <ArrowLeft className="h-7 w-7" />
        </Button>
      </header>

      <div className="relative z-50 flex-1 flex flex-col justify-center px-4 gap-6">
        {[
          { icon: Type, label: "الكتابة", onClick: () => setIsTextDialogOpen(true), active: !!finalText },
          { icon: Layers, label: "الفلاتر", onClick: () => router.back(), active: filterClass !== "filter-none" },
        ].map((action) => (
          <div key={action.label} className="flex items-center gap-4 cursor-pointer" onClick={(e) => { e.stopPropagation(); action.onClick(); }}>
            <div className={cn("h-12 w-12 flex items-center justify-center rounded-2xl backdrop-blur-md border border-white/20 shadow-2xl", action.active ? "bg-primary border-primary" : "bg-black/50")}>
              <action.icon className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black drop-shadow-md">{action.label}</span>
              {action.active && <span className="text-[10px] text-primary font-bold">نشط</span>}
            </div>
          </div>
        ))}
      </div>

      <footer className="relative z-50 p-6 flex justify-end">
        <Button onClick={handleNext} className="rounded-full bg-white text-black hover:bg-zinc-200 px-12 py-7 text-xl font-black shadow-2xl active:scale-95 transition-transform">
          التالي
        </Button>
      </footer>

      <Dialog open={isTextDialogOpen} onOpenChange={setIsTextDialogOpen}>
        <DialogContent className="bg-zinc-950/98 border-zinc-800 text-white w-[92%] max-w-[400px] rounded-[2.5rem] p-6 outline-none h-[85vh] flex flex-col">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-center font-black">أضف لمستك السينمائية</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <div className="space-y-6 pb-4">
              <div className="relative">
                <Input 
                  placeholder="اكتب هنا..." value={textOverlay} onChange={(e) => setTextOverlay(e.target.value)}
                  className={cn("bg-zinc-900 border-none rounded-2xl h-20 text-center text-2xl font-black", textColor, textEffect)}
                  autoFocus
                />
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">تأثيرات سينمائية</span>
                <div className="grid grid-cols-4 gap-2">
                  {TEXT_EFFECTS.map((eff) => (
                    <button 
                      key={eff.id} 
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all active:scale-95",
                        textEffect === eff.id ? "bg-primary border-primary" : "bg-zinc-900 border-white/5"
                      )}
                      onClick={() => setTextEffect(textEffect === eff.id ? "" : eff.id)}
                    >
                      <eff.icon className="h-5 w-5" />
                      <span className="text-[8px] font-black text-center leading-tight">{eff.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">الألوان</span>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {TEXT_COLORS.map(c => (
                    <button key={c} className={cn("h-9 w-9 rounded-full border-2 shrink-0 transition-all active:scale-90", c.replace('text-', 'bg-'), textColor === c ? "border-white scale-110" : "border-transparent")} onClick={() => setTextColor(c)} />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-2xl">
                <span className="text-sm font-bold">خلفية زجاجية</span>
                <Button variant={textBg ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => setTextBg(!textBg)}>
                  {textBg ? "مفعل" : "معطل"}
                </Button>
              </div>
            </div>
          </ScrollArea>
          
          <div className="flex gap-4 mt-4">
            <Button variant="ghost" className="flex-1 rounded-2xl font-bold h-12" onClick={() => setIsTextDialogOpen(false)}>إلغاء</Button>
            <Button className="flex-1 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black h-12 shadow-xl" onClick={() => { 
              setFinalText(textOverlay); 
              setFinalColor(textColor); 
              setFinalBg(textBg); 
              setFinalEffect(textEffect);
              setIsTextDialogOpen(false); 
            }}>تطبيق</Button>
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
