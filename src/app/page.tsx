
"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { ArticleCard } from "@/components/feed/ArticleCard";
import { StoryBar } from "@/components/feed/StoryBar";
import { useLanguage } from "@/context/LanguageContext";
import { Newspaper, Award, Loader2, TrendingUp, Sparkles, Megaphone, X } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, limit, doc, where, updateDoc } from "firebase/firestore";
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

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (window.matchMedia('(display-mode: standalone)').matches === false) {
        setShowInstallOverlay(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShowInstallOverlay(false);
    } else {
      alert(isRtl ? "يرجى اختيار 'إضافة إلى الصفحة الرئيسية' من المتصفح" : "Please select 'Add to Home Screen'");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-900">
      {showInstallOverlay && (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-2xl rotate-3 mb-8">
             <span className="text-white font-black text-4xl italic">ق</span>
          </div>
          <h2 className="text-2xl font-black mb-4 uppercase">{isRtl ? "تثبيت تطبيق القوميون" : "Install Qaumiyun"}</h2>
          <p className="text-zinc-500 text-sm mb-10">{isRtl ? "ثبت التطبيق لتفعيل السيادة الرقمية الكاملة." : "Install to activate full digital sovereignty."}</p>
          <Button onClick={handleInstallClick} className="w-full h-14 rounded-2xl bg-white text-black font-black">
            {isRtl ? "تثبيت الآن" : "Install Now"}
          </Button>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md px-4 py-4 border-b border-zinc-900 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center rotate-3">
             <span className="text-white font-black text-xl italic">ق</span>
          </div>
          <h1 className="text-lg font-black uppercase tracking-tighter">{isRtl ? "القوميون" : "Al-Qaumiyun"}</h1>
        </div>
        {profile && (
          <Badge variant="outline" className="border-primary/30 text-primary h-8 px-3 rounded-full flex gap-2 items-center">
            <Award className="h-3 w-3" />
            <span className="font-black text-[10px]">{profile.points}</span>
          </Badge>
        )}
      </header>

      <main className="pb-32">
        <StoryBar />
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          </div>
        ) : (
          <div className="flex flex-col">
            {articles?.map((article: any) => (
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
            ))}
          </div>
        )}
      </main>
      <AppSidebar />
    </div>
  );
}
