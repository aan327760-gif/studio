
"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { PostCard } from "@/components/feed/PostCard";
import { useLanguage } from "@/context/LanguageContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";

export default function Home() {
  const { t, isRtl } = useLanguage();
  const db = useFirestore();

  const postsQuery = useMemoFirebase(() => {
    return query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(20));
  }, [db]);

  const { data: posts, loading } = useCollection<any>(postsQuery);

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

      <Tabs defaultValue="following" className="w-full">
        <TabsList className="w-full bg-black h-12 rounded-none p-0 border-b border-zinc-900">
          <TabsTrigger 
            value="following" 
            className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:text-white text-muted-foreground font-bold text-sm border-b-2 border-transparent data-[state=active]:border-primary transition-all"
          >
            Following
          </TabsTrigger>
          <TabsTrigger 
            value="discover" 
            className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:text-white text-muted-foreground font-bold text-sm border-b-2 border-transparent data-[state=active]:border-primary transition-all"
          >
            Discover
          </TabsTrigger>
        </TabsList>

        <main className="pb-20">
          <TabsContent value="following" className="m-0">
            {loading ? (
              <div className="flex justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : posts.length > 0 ? (
              <div className="flex flex-col">
                {posts.map((post: any) => (
                  <PostCard 
                    key={post.id} 
                    id={post.id}
                    author={post.author || { name: "User", handle: "user", avatar: "" }}
                    content={post.content}
                    image={post.mediaUrl}
                    likes={post.likesCount || 0}
                    comments={0}
                    reposts={0}
                    time={post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : post.createdAt}
                  />
                ))}
              </div>
            ) : (
              <div className="p-10 text-center text-muted-foreground">
                No posts yet. Start following someone!
              </div>
            )}
          </TabsContent>
          <TabsContent value="discover" className="m-0">
             <div className="p-10 text-center text-muted-foreground">
                Trending content will appear here.
              </div>
          </TabsContent>
        </main>
      </Tabs>

      <AppSidebar />
    </div>
  );
}
