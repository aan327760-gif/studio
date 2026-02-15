
"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { Input } from "@/components/ui/input";
import { Search, Users, Loader2, Flame, ChevronRight, TrendingUp, Hash } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, limit, doc, setDoc, deleteDoc, serverTimestamp, increment, updateDoc, addDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { PostCard } from "@/components/feed/PostCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VerificationBadge } from "@/components/ui/verification-badge";

const TRENDING_TOPICS = [
  { tag: "Algeria", posts: "125K", category: "News" },
  { tag: "Unbound2026", posts: "89K", category: "Tech" },
  { tag: "DigitalSovereignty", posts: "54K", category: "Governance" },
  { tag: "LammaChat", posts: "42K", category: "Social" },
  { tag: "FreeWorld", posts: "30K", category: "Rights" },
];

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
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-900">
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md p-4 border-b border-zinc-900">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? "ابحث عن قنوات أو مواطنين..." : "Search channels or citizens..."} 
            className="pl-12 bg-zinc-900/50 border-zinc-800 rounded-2xl h-12 text-sm focus-visible:ring-1 focus-visible:ring-primary transition-all"
          />
        </div>
      </header>

      <main className="pb-24 overflow-y-auto custom-scrollbar">
        {searchQuery.trim() ? (
          <Tabs defaultValue="users" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="w-full bg-black h-12 rounded-none p-0 border-b border-zinc-900">
              <TabsTrigger value="users" className="flex-1 h-full rounded-none font-black text-[10px] uppercase tracking-widest data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
                {isRtl ? "أشخاص" : "People"}
              </TabsTrigger>
              <TabsTrigger value="posts" className="flex-1 h-full rounded-none font-black text-[10px] uppercase tracking-widest data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
                {isRtl ? "منشورات" : "Posts"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="p-4 m-0 space-y-4">
              {userLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : userResults.length > 0 ? (
                userResults.filter(u => u.uid !== currentUser?.uid).map((user: any) => (
                  <div key={user.uid} className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-3xl border border-zinc-900 hover:border-zinc-800 transition-all group">
                    <Link href={`/profile/${user.uid}`} className="flex gap-4 flex-1">
                      <Avatar className="h-12 w-12 border border-zinc-800">
                        <AvatarImage src={user.photoURL} />
                        <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-black truncate group-hover:text-primary transition-colors">{user.displayName}</p>
                          {user.isVerified && <VerificationBadge className="h-3.5 w-3.5" />}
                        </div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">@{user.email?.split('@')[0]}</p>
                      </div>
                    </Link>
                    <Button 
                      size="sm" 
                      onClick={() => handleFollow(user.uid)}
                      className={cn(
                        "rounded-full font-black px-6 h-9 text-[11px] transition-all",
                        isFollowing(user.uid) ? "bg-zinc-900 text-white border border-zinc-800" : "bg-white text-black"
                      )}
                    >
                      {isFollowing(user.uid) ? (isRtl ? "يتبع" : "Following") : (isRtl ? "متابعة" : "Follow")}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 opacity-20 flex flex-col items-center gap-4">
                   <Search className="h-16 w-16" />
                   <p className="text-sm font-black uppercase tracking-widest">{isRtl ? "لا توجد نتائج" : "No matches found"}</p>
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
                      time={post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : ""}
                      mediaSettings={post.mediaSettings}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center opacity-20">
                   <p className="text-sm font-black uppercase tracking-widest">{isRtl ? "لم نجد منشورات" : "No insights found"}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-8 p-4">
            <section>
              <h2 className="text-lg font-black mb-6 flex items-center gap-2">
                <Flame className="h-6 w-6 text-orange-500 fill-orange-500" />
                {isRtl ? "رائج الآن" : "Trending Now"}
              </h2>
              <div className="space-y-7">
                {TRENDING_TOPICS.map((topic, i) => (
                  <div key={i} className="flex justify-between items-start cursor-pointer group" onClick={() => setSearchQuery(topic.tag)}>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                         <Hash className="h-3 w-3 text-primary" />
                         <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{topic.category}</p>
                      </div>
                      <p className="font-black text-[16px] group-hover:text-primary transition-colors tracking-tight">#{topic.tag}</p>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase">{topic.posts} {isRtl ? "منشور" : "Insights"}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-800 rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-all">
                       <ChevronRight className={cn("h-5 w-5", isRtl ? "rotate-180" : "")} />
                    </Button>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-zinc-950 rounded-[2.5rem] p-8 border border-zinc-900 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-all" />
               <div className="relative z-10 flex flex-col items-center text-center gap-4">
                  <div className="h-16 w-16 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20">
                     <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black">{isRtl ? "مجتمعات اللمة" : "Lamma Communities"}</h3>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed">{isRtl ? "انضم إلى المئات من النقاشات الحرة والمشفرة سيادياً." : "Join hundreds of free and sovereign encrypted discussions."}</p>
                  </div>
                  <Link href="/lamma" className="w-full">
                    <Button className="w-full rounded-2xl bg-white text-black font-black h-12 hover:bg-zinc-200 shadow-xl transition-all active:scale-95">
                      {isRtl ? "اكتشف اللمة" : "Discover Lamma"}
                    </Button>
                  </Link>
               </div>
            </section>
          </div>
        )}
      </main>

      <AppSidebar />
    </div>
  );
}
