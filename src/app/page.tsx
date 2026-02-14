"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { PostCard } from "@/components/feed/PostCard";
import { useLanguage } from "@/context/LanguageContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MessageSquare, Loader2, Sparkles, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, limit, where } from "firebase/firestore";

export default function Home() {
  const { isRtl } = useLanguage();
  const db = useFirestore();
  const { user: currentUser } = useUser();

  const discoverPostsQuery = useMemoFirebase(() => {
    return query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(20));
  }, [db]);
  const { data: discoverPosts, loading: discoverLoading } = useCollection<any>(discoverPostsQuery);

  const followsQuery = useMemoFirebase(() => {
    if (!currentUser) return null;
    return query(collection(db, "follows"), where("followerId", "==", currentUser.uid));
  }, [db, currentUser]);
  const { data: userFollows } = useCollection<any>(followsQuery);

  const followingIds = userFollows?.map(f => f.followingId) || [];

  const followingPostsQuery = useMemoFirebase(() => {
    if (!currentUser || followingIds.length === 0) return null;
    return query(
      collection(db, "posts"), 
      where("authorId", "in", followingIds.slice(0, 10)),
      orderBy("createdAt", "desc"),
      limit(20)
    );
  }, [db, currentUser, followingIds]);
  
  const { data: followingPosts, loading: followingLoading } = useCollection<any>(followingPostsQuery);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-900">
      <header className="sticky top-0 z-50 glass px-4 py-3 flex items-center justify-between border-b border-zinc-900">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-white/5">
             <span className="text-white font-black text-xl italic leading-none">U</span>
        </div>
        
        <h1 className="text-sm font-black uppercase tracking-[0.3em] opacity-40">Unbound</h1>

        <Link href="/lamma">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full h-10 w-10">
            <MessageSquare className="h-6 w-6" />
          </Button>
        </Link>
      </header>

      <Tabs defaultValue="discover" className="w-full">
        <TabsList className="w-full bg-black h-12 rounded-none p-0 border-b border-zinc-900 glass">
          <TabsTrigger 
            value="discover" 
            className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:text-white text-zinc-500 font-bold text-xs uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-primary transition-all"
          >
            {isRtl ? "اكتشف" : "Discover"}
          </TabsTrigger>
          <TabsTrigger 
            value="following" 
            className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:text-white text-zinc-500 font-bold text-xs uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-primary transition-all"
          >
            {isRtl ? "متابعة" : "Following"}
          </TabsTrigger>
        </TabsList>

        <main className="pb-32">
          <TabsContent value="discover" className="m-0 focus-visible:ring-0">
            {discoverLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest animate-pulse">Loading Feed</p>
              </div>
            ) : discoverPosts.length > 0 ? (
              <div className="flex flex-col">
                {discoverPosts.map((post: any) => (
                  <PostCard 
                    key={post.id} 
                    id={post.id}
                    author={post.author || { name: "User", handle: "user", avatar: "" }}
                    content={post.content}
                    image={post.mediaUrl}
                    mediaType={post.mediaType}
                    likes={post.likesCount || 0}
                    comments={0}
                    reposts={0}
                    time={post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : ""}
                  />
                ))}
              </div>
            ) : (
              <div className="py-24 px-10 text-center flex flex-col items-center gap-6">
                <div className="h-20 w-20 rounded-3xl bg-zinc-900 flex items-center justify-center border border-white/5">
                  <Sparkles className="h-10 w-10 text-zinc-700" />
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-lg">{isRtl ? "هدوء تام هنا..." : "Silence is deep..."}</p>
                  <p className="text-zinc-500 text-sm leading-relaxed">{isRtl ? "كن أول من يكسر الصمت ويشارك فكرة أو صورة." : "Be the one to break the silence. Share a thought or a snap."}</p>
                </div>
                <Link href="/create-post">
                  <Button className="rounded-full px-8 bg-white text-black font-bold h-12 shadow-xl active:scale-95 transition-transform">
                    {isRtl ? "ابدأ الآن" : "Start Now"}
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="following" className="m-0 focus-visible:ring-0">
            {!currentUser ? (
              <div className="py-32 px-10 text-center flex flex-col items-center gap-6">
                <div className="h-16 w-16 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5">
                  <UserPlus className="h-8 w-8 text-zinc-700" />
                </div>
                <p className="text-zinc-500 text-sm">{isRtl ? "سجل الدخول لرؤية ما يشاركه من تتابعهم." : "Sign in to see updates from the ones you follow."}</p>
                <Link href="/auth">
                  <Button className="rounded-full bg-white text-black font-bold px-8 h-12">
                    {isRtl ? "تسجيل الدخول" : "Sign In"}
                  </Button>
                </Link>
              </div>
            ) : followingLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
              </div>
            ) : followingPosts && followingPosts.length > 0 ? (
              <div className="flex flex-col">
                {followingPosts.map((post: any) => (
                  <PostCard 
                    key={post.id} 
                    id={post.id}
                    author={post.author || { name: "User", handle: "user", avatar: "" }}
                    content={post.content}
                    image={post.mediaUrl}
                    mediaType={post.mediaType}
                    likes={post.likesCount || 0}
                    comments={0}
                    reposts={0}
                    time={post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : ""}
                  />
                ))}
              </div>
            ) : (
              <div className="py-24 px-10 text-center flex flex-col items-center gap-6">
                <div className="h-20 w-20 rounded-3xl bg-zinc-900 flex items-center justify-center border border-white/5">
                  <UserPlus className="h-10 w-10 text-zinc-700" />
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-lg">{isRtl ? "لا متابعات بعد" : "No connections yet"}</p>
                  <p className="text-zinc-500 text-sm">{isRtl ? "ابدأ بمتابعة أشخاص لتظهر منشوراتهم هنا." : "Follow people to populate your feed."}</p>
                </div>
                <Link href="/explore">
                  <Button variant="outline" className="rounded-full border-zinc-800 font-bold h-12 px-8">
                    {isRtl ? "اكتشف أشخاصاً" : "Discover People"}
                  </Button>
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
