
"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { PostCard } from "@/components/feed/PostCard";
import { useLanguage } from "@/context/LanguageContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MessageSquare, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy, limit, where } from "firebase/firestore";

export default function Home() {
  const { t, isRtl } = useLanguage();
  const db = useFirestore();
  const { user: currentUser } = useUser();

  // "Discover" tab - shows all posts
  const discoverPostsQuery = useMemoFirebase(() => {
    return query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(20));
  }, [db]);
  const { data: discoverPosts, loading: discoverLoading } = useCollection<any>(discoverPostsQuery);

  // "Following" tab - fetch posts from followed users
  const followsQuery = useMemoFirebase(() => {
    if (!currentUser) return null;
    return query(collection(db, "follows"), where("followerId", "==", currentUser.uid));
  }, [db, currentUser]);
  const { data: userFollows } = useCollection<any>(followsQuery);

  const followingIds = userFollows.map(f => f.followingId);

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
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-800">
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-zinc-900">
        <div className="w-8" />
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mb-1">
             <span className="text-white font-bold text-xl italic">U</span>
          </div>
        </div>
        <Link href="/lamma">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
            <MessageSquare className="h-6 w-6" />
          </Button>
        </Link>
      </header>

      <Tabs defaultValue="discover" className="w-full">
        <TabsList className="w-full bg-black h-12 rounded-none p-0 border-b border-zinc-900">
          <TabsTrigger 
            value="discover" 
            className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:text-white text-muted-foreground font-bold text-sm border-b-2 border-transparent data-[state=active]:border-primary transition-all"
          >
            {isRtl ? "اكتشف" : "Discover"}
          </TabsTrigger>
          <TabsTrigger 
            value="following" 
            className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:text-white text-muted-foreground font-bold text-sm border-b-2 border-transparent data-[state=active]:border-primary transition-all"
          >
            {isRtl ? "متابعة" : "Following"}
          </TabsTrigger>
        </TabsList>

        <main className="pb-20">
          <TabsContent value="discover" className="m-0">
            {discoverLoading ? (
              <div className="flex justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
              <div className="p-10 text-center text-muted-foreground flex flex-col items-center gap-4">
                <Sparkles className="h-10 w-10 opacity-20" />
                <p>{isRtl ? "لا توجد منشورات حتى الآن" : "Be the first to share something!"}</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="following" className="m-0">
            {!currentUser ? (
              <div className="p-10 text-center text-muted-foreground">
                {isRtl ? "سجل الدخول لرؤية منشورات من تتابعهم" : "Login to see posts from people you follow."}
              </div>
            ) : followingLoading ? (
              <div className="flex justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : followingPosts.length > 0 ? (
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
              <div className="p-10 text-center text-muted-foreground">
                {isRtl ? "أنت لا تتابع أحداً بعد، ابدأ بالاكتشاف!" : "No posts yet. Start following people to see their updates here."}
              </div>
            )}
          </TabsContent>
        </main>
      </Tabs>

      <AppSidebar />
    </div>
  );
}
