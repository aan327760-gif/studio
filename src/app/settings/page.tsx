
"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { 
  ChevronRight, 
  Languages, 
  ShieldCheck, 
  BellRing, 
  CircleHelp, 
  Info, 
  ArrowLeft,
  Moon,
  Lock,
  EyeOff,
  Hammer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { language, setLanguage, isRtl } = useLanguage();
  const router = useRouter();

  const handleUnderDev = () => {
    toast({
      title: isRtl ? "قيد التطوير" : "Under Development",
      description: isRtl ? "هذه الميزة ستتوفر قريباً." : "This feature will be available soon.",
    });
  };

  const menuItems = [
    { 
      title: isRtl ? "اللغة" : "Language", 
      icon: Languages, 
      value: language === "ar" ? "العربية" : "English",
      onClick: () => setLanguage(language === "ar" ? "en" : "ar")
    },
    { 
      title: isRtl ? "الخصوصية" : "Privacy", 
      icon: ShieldCheck, 
      onClick: handleUnderDev,
      isDev: true
    },
    { 
      title: isRtl ? "التنبيهات" : "Notifications", 
      icon: BellRing, 
      onClick: handleUnderDev,
      isDev: true
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-800">
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md px-4 py-4 flex items-center gap-4 border-b border-zinc-900">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
          <ArrowLeft className={isRtl ? "rotate-180" : ""} />
        </Button>
        <h1 className="text-xl font-bold">{isRtl ? "الإعدادات" : "Settings"}</h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="p-4 space-y-6">
          
          <section>
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 px-2">
              {isRtl ? "التفضيلات" : "Preferences"}
            </h2>
            <div className="bg-zinc-900/30 rounded-2xl border border-zinc-900 overflow-hidden">
              {menuItems.map((item, i) => (
                <div key={i}>
                  <div 
                    className="flex items-center justify-between p-4 hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={item.onClick}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-8 rounded-full bg-zinc-900 flex items-center justify-center">
                        <item.icon className="h-4 w-4 text-zinc-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.title}</span>
                        {item.isDev && (
                          <span className="text-[8px] text-primary font-bold uppercase">{isRtl ? "قيد التطوير" : "Under Dev"}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.value && <span className="text-xs text-zinc-500">{item.value}</span>}
                      <ChevronRight className={cn("h-4 w-4 text-zinc-700", isRtl ? "rotate-180" : "")} />
                    </div>
                  </div>
                  {i < menuItems.length - 1 && <Separator className="bg-zinc-900" />}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 px-2">
              {isRtl ? "الأمان" : "Security"}
            </h2>
            <div className="bg-zinc-900/30 rounded-2xl border border-zinc-900 overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-zinc-900 flex items-center justify-center">
                    <Lock className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{isRtl ? "حساب خاص" : "Private Account"}</span>
                    <span className="text-[8px] text-primary font-bold uppercase">{isRtl ? "قيد التطوير" : "Under Dev"}</span>
                  </div>
                </div>
                <Switch disabled />
              </div>
              <Separator className="bg-zinc-900" />
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-zinc-900 flex items-center justify-center">
                    <EyeOff className="h-4 w-4 text-zinc-400" />
                  </div>
                  <span className="text-sm font-medium">{isRtl ? "إخفاء عدد الإعجابات" : "Hide Like Counts"}</span>
                </div>
                <Switch checked onCheckedChange={handleUnderDev} />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 px-2">
              {isRtl ? "عن التطبيق" : "About"}
            </h2>
            <div className="bg-zinc-900/30 rounded-2xl border border-zinc-900 overflow-hidden">
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5" onClick={handleUnderDev}>
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-zinc-900 flex items-center justify-center">
                    <CircleHelp className="h-4 w-4 text-zinc-400" />
                  </div>
                  <span className="text-sm font-medium">{isRtl ? "مركز المساعدة" : "Help Center"}</span>
                </div>
                <ChevronRight className={cn("h-4 w-4 text-zinc-700", isRtl ? "rotate-180" : "")} />
              </div>
              <Separator className="bg-zinc-900" />
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-zinc-900 flex items-center justify-center">
                    <Info className="h-4 w-4 text-zinc-400" />
                  </div>
                  <span className="text-sm font-medium">{isRtl ? "الإصدار" : "Version"}</span>
                </div>
                <span className="text-xs text-zinc-600 font-mono">v1.0.0-BETA</span>
              </div>
            </div>
          </section>

          <div className="text-center pt-10 pb-4">
            <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
              Created by Unbound Team 2026
            </p>
          </div>
        </div>
      </main>

      <AppSidebar />
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
