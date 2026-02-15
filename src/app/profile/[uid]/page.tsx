"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  MoreHorizontal, 
  Calendar, 
  MapPin, 
  Loader2,
  Settings,
  ShieldCheck,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from "@/context/LanguageContext";
import { AppSidebar } from "@/components/layout/AppSidebar";
import Link from "next/link";
import { PostCard } from "@/components/feed/PostCard";
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, limit, doc, setDoc, deleteDoc, serverTimestamp, increment, updateDoc, addDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { VerificationBadge } from "@/components/ui/verification-badge";

const SUPER_ADMIN_EMAIL = "adelbenmaza3@gmail.com";

export default function UserProfilePage() {
  const { uid } = useParams();
  const { isRtl } = useLanguage();
  const auth = useAuth();
  const { user: currentUser } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const isOwnProfile = currentUser?.uid === uid;

  const profileRef = useMemoFirebase(() => uid ? doc(db, "users", uid as string) : null, [db, uid]);
  const { data: profile, loading: profileLoading } = useDoc<any>(profileRef);

  const currentUserRef = useMemoFirebase(() => currentUser ? doc(db, "users", currentUser.uid) : null, [db, currentUser]);
  const { data: currentUserProfile } = useDoc<any>(currentUserRef);

  const followId = currentUser && uid ? `${currentUser.uid}_${uid}` : null;
  const followRef = useMemoFirebase(() => (followId && !isOwnProfile) ? doc(db, "follows", followId) : null, [db, followId, isOwnProfile]);
  const { data: followDoc } = useDoc<any>(followRef);
  const isFollowing = !!followDoc;

  const userPostsQuery = useMemoFirebase(() => {
    if (!uid) return null;
    return query(collection(db, "posts"), where("authorId", "==", uid), limit(30));
  }, [db, uid]);
  const { data: userPosts = [], loading: postsLoading } = useCollection<any>(userPostsQuery);

  const handleFollow = async () => {
    if (!currentUser || !uid || isOwnProfile || !followRef) return;
    
    if (isFollowing) {
      deleteDoc(followRef);
      updateDoc(doc(db, "users", currentUser.uid), { followingCount: increment(-1) });
      updateDoc(doc(db, "users", uid as string), { followersCount: increment(-1) });
    } else {
      setDoc(followRef, { followerId: currentUser.uid, followingId: uid, createdAt: serverTimestamp() });
      updateDoc(doc(db, "users", currentUser.uid), { followingCount: increment(1) });
      updateDoc(doc(db, "users", uid as string), { followersCount: increment(1) });

      addDoc(collection(db, "notifications"), {
        userId: uid, type: "follow", fromUserId: currentUser.uid,
        fromUserName: currentUser.displayName || "User", fromUserAvatar: currentUser.photoURL || "",
        read: false, createdAt: serverTimestamp()
      });
    }
  };

  if (profileLoading) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!profile && !profileLoading) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white p-4">
        <p className="text-zinc-500 mb-4">{isRtl ? "المستخدم غير موجود" : "User not found"}</p>
        <Button onClick={() => router.push("/")} variant="outline" className="rounded-full">{isRtl ? "العودة للرئيسية" : "Go Home"}</Button>
      </div>
    );
  }

  const isProfileAdmin = profile?.role === "admin" || profile?.email === SUPER_ADMIN_EMAIL;
  const isVisitorAdmin = currentUserProfile?.role === "admin" || currentUser?.email === SUPER_ADMIN_EMAIL;
  const showCheckmark = profile?.isVerified || profile?.email === SUPER_ADMIN_EMAIL;
  const isPro = profile?.isPro;

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-800 pb-20 overflow-x-hidden">
      <div className="relative h-48 w-full">
        <div className="w-full h-full bg-zinc-900 overflow-hidden">
           {profile?.bannerURL ? <img src={profile.bannerURL} alt="Cover" className="w-full h-full object-cover" /> : <img src={`https://picsum.photos/seed/${uid}/1200/400`} alt="Default Cover" className="w-full h-full object-cover opacity-30 grayscale" />}
           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        </div>
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <Button variant="ghost" size="icon" className="rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10" onClick={() => router.back()}>
            <ArrowLeft className={isRtl ? "rotate-180" : ""} />
          </Button>
          <div className="flex gap-2">
            {isOwnProfile && isVisitorAdmin && (
              <Button variant="ghost" size="icon" className="rounded-full bg-primary/20 backdrop-blur-md text-primary border border-primary/20" onClick={() => router.push('/admin')}>
                <ShieldCheck className="h-5 w-5" />
              </Button>
            )}
            {isOwnProfile && <Link href="/settings"><Button variant="ghost" size="icon" className="rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10"><Settings className="h-5 w-5" /></Button></Link>}
          </div>
        </div>
      </div>

      <div className="px-4 relative -mt-14">
        <Avatar className="h-28 w-28 border-[6px] border-black shadow-2xl mb-4">
          <AvatarImage src={profile?.photoURL} />
          <AvatarFallback className="bg-zinc-800 text-3xl font-black">{profile?.displayName?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-2xl font-black tracking-tight">{profile?.displayName}</h2>
              {showCheckmark && <VerificationBadge className="h-5 w-5" />}
              {isPro && <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-zinc-500 text-sm font-medium">@{profile?.email?.split('@')[0] || "user"}</p>
              {isProfileAdmin && <span className="bg-primary/10 text-primary text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-primary/20">{isRtl ? "إدارة" : "Admin"}</span>}
            </div>
          </div>
          
          {isOwnProfile ? (
            <Link href="/profile/edit"><Button variant="outline" className="rounded-full font-black px-6 border-zinc-700">{isRtl ? "تعديل" : "Edit"}</Button></Link>
          ) : (
            <Button onClick={handleFollow} className={cn("rounded-full font-black px-8 h-10", isFollowing ? "bg-zinc-900 text-white border border-zinc-800" : "bg-white text-black")}>
              {isFollowing ? (isRtl ? "يتابع" : "Following") : (isRtl ? "متابعة" : "Follow")}
            </Button>
          )}
        </div>

        <div className="mt-4 text-[15px] leading-relaxed text-zinc-300 font-medium">
          {profile?.bio || (isRtl ? "لا توجد سيرة ذاتية.." : "No bio yet.")}
        </div>

        <div className="mt-6 flex gap-6 border-y border-zinc-900 py-4">
          <div className="flex flex-col items-center flex-1"><span className="font-black text-lg text-white">{profile?.followingCount || 0}</span><span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{isRtl ? "يتابع" : "Following"}</span></div>
          <div className="flex flex-col items-center flex-1 border-x border-zinc-900"><span className="font-black text-lg text-white">{profile?.followersCount || 0}</span><span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{isRtl ? "متابع" : "Followers"}</span></div>
          <div className="flex flex-col items-center flex-1"><span className="font-black text-lg text-white">{userPosts.length}</span><span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{isRtl ? "منشور" : "Posts"}</span></div>
        </div>
      </div>

      <Tabs defaultValue="posts" className="mt-2 w-full">
        <TabsList className="w-full bg-black rounded-none h-14 p-0 border-b border-zinc-900 justify-around glass">
          <TabsTrigger value="posts" className="flex-1 font-black text-[10px] uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-primary">{isRtl ? "المنشورات" : "Posts"}</TabsTrigger>
          <TabsTrigger value="media" className="flex-1 font-black text-[10px] uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-primary">{isRtl ? "الوسائط" : "Media"}</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="m-0">
          {postsLoading ? <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" /></div> : userPosts.length > 0 ? (
            <div className="flex flex-col">{userPosts.map((post: any) => <PostCard key={post.id} id={post.id} author={{...profile, handle: profile.email?.split('@')[0], uid: uid}} content={post.content} image={post.mediaUrl} mediaType={post.mediaType} likes={post.likesCount || 0} time={post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : ""} />)}</div>
          ) : <div className="p-20 text-center text-zinc-500 font-bold">{isRtl ? "لا منشورات" : "No posts"}</div>}
        </TabsContent>

        <TabsContent value="media" className="m-0">
          <div className="grid grid-cols-3 gap-1 p-1">
            {userPosts.filter(p => p.mediaUrl).map((post: any) => (
              <Link key={post.id} href={`/post/${post.id}`}>
                <div className="aspect-square bg-zinc-900 relative overflow-hidden">
                  {post.mediaType === 'video' ? <video src={post.mediaUrl} className="w-full h-full object-cover" /> : <img src={post.mediaUrl} alt="Media" className="w-full h-full object-cover" />}
                </div>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      <AppSidebar />
    </div>
  );
}
