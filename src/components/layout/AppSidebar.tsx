
"use client";

import { Home, Search, Plus, Bell, User, Video, Mic, ImageIcon, PenLine, X, StopCircle, MessageSquare, ShieldCheck } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";

const ADMIN_EMAIL = "adelbenmaza3@gmail.com";

export function AppSidebar() {
  const { isRtl } = useLanguage();
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

  // جلب بيانات المستخدم لمعرفة الدور
  const userRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<any>(userRef);
  const isAdmin = user?.email === ADMIN_EMAIL || profile?.role === 'admin';

  const unreadNotifsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, "notifications"), where("userId", "==", user.uid), where("read", "==", false));
  }, [db, user]);
  const { data: unreadNotifs = [] } = useCollection<any>(unreadNotifsQuery);

  const navItems = [
    { icon: Home, href: "/", label: "Home" },
    { icon: Search, href: "/explore", label: "Search" },
    { icon: Plus, href: "#", label: "Add", special: true },
    { icon: Bell, href: "/notifications", label: "Notifications", hasBadge: unreadNotifs.length > 0 },
    { 
      icon: User, 
      href: user ? "/profile" : "/auth", 
      label: "Profile", 
      isAvatar: true 
    },
  ];

  // إضافة رابط الإدارة للمدير
  if (isAdmin) {
    navItems.splice(4, 0, { icon: ShieldCheck, href: "/admin", label: "Management" });
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setIsSheetOpen(false);
      router.push(`/edit-image?image=${encodeURIComponent(imageUrl)}`);
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
        const audioUrl = URL.createObjectURL(blob);
        setIsSheetOpen(false);
        router.push(`/create-post?audio=${encodeURIComponent(audioUrl)}`);
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
    <aside className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto glass border-t border-zinc-800 z-50 px-2 h-16 shadow-2xl flex justify-around items-center">
      <input type="file" accept="image/*" className="hidden" ref={imageInputRef} onChange={handleImageChange} />
      <input type="file" accept="video/*" className="hidden" ref={videoInputRef} onChange={handleVideoChange} />

      {navItems.map((item, idx) => {
        const isActive = pathname === item.href;
        
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
                  <SheetTitle className="text-white text-center font-bold text-xl">
                    {isRecording ? (isRtl ? "جاري التسجيل..." : "Recording...") : (isRtl ? "إضافة محتوى" : "Create New")}
                  </SheetTitle>
                </SheetHeader>
                
                {isRecording ? (
                  <div className="flex flex-col items-center gap-6 py-4">
                    <div className="text-5xl font-mono text-red-500 animate-pulse">
                      {formatTime(recordingTime)}
                    </div>
                    <Button variant="destructive" size="lg" className="rounded-full h-14 px-8 font-bold gap-3" onClick={handleStopRecording}>
                      <StopCircle className="h-6 w-6" />
                      {isRtl ? "إيقاف وحفظ" : "Stop Recording"}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-2 px-2">
                    {createOptions.map((opt, index) => (
                      <div key={index} className="flex flex-col items-center gap-3 group cursor-pointer" onClick={opt.onClick}>
                        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center text-white transition-all group-active:scale-90 shadow-xl", opt.color)}>
                          <opt.icon className="h-7 w-7" />
                        </div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter text-center">
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
          <Link key={idx} href={item.href} className="flex-1">
            <div className="flex flex-col items-center justify-center relative h-full active:scale-90 transition-transform">
              {item.isAvatar ? (
                <Avatar className={cn("h-7 w-7 transition-all", isActive ? "ring-2 ring-white ring-offset-2 ring-offset-black" : "opacity-60")}>
                  <AvatarImage src={user?.photoURL || "https://picsum.photos/seed/me/50/50"} />
                  <AvatarFallback>{user?.displayName?.[0] || "U"}</AvatarFallback>
                </Avatar>
              ) : (
                <div className="relative">
                  <item.icon className={cn("h-7 w-7 transition-colors", isActive ? "text-white stroke-[2.5px]" : "text-zinc-600")} />
                  {item.hasBadge && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-black" />
                  )}
                </div>
              )}
              <div className={cn("h-1 w-1 rounded-full mt-1.5 transition-all", isActive ? "bg-white opacity-100" : "bg-transparent opacity-0")} />
            </div>
          </Link>
        );
      })}
    </aside>
  );
}
