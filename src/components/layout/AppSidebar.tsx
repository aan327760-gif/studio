
"use client";

import { Home, Search, Plus, Bell, User } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppSidebar() {
  const { isRtl } = useLanguage();
  const pathname = usePathname();

  const navItems = [
    { icon: Home, href: "/", label: "Home" },
    { icon: Search, href: "/explore", label: "Search" },
    { icon: Plus, href: "/create", label: "Add", special: true },
    { icon: Bell, href: "/notifications", label: "Notifications" },
    { icon: User, href: "/profile", label: "Profile", isAvatar: true },
  ];

  return (
    <aside className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-black border-t border-zinc-800 z-50 px-4 py-2 flex justify-around items-center h-16 shadow-2xl">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        
        if (item.special) {
          return (
            <Link key={item.href} href={item.href}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 rounded-lg text-white hover:bg-white/10"
              >
                <Plus className="h-8 w-8" />
              </Button>
            </Link>
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
