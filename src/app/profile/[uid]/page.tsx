
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  MoreHorizontal, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Loader2,
  Settings,
  Grid3X3,
  Heart,
  FileText,
  MessageSquare,
  Share2,
  Trash2,
  ShieldCheck
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

const ADMIN_EMAIL = "adelbenmaza3@gmail.com";

export default function UserProfilePage() {
  const { uid } = useParams();
  const { isRtl } = useLanguage();
  const auth = useAuth();
  const { user: currentUser } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const isOwnProfile = currentUser?.uid === uid;

  // جلب بيانات الملف الشخصي
  const profileRef = useMemoFirebase(() => uid ? doc(db, "users", uid as string) : null, [db, uid]);
  const { data: profile, loading: profileLoading } = useDoc<any>(profileRef);

  // نظام المتابعة
  const followId = currentUser && uid ? `${currentUser.uid}_${uid}` : null;
  const followRef = useMemoFirebase(() => (followId && !isOwnProfile) ? doc(db, "follows", followId) : null, [db, followId, isOwnProfile]);
  const { data: followDoc } = useDoc<any>(followRef);
  const isFollowing = !!followDoc;

  // جلب منشورات المستخدم
  const userPostsQuery = useMemoFirebase(() => {
    if (!uid) return null;
    return query(
      collection(db, "posts"),
      where("authorId", "==", uid),
      orderBy("createdAt", "desc"),
      limit(30)
    );
  }, [db, uid]);
  const { data: userPosts = [], loading: postsLoading } = useCollection<any>(userPostsQuery);

  // جلب المنشورات التي أعجب بها
  const likedPostsQuery = useMemoFirebase(() => {
    if (!uid) return null;
    return query(
      collection(db, "posts"),
      where("likedBy", "array-contains", uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );
  }, [db, uid]);
  const { data: likedPosts = [], loading: likedLoading } = useCollection<any>(likedPostsQuery);

  // تصفية الوسائط
  const userMedia = userPosts.filter(p => p.mediaUrl);

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

  if (profileLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile && !profileLoading) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white p-4">
        <p className="text-zinc-500 mb-4">{isRtl ? "المستخدم غير موجود" : "User not found"}</p>
        <Button onClick={() => router.push("/")} variant="outline" className="rounded-full">
          {isRtl ? "العودة للرئيسية" : "Go Home"}
        </Button>
      </div>
    );
  }

  const isProfileAdmin = profile?.email === ADMIN_EMAIL || profile?.role === 'admin';

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-800 pb-20 overflow-x-hidden">
      <div className="relative h-48 w-full">
        <div className="w-full h-full bg-zinc-900 overflow-hidden">
           {profile?.bannerURL ? (
             <img src={profile.bannerURL} alt="Cover" className="w-full h-full object-cover" />
           ) : (
             <img src={`https://picsum.photos/seed/${uid}/1200/400`} alt="Default Cover" className="w-full h-full object-cover opacity-30 grayscale" />
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        </div>
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <Button variant="ghost" size="icon" className="rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10" onClick={() => router.back()}>
            <ArrowLeft className={isRtl ? "rotate-180" : ""} />
          </Button>
          <div className="flex gap-2">
            {isOwnProfile && isProfileAdmin && (
              <Button variant="ghost" size="icon" className="rounded-full bg-primary/20 backdrop-blur-md text-primary border border-primary/20" onClick={() => router.push('/admin')}>
                <ShieldCheck className="h-5 w-5" />
              </Button>
            )}
            {isOwnProfile && (
              <Link href="/settings">
                <Button variant="ghost" size="icon" className="rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="icon" className="rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 relative -mt-14">
        <Avatar className="h-28 w-28 border-[6px] border-black shadow-2xl mb-4">
          <AvatarImage src={profile?.photoURL} />
          <AvatarFallback className="bg-zinc-800 text-3xl font-black">
            {profile?.displayName?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-2xl font-black tracking-tight">{profile?.displayName}</h2>
              {(profile?.isVerified || isProfileAdmin) && (
                <CheckCircle2 className="h-5 w-5 text-[#1DA1F2] fill-[#1DA1F2] text-black" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-zinc-500 text-sm font-medium">@{profile?.email?.split('@')[0] || "user"}</p>
              {isProfileAdmin && (
                <span className="bg-primary/10 text-primary text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-primary/20">
                  {isRtl ? "الإدارة" : "Management"}
                </span>
              )}
            </div>
          </div>
          
          {isOwnProfile ? (
            <Link href="/profile/edit">
              <Button variant="outline" className="rounded-full font-black px-6 border-zinc-700 hover:bg-zinc-800 hover:text-white transition-all">
                {isRtl ? "تعديل الملف" : "Edit profile"}
              </Button>
            </Link>
          ) : (
            <Button 
              onClick={handleFollow}
              className={cn(
                "rounded-full font-black px-8 h-10 transition-all shadow-lg active:scale-95",
                isFollowing ? "bg-zinc-900 text-white border border-zinc-800" : "bg-white text-black hover:bg-zinc-200"
              )}
            >
              {isFollowing ? (isRtl ? "يتابع" : "Following") : (isRtl ? "متابعة" : "Follow")}
            </Button>
          )}
        </div>

        <div className="mt-4 text-[15px] leading-relaxed text-zinc-300 font-medium">
          {profile?.bio || (isRtl ? "لم يكتب سيرة ذاتية بعد.. يفضل الصمت أحياناً." : "No bio yet. Silence is golden.")}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span>{isRtl ? "الجزائر" : "Algeria"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{isRtl ? "انضم في 2026" : "Joined 2026"}</span>
          </div>
        </div>

        <div className="mt-6 flex gap-6 border-y border-zinc-900 py-4">
          <div className="flex flex-col items-center flex-1">
            <span className="font-black text-lg text-white">{profile?.followingCount || 0}</span>
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{isRtl ? "يتابع" : "Following"}</span>
          </div>
          <div className="flex flex-col items-center flex-1 border-x border-zinc-900">
            <span className="font-black text-lg text-white">{profile?.followersCount || 0}</span>
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{isRtl ? "متابع" : "Followers"}</span>
          </div>
          <div className="flex flex-col items-center flex-1">
            <span className="font-black text-lg text-white">{userPosts.length}</span>
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{isRtl ? "منشور" : "Posts"}</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="posts" className="mt-2 w-full">
        <TabsList className="w-full bg-black rounded-none h-14 p-0 border-b border-zinc-900 justify-around glass">
          <TabsTrigger value="posts" className="flex-1 px-4 h-full font-black text-[10px] uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-white text-zinc-500 transition-all">
            {isRtl ? "المنشورات" : "Posts"}
          </TabsTrigger>
          <TabsTrigger value="media" className="flex-1 px-4 h-full font-black text-[10px] uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-white text-zinc-500 transition-all">
            {isRtl ? "الوسائط" : "Media"}
          </TabsTrigger>
          <TabsTrigger value="likes" className="flex-1 px-4 h-full font-black text-[10px] uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-white text-zinc-500 transition-all">
            {isRtl ? "الإعجابات" : "Likes"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="m-0 focus-visible:ring-0">
          {postsLoading ? (
            <div className="flex justify-center p-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
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
                    avatar: profile.photoURL,
                    uid: profile.uid,
                    isVerified: profile.isVerified || isProfileAdmin,
                    role: profile.role
                  }}
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
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <FileText className="h-12 w-12 text-zinc-800" />
              <p className="text-zinc-500 text-sm font-bold">{isRtl ? "لم ينشر أي شيء بعد" : "Nothing published yet"}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="media" className="m-0 focus-visible:ring-0">
          {userMedia.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 p-1">
              {userMedia.map((post: any) => (
                <Link key={post.id} href={`/post/${post.id}`}>
                  <div className="aspect-square bg-zinc-900 relative overflow-hidden group">
                    {post.mediaType === 'video' ? (
                      <video src={post.mediaUrl} className="w-full h-full object-cover" />
                    ) : (
                      <img src={post.mediaUrl} alt="Media" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <div className="flex items-center gap-1">
                         <Heart className="h-4 w-4 fill-white" />
                         <span className="text-[10px] font-bold">{post.likesCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <Grid3X3 className="h-12 w-12 text-zinc-800" />
              <p className="text-zinc-500 text-sm font-bold">{isRtl ? "لا توجد صور أو فيديوهات" : "No media found"}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="likes" className="m-0 focus-visible:ring-0">
          {likedLoading ? (
            <div className="flex justify-center p-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
            </div>
          ) : likedPosts.length > 0 ? (
            <div className="flex flex-col">
              {likedPosts.map((post: any) => (
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
                  mediaSettings={post.mediaSettings}
                />
              ))}
            </div>
          ) : (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <Heart className="h-12 w-12 text-zinc-800" />
              <p className="text-zinc-500 text-sm font-bold">{isRtl ? "لم يعجب بأي منشور بعد" : "No liked posts yet"}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AppSidebar />
    </div>
  );
}
