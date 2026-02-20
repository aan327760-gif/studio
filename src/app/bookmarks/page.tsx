
"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit } from "firebase/firestore";
import { Bookmark, Loader2, Archive, Zap } from "lucide-react";
import { PostCard } from "@/components/feed/PostCard";

export default function BookmarksPage() {
  const { isRtl } = useLanguage();
  const db = useFirestore();
  const { user } = useUser();

  const savedArticlesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, "articles"),
      where("savedBy", "array-contains", user.uid),
      limit(50)
    );
  }, [db, user]);

  const { data: savedArticles = [], isLoading } = useCollection<any>(savedArticlesQuery);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-900">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md px-6 py-5 border-b border-zinc-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
             <Archive className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase">
            {isRtl ? "الأرشيف القومي" : "National Archive"}
          </h1>
        </div>
        <div className="flex items-center gap-1">
           <Zap className="h-3 w-3 text-zinc-600 fill-zinc-600" />
           <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Sovereign Record</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        {isLoading ? (
          <div className="flex justify-center py-40"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" /></div>
        ) : savedArticles && savedArticles.length > 0 ? (
          <div className="flex flex-col">
            {savedArticles.map((article: any) => (
              <PostCard 
                key={article.id} 
                id={article.id} 
                author={{name: article.authorName, uid: article.authorId, nationality: article.authorNationality}} 
                content={article.content} 
                image={article.mediaUrl} 
                likes={article.likesCount || 0} 
                likedBy={article.likedBy} 
                savedBy={article.savedBy}
                commentsCount={article.commentsCount}
                time={article.createdAt?.toDate ? article.createdAt.toDate().toLocaleString() : ""} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-40 opacity-20 flex flex-col items-center gap-6 px-10">
            <Bookmark className="h-16 w-16" />
            <div className="space-y-2">
              <p className="text-sm font-black uppercase tracking-widest">{isRtl ? "الأرشيف فارغ" : "Archive Empty"}</p>
              <p className="text-[10px] font-bold leading-relaxed">{isRtl ? "احفظ المقالات التي تهمك لتبني مرجعك المعرفي هنا." : "Save articles that interest you to build your knowledge base here."}</p>
            </div>
          </div>
        )}
      </main>

      <AppSidebar />
    </div>
  );
}
