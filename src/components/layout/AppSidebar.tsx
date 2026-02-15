
"use client";

import { Home, MessageSquare, Plus, Bell, User, Video, Mic, ImageIcon, PenLine, StopCircle, Save } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useRef, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

export function AppSidebar() {
  const { isRtl } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = user ? useUser() : { user: null }; // Safe check
  const actualUser = useUser().user;
  const db = useFirestore();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAudioOpen, setIsAudioOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const unreadNotifsQuery = useMemoFirebase(() => {
    if (!actualUser) return null;
    return query(collection(db, "notifications"), where("userId", "==", actualUser.uid), where("read", "==", false));
  }, [db, actualUser]);
  const { data: unreadNotifs = [] } = useCollection<any>(unreadNotifsQuery);

  const navItems = [
    { icon: Home, href: "/", label: "Home" },
    { icon: MessageSquare, href: "/messages", label: "Messages" },
    { icon: Plus, href: "#", label: "Add", special: true },
    { icon: Bell, href: "/notifications", label: "Notifications", hasBadge: unreadNotifs.length > 0 },
    { icon: User, href: actualUser ? "/profile" : "/auth", label: "Profile", isAvatar: true },
  ];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      toast({ variant: "destructive", title: "Mic Access Required" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleAudioSave = () => {
    if (audioUrl) {
      toast({ title: isRtl ? "تم الحفظ" : "Saved", description: isRtl ? "يمكنك الآن استخدامه في المنشورات." : "You can now use it in posts." });
      setIsAudioOpen(false);
      setAudioUrl(null);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsSheetOpen(false);
      if (files.length > 1) {
        const urls = Array.from(files).map(f => URL.createObjectURL(f));
        sessionStorage.setItem('pending_album_images', JSON.stringify(urls));
        router.push('/create-post?source=album');
      } else {
        const imageUrl = URL.createObjectURL(files[0]);
        router.push(`/edit-image?image=${encodeURIComponent(imageUrl)}`);
      }
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const videoUrl = URL.createObjectURL(file);
      setIsSheetOpen(false);
      router.push(`/edit-video?video=${encodeURIComponent(videoUrl)}`);
    }
  };

  const createOptions = [
    { icon: ImageIcon, label: isRtl ? "الصور" : "Images", color: "bg-green-500", onClick: () => imageInputRef.current?.click() },
    { icon: Video, label: isRtl ? "فيديو" : "Videos", color: "bg-blue-500", onClick: () => videoInputRef.current?.click() },
    { 
      icon: Mic, 
      label: isRtl ? "صوت" : "Audio", 
      color: "bg-orange-500", 
      onClick: () => { 
        setIsSheetOpen(false); 
        setIsAudioOpen(true);
      } 
    },
    { icon: PenLine, label: isRtl ? "نشر" : "Post", color: "bg-primary", onClick: () => { setIsSheetOpen(false); router.push("/create-post"); } },
  ];

  return (
    <aside className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-black/90 backdrop-blur-xl border-t border-zinc-900 z-50 px-2 h-16 shadow-2xl flex justify-around items-center">
      <input type="file" accept="image/*" multiple className="hidden" ref={imageInputRef} onChange={handleImageChange} />
      <input type="file" accept="video/*" className="hidden" ref={videoInputRef} onChange={handleVideoChange} />

      {navItems.map((item, idx) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        
        if (item.special) {
          return (
            <Sheet key="create-sheet" open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <div className="p-1">
                  <Button className="h-12 w-12 rounded-2xl bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/5 active:scale-95 transition-transform">
                    <Plus className="h-7 w-7 stroke-[3px]" />
                  </Button>
                </div>
              </SheetTrigger>
              <SheetContent side="bottom" className="bg-zinc-950 border-zinc-900 rounded-t-[3rem] pb-12 outline-none">
                <SheetHeader className="mb-8 pt-2">
                  <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-6" />
                  <SheetTitle className="text-white text-center font-bold text-xl">{isRtl ? "إضافة محتوى" : "Create New"}</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-4 gap-2 px-2">
                  {createOptions.map((opt, index) => (
                    <div key={index} className="flex flex-col items-center gap-3 group cursor-pointer" onClick={opt.onClick}>
                      <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center text-white transition-all group-active:scale-90 shadow-xl", opt.color)}>
                        <opt.icon className="h-7 w-7" />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter text-center">{opt.label}</span>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          );
        }

        return (
          <Link key={idx} href={item.href} className="flex-1">
            <div className="flex flex-col items-center justify-center relative h-full active:scale-90 transition-transform">
              {item.isAvatar ? (
                <Avatar className={cn("h-7 w-7 transition-all", isActive ? "ring-2 ring-white ring-offset-2 ring-offset-black" : "opacity-60")}>
                  <AvatarImage src={actualUser?.photoURL || ""} />
                  <AvatarFallback>{actualUser?.displayName?.[0] || "U"}</AvatarFallback>
                </Avatar>
              ) : (
                <div className="relative">
                  <item.icon className={cn("h-7 w-7 transition-colors", isActive ? "text-white stroke-[2.5px]" : "text-zinc-600")} />
                  {item.hasBadge && <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-black" />}
                </div>
              )}
              <div className={cn("h-1 w-1 rounded-full mt-1.5 transition-all", isActive ? "bg-white opacity-100" : "bg-transparent opacity-0")} />
            </div>
          </Link>
        );
      })}

      <Dialog open={isAudioOpen} onOpenChange={setIsAudioOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-[90%] rounded-[2.5rem] p-8">
          <DialogHeader><DialogTitle className="text-center font-black uppercase">{isRtl ? "تسجيل سيادي" : "Voice Note"}</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center py-10 gap-10">
             <div className={cn("h-24 w-24 rounded-full flex items-center justify-center transition-all duration-500 relative", isRecording ? "bg-red-500 animate-pulse" : "bg-zinc-900")}>
                {isRecording && <div className="absolute inset-0 rounded-full border-4 border-red-500/30 animate-ping" />}
                <Mic className={cn("h-10 w-10", isRecording ? "text-white" : "text-primary")} />
             </div>
             
             {audioUrl && <audio src={audioUrl} controls className="w-full" />}

             <div className="flex gap-4 w-full">
                {!isRecording && !audioUrl ? (
                  <Button className="flex-1 h-14 rounded-2xl bg-white text-black font-black" onClick={startRecording}>{isRtl ? "بدء التسجيل" : "Start"}</Button>
                ) : isRecording ? (
                  <Button variant="destructive" className="flex-1 h-14 rounded-2xl font-black gap-2" onClick={stopRecording}><StopCircle className="h-5 w-5" /> {isRtl ? "إيقاف" : "Stop"}</Button>
                ) : (
                  <>
                    <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black" onClick={() => { setAudioUrl(null); chunksRef.current = []; }}>{isRtl ? "إعادة" : "Retry"}</Button>
                    <Button className="flex-1 h-14 rounded-2xl bg-primary text-white font-black gap-2" onClick={handleAudioSave}><Save className="h-5 w-5" /> {isRtl ? "حفظ" : "Save"}</Button>
                  </>
                )}
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
