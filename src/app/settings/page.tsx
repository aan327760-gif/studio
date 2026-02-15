"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { 
  ChevronRight, 
  CircleHelp, 
  Info, 
  ArrowLeft,
  LogOut,
  ShieldAlert,
  Globe,
  Palette,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { signOut } from "firebase/auth";
import { useAuth, useUser, useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { cn } from "@/lib/utils";

const SUPER_ADMIN_EMAIL = "adelbenmaza3@gmail.com";

export default function SettingsPage() {
  const { language, setLanguage, isRtl } = useLanguage();
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser();
  const db = useFirestore();

  const profileRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<any>(profileRef);

  const isSuper = user?.email === SUPER_ADMIN_EMAIL;

  const handleSignOut = async () => {
    if (confirm(isRtl ? "هل تريد تسجيل الخروج؟" : "Are you sure you want to sign out?")) {
      await signOut(auth);
      router.push("/auth");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-900 pb-20">
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl px-4 py-4 flex items-center gap-4 border-b border-zinc-900">
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-900" onClick={() => router.back()}>
          <ArrowLeft className={cn("h-5 w-5", isRtl ? "rotate-180" : "")} />
        </Button>
        <h1 className="text-xl font-black tracking-tight uppercase">{isRtl ? "الإعدادات" : "Settings"}</h1>
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
                  <h2 className="font-black text-lg truncate">{user?.displayName}</h2>
                  {(profile?.isVerified || isSuper) && <VerificationBadge className="h-4 w-4" />}
                </div>
                <p className="text-xs text-zinc-500 font-bold truncate">@{user?.email?.split('@')[0]}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="px-6 space-y-8 pb-10">
          {isSuper && (
            <section>
              <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 px-2">COMMAND CENTER</h2>
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
                    <span className="text-sm font-black group-hover:text-primary transition-all">{isRtl ? "غرفة العمليات" : "War Room"}</span>
                    <span className="text-[8px] font-bold text-primary/60 uppercase tracking-widest">ROOT ACCESS</span>
                  </div>
                </div>
              </Button>
            </section>
          )}

          <section>
            <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4 px-2">{isRtl ? "التفضيلات" : "Preferences"}</h2>
            <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] overflow-hidden">
              <div 
                className="flex items-center justify-between p-5 hover:bg-white/[0.02] cursor-pointer"
                onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800"><Globe className="h-5 w-5 text-zinc-400" /></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{isRtl ? "اللغة" : "Language"}</span>
                    <span className="text-[10px] text-primary font-black uppercase">{language === "ar" ? "العربية" : "English"}</span>
                  </div>
                </div>
                <ChevronRight className={cn("h-4 w-4 text-zinc-800", isRtl ? "rotate-180" : "")} />
              </div>
              <Separator className="bg-zinc-900/50" />
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800"><Palette className="h-5 w-5 text-zinc-400" /></div>
                  <span className="text-sm font-bold">{isRtl ? "الوضع الداكن" : "Dark Mode"}</span>
                </div>
                <Switch checked disabled />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4 px-2">{isRtl ? "عن بلا قيود" : "About Unbound"}</h2>
            <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] overflow-hidden">
              <div className="p-5 hover:bg-white/[0.02] cursor-pointer flex items-center justify-between" onClick={() => router.push('/about')}>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800"><Info className="h-5 w-5 text-zinc-400" /></div>
                  <span className="text-sm font-bold">{isRtl ? "من نحن" : "About Us"}</span>
                </div>
                <ChevronRight className={cn("h-4 w-4 text-zinc-800", isRtl ? "rotate-180" : "")} />
              </div>
              <Separator className="bg-zinc-900/50" />
              <div className="p-5 hover:bg-white/[0.02] cursor-pointer flex items-center justify-between" onClick={() => router.push('/guidelines')}>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800"><FileText className="h-5 w-5 text-zinc-400" /></div>
                  <span className="text-sm font-bold">{isRtl ? "ميثاق المجتمع" : "Community Charter"}</span>
                </div>
                <ChevronRight className={cn("h-4 w-4 text-zinc-800", isRtl ? "rotate-180" : "")} />
              </div>
              <Separator className="bg-zinc-900/50" />
              <div className="p-5 hover:bg-white/[0.02] cursor-pointer flex items-center justify-between" onClick={() => router.push('/help')}>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800"><CircleHelp className="h-5 w-5 text-zinc-400" /></div>
                  <span className="text-sm font-bold">{isRtl ? "مركز المساعدة والخصوصية" : "Help & Privacy"}</span>
                </div>
                <ChevronRight className={cn("h-4 w-4 text-zinc-800", isRtl ? "rotate-180" : "")} />
              </div>
            </div>
          </section>

          <section>
            <Button 
              variant="ghost" 
              className="w-full justify-start p-5 h-auto bg-zinc-950 border border-zinc-900 rounded-[2rem] hover:bg-red-500/10 transition-all"
              onClick={handleSignOut}
            >
              <div className="flex items-center gap-4 w-full">
                <div className="h-10 w-10 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800"><LogOut className="h-5 w-5" /></div>
                <span className="text-sm font-black group-hover:text-red-500 transition-all">{isRtl ? "تسجيل الخروج" : "Sign Out"}</span>
              </div>
            </Button>
          </section>
        </div>
      </main>
      <AppSidebar />
    </div>
  );
}
