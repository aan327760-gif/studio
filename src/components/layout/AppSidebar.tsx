
"use client";

import { Home, Newspaper, Plus, Bell, User, Globe, Search, BookOpen } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/firebase";

export function AppSidebar() {
  const { isRtl } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();

  const navItems = [
    { icon: Home, href: "/", label: "Home" },
    { icon: Search, href: "/explore", label: "Explore" },
    { icon: Plus, href: "/create-post", label: "Write", special: true },
    { icon: Bell, href: "/notifications", label: "Alerts" },
    { icon: User, href: user ? `/profile/${user.uid}` : "/auth", label: "Profile", isAvatar: true },
  ];

  return (
    <aside className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-black/95 backdrop-blur-xl border-t border-zinc-900 z-50 h-16 shadow-2xl flex justify-around items-center px-4">
      {navItems.map((item, idx) => {
        const isActive = pathname === item.href;
        
        if (item.special) {
          return (
            <Link key="write" href="/create-post">
              <Button className="h-12 w-12 rounded-2xl bg-primary text-white hover:bg-primary/90 shadow-lg active:scale-95 transition-all">
                <Plus className="h-7 w-7 stroke-[3px]" />
              </Button>
            </Link>
          );
        }

        return (
          <Link key={idx} href={item.href} className="flex-1 flex flex-col items-center justify-center gap-1 active:scale-90 transition-transform">
            {item.isAvatar ? (
              <Avatar className={cn("h-7 w-7 border-2", isActive ? "border-primary" : "border-transparent opacity-60")}>
                <AvatarImage src={user?.photoURL || ""} />
                <AvatarFallback className="bg-zinc-900 font-black text-[8px]">U</AvatarFallback>
              </Avatar>
            ) : (
              <item.icon className={cn("h-6 w-6 transition-colors", isActive ? "text-primary" : "text-zinc-600")} />
            )}
            <span className={cn("text-[8px] font-black uppercase tracking-widest", isActive ? "text-primary" : "text-zinc-700")}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </aside>
  );
}
