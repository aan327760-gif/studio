
"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { 
  ChevronRight, 
  Languages, 
  ShieldCheck, 
  CircleHelp, 
  Info, 
  ArrowLeft,
  Lock,
  LogOut,
  ShieldAlert,
  Star,
  Globe,
  Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { useAuth, useUser, useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerificationBadge } from "@/components/ui/verification-badge";

export default function SettingsPage() {
  const { language, setLanguage, isRtl } = useLanguage();
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser();
  const db = useFirestore();

  const profileRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<any>(profileRef);

  const isAdmin = profile?.role === "admin" || user?.email === "adelbenmaza3@gmail.com";

  const handleSignOut = async () => {
    if (confirm(isRtl ? "هل تريد تسجيل الخروج؟" : "Are you sure you want to sign out?")) {
      await signOut(auth);
      router.push("/auth");
    }
  };

  const handleUnderDev = () => {
    toast({
      title: isRtl ? "قيد التطوير" : "Under Development",
      description: isRtl ? "هذه الميزة ستتوفر قريباً في التحديث القادم." : "This feature will be available in the next update.",
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-900 pb-20">
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md px-4 py-4 flex items-center gap-4 border-b border-zinc-900">
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-900" onClick={() => router.back()}>
          <ArrowLeft className={cn("h-5 w-5", isRtl ? "rotate-180" : "")} />
        </Button>
        <h1 className="text-xl font-black tracking-tight">{isRtl ? "الإعدادات" : "Settings"}</h1>
      </header>

      <main className="flex-1 overflow-y-auto">
        <section className="p-6">
          <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-primary/10" />
            <div className="flex items-center gap-4 relative z-10">
              <Avatar className="h-16 w-16 border-2 border-zinc-800 ring-2 ring-primary/20">
                <AvatarImage src={user?.photoURL || ""} />
                <AvatarFallback className="bg-zinc-900 text-xl font-black">{user?.displayName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="font-black text-lg truncate">{user?.displayName || (isRtl ? "مواطن" : "Citizen")}</h2>
                  {profile?.isVerified && <VerificationBadge className="h-4 w-4" />}
                  {profile?.isPro && (
                    <div className="flex items-center gap-0.5 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded-full">
                       <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                       <span className="text-[7px] font-black text-yellow-500 uppercase tracking-widest">{isRtl ? "إعلام" : "Media"}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-zinc-500 font-bold truncate">@{user?.email?.split('@')[0]}</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl font-black text-[10px] uppercase h-8 border-zinc-800" onClick={() => router.push('/profile')}>
                {isRtl ? "الملف" : "Profile"}
              </Button>
            </div>
          </div>
        </section>

        <div className="px-6 space-y-8 pb-10">
          <section>
            <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4 px-2">
              {isRtl ? "التفضيلات العامة" : "General Preferences"}
            </h2>
            <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] overflow-hidden">
              <div 
                className="flex items-center justify-between p-5 hover:bg-white/[0.02] cursor-pointer transition-colors"
                onClick={() => {
                  setLanguage(language === "ar" ? "en" : "ar");
                  toast({ title: isRtl ? "تم تغيير اللغة" : "Language Changed" });
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                    <Globe className="h-5 w-5 text-zinc-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{isRtl ? "اللغة" : "Language"}</span>
                    <span className="text-[10px] text-primary font-black uppercase">{language === "ar" ? "العربية" : "English"}</span>
                  </div>
                </div>
                <ChevronRight className={cn("h-4 w-4 text-zinc-800", isRtl ? "rotate-180" : "")} />
              </div>
              
              <Separator className="bg-zinc-900/50" />
              
              <div className="flex items-center justify-between p-5 hover:bg-white/[0.02] cursor-pointer transition-colors" onClick={handleUnderDev}>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                    <Palette className="h-5 w-5 text-zinc-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{isRtl ? "المظهر" : "Appearance"}</span>
                    <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">{isRtl ? "الوضع الداكن" : "Dark Mode"}</span>
                  </div>
                </div>
                <Switch checked disabled />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4 px-2">
              {isRtl ? "الأمان والخصوصية" : "Security & Privacy"}
            </h2>
            <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] overflow-hidden">
              <div className="flex items-center justify-between p-5 hover:bg-white/[0.02] cursor-pointer transition-colors" onClick={handleUnderDev}>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                    <Lock className="h-5 w-5 text-zinc-400" />
                  </div>
                  <span className="text-sm font-bold">{isRtl ? "خصوصية الحساب" : "Account Privacy"}</span>
                </div>
                <ChevronRight className={cn("h-4 w-4 text-zinc-800", isRtl ? "rotate-180" : "")} />
              </div>
              
              <Separator className="bg-zinc-900/50" />
              
              <div className="flex items-center justify-between p-5 hover:bg-white/[0.02] cursor-pointer transition-colors" onClick={handleUnderDev}>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                    <ShieldCheck className="h-5 w-5 text-zinc-400" />
                  </div>
                  <span className="text-sm font-bold">{isRtl ? "المصادقة الثنائية" : "Two-Factor Auth"}</span>
                </div>
                <Badge variant="outline" className="text-[8px] font-black border-zinc-800 text-zinc-500">OFF</Badge>
              </div>
            </div>
          </section>

          {isAdmin && (
            <section>
              <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 px-2">
                {isRtl ? "أدوات القيادة" : "Command Tools"}
              </h2>
              <Button 
                variant="ghost" 
                className="w-full justify-start p-5 h-auto bg-primary/5 border border-primary/20 rounded-[2rem] hover:bg-primary/10 hover:border-primary/40 group transition-all"
                onClick={() => router.push('/admin')}
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                    <ShieldAlert className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-black group-hover:text-primary transition-all">{isRtl ? "لوحة التحكم" : "Admin Dashboard"}</span>
                    <span className="text-[8px] font-bold text-primary/60 uppercase tracking-widest">{isRtl ? "صلاحيات كاملة" : "Full Access"}</span>
                  </div>
                </div>
              </Button>
            </section>
          )}

          <section>
            <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4 px-2">
              {isRtl ? "الدعم والمعلومات" : "Support & About"}
            </h2>
            <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] overflow-hidden">
              <div className="flex items-center justify-between p-5 hover:bg-white/[0.02] cursor-pointer transition-colors" onClick={() => router.push('/help')}>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                    <CircleHelp className="h-5 w-5 text-zinc-400" />
                  </div>
                  <span className="text-sm font-bold">{isRtl ? "مركز المساعدة" : "Help Center"}</span>
                </div>
                <ChevronRight className={cn("h-4 w-4 text-zinc-800", isRtl ? "rotate-180" : "")} />
              </div>
              <Separator className="bg-zinc-900/50" />
              <div className="flex items-center justify-between p-5 hover:bg-white/[0.02] cursor-pointer transition-colors" onClick={() => router.push('/about')}>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                    <Info className="h-5 w-5 text-zinc-400" />
                  </div>
                  <span className="text-sm font-bold">{isRtl ? "عن بلا قيود" : "About Unbound"}</span>
                </div>
                <span className="text-[10px] text-zinc-600 font-bold">v1.0.4</span>
              </div>
            </div>
          </section>

          <section>
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

          <div className="text-center pt-10 pb-4 opacity-10">
            <p className="text-[10px] font-black uppercase tracking-[0.5em]">
              UNBOUND SOVEREIGN OS
            </p>
          </div>
        </div>
      </main>

      <AppSidebar />
    </div>
  );
}
