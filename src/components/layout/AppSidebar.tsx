
"use client";

import { Home, Search, Plus, Bell, User, Video, Mic, Image as ImageIcon, PenLine, X, StopCircle, LogOut, MessageSquare } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { signOut } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export function AppSidebar() {
  const { isRtl, t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const navItems = [
    { icon: Home, href: "/", label: "Home" },
    { icon: Search, href: "/explore", label: "Search" },
    { icon: Plus, href: "#", label: "Add", special: true },
    { icon: Bell, href: "/notifications", label: "Notifications" },
    { 
      icon: User, 
      href: user ? "/profile" : "/auth", 
      label: "Profile", 
      isAvatar: true 
    },
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setIsSheetOpen(false);
        router.push(`/edit-image?image=${encodeURIComponent(imageUrl)}`);
      };
      reader.readAsDataURL(file);
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

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setIsSheetOpen(false);
          router.push(`/create-post?audio=${encodeURIComponent(base64Audio)}`);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 60) {
            handleStopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not access microphone.",
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const createOptions = [
    { 
      icon: MessageSquare, 
      label: isRtl ? "مساحات" : "Spaces", 
      color: "bg-orange-500",
      onClick: () => {
        setIsSheetOpen(false);
        router.push("/lamma");
      }
    },
    { 
      icon: ImageIcon, 
      label: isRtl ? "الصور" : "Images", 
      color: "bg-green-500",
      onClick: () => imageInputRef.current?.click()
    },
    { 
      icon: Video, 
      label: isRtl ? "فيديو" : "Videos", 
      color: "bg-blue-500",
      onClick: () => videoInputRef.current?.click()
    },
    { 
      icon: PenLine, 
      label: isRtl ? "نشر" : "Post", 
      color: "bg-primary",
      onClick: () => {
        setIsSheetOpen(false);
        router.push("/create-post");
      }
    },
    { 
      icon: Mic, 
      label: isRtl ? "صوت" : "Voice", 
      color: "bg-purple-500",
      onClick: handleStartRecording
    },
  ];

  return (
    <aside className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-black border-t border-zinc-800 z-50 px-4 py-2 flex justify-around items-center h-16 shadow-2xl">
      <input type="file" accept="image/*,image/heic,image/heif,image/webp" className="hidden" ref={imageInputRef} onChange={handleImageChange} />
      <input type="file" accept="video/*,video/quicktime,video/mp4,video/webm" className="hidden" ref={videoInputRef} onChange={handleVideoChange} />

      {navItems.map((item) => {
        const isActive = pathname === item.href;
        
        if (item.special) {
          return (
            <Sheet key="create-sheet" open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg text-white hover:bg-white/10">
                  <Plus className="h-8 w-8" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="bg-zinc-950 border-zinc-800 rounded-t-3xl pb-10 outline-none">
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-white text-center">
                    {isRecording ? (isRtl ? "جاري التسجيل..." : "Recording...") : (isRtl ? "إنشاء جديد" : "Create New")}
                  </SheetTitle>
                </SheetHeader>
                
                {isRecording ? (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div className="text-4xl font-mono text-red-500 animate-pulse">
                      {formatTime(recordingTime)}
                    </div>
                    <Button variant="destructive" size="lg" className="rounded-full gap-2" onClick={handleStopRecording}>
                      <StopCircle className="h-6 w-6" />
                      {isRtl ? "إيقاف التسجيل" : "Stop Recording"}
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-around items-center gap-2">
                    {createOptions.map((opt, index) => (
                      <div key={index} className="flex flex-col items-center gap-2 group cursor-pointer" onClick={opt.onClick}>
                        <div className={cn("h-14 w-14 rounded-full flex items-center justify-center text-white transition-transform group-active:scale-95 shadow-lg", opt.color)}>
                          <opt.icon className="h-7 w-7" />
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 text-center leading-tight max-w-[60px]">
                          {opt.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </SheetContent>
            </Sheet>
          );
        }

        return (
          <Link key={item.href} href={item.href}>
            <Button variant="ghost" size="icon" className={cn("h-12 w-12 rounded-full transition-all", isActive ? "text-white" : "text-muted-foreground")}>
              {item.isAvatar ? (
                <Avatar className={cn("h-7 w-7 border", isActive ? "border-white" : "border-transparent")}>
                  <AvatarImage src={user?.photoURL || "https://picsum.photos/seed/me/50/50"} />
                  <AvatarFallback>{user?.displayName?.[0] || "U"}</AvatarFallback>
                </Avatar>
              ) : (
                <item.icon className={cn("h-7 w-7", isActive && "stroke-[2.5px]")} />
              )}
            </Button>
          </Link>
        );
      })}
    </aside>
  );
}
