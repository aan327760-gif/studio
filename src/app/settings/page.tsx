
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
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { useAuth } from "@/firebase";

export default function SettingsPage() {
  const { language, setLanguage, isRtl } = useLanguage();
  const router = useRouter();
  const auth = useAuth();

  const handleSignOut = async () => {
    if (confirm(isRtl ? "هل تريد تسجيل الخروج؟" : "Are you sure you want to sign out?")) {
      await signOut(auth);
      router.push("/auth");
    }
  };

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
      onClick: () => {
        const nextLang = language === "ar" ? "en" : "ar";
        setLanguage(nextLang);
        toast({ title: isRtl ? "تم تغيير اللغة" : "Language Changed" });
      }
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
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-900" onClick={() => router.back()}>
          <ArrowLeft className={cn("h-5 w-5", isRtl ? "rotate-180" : "")} />
        </Button>
        <h1 className="text-xl font-black tracking-tight">{isRtl ? "الإعدادات" : "Settings"}</h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="p-4 space-y-8">
          
          <section>
            <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4 px-2">
              {isRtl ? "التفضيلات" : "Preferences"}
            </h2>
            <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] overflow-hidden">
              {menuItems.map((item, i) => (
                <div key={i}>
                  <div 
                    className="flex items-center justify-between p-5 hover:bg-white/[0.02] cursor-pointer transition-colors"
                    onClick={item.onClick}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                        <item.icon className="h-5 w-5 text-zinc-400" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{item.title}</span>
                        {item.isDev && (
                          <span className="text-[8px] text-primary font-black uppercase tracking-widest">{isRtl ? "قريباً" : "Soon"}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.value && <span className="text-xs text-zinc-500 font-bold">{item.value}</span>}
                      <ChevronRight className={cn("h-4 w-4 text-zinc-800", isRtl ? "rotate-180" : "")} />
                    </div>
                  </div>
                  {i < menuItems.length - 1 && <Separator className="bg-zinc-900" />}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4 px-2">
              {isRtl ? "الأمان" : "Security"}
            </h2>
            <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] overflow-hidden">
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                    <Lock className="h-5 w-5 text-zinc-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{isRtl ? "حساب خاص" : "Private Account"}</span>
                    <span className="text-[8px] text-zinc-600 font-black tracking-widest uppercase">{isRtl ? "تحت التطوير" : "Coming Soon"}</span>
                  </div>
                </div>
                <Switch disabled />
              </div>
              <Separator className="bg-zinc-900" />
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                    <EyeOff className="h-5 w-5 text-zinc-400" />
                  </div>
                  <span className="text-sm font-bold">{isRtl ? "إخفاء التفاعلات" : "Hide Interactions"}</span>
                </div>
                <Switch checked onCheckedChange={handleUnderDev} />
              </div>
            </div>
          </section>

          <section>
             <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4 px-2">
              {isRtl ? "الحساب" : "Account"}
            </h2>
            <Button 
              variant="ghost" 
              className="w-full justify-start p-5 h-auto bg-zinc-950 border border-zinc-900 rounded-[2rem] hover:bg-red-500/10 hover:border-red-500/50 group transition-all"
              onClick={handleSignOut}
            >
              <div className="flex items-center gap-4 w-full">
                <div className="h-10 w-10 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover:bg-red-500 group-hover:text-white transition-all">
                  <LogOut className="h-5 w-5" />
                </div>
                <span className="text-sm font-black group-hover:text-red-500 transition-all">{isRtl ? "تسجيل الخروج" : "Sign Out"}</span>
              </div>
            </Button>
          </section>

          <div className="text-center pt-10 pb-4 opacity-20">
            <p className="text-[10px] font-black uppercase tracking-[0.5em]">
              UNBOUND OS v1.0
            </p>
          </div>
        </div>
      </main>

      <AppSidebar />
    </div>
  );
}
