"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit, orderBy } from "firebase/firestore";
import { Bookmark, Loader2, Archive, Zap } from "lucide-react";
import { PostCard } from "@/components/feed/PostCard";
import { cn } from "@/lib/utils";

export default function BookmarksPage() {
  const { isRtl } = useLanguage();
  const db = useFirestore();
  const { user } = useUser();

  // جلب المنشورات التي قام المستخدم بحفظها
  const savedPostsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, "posts"),
      where("savedBy", "array-contains", user.uid),
      limit(50)
    );
  }, [db, user]);

  const { data: savedPosts = [], loading } = useCollection<any>(savedPostsQuery);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-900">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md px-6 py-5 border-b border-zinc-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
             <Archive className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase">
            {isRtl ? "الأرشيف السيادي" : "Sovereign Archive"}
          </h1>
        </div>
        <div className="flex items-center gap-1">
           <Zap className="h-3 w-3 text-zinc-600 fill-zinc-600" />
           <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Phase 2 Core</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        {loading ? (
          <div className="flex justify-center py-40"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" /></div>
        ) : savedPosts.length > 0 ? (
          <div className="flex flex-col">
            {savedPosts.map((post: any) => (
              <PostCard 
                key={post.id} 
                id={post.id} 
                author={post.author} 
                content={post.content} 
                image={post.mediaUrl} 
                mediaUrls={post.mediaUrls} 
                mediaType={post.mediaType} 
                likes={post.likesCount || 0} 
                saves={post.savesCount || 0} 
                likedBy={post.likedBy} 
                savedBy={post.savedBy}
                commentsCount={post.commentsCount}
                time={post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : ""} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-40 opacity-20 flex flex-col items-center gap-6 px-10">
            <Bookmark className="h-16 w-16" />
            <div className="space-y-2">
              <p className="text-sm font-black uppercase tracking-widest">{isRtl ? "الأرشيف فارغ" : "Archive Empty"}</p>
              <p className="text-[10px] font-bold leading-relaxed">{isRtl ? "احفظ الأفكار التي تلهمك لتبني مرجعك المعرفي هنا." : "Save insights that inspire you to build your knowledge base here."}</p>
            </div>
          </div>
        )}
      </main>

      <AppSidebar />
    </div>
  );
}
