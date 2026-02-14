
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
  Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

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

const STICKER_CATEGORIES = [
  { id: "identity", label: "هوية", items: ["صوت حر", "بلا فلتر", "قولها بصراحة", "فكر مختلف", "خارج الصندوق", "رأي جريء", "بلا مجاملة", "الحقيقة أولًا", "نقاش مفتوح", "فكر قبل أن تحكم", "الحرية مسؤولية", "كلام ثقيل", "مواجهة", "بدون خوف", "وعي", "انتبه", "افهم الصورة", "الموضوع كبير", "لا تسكت", "اسمع الآخر"] },
  { id: "interaction", label: "تفاعل", items: ["متفق", "غير موافق", "100٪ صح", "فيه مبالغة", "منطقي", "غير مقنع", "يحتاج دليل", "قوي جدًا", "عادي", "صادم", "ممتاز", "ضعيف", "يستحق الانتشار", "لازم نقاش", "شارك رأيك"] },
  { id: "analysis", label: "تحليل", items: ["تحليل", "أرقام", "مصدر؟", "تدقيق", "رأي شخصي", "معلومة مهمة", "مقارنة", "خلف الكواليس", "قراءة عميقة", "زاوية أخرى", "نظرة مختلفة", "تفسير", "توضيح", "استنتاج", "توقعات"] },
  { id: "political", label: "سياسي", items: ["شأن عام", "قرار مهم", "جدل", "أزمة", "قانون", "بيان رسمي", "عاجل", "حدث الآن", "ملف مفتوح", "مسؤولية", "انتخابات", "تصريح", "موقف", "سياسة", "قضية رأي عام"] },
  { id: "human", label: "إنساني", items: ["تضامن", "دعم", "إنسانية", "قصة مؤثرة", "واقعي", "مؤلم", "فرحة", "أمل", "لا للعنف", "معًا أفضل"] },
  { id: "life", label: "حياة", items: ["ضحك", "ترند", "لحظة جميلة", "يوميات", "ذكريات", "عفوي", "مزاج", "مفاجأة", "تحدي", "رهيب"] },
  { id: "sports", label: "رياضة", items: ["بطل", "مباراة قوية", "هدف", "فوز", "خسارة"] },
  { id: "future", label: "دعم", items: ["مدعوم", "محتوى مميز", "دعم مباشر", "شكراً للداعمين", "شراكة"] },
  { id: "warning", label: "تنبيه", items: ["تحذير", "تحقق قبل النشر", "إشاعة؟", "غير مؤكد", "معلومات حساسة"] }
];

const STICKER_COLORS = [
  { name: "White", bg: "bg-white", text: "text-black" },
  { name: "Black", bg: "bg-black", text: "text-white" },
  { name: "Primary", bg: "bg-primary", text: "text-white" },
  { name: "Accent", bg: "bg-accent", text: "text-accent-foreground" },
  { name: "Glass", bg: "bg-white/20 backdrop-blur-md border border-white/20", text: "text-white" },
];

interface StickerInstance {
  id: string;
  text: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  colorIndex: number;
}

function FinalizeMediaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const imageUrl = searchParams.get("image");
  const videoUrl = searchParams.get("video");
  const filterClass = searchParams.get("filter") || "filter-none";

  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
  const [isStickerDialogOpen, setIsStickerDialogOpen] = useState(false);
  
  // Text state
  const [textOverlay, setTextOverlay] = useState("");
  const [textColor, setTextColor] = useState("text-white");
  const [textEffect, setTextEffect] = useState("");
  const [textBg, setTextBg] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [textPos, setTextPos] = useState({ x: 50, y: 30 });
  const [isDraggingText, setIsDraggingText] = useState(false);

  // Stickers state
  const [stickers, setStickers] = useState<StickerInstance[]>([]);
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);
  const [isDraggingSticker, setIsDraggingSticker] = useState<string | null>(null);

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
    x = Math.max(5, Math.min(95, x));
    y = Math.max(5, Math.min(95, y));

    if (isDraggingText) {
      setTextPos({ x, y });
    } else if (isDraggingSticker) {
      setStickers(prev => prev.map(s => s.id === isDraggingSticker ? { ...s, x, y } : s));
    }
  };

  const addSticker = (text: string) => {
    const newSticker: StickerInstance = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      colorIndex: 0
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
      {/* Preview Layer */}
      <div className="absolute inset-0 z-0">
        {imageUrl && <img src={imageUrl} alt="Finalize" className={cn("w-full h-full object-cover", filterClass)} />}
        {videoUrl && <video src={videoUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/40" />
      </div>

      {/* Interactive Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Text Layer */}
        {finalText && (
          <div 
            className={cn(
              "absolute z-30 pointer-events-auto cursor-grab active:cursor-grabbing", 
              isDraggingText && "scale-110",
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

        {/* Stickers Layer */}
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
            <div className={cn(
              "px-4 py-2 rounded-xl font-black text-lg shadow-xl border border-white/10 whitespace-nowrap",
              STICKER_COLORS[s.colorIndex].bg,
              STICKER_COLORS[s.colorIndex].text
            )}>
              {s.text}
            </div>
          </div>
        ))}
      </div>

      {/* Header Controls */}
      <header className="relative z-50 p-4 flex justify-between items-center">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-black/40 backdrop-blur-md">
          <ArrowLeft className="h-7 w-7" />
        </Button>
      </header>

      {/* Sidebar Tools */}
      <div className="relative z-50 flex-1 flex flex-col justify-center px-4 gap-4">
        {[
          { icon: Type, label: "الكتابة", onClick: () => setIsTextDialogOpen(true), active: !!finalText },
          { icon: StickerIcon, label: "الملصقات", onClick: () => setIsStickerDialogOpen(true), active: stickers.length > 0 },
          { icon: Layers, label: "الفلاتر", onClick: () => router.back(), active: filterClass !== "filter-none" },
        ].map((action) => (
          <div key={action.label} className="flex items-center gap-4 cursor-pointer" onClick={(e) => { e.stopPropagation(); action.onClick(); }}>
            <div className={cn("h-12 w-12 flex items-center justify-center rounded-2xl backdrop-blur-md border border-white/20 shadow-2xl transition-all", action.active ? "bg-primary border-primary scale-110" : "bg-black/50")}>
              <action.icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black drop-shadow-md">{action.label}</span>
              {action.active && <span className="text-[10px] text-primary font-bold">نشط</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Sticker Toolbar (Dynamic) */}
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
            </div>
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {STICKER_COLORS.map((c, i) => (
                  <button 
                    key={i} 
                    className={cn("h-8 w-8 rounded-full border-2", c.bg, stickers.find(s => s.id === activeStickerId)?.colorIndex === i ? "border-white" : "border-transparent")}
                    onClick={() => updateActiveSticker({ colorIndex: i })}
                  />
                ))}
              </div>
              <Button variant="destructive" size="icon" className="rounded-full h-8 w-8" onClick={() => removeSticker(activeStickerId)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action */}
      <footer className="relative z-50 p-6 flex justify-end">
        <Button onClick={handleNext} className="rounded-full bg-white text-black hover:bg-zinc-200 px-12 py-7 text-xl font-black shadow-2xl active:scale-95 transition-transform">
          التالي
        </Button>
      </footer>

      {/* Text Dialog */}
      <Dialog open={isTextDialogOpen} onOpenChange={setIsTextDialogOpen}>
        <DialogContent className="bg-zinc-950/98 border-zinc-800 text-white w-[92%] max-w-[400px] rounded-[2.5rem] p-6 outline-none h-[85vh] flex flex-col">
          <DialogHeader><DialogTitle className="text-center font-black">أضف لمستك السينمائية</DialogTitle></DialogHeader>
          <ScrollArea className="flex-1">
            <div className="space-y-6 pb-4">
              <Input 
                placeholder="اكتب هنا..." value={textOverlay} onChange={(e) => setTextOverlay(e.target.value)}
                className={cn("bg-zinc-900 border-none rounded-2xl h-20 text-center text-2xl font-black", textColor, textEffect)}
                autoFocus
              />
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">التأثيرات</span>
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
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">الألوان</span>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {TEXT_COLORS.map(c => (
                    <button key={c} className={cn("h-8 w-8 rounded-full border-2 shrink-0", c.replace('text-', 'bg-'), textColor === c ? "border-white" : "border-transparent")} onClick={() => setTextColor(c)} />
                  ))}
                </div>
              </div>
              <Button variant={textBg ? "default" : "outline"} className="w-full rounded-2xl font-bold" onClick={() => setTextBg(!textBg)}>خلفية زجاجية: {textBg ? "مفعل" : "معطل"}</Button>
            </div>
          </ScrollArea>
          <div className="flex gap-4 mt-4">
            <Button className="flex-1 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black h-12" onClick={() => { setFinalText(textOverlay); setIsTextDialogOpen(false); }}>تطبيق</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stickers Dialog */}
      <Dialog open={isStickerDialogOpen} onOpenChange={setIsStickerDialogOpen}>
        <DialogContent className="bg-zinc-950/98 border-zinc-800 text-white w-[92%] max-w-[400px] rounded-[2.5rem] p-4 outline-none h-[80vh] flex flex-col">
          <DialogHeader><DialogTitle className="text-center font-black">ملصقات بلا قيود</DialogTitle></DialogHeader>
          <Tabs defaultValue="identity" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="bg-transparent border-b border-white/10 h-10 w-full justify-start overflow-x-auto no-scrollbar rounded-none">
              {STICKER_CATEGORIES.map(cat => (
                <TabsTrigger key={cat.id} value={cat.id} className="text-[10px] font-black px-4 data-[state=active]:text-primary data-[state=active]:bg-transparent">
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {STICKER_CATEGORIES.map(cat => (
              <TabsContent key={cat.id} value={cat.id} className="flex-1 overflow-y-auto mt-4 focus-visible:ring-0">
                <div className="grid grid-cols-2 gap-2 pb-10">
                  {cat.items.map((item, i) => (
                    <button 
                      key={i} 
                      className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl font-black text-xs text-center border border-white/5 active:scale-95 transition-all"
                      onClick={() => addSticker(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
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
