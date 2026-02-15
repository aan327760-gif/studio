
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
  Moon,
  Sticker as StickerIcon,
  Trash2,
  RotateCw,
  Maximize2,
  Search,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useLanguage } from "@/context/LanguageContext";

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

interface StickerInstance {
  id: string;
  imageUrl: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

function FinalizeMediaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const { isRtl } = useLanguage();
  
  const imageUrl = searchParams.get("image");
  const videoUrl = searchParams.get("video");
  const filterClass = searchParams.get("filter") || "filter-none";

  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
  const [isStickerDialogOpen, setIsStickerDialogOpen] = useState(false);
  
  const [textOverlay, setTextOverlay] = useState("");
  const [textColor, setTextColor] = useState("text-white");
  const [textEffect, setTextEffect] = useState("");
  const [textBg, setTextBg] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [textPos, setTextPos] = useState({ x: 50, y: 30 });
  const [isDraggingText, setIsDraggingText] = useState(false);

  const [stickers, setStickers] = useState<StickerInstance[]>([]);
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);
  const [isDraggingSticker, setIsDraggingSticker] = useState<string | null>(null);
  const [stickerSearch, setStickerSearch] = useState("");

  const handleNext = () => {
    const params = new URLSearchParams();
    if (imageUrl) params.set("image", imageUrl);
    if (videoUrl) params.set("video", videoUrl);
    if (filterClass) params.set("filter", filterClass);
    
    if (finalText) {
      params.set("textOverlay", finalText);
      params.set("textColor", textColor);
      params.set("textBg", textBg.toString());
      params.set("textEffect", textEffect);
      params.set("textX", textPos.x.toString());
      params.set("textY", textPos.y.toString());
    }

    if (stickers.length > 0) {
      params.set("stickers", JSON.stringify(stickers));
    }
    
    router.push(`/create-post?${params.toString()}`);
  };

  const handleDrag = (e: any) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches) {
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

    if (isDraggingText) {
      setTextPos({ x, y });
    } else if (isDraggingSticker) {
      setStickers(prev => prev.map(s => s.id === isDraggingSticker ? { ...s, x, y } : s));
    }
  };

  const addSticker = (imgUrl: string) => {
    const newSticker: StickerInstance = {
      id: Math.random().toString(36).substr(2, 9),
      imageUrl: imgUrl,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0
    };
    setStickers([...stickers, newSticker]);
    setActiveStickerId(newSticker.id);
    setIsStickerDialogOpen(false);
  };

  const updateActiveSticker = (updates: Partial<StickerInstance>) => {
    if (!activeStickerId) return;
    setStickers(prev => prev.map(s => s.id === activeStickerId ? { ...s, ...updates } : s));
  };

  const removeSticker = (id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id));
    if (activeStickerId === id) setActiveStickerId(null);
  };

  const filteredStickers = PlaceHolderImages.filter(img => 
    img.id.startsWith('sticker-') && 
    (img.description.toLowerCase().includes(stickerSearch.toLowerCase()) || stickerSearch === "")
  );

  return (
    <div 
      className="flex flex-col h-screen bg-black text-white max-w-md mx-auto relative overflow-hidden select-none touch-none"
      ref={containerRef}
      onMouseMove={handleDrag}
      onMouseUp={() => { setIsDraggingText(false); setIsDraggingSticker(null); }}
      onTouchMove={handleDrag}
      onTouchEnd={() => { setIsDraggingText(false); setIsDraggingSticker(null); }}
      onClick={() => setActiveStickerId(null)}
    >
      <div className="absolute inset-0 z-0">
        {imageUrl && <img src={imageUrl} alt="Finalize" className={cn("w-full h-full object-cover", filterClass)} />}
        {videoUrl && <video src={videoUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/40" />
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none">
        {finalText && (
          <div 
            className={cn(
              "absolute z-30 pointer-events-auto cursor-grab active:cursor-grabbing transition-transform", 
              isDraggingText && "scale-110 shadow-2xl",
              textEffect
            )}
            style={{ left: `${textPos.x}%`, top: `${textPos.y}%`, transform: 'translate(-50%, -50%)' }}
            onMouseDown={(e) => { e.stopPropagation(); setIsDraggingText(true); }}
            onTouchStart={(e) => { e.stopPropagation(); setIsDraggingText(true); }}
          >
            <span className={cn(
              "text-2xl font-black px-4 py-2 rounded-xl text-center block drop-shadow-2xl",
              textColor,
              textBg ? "bg-black/60 backdrop-blur-md border border-white/10" : ""
            )}>
              {finalText}
            </span>
          </div>
        )}

        {stickers.map((s) => (
          <div 
            key={s.id}
            className={cn(
              "absolute z-30 pointer-events-auto cursor-grab active:cursor-grabbing transition-transform",
              activeStickerId === s.id && "ring-2 ring-primary ring-offset-2 ring-offset-black rounded-xl"
            )}
            style={{ 
              left: `${s.x}%`, 
              top: `${s.y}%`, 
              transform: `translate(-50%, -50%) scale(${s.scale}) rotate(${s.rotation}deg)` 
            }}
            onMouseDown={(e) => { e.stopPropagation(); setIsDraggingSticker(s.id); setActiveStickerId(s.id); }}
            onTouchStart={(e) => { e.stopPropagation(); setIsDraggingSticker(s.id); setActiveStickerId(s.id); }}
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={s.imageUrl} 
              alt="Sticker" 
              className="w-24 h-24 object-contain drop-shadow-2xl" 
              draggable={false}
            />
          </div>
        ))}
      </div>

      <header className="relative z-50 p-4 flex justify-between items-center">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-black/40 backdrop-blur-md text-white">
          <ArrowLeft className={cn("h-7 w-7", isRtl ? "rotate-180" : "")} />
        </Button>
      </header>

      <div className="relative z-50 flex-1 flex flex-col justify-center px-4 gap-4">
        {[
          { icon: Type, label: isRtl ? "الكتابة" : "Text", onClick: () => setIsTextDialogOpen(true), active: !!finalText },
          { icon: StickerIcon, label: isRtl ? "الملصقات" : "Stickers", onClick: () => setIsStickerDialogOpen(true), active: stickers.length > 0 },
          { icon: Layers, label: isRtl ? "الفلاتر" : "Filters", onClick: () => router.back(), active: filterClass !== "filter-none" },
        ].map((action) => (
          <div key={action.label} className="flex items-center gap-4 cursor-pointer" onClick={(e) => { e.stopPropagation(); action.onClick(); }}>
            <div className={cn("h-12 w-12 flex items-center justify-center rounded-2xl backdrop-blur-md border border-white/20 shadow-2xl transition-all", action.active ? "bg-primary border-primary scale-110" : "bg-black/50")}>
              <action.icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black drop-shadow-md">{action.label}</span>
              {action.active && <span className="text-[10px] text-primary font-bold">{isRtl ? "نشط" : "Active"}</span>}
            </div>
          </div>
        ))}
      </div>

      {activeStickerId && (
        <div className="relative z-50 p-4 bg-black/80 backdrop-blur-xl border-t border-white/10 animate-in slide-in-from-bottom-4" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Maximize2 className="h-4 w-4 text-zinc-500" />
              <Slider 
                value={[stickers.find(s => s.id === activeStickerId)?.scale || 1]} 
                min={0.5} max={3} step={0.1} 
                onValueChange={([v]) => updateActiveSticker({ scale: v })} 
              />
              <RotateCw className="h-4 w-4 text-zinc-500" />
              <Slider 
                value={[stickers.find(s => s.id === activeStickerId)?.rotation || 0]} 
                min={-180} max={180} step={1} 
                onValueChange={([v]) => updateActiveSticker({ rotation: v })} 
              />
              <Button variant="destructive" size="icon" className="rounded-full h-8 w-8 shrink-0" onClick={() => removeSticker(activeStickerId)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <footer className="relative z-50 p-6 flex justify-end">
        <Button onClick={handleNext} className="rounded-full bg-white text-black hover:bg-zinc-200 px-12 py-7 text-xl font-black shadow-2xl active:scale-95 transition-transform">
          {isRtl ? "التالي" : "Next"}
        </Button>
      </footer>

      <Dialog open={isTextDialogOpen} onOpenChange={setIsTextDialogOpen}>
        <DialogContent className="bg-zinc-950/98 border-zinc-800 text-white w-[92%] max-w-[400px] rounded-[2.5rem] p-6 outline-none h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-center font-black uppercase tracking-tight">
              {isRtl ? "أضف لمستك السينمائية" : "Cinema Edit"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <div className="space-y-6 pb-4">
              <Input 
                placeholder={isRtl ? "اكتب هنا..." : "Type here..."} 
                value={textOverlay} 
                onChange={(e) => setTextOverlay(e.target.value)}
                className={cn("bg-zinc-900 border-none rounded-2xl h-20 text-center text-2xl font-black", textColor, textEffect)}
                autoFocus
              />
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{isRtl ? "التأثيرات" : "Effects"}</span>
                <div className="grid grid-cols-4 gap-2">
                  {TEXT_EFFECTS.map((eff) => (
                    <button 
                      key={eff.id} 
                      className={cn("flex flex-col items-center gap-1 p-2 rounded-xl border transition-all", textEffect === eff.id ? "bg-primary border-primary" : "bg-zinc-900 border-white/5")}
                      onClick={() => setTextEffect(textEffect === eff.id ? "" : eff.id)}
                    >
                      <eff.icon className="h-4 w-4" />
                      <span className="text-[8px] font-black text-center">{eff.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{isRtl ? "الألوان" : "Colors"}</span>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {TEXT_COLORS.map(c => (
                    <button key={c} className={cn("h-8 w-8 rounded-full border-2 shrink-0", c.replace('text-', 'bg-'), textColor === c ? "border-white" : "border-transparent")} onClick={() => setTextColor(c)} />
                  ))}
                </div>
              </div>
              <Button variant={textBg ? "default" : "outline"} className="w-full rounded-2xl font-bold" onClick={() => setTextBg(!textBg)}>
                {isRtl ? "خلفية زجاجية" : "Glass Backdrop"}: {textBg ? (isRtl ? "مفعل" : "Enabled") : (isRtl ? "معطل" : "Disabled")}
              </Button>
            </div>
          </ScrollArea>
          <div className="flex gap-4 mt-4">
            <Button className="flex-1 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black h-12" onClick={() => { setFinalText(textOverlay); setIsTextDialogOpen(false); }}>
              {isRtl ? "تطبيق" : "Apply"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isStickerDialogOpen} onOpenChange={setIsStickerDialogOpen}>
        <DialogContent className="bg-zinc-950/98 border-zinc-800 text-white w-[92%] max-w-[400px] rounded-[3rem] p-0 outline-none h-[75vh] flex flex-col overflow-hidden">
          <DialogHeader className="pt-6 px-6 pb-2">
            <DialogTitle className="text-center font-black uppercase text-sm tracking-widest">
              {isRtl ? "اختر ملصقاً" : "Choose Sticker"}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input 
                placeholder={isRtl ? "البحث عن ملصقات..." : "Search stickers..."} 
                className="pl-10 bg-zinc-900 border-none rounded-full h-10" 
                value={stickerSearch}
                onChange={(e) => setStickerSearch(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="grid grid-cols-3 gap-4 pb-10">
              {filteredStickers.map((sticker) => (
                <button 
                  key={sticker.id} 
                  className="aspect-square bg-zinc-900/50 hover:bg-zinc-800 rounded-2xl p-2 flex items-center justify-center transition-all active:scale-90"
                  onClick={() => addSticker(sticker.imageUrl)}
                >
                  <img 
                    src={sticker.imageUrl} 
                    alt={sticker.description} 
                    className="w-full h-full object-contain" 
                  />
                </button>
              ))}
            </div>
          </ScrollArea>
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
