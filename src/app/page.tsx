
"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { ArticleCard } from "@/components/feed/ArticleCard";
import { StoryBar } from "@/components/feed/StoryBar";
import { useLanguage } from "@/context/LanguageContext";
import { Newspaper, Award, Loader2, TrendingUp, Sparkles, Megaphone, X } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, limit, doc, where } from "firebase/firestore";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { isRtl } = useLanguage();
  const db = useFirestore();
  const { user } = useUser();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallOverlay, setShowInstallOverlay] = useState(false);

  const userProfileRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<any>(userProfileRef);

  const articlesQuery = useMemoFirebase(() => {
    return query(collection(db, "articles"), orderBy("priorityScore", "desc"), limit(50));
  }, [db]);

  const { data: articles, isLoading } = useCollection<any>(articlesQuery);

  const broadcastQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, "notifications"), 
      where("userId", "==", user.uid),
      where("type", "==", "system"),
      where("read", "==", false),
      orderBy("createdAt", "desc"),
      limit(1)
    );
  }, [db, user]);
  const { data: broadcasts } = useCollection<any>(broadcastQuery);
  const latestBroadcast = broadcasts?.[0];

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (window.matchMedia('(display-mode: standalone)').matches === false) {
        setShowInstallOverlay(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallOverlay(false);
    }
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallOverlay(false);
      }
    } else {
      alert(isRtl ? "يرجى الضغط على زر المشاركة في متصفحك واختيار 'إضافة إلى الصفحة الرئيسية'" : "Please tap the share button and select 'Add to Home Screen'");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-900">
      {showInstallOverlay && (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
          <div className="w-24 h-24 rounded-[2.5rem] bg-primary flex items-center justify-center shadow-2xl rotate-3 mb-8">
             <span className="text-white font-black text-5xl italic">ق</span>
          </div>
          <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">
            {isRtl ? "تطبيق القوميون مطلوب" : "Qaumiyun App Required"}
          </h2>
          <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-10">
            {isRtl 
              ? "للوصول إلى السجل السيادي، يجب تثبيت التطبيق على جهازك. انقر أدناه لتفعيل السيادة الرقمية." 
              : "To access the sovereign record, you must install the app. Click below to activate digital sovereignty."}
          </p>
          <Button 
            onClick={handleInstallClick}
            className="w-full h-16 rounded-2xl bg-white text-black font-black text-lg shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95 transition-all"
          >
            {isRtl ? "تثبيت الآن" : "Install Now"}
          </Button>
          <p className="mt-6 text-[10px] text-zinc-700 font-black uppercase tracking-widest">Sovereign OS v1.0</p>
        </div>
      )}

      {latestBroadcast && (
        <div className="bg-primary p-3 flex items-center justify-between animate-in slide-in-from-top duration-500 z-[60]">
           <div className="flex items-center gap-3">
              <Megaphone className="h-4 w-4 text-white animate-bounce" />
              <p className="text-[10px] font-black uppercase tracking-tight text-white leading-none">
                {latestBroadcast.message}
              </p>
           </div>
           <Button variant="ghost" size="icon" className="h-6 w-6 text-white/50" onClick={() => {
             // Logic to mark as read
           }}><X className="h-3 w-3" /></Button>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md px-4 pt-4 pb-4 border-b border-zinc-900 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-2xl rotate-3">
               <span className="text-white font-black text-xl italic leading-none">ق</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-black uppercase tracking-tighter">{isRtl ? "القوميون" : "Al-Qaumiyun"}</h1>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-2 w-2 text-primary" />
                <span className="text-[7px] font-black text-zinc-500 uppercase tracking-[0.2em]">{isRtl ? "خوارزمية السيادة نشطة" : "Sovereign Algorithm Active"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile && (
              <Badge variant="outline" className="border-primary/30 text-primary h-8 px-3 rounded-full flex gap-2 items-center bg-primary/5">
                <Award className="h-3 w-3" />
                <span className="font-black text-[10px] tracking-widest">{profile.points}</span>
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="pb-32">
        <StoryBar />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative">
               <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
               <Sparkles className="h-4 w-4 text-primary absolute inset-0 m-auto animate-pulse" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-30 animate-pulse">Synchronizing Data</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {(articles && articles.length > 0) ? articles.map((article: any) => (
              <ArticleCard 
                key={article.id}
                id={article.id}
                author={{
                  name: article.authorName,
                  nationality: article.authorNationality,
                  uid: article.authorId,
                  isVerified: article.authorIsVerified,
                  email: article.authorEmail
                }}
                title={article.title}
                content={article.content}
                section={article.section}
                image={article.mediaUrl}
                likes={article.likesCount || 0}
                comments={article.commentsCount || 0}
                likedBy={article.likedBy}
                savedBy={article.savedBy}
                time={article.createdAt?.toDate ? article.createdAt.toDate().toLocaleDateString() : ""}
              />
            )) : (
              <div className="py-48 text-center opacity-20 flex flex-col items-center gap-6 px-10">
                <Newspaper className="h-20 w-20 stroke-[1px]" />
                <p className="text-sm font-black uppercase tracking-[0.3em]">{isRtl ? "السجل خاوٍ" : "Record Empty"}</p>
              </div>
            )}
          </div>
        )}
      </main>

      <AppSidebar />
    </div>
  );
}
