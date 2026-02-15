"use client";

import { Home, MessageSquare, Plus, Bell, User, Video, Mic, ImageIcon, PenLine, Bookmark } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [isProclamationOpen, setIsProclamationOpen] = useState(false);
  
  const userProfileRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<any>(userProfileRef);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const unreadNotifsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, "notifications"), where("userId", "==", user.uid), where("read", "==", false));
  }, [db, user]);
  const { data: unreadNotifs = [] } = useCollection<any>(unreadNotifsQuery);

  const navItems = [
    { icon: Home, href: "/", label: "Home" },
    { icon: Bookmark, href: "/bookmarks", label: "Archive" },
    { icon: Plus, href: "#", label: "Add", special: true },
    { icon: Bell, href: "/notifications", label: "Notifications", hasBadge: unreadNotifs.length > 0 },
    { 
      icon: User, 
      href: user ? "/profile" : "/auth", 
      label: "Profile", 
      isAvatar: true 
    },
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
      onClick: () => {
        setIsSheetOpen(false);
        if (profile?.isVerified || profile?.isPro || user?.email === ADMIN_EMAIL) {
          setIsProclamationOpen(true);
        } else {
          toast({
            title: isRtl ? "امتياز سيادي محدود" : "Sovereign Privilege",
            description: isRtl 
              ? "عذراً، ميزة الساحة الصوتية متاحة حصرياً للمواطنين الموثقين والقنوات الإعلامية." 
              : "Sorry, the Acoustic Arena is exclusively available to verified citizens and media channels."
          });
        }
      }
    },
  ];

  return (
    <>
      <aside className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto glass border-t border-zinc-800 z-50 px-2 h-16 shadow-2xl flex justify-around items-center">
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
                    <SheetTitle className="text-white text-center font-bold text-xl">
                      {isRtl ? "إضافة محتوى" : "Create New"}
                    </SheetTitle>
                  </SheetHeader>
                  
                  <div className="grid grid-cols-4 gap-2 px-2">
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
                </SheetContent>
              </Sheet>
            );
          }

          return (
            <Link key={idx} href={item.href} className="flex-1">
              <div className="flex flex-col items-center justify-center relative h-full active:scale-90 transition-transform">
                {item.isAvatar ? (
                  <Avatar className={cn("h-7 w-7 transition-all", isActive ? "ring-2 ring-white ring-offset-2 ring-offset-black" : "opacity-60")}>
                    <AvatarImage src={user?.photoURL || ""} />
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

      <Dialog open={isProclamationOpen} onOpenChange={setIsProclamationOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white w-[92%] max-w-[400px] rounded-[2.5rem] p-0 shadow-2xl max-h-[85vh] overflow-hidden flex flex-col outline-none">
          <ScrollArea className="flex-1 p-6 sm:p-8">
            <DialogHeader className="space-y-6">
              <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-2">
                 <Mic className="h-8 w-8 sm:h-10 sm:w-10 text-purple-500 animate-pulse" />
              </div>
              <DialogTitle className="text-center font-black text-xl sm:text-2xl tracking-tighter uppercase">
                {isRtl ? "البيان التقني: الساحة الصوتية السيادية" : "Sovereign Acoustic Arena"}
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-center font-medium leading-relaxed text-sm sm:text-[15px]">
                {isRtl 
                  ? "إن هذه المساحة ليست مجرد أداة لتسجيل الأصوات، بل هي صرح إبستيمي (معرفي) صُمم ليكون منبراً للنخبة الفكرية، الأكاديميين، والمبدعين. نهدف من خلال 'الساحة الصوتية' إلى توفير بيئة رصينة تحتضن المحاضرات العلمية التخصصية، السجالات السياسية العميقة، والأعمال الموسيقية ذات الرسالة الهادفة. هنا، تصبح الكلمة المنطوقة وثيقة سيادية مسجلة، تعكس الرقي الحضاري لمجتمع 'بلا قيود'."
                  : "This space is not merely a recording tool, but an epistemic bastion designed as a forum for intellectual elites, academics, and creators. Through the 'Acoustic Arena', we aim to provide a formal environment for specialized scientific lectures, profound political discourse, and purposeful musical works. Here, the spoken word becomes a registered sovereign document, reflecting the societal depth of Unbound OS."}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-8 flex flex-col items-center gap-4 pb-4">
               <div className="h-[1px] w-24 bg-zinc-800" />
               <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">
                  Unbound Academic Core • v1.0.4
               </p>
            </div>
          </ScrollArea>
          <div className="p-6 pt-0 mt-auto border-t border-white/5 bg-zinc-950/80 backdrop-blur-md">
            <Button 
              className="w-full bg-white text-black hover:bg-zinc-200 font-black rounded-2xl h-14 shadow-xl active:scale-95 transition-transform" 
              onClick={() => setIsProclamationOpen(false)}
            >
              {isRtl ? "إقرار بالموافقة" : "Acknowledge & Close"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
