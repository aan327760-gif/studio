
"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { Input } from "@/components/ui/input";
import { Search, Users, Loader2, Flame, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, limit, doc, setDoc, deleteDoc, serverTimestamp, increment, updateDoc, addDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { PostCard } from "@/components/feed/PostCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const TRENDING_TOPICS = [
  { tag: "Algeria", posts: "120K", category: "News" },
  { tag: "Unbound2026", posts: "85K", category: "Tech" },
  { tag: "LammaChat", posts: "45K", category: "Social" },
  { tag: "DigitalNomad", posts: "32K", category: "Life" },
  { tag: "FreedomOfSpeech", posts: "18K", category: "Rights" },
];

const VerificationBadge = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={cn("fill-[#1DA1F2]", className)} aria-hidden="true">
    <g>
      <path d="M22.5 12.5c0-1.58-.8-3.04-2.12-3.88.59-1.58.29-3.38-.98-4.65s-3.07-1.57-4.65-.98c-.84-1.32-2.3-2.12-3.88-2.12s-3.04.8-3.88 2.12c-1.58-.59-3.38-.29-4.65.98s-1.57 3.07-.98 4.65c-1.32.84-2.12 2.3-2.12 3.88s.8 3.04 2.12 3.88c-.59 1.58-.29 3.38.98 4.65s3.07 1.57 4.65.98c.84 1.32 2.3 2.12 3.88 2.12s3.04-.8 3.88-2.12c1.58.59 3.38.29 4.65-.98s1.57-3.07.98-4.65c1.32-.84 2.12-2.3 2.12-3.88zM10.5 16l-3.5-3.5 1.4-1.4 2.1 2.1 5.2-5.2 1.4 1.4-6.6 6.6z"></path>
    </g>
  </svg>
);

export default function ExplorePage() {
  const { isRtl } = useLanguage();
  const db = useFirestore();
  const { user: currentUser } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("users");

  const userResultsQuery = useMemoFirebase(() => {
    if (!searchQuery.trim()) return null;
    return query(
      collection(db, "users"),
      where("displayName", ">=", searchQuery),
      where("displayName", "<=", searchQuery + "\uf8ff"),
      limit(10)
    );
  }, [db, searchQuery]);

  const { data: userResults = [], loading: userLoading } = useCollection<any>(userResultsQuery);

  const postResultsQuery = useMemoFirebase(() => {
    if (!searchQuery.trim()) return null;
    return query(
      collection(db, "posts"),
      where("content", ">=", searchQuery),
      where("content", "<=", searchQuery + "\uf8ff"),
      limit(10)
    );
  }, [db, searchQuery]);

  const { data: postResults = [], loading: postLoading } = useCollection<any>(postResultsQuery);

  const followsQuery = useMemoFirebase(() => {
    if (!currentUser) return null;
    return query(collection(db, "follows"), where("followerId", "==", currentUser.uid));
  }, [db, currentUser]);
  const { data: userFollows = [] } = useCollection<any>(followsQuery);

  const isFollowing = (userId: string) => {
    return userFollows.some((f: any) => f.followingId === userId);
  };

  const handleFollow = async (targetUserId: string) => {
    if (!currentUser || !db) return;
    
    const followId = `${currentUser.uid}_${targetUserId}`;
    const followRef = doc(db, "follows", followId);

    if (isFollowing(targetUserId)) {
      await deleteDoc(followRef);
      updateDoc(doc(db, "users", currentUser.uid), { followingCount: increment(-1) });
      updateDoc(doc(db, "users", targetUserId), { followersCount: increment(-1) });
    } else {
      await setDoc(followRef, {
        followerId: currentUser.uid,
        followingId: targetUserId,
        createdAt: serverTimestamp()
      });
      updateDoc(doc(db, "users", currentUser.uid), { followingCount: increment(1) });
      updateDoc(doc(db, "users", targetUserId), { followersCount: increment(1) });

      addDoc(collection(db, "notifications"), {
        userId: targetUserId,
        type: "follow",
        fromUserId: currentUser.uid,
        fromUserName: currentUser.displayName || "Someone",
        fromUserAvatar: currentUser.photoURL || "",
        read: false,
        createdAt: serverTimestamp()
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-800">
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md p-4 border-b border-zinc-900">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? "ابحث عن أشخاص أو مواضيع..." : "Search people or topics..."} 
            className="pl-10 bg-zinc-900 border-none rounded-2xl h-11 text-sm focus-visible:ring-1 focus-visible:ring-primary transition-all"
          />
        </div>
      </header>

      <main className="pb-24 overflow-y-auto custom-scrollbar">
        {searchQuery.trim() ? (
          <Tabs defaultValue="users" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="w-full bg-black h-12 rounded-none p-0 border-b border-zinc-900">
              <TabsTrigger value="users" className="flex-1 h-full rounded-none font-bold text-xs uppercase tracking-widest data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
                {isRtl ? "أشخاص" : "People"}
              </TabsTrigger>
              <TabsTrigger value="posts" className="flex-1 h-full rounded-none font-bold text-xs uppercase tracking-widest data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
                {isRtl ? "منشورات" : "Posts"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="p-4 m-0">
              {userLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : userResults.length > 0 ? (
                <div className="space-y-4">
                  {userResults.filter(u => u.uid !== currentUser?.uid).map((user: any) => {
                    const isUserVerified = user.isVerified || user.email === "adelbenmaza3@gmail.com";
                    return (
                      <div key={user.uid} className="flex items-center justify-between group p-3 bg-zinc-950 rounded-2xl border border-transparent hover:border-zinc-800 transition-all">
                        <Link href={`/profile/${user.uid}`} className="flex gap-3 flex-1">
                          <Avatar className="h-10 w-10 ring-1 ring-zinc-800 ring-offset-1 ring-offset-black">
                            <AvatarImage src={user.photoURL} />
                            <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-1">
                              <p className="text-sm font-bold group-hover:text-primary transition-colors">{user.displayName}</p>
                              {isUserVerified && <VerificationBadge className="h-3 w-3" />}
                            </div>
                            <p className="text-[10px] text-zinc-500">@{user.email?.split('@')[0]}</p>
                          </div>
                        </Link>
                        <Button 
                          size="sm" 
                          onClick={() => handleFollow(user.uid)}
                          className={cn(
                            "rounded-full font-bold px-5 h-8 text-[11px] transition-all",
                            isFollowing(user.uid) ? "bg-zinc-800 text-white" : "bg-white text-black"
                          )}
                        >
                          {isFollowing(user.uid) ? (isRtl ? "يتابع" : "Following") : (isRtl ? "متابعة" : "Follow")}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 opacity-30 flex flex-col items-center">
                  <Users className="h-12 w-12 mb-2" />
                  <p className="text-sm font-bold">{isRtl ? "لا يوجد نتائج" : "No results found"}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="posts" className="m-0">
              {postLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : postResults.length > 0 ? (
                <div className="flex flex-col">
                  {postResults.map((post: any) => (
                    <PostCard 
                      key={post.id} 
                      id={post.id}
                      author={post.author}
                      content={post.content}
                      image={post.mediaUrl}
                      mediaType={post.mediaType}
                      likes={post.likesCount || 0}
                      comments={0}
                      reposts={0}
                      time={post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : ""}
                      mediaSettings={post.mediaSettings}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-zinc-600 text-sm mt-10">{isRtl ? "لم نجد منشورات" : "No posts found"}</p>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <>
            <section className="p-4 border-b border-zinc-900">
              <h2 className="text-lg font-black mb-6 flex items-center gap-2">
                <Flame className="h-6 w-6 text-orange-500 fill-orange-500" />
                {isRtl ? "رائج في بلا قيود" : "Trending on Unbound"}
              </h2>
              <div className="space-y-6">
                {TRENDING_TOPICS.map((topic, i) => (
                  <div key={i} className="flex justify-between items-start cursor-pointer group" onClick={() => setSearchQuery(topic.tag)}>
                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">{topic.category}</p>
                      <p className="font-black text-[15px] group-hover:text-primary transition-colors">#{topic.tag}</p>
                      <p className="text-[11px] text-zinc-500">{topic.posts} {isRtl ? "منشور" : "posts"}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-800">
                       <ChevronRight className={cn("h-4 w-4", isRtl ? "rotate-180" : "")} />
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <AppSidebar />
    </div>
  );
}
