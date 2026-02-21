
"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit } from "firebase/firestore";
import { Bookmark, Loader2, Archive } from "lucide-react";
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

  const { data: savedArticles, isLoading } = useCollection<any>(savedArticlesQuery);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative border-x border-zinc-900">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md px-6 py-5 border-b border-zinc-900 flex items-center justify-between">
        <h1 className="text-xl font-black uppercase">{isRtl ? "الأرشيف" : "Archive"}</h1>
        <Bookmark className="h-5 w-5 text-primary" />
      </header>
      <main className="flex-1 overflow-y-auto pb-32">
        {isLoading ? (
          <div className="flex justify-center py-40"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" /></div>
        ) : (savedArticles && savedArticles.length > 0) ? (
          <div className="flex flex-col">
            {savedArticles.map((article: any) => (
              <PostCard 
                key={article.id} 
                id={article.id} 
                author={{ name: article.authorName, uid: article.authorId }} 
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
          <div className="text-center py-40 opacity-20 flex flex-col items-center gap-6">
            <Archive className="h-16 w-16" />
            <p className="text-sm font-black uppercase">{isRtl ? "الأرشيف فارغ" : "Archive Empty"}</p>
          </div>
        )}
      </main>
      <AppSidebar />
    </div>
  );
}
