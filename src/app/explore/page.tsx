
"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, Users, Hash, Loader2, UserPlus, UserCheck, Flame, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, limit, doc, setDoc, deleteDoc, serverTimestamp, increment, updateDoc, addDoc, orderBy } from "firebase/firestore";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { PostCard } from "@/components/feed/PostCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const TRENDING_TOPICS = [
  { tag: "Algeria", posts: "120K", category: "News" },
  { tag: "Unbound2026", posts: "85K", category: "Tech" },
  { tag: "LammaChat", posts: "45K", category: "Social" },
  { tag: "DigitalNomad", posts: "32K", category: "Life" },
];

export default function ExplorePage() {
  const { isRtl } = useLanguage();
  const db = useFirestore();
  const { user: currentUser } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("users");

  // البحث عن المستخدمين
  const userResultsQuery = useMemoFirebase(() => {
    if (!searchQuery.trim()) return null;
    return query(
      collection(db, "users"),
      where("displayName", ">=", searchQuery),
      where("displayName", "<=", searchQuery + "\uf8ff"),
      limit(10)
    );
  }, [db, searchQuery]);

  const { data: userResults, loading: userLoading } = useCollection<any>(userResultsQuery);

  // البحث عن المنشورات (بناءً على الكلمات المفتاحية في المحتوى)
  const postResultsQuery = useMemoFirebase(() => {
    if (!searchQuery.trim()) return null;
    return query(
      collection(db, "posts"),
      where("content", ">=", searchQuery),
      where("content", "<=", searchQuery + "\uf8ff"),
      limit(10)
    );
  }, [db, searchQuery]);

  const { data: postResults, loading: postLoading } = useCollection<any>(postResultsQuery);

  // جلب المستخدمين المقترحين
  const suggestedUsersQuery = useMemoFirebase(() => {
    return query(collection(db, "users"), limit(5));
  }, [db]);
  const { data: suggestedUsers, loading: suggestedLoading } = useCollection<any>(suggestedUsersQuery);

  // جلب المتابعات الحالية للمستخدم
  const followsQuery = useMemoFirebase(() => {
    if (!currentUser) return null;
    return query(collection(db, "follows"), where("followerId", "==", currentUser.uid));
  }, [db, currentUser]);
  const { data: userFollows } = useCollection<any>(followsQuery);

  const isFollowing = (userId: string) => {
    return (userFollows || []).some((f: any) => f.followingId === userId);
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? "ابحث عن أشخاص أو مواضيع..." : "Search people or topics..."} 
            className="pl-10 bg-zinc-900 border-none rounded-full h-10 text-sm focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </header>

      <main className="pb-24 overflow-y-auto custom-scrollbar">
        {searchQuery.trim() ? (
          <Tabs defaultValue="users" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="w-full bg-black h-12 rounded-none p-0 border-b border-zinc-900">
              <TabsTrigger value="users" className="flex-1 h-full rounded-none font-bold text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
                {isRtl ? "أشخاص" : "People"}
              </TabsTrigger>
              <TabsTrigger value="posts" className="flex-1 h-full rounded-none font-bold text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
                {isRtl ? "منشورات" : "Posts"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="p-4 m-0">
              {userLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : userResults.length > 0 ? (
                <div className="space-y-4">
                  {userResults.filter(u => u.uid !== currentUser?.uid).map((user: any) => (
                    <div key={user.uid} className="flex items-center justify-between group">
                      <Link href={`/profile/${user.uid}`} className="flex gap-3 flex-1">
                        <Avatar>
                          <AvatarImage src={user.photoURL} />
                          <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold group-hover:underline">{user.displayName}</p>
                          <p className="text-xs text-zinc-500">@{user.email?.split('@')[0]}</p>
                        </div>
                      </Link>
                      <Button 
                        size="sm" 
                        onClick={() => handleFollow(user.uid)}
                        className={cn(
                          "rounded-full font-bold px-4 h-8 text-xs transition-all",
                          isFollowing(user.uid) ? "bg-zinc-800 text-white" : "bg-white text-black"
                        )}
                      >
                        {isFollowing(user.uid) ? (isRtl ? "يتابع" : "Following") : (isRtl ? "متابعة" : "Follow")}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-zinc-600 text-sm mt-10">{isRtl ? "لم نجد مستخدمين" : "No users found"}</p>
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
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                {isRtl ? "رائج الآن" : "Trending Now"}
              </h2>
              <div className="space-y-4">
                {TRENDING_TOPICS.map((topic, i) => (
                  <div key={i} className="flex justify-between items-start cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors">
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">{topic.category}</p>
                      <p className="font-bold text-sm">#{topic.tag}</p>
                      <p className="text-xs text-zinc-500">{topic.posts} {isRtl ? "منشور" : "posts"}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-600">
                       <Hash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </section>

            <section className="p-4">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {isRtl ? "قد ترغب في متابعتهم" : "Who to follow"}
              </h2>
              <div className="space-y-4">
                {suggestedLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 
                  suggestedUsers.filter(u => u.uid !== currentUser?.uid && !isFollowing(u.uid)).map((user: any) => (
                    <div key={user.uid} className="flex items-center justify-between">
                      <Link href={`/profile/${user.uid}`} className="flex gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.photoURL} />
                          <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold">{user.displayName}</p>
                          <p className="text-[10px] text-zinc-500">@{user.email?.split('@')[0]}</p>
                        </div>
                      </Link>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleFollow(user.uid)}
                        className="rounded-full h-8 text-xs border-zinc-800 hover:bg-white hover:text-black font-bold"
                      >
                        {isRtl ? "متابعة" : "Follow"}
                      </Button>
                    </div>
                  ))
                }
              </div>
            </section>
          </>
        )}
      </main>

      <AppSidebar />
    </div>
  );
}
