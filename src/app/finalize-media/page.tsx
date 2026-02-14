
"use client";

import { useState, Suspense, useEffect } from "react";
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
  "text-purple-500"
];

function FinalizeMediaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const handleNext = () => {
    const params = new URLSearchParams();
    if (imageUrl) params.set("image", imageUrl);
    if (videoUrl) params.set("video", videoUrl);
    if (filterClass) params.set("filter", filterClass);
    if (finalText) {
      params.set("textOverlay", finalText);
      params.set("textColor", finalColor);
      params.set("textBg", finalBg.toString());
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

  return (
    <div className="flex flex-col h-screen bg-black text-white max-w-md mx-auto relative overflow-hidden">
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

      {/* Text Overlay Render */}
      {finalText && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none p-6">
          <span className={cn(
            "text-3xl font-black text-center px-4 py-2 rounded-xl break-words max-w-full transition-all drop-shadow-2xl",
            finalColor,
            finalBg ? "bg-black/50 backdrop-blur-sm" : ""
          )}>
            {finalText}
          </span>
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
          { icon: Type, label: "Text", onClick: () => setIsTextDialogOpen(true), active: !!finalText },
          { icon: Layers, label: "Filters", onClick: () => router.back(), active: filterClass !== "filter-none" },
          { icon: Smile, label: "Stickers", onClick: () => handleUnderDev("Stickers") },
          { icon: Sparkles, label: "Effects", onClick: () => handleUnderDev("Effects") },
          { icon: Music, label: "Music", onClick: () => handleUnderDev("Music") },
          { icon: FastForward, label: "Time", onClick: () => handleUnderDev("Time") },
          { icon: Grid2X2, label: "Blur", onClick: () => handleUnderDev("Blur") },
        ].map((action) => (
          <div 
            key={action.label} 
            className="flex items-center gap-4 group cursor-pointer w-fit"
            onClick={action.onClick}
          >
            <div className={cn(
              "h-10 w-10 flex items-center justify-center rounded-full backdrop-blur-md transition-all shadow-sm border border-white/10",
              action.active ? "bg-primary border-primary scale-110" : "bg-black/20 group-hover:bg-black/40"
            )}>
              <action.icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white drop-shadow-lg">
                {action.label}
              </span>
              {action.active && <span className="text-[7px] text-primary font-bold uppercase drop-shadow-md">Active</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Right Next Button */}
      <div className="relative z-10 p-6 flex justify-end">
        <Button 
          onClick={handleNext}
          className="rounded-full bg-white text-black hover:bg-zinc-200 px-10 py-7 text-lg font-bold shadow-2xl transition-transform active:scale-95"
        >
          Next
        </Button>
      </div>

      {/* Text Tool Dialog */}
      <Dialog open={isTextDialogOpen} onOpenChange={setIsTextDialogOpen}>
        <DialogContent className="bg-zinc-950/95 backdrop-blur-xl border-zinc-800 text-white max-w-[90%] rounded-[2rem] p-6">
          <DialogHeader>
            <DialogTitle className="text-center font-bold">Add Text Overlay</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="relative">
              <Input 
                placeholder="Type your message..." 
                value={textOverlay} 
                onChange={(e) => setTextOverlay(e.target.value)}
                className={cn(
                  "bg-zinc-900 border-none rounded-2xl h-14 text-center text-xl font-bold focus-visible:ring-2 focus-visible:ring-primary",
                  textColor
                )}
                autoFocus
              />
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500 uppercase">Colors</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn("h-8 rounded-full text-[10px] font-bold", textBg ? "bg-primary text-white" : "text-zinc-400")}
                  onClick={() => setTextBg(!textBg)}
                >
                  Background
                </Button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 shrink-0 transition-transform active:scale-90",
                      color.replace('text-', 'bg-'),
                      textColor === color ? "border-white scale-110" : "border-transparent"
                    )}
                    onClick={() => setTextColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1 rounded-full font-bold h-12" onClick={() => setIsTextDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1 rounded-full font-bold bg-primary hover:bg-primary/90 h-12" onClick={applyText}>
                Apply
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
