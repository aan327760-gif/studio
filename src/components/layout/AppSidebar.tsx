"use client";

import { Home, Compass, Users, User, Settings, LogOut, PlusCircle, MessageSquare } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const { t, isRtl } = useLanguage();
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: t("home"), href: "/" },
    { icon: Compass, label: t("explore"), href: "/explore" },
    { icon: Users, label: t("lamma"), href: "/lamma" },
    { icon: MessageSquare, label: t("comments"), href: "/messages" },
    { icon: User, label: t("profile"), href: "/profile" },
    { icon: Settings, label: t("settings"), href: "/settings" },
  ];

  return (
    <aside className={cn(
      "fixed bottom-0 w-full bg-white border-t z-50 md:sticky md:top-0 md:h-screen md:w-64 md:border-t-0 md:border-x px-4 py-2 flex md:flex-col justify-between items-center md:items-stretch shadow-lg md:shadow-none",
      isRtl ? "md:border-l" : "md:border-r"
    )}>
      <div className="hidden md:flex items-center gap-2 px-2 py-6 mb-4">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-lg leading-none">L</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-primary">{t("appName")}</h1>
      </div>

      <nav className="flex md:flex-col items-center md:items-stretch justify-around md:justify-start w-full gap-1 md:gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="w-full">
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-center md:justify-start gap-3 h-12 md:h-11 rounded-xl",
                  isActive && "text-primary font-semibold"
                )}
              >
                <item.icon className={cn("h-6 w-6 md:h-5 md:w-5", isActive && "text-primary")} />
                <span className="hidden md:inline">{item.label}</span>
              </Button>
            </Link>
          );
        })}
        
        <div className="md:mt-4 md:hidden">
          <Button variant="default" size="icon" className="h-10 w-10 rounded-full bg-accent hover:bg-accent/90">
            <PlusCircle className="h-6 w-6" />
          </Button>
        </div>
      </nav>

      <div className="hidden md:flex flex-col gap-2 mt-auto pb-6">
        <div className="flex items-center justify-between px-2 mb-2">
          <LanguageSwitcher />
        </div>
        <Button variant="ghost" className="justify-start gap-3 h-11 text-muted-foreground hover:text-destructive rounded-xl">
          <LogOut className="h-5 w-5" />
          <span>{isRtl ? "خروج" : "Logout"}</span>
        </Button>
      </div>
    </aside>
  );
}
