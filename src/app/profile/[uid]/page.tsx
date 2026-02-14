
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  MoreHorizontal, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Edit2, 
  LogOut,
  Loader2,
  UserPlus,
  UserCheck,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from "@/context/LanguageContext";
import { AppSidebar } from "@/components/layout/AppSidebar";
import Link from "next/link";
import { PostCard } from "@/components/feed/PostCard";
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { signOut } from "firebase/auth";
import { toast } from "@/hooks/use-toast";
import { collection, query, where, orderBy, limit, doc, setDoc, deleteDoc, serverTimestamp, increment, updateDoc, addDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function UserProfilePage() {
  const { uid } = useParams();
  const { t, isRtl } = useLanguage();
  const auth = useAuth();
  const { user: currentUser } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const isOwnProfile = currentUser?.uid === uid;

  // Real-time user profile data
  const profileRef = useMemoFirebase(() => uid ? doc(db, "users", uid as string) : null, [db, uid]);
  const { data: profile, loading: profileLoading } = useDoc<any>(profileRef);

  // Follow state
  const followId = currentUser && uid ? `${currentUser.uid}_${uid}` : null;
  const followRef = useMemoFirebase(() => (followId && !isOwnProfile) ? doc(db, "follows", followId) : null, [db, followId, isOwnProfile]);
  const { data: followDoc } = useDoc<any>(followRef);
  const isFollowing = !!followDoc;

  const handleFollow = async () => {
    if (!currentUser || !uid || isOwnProfile || !followRef) return;
    
    if (isFollowing) {
      deleteDoc(followRef);
      updateDoc(doc(db, "users", currentUser.uid), { followingCount: increment(-1) });
      updateDoc(doc(db, "users", uid as string), { followersCount: increment(-1) });
    } else {
      setDoc(followRef, {
        followerId: currentUser.uid,
        followingId: uid,
        createdAt: serverTimestamp()
      });
      updateDoc(doc(db, "users", currentUser.uid), { followingCount: increment(1) });
      updateDoc(doc(db, "users", uid as string), { followersCount: increment(1) });

      // Notification
      addDoc(collection(db, "notifications"), {
        userId: uid,
        type: "follow",
        fromUserId: currentUser.uid,
        fromUserName: currentUser.displayName || "User",
        fromUserAvatar: currentUser.photoURL || "",
        read: false,
        createdAt: serverTimestamp()
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/auth");
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to logout" });
    }
  };

  // Fetch user's posts
  const userPostsQuery = useMemoFirebase(() => {
    if (!uid) return null;
    return query(
      collection(db, "posts"),
      where("authorId", "==", uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );
  }, [db, uid]);

  const { data: userPosts, loading: postsLoading } = useCollection<any>(userPostsQuery);

  if (profileLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If profile is missing but it's the current user, show a "Welcome" or placeholder state
  if (!profile && !profileLoading) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white p-4">
        <p className="text-zinc-500 mb-4">{isRtl ? "المستخدم غير موجود" : "User not found"}</p>
        <div className="flex gap-2">
          <Button onClick={() => router.push("/")} variant="outline" className="rounded-full">
            {isRtl ? "العودة للرئيسية" : "Go Home"}
          </Button>
          {isOwnProfile && (
            <Button onClick={handleLogout} variant="destructive" className="rounded-full">
              {isRtl ? "تسجيل الخروج" : "Logout"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-800 pb-20">
      <div className="relative h-40 w-full">
        <div className="w-full h-full bg-zinc-900 overflow-hidden">
           <img src={`https://picsum.photos/seed/${uid}/1200/400`} alt="Cover" className="w-full h-full object-cover opacity-50" />
        </div>
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <Button variant="ghost" size="icon" className="rounded-full bg-black/40 backdrop-blur-md text-white" onClick={() => router.back()}>
            <ArrowLeft className={isRtl ? "rotate-180" : ""} />
          </Button>
          <div className="flex gap-2">
            {isOwnProfile && (
              <Button onClick={handleLogout} variant="ghost" size="icon" className="rounded-full bg-black/40 backdrop-blur-md hover:bg-red-500/40 text-white">
                <LogOut className="h-5 w-5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="rounded-full bg-black/40 backdrop-blur-md text-white">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 relative -mt-12">
        <Avatar className="h-24 w-24 border-4 border-black shadow-xl mb-4">
          <AvatarImage src={profile?.photoURL} />
          <AvatarFallback className="bg-zinc-800 text-2xl">U</AvatarFallback>
        </Avatar>

        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xl font-bold">{profile?.displayName}</h2>
              <CheckCircle2 className="h-4 w-4 text-primary fill-primary text-black" />
            </div>
            <p className="text-zinc-500 text-sm">@{profile?.email?.split('@')[0] || "user"}</p>
          </div>
          
          {isOwnProfile ? (
            <Link href="/profile/edit">
              <Button variant="outline" className="rounded-full font-bold px-6 border-zinc-700 hover:bg-zinc-800">
                {isRtl ? "تعديل" : "Edit profile"}
              </Button>
            </Link>
          ) : (
            <div className="flex gap-2">
              <Button 
                onClick={handleFollow}
                className={cn(
                  "rounded-full font-bold px-6 h-9 transition-all",
                  isFollowing ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-white text-black hover:bg-zinc-200"
                )}
              >
                {isFollowing ? (isRtl ? "يتابع" : "Following") : (isRtl ? "متابعة" : "Follow")}
              </Button>
            </div>
          )}
        </div>

        <div className="mt-4 text-sm leading-relaxed text-zinc-300">
          {profile?.bio || (isRtl ? "لا توجد سيرة ذاتية" : "No bio yet")}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{isRtl ? "الجزائر" : "Algeria"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{isRtl ? "انضم في 2026" : "Joined 2026"}</span>
          </div>
        </div>

        <div className="mt-4 flex gap-5 text-sm">
          <div className="flex gap-1">
            <span className="font-bold text-white">{profile?.followingCount || 0}</span>
            <span className="text-zinc-500">{isRtl ? "متابِع" : "Following"}</span>
          </div>
          <div className="flex gap-1">
            <span className="font-bold text-white">{profile?.followersCount || 0}</span>
            <span className="text-zinc-500">{isRtl ? "متابَع" : "Followers"}</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="posts" className="mt-6 w-full">
        <TabsList className="w-full bg-black rounded-none h-12 p-0 border-b border-zinc-900 justify-start">
          <TabsTrigger value="posts" className="flex-1 px-4 h-full font-bold text-xs border-b-2 border-transparent data-[state=active]:border-primary transition-all">
            {isRtl ? "المنشورات" : "Posts"}
          </TabsTrigger>
          <TabsTrigger value="media" className="flex-1 px-4 h-full font-bold text-xs border-b-2 border-transparent data-[state=active]:border-primary transition-all">
            {isRtl ? "الوسائط" : "Media"}
          </TabsTrigger>
          <TabsTrigger value="likes" className="flex-1 px-4 h-full font-bold text-xs border-b-2 border-transparent data-[state=active]:border-primary transition-all">
            {isRtl ? "الإعجابات" : "Likes"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="m-0">
          {postsLoading ? (
            <div className="flex justify-center p-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : userPosts.length > 0 ? (
            <div className="flex flex-col">
              {userPosts.map((post: any) => (
                <PostCard 
                  key={post.id} 
                  id={post.id}
                  author={{
                    name: profile.displayName,
                    handle: profile.email?.split('@')[0],
                    avatar: profile.photoURL
                  }}
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
            <div className="p-10 text-center text-zinc-500 text-sm">
              {isRtl ? "لا توجد منشورات" : "No posts yet"}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AppSidebar />
    </div>
  );
}
