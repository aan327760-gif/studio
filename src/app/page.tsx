
"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { ArticleCard } from "@/components/feed/ArticleCard";
import { StoryBar } from "@/components/feed/StoryBar";
import { useLanguage } from "@/context/LanguageContext";
import { Newspaper, Award, Loader2, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, limit, where, doc } from "firebase/firestore";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "Politics", label: { ar: "سياسة", en: "Politics" } },
  { id: "Culture", label: { ar: "ثقافة", en: "Culture" } },
  { id: "Sports", label: { ar: "رياضة", en: "Sports" } },
  { id: "Economy", label: { ar: "اقتصاد", en: "Economy" } },
  { id: "National", label: { ar: "وطنية", en: "National" } },
];

export default function Home() {
  const { isRtl } = useLanguage();
  const db = useFirestore();
  const { user } = useUser();
  const [activeSection, setActiveSection] = useState("All");

  const userProfileRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<any>(userProfileRef);

  const articlesQuery = useMemoFirebase(() => {
    let baseRef = collection(db, "articles");
    if (activeSection === "All") {
      return query(baseRef, orderBy("priorityScore", "desc"), limit(50));
    }
    return query(baseRef, where("section", "==", activeSection), orderBy("priorityScore", "desc"), limit(50));
  }, [db, activeSection]);

  const { data: articles, isLoading } = useCollection<any>(articlesQuery);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-900">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md px-4 pt-4 pb-2 border-b border-zinc-900 shadow-xl shadow-black/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-2xl rotate-3 group-active:rotate-0 transition-transform">
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
              <Badge variant="outline" className="border-primary/30 text-primary h-8 px-3 rounded-full flex gap-2 items-center bg-primary/5 shadow-inner">
                <Award className="h-3 w-3" />
                <span className="font-black text-[10px] tracking-widest">{profile.points}</span>
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setActiveSection("All")}
            className={cn("rounded-full h-9 text-[10px] font-black uppercase px-5 tracking-widest transition-all", activeSection === "All" ? "bg-white text-black shadow-lg" : "bg-zinc-900 text-zinc-500")}
          >
            {isRtl ? "الأهم عالمياً" : "Global Pulse"}
          </Button>
          {SECTIONS.map((s) => (
            <Button 
              key={s.id} 
              variant="ghost" 
              size="sm"
              onClick={() => setActiveSection(s.id)}
              className={cn("rounded-full h-9 text-[10px] font-black uppercase px-5 shrink-0 tracking-widest transition-all", activeSection === s.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-zinc-900 text-zinc-500")}
            >
              {isRtl ? s.label.ar : s.label.en}
            </Button>
          ))}
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
            <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-30 animate-pulse">Synchronizing Sovereign Data</p>
          </div>
        ) : (
          <div className="flex flex-col animate-in fade-in duration-700">
            {articles && articles.length > 0 ? articles.map((article: any) => (
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
                <div className="space-y-2">
                   <p className="text-sm font-black uppercase tracking-[0.3em]">{isRtl ? "السجل القومي خاوٍ" : "National Record Empty"}</p>
                   <p className="text-[10px] font-bold leading-relaxed">{isRtl ? "كن أول من يخط فكره في تاريخ الجريدة." : "Be the first to write in the newspaper's history."}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <AppSidebar />
    </div>
  );
}
