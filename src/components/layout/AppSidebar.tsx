"use client";

import { Home, MessageSquare, Plus, Bell, User, Video, ImageIcon, PenLine } from "lucide-react";
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
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

export function AppSidebar() {
  const { isRtl } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const unreadNotifsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, "notifications"), where("userId", "==", user.uid), where("read", "==", false));
  }, [db, user]);
  const { data: unreadNotifs = [] } = useCollection<any>(unreadNotifsQuery);

  const navItems = [
    { icon: Home, href: "/", label: "Home" },
    { icon: MessageSquare, href: "/messages", label: "Messages" },
    { icon: Plus, href: "#", label: "Add", special: true },
    { icon: Bell, href: "/notifications", label: "Notifications", hasBadge: unreadNotifs.length > 0 },
    { icon: User, href: user ? `/profile/${user.uid}` : "/auth", label: "Profile", isAvatar: true },
  ];

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
    { icon: ImageIcon, label: isRtl ? "الصور" : "Images", color: "bg-emerald-500", onClick: () => imageInputRef.current?.click() },
    { icon: Video, label: isRtl ? "فيديو" : "Videos", color: "bg-blue-500", onClick: () => videoInputRef.current?.click() },
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
                  <Button className="h-12 w-12 rounded-2xl bg-white text-black hover:bg-zinc-200 shadow-lg active:scale-95 transition-transform">
                    <Plus className="h-7 w-7 stroke-[3px]" />
                  </Button>
                </div>
              </SheetTrigger>
              <SheetContent side="bottom" className="bg-zinc-950 border-zinc-900 rounded-t-[3rem] pb-12 outline-none">
                <SheetHeader className="mb-8 pt-2">
                  <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-6" />
                  <SheetTitle className="text-white text-center font-black text-xl uppercase tracking-tighter">{isRtl ? "إضافة محتوى" : "Sovereign Input"}</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-3 gap-4 px-4">
                  {createOptions.map((opt, index) => (
                    <div key={index} className="flex flex-col items-center gap-3 group cursor-pointer" onClick={opt.onClick}>
                      <div className={cn("h-16 w-16 rounded-3xl flex items-center justify-center text-white transition-all group-active:scale-90 shadow-xl", opt.color)}>
                        <opt.icon className="h-8 w-8" />
                      </div>
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">{opt.label}</span>
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
                <Avatar className={cn("h-7 w-7 transition-all", isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-black" : "opacity-60")}>
                  <AvatarImage src={user?.photoURL || ""} />
                  <AvatarFallback className="bg-zinc-900 font-black">{user?.displayName?.[0] || "U"}</AvatarFallback>
                </Avatar>
              ) : (
                <div className="relative">
                  <item.icon className={cn("h-7 w-7 transition-colors", isActive ? "text-primary stroke-[2.5px]" : "text-zinc-600")} />
                  {item.hasBadge && <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full border-2 border-black animate-pulse" />}
                </div>
              )}
              <div className={cn("h-1 w-1 rounded-full mt-1.5 transition-all", isActive ? "bg-primary opacity-100" : "bg-transparent opacity-0")} />
            </div>
          </Link>
        );
      })}
    </aside>
  );
}