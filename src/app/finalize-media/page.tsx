
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
  Palette,
  RotateCw,
  Maximize,
  Minimize,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";

const TEXT_COLORS = [
  "text-white", "text-black", "text-primary", "text-red-500", "text-yellow-400", 
  "text-green-500", "text-purple-500", "text-orange-500", "text-pink-500"
];

const STICKER_CATEGORIES = [
  { name: "هوية", icon: "🆔", stickers: ["صوت حر", "بلا فلتر", "قولها بصراحة", "فكر مختلف", "خارج الصندوق", "رأي جريء", "بلا مجاملة", "الحقيقة أولًا", "نقاش مفتوح", "فكر قبل أن تحكم", "الحرية مسؤولية", "كلام ثقيل", "مواجهة", "بدون خوف", "وعي", "انتبه", "افهم الصورة", "الموضوع كبير", "لا تسكت", "اسمع الآخر"] },
  { name: "تفاعل", icon: "💬", stickers: ["متفق", "غير موافق", "100٪ صح", "فيه مبالغة", "منطقي", "غير مقنع", "يحتاج دليل", "قوي جدًا", "عادي", "صادم", "ممتاز", "ضعيف", "يستحق الانتشار", "لازم نقاش", "شارك رأيك"] },
  { name: "تحليل", icon: "🧠", stickers: ["تحليل", "أرقام", "مصدر؟", "تدقيق", "رأي شخصي", "معلومة مهمة", "مقارنة", "خلف الكواليس", "قراءة عميقة", "زاوية أخرى", "نظرة مختلفة", "تفسير", "توضيح", "استنتاج", "توقعات"] },
  { name: "شأن عام", icon: "🏛", stickers: ["شأن عام", "قرار مهم", "جدل", "أزمة", "قانون", "بيان رسمي", "عاجل", "حدث الآن", "ملف مفتوح", "مسؤولية", "انتخابات", "تصريح", "موقف", "سياسة", "قضية رأي عام"] },
  { name: "إنساني", icon: "❤️", stickers: ["تضامن", "دعم", "إنسانية", "قصة مؤثرة", "واقعي", "مؤلم", "فرحة", "أمل", "لا للعنف", "معًا أفضل"] },
  { name: "حياة", icon: "🎉", stickers: ["ضحك", "ترند", "لحظة جميلة", "يوميات", "ذكريات", "عفوي", "مزاج", "مفاجأة", "تحدي", "رهيب"] },
  { name: "رياضة", icon: "⚽", stickers: ["بطل", "مباراة قوية", "هدف", "فوز", "خسارة"] },
  { name: "مستقبلي", icon: "💰", stickers: ["مدعوم", "محتوى مميز", "دعم مباشر", "شكراً للداعمين", "شراكة"] },
  { name: "تحذير", icon: "🔍", stickers: ["تحذير", "تحقق قبل النشر", "إشاعة؟", "غير مؤكد", "معلومات حساسة"] }
];

interface StickerInstance {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

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
  const [textPos, setTextPos] = useState({ x: 50, y: 30 });
  const [isDraggingText, setIsDraggingText] = useState(false);

  const [isStickerDialogOpen, setIsStickerDialogOpen] = useState(false);
  const [stickers, setStickers] = useState<StickerInstance[]>([]);
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);
  const [isDraggingSticker, setIsDraggingSticker] = useState(false);

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
    if (stickers.length > 0) {
      params.set("stickers", JSON.stringify(stickers));
    }
    router.push(`/create-post?${params.toString()}`);
  };

  const addSticker = (text: string) => {
    const newSticker: StickerInstance = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      color: "bg-white text-black",
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
    setStickers(prev => prev.map(s => s.id === activeStickerId ? { ...s, ...updates } : s));
  };

  const removeSticker = (id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id));
    if (activeStickerId === id) setActiveStickerId(null);
  };

  const handleGlobalDrag = (e: any) => {
    if ((!isDraggingText && !isDraggingSticker) || !containerRef.current) return;

    // Prevent scrolling on touch
    if (e.cancelable) e.preventDefault();

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
    
    x = Math.max(5, Math.min(95, x));
    y = Math.max(5, Math.min(95, y));

    if (isDraggingText) {
      setTextPos({ x, y });
    } else if (isDraggingSticker && activeStickerId) {
      updateActiveSticker({ x, y });
    }
  };

  return (
    <div 
      className="flex flex-col h-screen bg-black text-white max-w-md mx-auto relative overflow-hidden select-none touch-none"
      ref={containerRef}
      onMouseMove={handleGlobalDrag}
      onMouseUp={() => { setIsDraggingText(false); setIsDraggingSticker(false); }}
      onTouchMove={handleGlobalDrag}
      onTouchEnd={() => { setIsDraggingText(false); setIsDraggingSticker(false); }}
      onClick={() => { 
        if (!isDraggingText && !isDraggingSticker) setActiveStickerId(null);
      }}
    >
      <div className="absolute inset-0 z-0">
        {imageUrl && (
          <img src={imageUrl} alt="Finalize" className={cn("w-full h-full object-cover", filterClass)} />
        )}
        {videoUrl && (
          <video src={videoUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20" />
      </div>

      {finalText && (
        <div 
          className={cn(
            "absolute z-30 pointer-events-auto cursor-grab active:cursor-grabbing transition-transform touch-none", 
            isDraggingText && "scale-110 ring-2 ring-primary rounded-xl"
          )}
          style={{ 
            left: `${textPos.x}%`, 
            top: `${textPos.y}%`, 
            transform: 'translate(-50%, -50%)',
            touchAction: 'none'
          }}
          onMouseDown={(e) => { e.stopPropagation(); setIsDraggingText(true); setActiveStickerId(null); }}
          onTouchStart={(e) => { e.stopPropagation(); setIsDraggingText(true); setActiveStickerId(null); }}
        >
          <span className={cn(
            "text-xl font-black text-center px-4 py-2 rounded-xl break-words max-w-[70vw] drop-shadow-2xl block",
            finalColor,
            finalBg ? "bg-black/60 backdrop-blur-md border border-white/10" : ""
          )}>
            {finalText}
          </span>
        </div>
      )}

      {stickers.map((sticker) => (
        <div 
          key={sticker.id}
          className={cn(
            "absolute z-40 pointer-events-auto cursor-grab active:cursor-grabbing transition-all touch-none",
            activeStickerId === sticker.id && "ring-2 ring-primary ring-offset-4 ring-offset-transparent rounded-lg"
          )}
          style={{ 
            left: `${sticker.x}%`, 
            top: `${sticker.y}%`, 
            transform: `translate(-50%, -50%) scale(${sticker.scale}) rotate(${sticker.rotation}deg)`,
            touchAction: 'none'
          }}
          onMouseDown={(e) => { e.stopPropagation(); setActiveStickerId(sticker.id); setIsDraggingSticker(true); }}
          onTouchStart={(e) => { e.stopPropagation(); setActiveStickerId(sticker.id); setIsDraggingSticker(true); }}
        >
          <div className={cn(
            "px-4 py-2 rounded-lg font-black text-sm whitespace-nowrap shadow-xl drop-shadow-md border-2 border-white/20",
            sticker.color
          )}>
            {sticker.text}
          </div>
        </div>
      ))}

      <header className="relative z-50 p-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-black/30 backdrop-blur-md">
          <ArrowLeft className="h-7 w-7" />
        </Button>
      </header>

      <div className="relative z-50 flex-1 flex flex-col justify-center px-4 gap-4">
        {[
          { icon: Type, label: "الكتابة", onClick: () => setIsTextDialogOpen(true), active: !!finalText },
          { icon: Smile, label: "الملصقات", onClick: () => setIsStickerDialogOpen(true), active: stickers.length > 0 },
          { icon: Layers, label: "الفلاتر", onClick: () => router.back(), active: filterClass !== "filter-none" },
        ].map((action) => (
          <div key={action.label} className="flex items-center gap-4 cursor-pointer" onClick={(e) => { e.stopPropagation(); action.onClick(); }}>
            <div className={cn("h-11 w-11 flex items-center justify-center rounded-xl backdrop-blur-md border border-white/10 shadow-xl", action.active ? "bg-primary border-primary" : "bg-black/40")}>
              <action.icon className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold drop-shadow-md">{action.label}</span>
              {action.label === "الفلاتر" && <span className="text-[8px] text-primary font-bold uppercase tracking-tighter">قيد التطوير</span>}
            </div>
          </div>
        ))}
      </div>

      {activeStickerId && (
        <div className="absolute bottom-28 left-4 right-4 z-50 animate-in slide-in-from-bottom-5" onClick={(e) => e.stopPropagation()}>
          <div className="bg-zinc-950/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <Maximize className="h-3 w-3 text-zinc-500" />
                  <span className="text-[10px] font-bold uppercase text-zinc-500">الحجم</span>
                </div>
                <Slider 
                  value={[stickers.find(s => s.id === activeStickerId)?.scale || 1]} 
                  min={0.5} max={2.5} step={0.1} 
                  onValueChange={([val]) => updateActiveSticker({ scale: val })}
                />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <RotateCw className="h-3 w-3 text-zinc-500" />
                  <span className="text-[10px] font-bold uppercase text-zinc-500">التدوير</span>
                </div>
                <Slider 
                  value={[stickers.find(s => s.id === activeStickerId)?.rotation || 0]} 
                  min={-180} max={180} step={5} 
                  onValueChange={([val]) => updateActiveSticker({ rotation: val })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-[200px]">
                {["bg-white text-black", "bg-primary text-white", "bg-red-500 text-white", "bg-black text-white", "bg-yellow-400 text-black"].map(c => (
                  <button 
                    key={c} 
                    className={cn("h-6 w-6 rounded-full border-2", c.split(' ')[0], stickers.find(s => s.id === activeStickerId)?.color === c ? "border-white" : "border-transparent")}
                    onClick={() => updateActiveSticker({ color: c })}
                  />
                ))}
              </div>
              <Button variant="ghost" size="sm" className="text-red-500 font-bold" onClick={() => removeSticker(activeStickerId)}>
                <Trash2 className="h-4 w-4 mr-1" /> حذف
              </Button>
            </div>
          </div>
        </div>
      )}

      <footer className="relative z-50 p-6 flex justify-end">
        <Button onClick={handleNext} className="rounded-full bg-white text-black hover:bg-zinc-200 px-10 py-6 text-lg font-black shadow-2xl">
          التالي
        </Button>
      </footer>

      <Dialog open={isStickerDialogOpen} onOpenChange={setIsStickerDialogOpen}>
        <DialogContent className="bg-zinc-950/95 backdrop-blur-2xl border-zinc-800 text-white w-[95%] max-w-[400px] rounded-[2rem] p-0 h-[70vh] flex flex-col overflow-hidden outline-none">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-center font-bold">ملصقات بلا قيود</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="هوية" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="bg-transparent border-b border-white/5 px-2 h-12 gap-2 overflow-x-auto no-scrollbar justify-start">
              {STICKER_CATEGORIES.map(cat => (
                <TabsTrigger key={cat.name} value={cat.name} className="rounded-full data-[state=active]:bg-white data-[state=active]:text-black text-xs font-bold gap-2">
                  <span>{cat.icon}</span> {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="flex-1 overflow-hidden relative">
              <ScrollArea className="h-full p-4">
                {STICKER_CATEGORIES.map(cat => (
                  <TabsContent key={cat.name} value={cat.name} className="mt-0">
                    <div className="grid grid-cols-2 gap-3 pb-20">
                      {cat.stickers.map(sticker => (
                        <button 
                          key={sticker} 
                          className="bg-zinc-900/50 hover:bg-zinc-800 p-3 rounded-xl text-sm font-black text-center transition-all active:scale-95 border border-white/5"
                          onClick={() => addSticker(sticker)}
                        >
                          {sticker}
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </ScrollArea>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={isTextDialogOpen} onOpenChange={setIsTextDialogOpen}>
        <DialogContent className="bg-zinc-950/95 border-zinc-800 text-white w-[92%] max-w-[400px] rounded-[2rem] p-6 outline-none">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-center font-bold">أضف نصاً</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <Input 
              placeholder="اكتب شيئاً..." value={textOverlay} onChange={(e) => setTextOverlay(e.target.value)}
              className={cn("bg-zinc-900 border-none rounded-2xl h-14 text-center text-xl font-bold", textColor)}
              autoFocus
            />
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {TEXT_COLORS.map(c => (
                <button key={c} className={cn("h-8 w-8 rounded-full border-2 shrink-0", c.replace('text-', 'bg-'), textColor === c ? "border-white" : "border-transparent")} onClick={() => setTextColor(c)} />
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setIsTextDialogOpen(false)}>إلغاء</Button>
              <Button className="flex-1 bg-primary font-black" onClick={() => { setFinalText(textOverlay); setFinalColor(textColor); setFinalBg(textBg); setIsTextDialogOpen(false); setActiveStickerId(null); }}>تطبيق</Button>
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
