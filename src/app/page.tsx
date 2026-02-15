
"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { PostCard } from "@/components/feed/PostCard";
import { useLanguage } from "@/context/LanguageContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Loader2, Megaphone, Zap, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, limit, where } from "firebase/firestore";
import { useMemo } from "react";

const ADMIN_EMAIL = "adelbenmaza3@gmail.com";

export default function Home() {
  const { isRtl } = useLanguage();
  const db = useFirestore();
  const { user: currentUser } = useUser();

  // خوارزمية الاكتشاف السيادية (المحرك الرئيسي)
  const discoverPostsQuery = useMemoFirebase(() => {
    return query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(100));
  }, [db]);
  const { data: rawDiscoverPosts, loading: discoverLoading } = useCollection<any>(discoverPostsQuery);

  const discoverPosts = useMemo(() => {
    if (!rawDiscoverPosts) return [];

    return [...rawDiscoverPosts].sort((a, b) => {
      const getScore = (post: any) => {
        let score = 0;
        const author = post.author || {};
        
        // 1. وزن رتبة المواطن (Sovereign Rank Weight)
        if (author.isPro) score += 1000;
        if (author.isVerified || author.role === 'admin' || author.email === ADMIN_EMAIL) score += 500;
        
        // 2. وزن التفاعل البشري (Engagement Weight)
        score += (post.likesCount || 0) * 10;
        score += (post.commentsCount || 0) * 15; 
        score += (post.savesCount || 0) * 20;    
        
        // 3. وزن التوقيت (Time Decay Weight)
        const postTime = post.createdAt?.seconds ? post.createdAt.seconds * 1000 : Date.now();
        const hoursPassed = (Date.now() - postTime) / (1000 * 60 * 60);
        score -= hoursPassed * 25; // فقدان 25 نقطة كل ساعة لضمان تجدد المحتوى
        
        return score;
      };
      return getScore(b) - getScore(a);
    }).slice(0, 30);
  }, [rawDiscoverPosts]);

  // استعلام تنبيهات النظام الرسمية
  const systemAlertQuery = useMemoFirebase(() => {
    if (!currentUser) return null;
    return query(
      collection(db, "notifications"), 
      where("userId", "==", currentUser.uid),
      where("type", "==", "system")
    );
  }, [db, currentUser]);
  const { data: rawSystemAlerts = [] } = useCollection<any>(systemAlertQuery);

  const systemAlerts = useMemo(() => {
    return [...rawSystemAlerts].sort((a, b) => 
      (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    ).slice(0, 1);
  }, [rawSystemAlerts]);

  // استعلام المتابعة لرؤية أفكار الأصدقاء
  const followsQuery = useMemoFirebase(() => {
    if (!currentUser) return null;
    return query(collection(db, "follows"), where("followerId", "==", currentUser.uid), limit(100));
  }, [db, currentUser]);
  const { data: userFollows = [] } = useCollection<any>(followsQuery);

  const followingIds = useMemo(() => userFollows.map(f => f.followingId), [userFollows]);
  const followingIdsString = JSON.stringify(followingIds);

  const followingPostsQuery = useMemoFirebase(() => {
    const ids = JSON.parse(followingIdsString);
    if (!currentUser || ids.length === 0) return null;
    return query(collection(db, "posts"), where("authorId", "in", ids.slice(0, 30)));
  }, [db, currentUser, followingIdsString]);
  
  const { data: rawFollowingPosts = [], loading: followingLoading } = useCollection<any>(followingPostsQuery);

  const followingPosts = useMemo(() => {
    return [...rawFollowingPosts].sort((a, b) => 
      (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );
  }, [rawFollowingPosts]);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-900">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 rotate-3">
               <span className="text-white font-black text-xl italic leading-none">U</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xs font-black uppercase tracking-[0.3em] opacity-40 ml-1">Unbound</h1>
            <div className="flex items-center gap-1 ml-1">
               <Zap className="h-2 w-2 text-primary fill-primary" />
               <span className="text-[7px] font-black text-primary uppercase tracking-widest">{isRtl ? "الخوارزمية السيادية" : "Sovereign Algo"}</span>
            </div>
          </div>
        </div>

        <Link href="/explore">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full h-10 w-10">
            <Search className="h-6 w-6" />
          </Button>
        </Link>
      </header>

      {systemAlerts.length > 0 && (
        <div className="p-3 bg-primary/5 border-b border-primary/20 animate-in fade-in slide-in-from-top-4 duration-500">
           <div className="flex items-center gap-3 bg-zinc-950/50 p-3 rounded-2xl ring-1 ring-primary/20">
              <Megaphone className="h-4 w-4 text-primary shrink-0 animate-bounce" />
              <p className="text-[11px] font-bold text-zinc-200 line-clamp-1">{systemAlerts[0].message}</p>
              <Link href="/notifications" className="ml-auto text-[10px] font-black text-primary uppercase tracking-widest">{isRtl ? "عرض" : "View"}</Link>
           </div>
        </div>
      )}

      <Tabs defaultValue="discover" className="w-full">
        <TabsList className="w-full bg-black h-12 rounded-none p-0 border-b border-zinc-900 sticky top-[64px] z-40 backdrop-blur-md">
          <TabsTrigger value="discover" className="flex-1 h-full rounded-none text-zinc-500 font-black text-[10px] uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-primary transition-all">{isRtl ? "اكتشف" : "Discover"}</TabsTrigger>
          <TabsTrigger value="following" className="flex-1 h-full rounded-none text-zinc-500 font-black text-[10px] uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-primary transition-all">{isRtl ? "متابعة" : "Following"}</TabsTrigger>
        </TabsList>

        <main className="pb-32">
          <TabsContent value="discover" className="m-0">
            {discoverLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" /></div>
            ) : discoverPosts.map((post: any) => (
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
          </TabsContent>
          
          <TabsContent value="following" className="m-0">
            {followingLoading ? (
              <div className="flex flex-col items-center justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" /></div>
            ) : followingPosts.length > 0 ? (
              followingPosts.map((post: any) => (
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
              ))
            ) : (
              <div className="py-40 text-center opacity-20 flex flex-col items-center gap-6">
                <UserPlus className="h-16 w-16" />
                <p className="text-sm font-black uppercase tracking-widest">{isRtl ? "تابع المواطنين لرؤية أفكارهم" : "Follow citizens to see insights"}</p>
                <Link href="/explore">
                  <Button className="rounded-full bg-white text-black font-black">{isRtl ? "اكتشف الآن" : "Discover Now"}</Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </main>
      </Tabs>
      <AppSidebar />
    </div>
  );
}
