
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
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function FinalizeMediaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const imageUrl = searchParams.get("image");
  const videoUrl = searchParams.get("video");
  const filterClass = searchParams.get("filter") || "filter-none";

  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
  const [textOverlay, setTextOverlay] = useState("");
  const [finalText, setFinalText] = useState("");

  const handleNext = () => {
    const params = new URLSearchParams();
    if (imageUrl) params.set("image", imageUrl);
    if (videoUrl) params.set("video", videoUrl);
    if (filterClass) params.set("filter", filterClass);
    if (finalText) params.set("textOverlay", finalText);
    router.push(`/create-post?${params.toString()}`);
  };

  const handleUnderDev = () => {
    toast({
      title: "Under Development",
      description: "This creative tool will be available in the next update.",
    });
  };

  const openTextTool = () => {
    setIsTextDialogOpen(true);
  };

  const applyText = () => {
    setFinalText(textOverlay);
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
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <span className="text-white text-3xl font-black text-center px-6 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] break-words max-w-full">
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
          { icon: Smile, label: "Stickers", onClick: handleUnderDev },
          { icon: Type, label: "Text", onClick: openTextTool, active: !!finalText },
          { icon: Sparkles, label: "Effects", onClick: handleUnderDev },
          { icon: Music, label: "Music", onClick: handleUnderDev },
          { icon: FastForward, label: "Time", onClick: handleUnderDev },
          { icon: Layers, label: "Filters", onClick: () => router.back(), active: filterClass !== "filter-none" },
          { icon: Grid2X2, label: "Blur", onClick: handleUnderDev },
        ].map((action) => (
          <div 
            key={action.label} 
            className="flex items-center gap-4 group cursor-pointer w-fit"
            onClick={action.onClick}
          >
            <div className={cn(
              "h-10 w-10 flex items-center justify-center rounded-full backdrop-blur-md transition-all shadow-sm border border-white/10",
              action.active ? "bg-primary border-primary" : "bg-black/20 group-hover:bg-black/40"
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
        <DialogContent className="bg-zinc-950 border-zinc-900 text-white max-w-[90%] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-center font-bold">Add Text</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <Input 
              placeholder="Type something..." 
              value={textOverlay} 
              onChange={(e) => setTextOverlay(e.target.value)}
              className="bg-zinc-900 border-none rounded-xl h-12 text-center text-lg focus-visible:ring-1 focus-visible:ring-primary"
              autoFocus
            />
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 rounded-full font-bold" onClick={() => setIsTextDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1 rounded-full font-bold bg-primary hover:bg-primary/90" onClick={applyText}>
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
    <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
      <FinalizeMediaContent />
    </Suspense>
  );
}
