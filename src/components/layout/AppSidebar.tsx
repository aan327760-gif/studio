
"use client";

import { Home, Search, Plus, Bell, User, Video, Mic, Image as ImageIcon, PenLine } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function AppSidebar() {
  const { isRtl, t } = useLanguage();
  const pathname = usePathname();

  const navItems = [
    { icon: Home, href: "/", label: "Home" },
    { icon: Search, href: "/explore", label: "Search" },
    { icon: Plus, href: "#", label: "Add", special: true },
    { icon: Bell, href: "/notifications", label: "Notifications" },
    { icon: User, href: "/profile", label: "Profile", isAvatar: true },
  ];

  const createOptions = [
    { icon: Video, label: isRtl ? "بدء بث مباشر" : "Start Live", color: "bg-blue-500" },
    { icon: Mic, label: isRtl ? "المساحات" : "Spaces", color: "bg-purple-500" },
    { icon: ImageIcon, label: isRtl ? "الصور" : "Images", color: "bg-green-500" },
    { icon: PenLine, label: isRtl ? "نشر" : "Post", color: "bg-primary" },
  ];

  return (
    <aside className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-black border-t border-zinc-800 z-50 px-4 py-2 flex justify-around items-center h-16 shadow-2xl">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        
        if (item.special) {
          return (
            <Sheet key="create-sheet">
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 rounded-lg text-white hover:bg-white/10"
                >
                  <Plus className="h-8 w-8" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="bg-zinc-950 border-zinc-800 rounded-t-3xl pb-10">
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-white text-center">
                    {isRtl ? "إنشاء جديد" : "Create New"}
                  </SheetTitle>
                </SheetHeader>
                <div className="flex justify-around items-center gap-2">
                  {createOptions.map((opt, index) => (
                    <div key={index} className="flex flex-col items-center gap-2 group cursor-pointer">
                      <div className={cn(
                        "h-14 w-14 rounded-full flex items-center justify-center text-white transition-transform group-active:scale-95 shadow-lg",
                        opt.color
                      )}>
                        <opt.icon className="h-7 w-7" />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-400 text-center leading-tight max-w-[60px]">
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
          <Link key={item.href} href={item.href}>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-12 w-12 rounded-full transition-all",
                isActive ? "text-white" : "text-muted-foreground"
              )}
            >
              {item.isAvatar ? (
                <Avatar className={cn("h-7 w-7 border", isActive ? "border-white" : "border-transparent")}>
                  <AvatarImage src="https://picsum.photos/seed/me/50/50" />
                  <AvatarFallback>U</AvatarFallback>
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
