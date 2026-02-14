
"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  MoreHorizontal, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Edit2, 
  LogOut,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from "@/context/LanguageContext";
import { AppSidebar } from "@/components/layout/AppSidebar";
import Link from "next/link";
import { PostCard } from "@/components/feed/PostCard";
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { collection, query, where, orderBy, limit } from "firebase/firestore";

export default function ProfilePage() {
  const { t, isRtl } = useLanguage();
  const [activeTab, setActiveTab] = useState("posts");
  const auth = useAuth();
  const { user: currentUser } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: isRtl ? "تم تسجيل الخروج" : "Logged Out" });
      router.push("/auth");
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to logout" });
    }
  };

  // Fetch user's posts
  const userPostsQuery = useMemoFirebase(() => {
    if (!currentUser) return null;
    return query(
      collection(db, "posts"),
      where("authorId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );
  }, [db, currentUser]);

  const { data: userPosts, loading: postsLoading } = useCollection<any>(userPostsQuery);

  const profileData = {
    name: currentUser?.displayName || (isRtl ? "مستخدم Unbound" : "Unbound User"),
    handle: currentUser?.email?.split('@')[0] || "user",
    bio: isRtl 
      ? "تطبيق Unbound هو مساحتك الحرة، شارك أفكارك، اصنع محتوى، وكن جزءاً من المجتمع." 
      : "Unbound is your free space. Share your thoughts, create content, and be part of the community.",
    followers: 0,
    following: 0,
    joinDate: isRtl ? "فبراير ٢٠٢٦" : "February 2026",
    location: isRtl ? "الجزائر" : "Algeria",
    isVerified: true,
    coverImage: "https://picsum.photos/seed/cover/1200/400",
    avatarImage: currentUser?.photoURL || "https://picsum.photos/seed/avatar/200/200"
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-800 pb-20">
      <div className="relative h-48 w-full group">
        <img src={profileData.coverImage} alt="Cover" className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20" />
        
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full bg-black/20 backdrop-blur-md hover:bg-black/40 text-white">
              <ArrowLeft className={isRtl ? "rotate-180" : ""} />
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button onClick={handleLogout} variant="ghost" size="icon" className="rounded-full bg-black/20 backdrop-blur-md hover:bg-red-500/40 text-white">
              <LogOut className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full bg-black/20 backdrop-blur-md hover:bg-black/40 text-white">
              <Edit2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 relative">
        <div className="absolute -top-12 left-4">
          <Avatar className="h-24 w-24 border-4 border-black ring-2 ring-zinc-800 shadow-xl">
            <AvatarImage src={profileData.avatarImage} />
            <AvatarFallback className="bg-primary text-3xl font-bold">U</AvatarFallback>
          </Avatar>
        </div>

        <div className="pt-14 space-y-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-xl font-bold tracking-tight">{profileData.name}</h2>
            {profileData.isVerified && <CheckCircle2 className="h-5 w-5 text-primary fill-primary text-black" />}
          </div>
          <p className="text-muted-foreground text-sm">@{profileData.handle}</p>
        </div>

        <div className="mt-4 text-[13px] leading-relaxed text-zinc-300">
          {profileData.bio}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{isRtl ? "انضم في" : "Joined"} {profileData.joinDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{profileData.location}</span>
          </div>
        </div>

        <div className="mt-4 flex gap-5 text-sm">
          <div className="flex gap-1 hover:underline cursor-pointer">
            <span className="font-bold text-white">{profileData.followers}</span>
            <span className="text-muted-foreground">{isRtl ? "المتابعون" : "Followers"}</span>
          </div>
          <div className="flex gap-1 hover:underline cursor-pointer">
            <span className="font-bold text-white">{profileData.following}</span>
            <span className="text-muted-foreground">{isRtl ? "متابعًا" : "Following"}</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="posts" className="mt-6 w-full" onValueChange={setActiveTab}>
        <TabsList className="w-full bg-black rounded-none h-12 p-0 border-b border-zinc-900 justify-start overflow-x-auto no-scrollbar">
          <TabsTrigger value="posts" className="flex-1 px-4 h-full font-bold text-xs border-b-2 border-transparent data-[state=active]:border-primary transition-all">
            {isRtl ? "المنشورات" : "Posts"}
          </TabsTrigger>
          <TabsTrigger value="replies" className="flex-1 px-4 h-full font-bold text-xs border-b-2 border-transparent data-[state=active]:border-primary transition-all">
            {isRtl ? "الردود" : "Replies"}
          </TabsTrigger>
          <TabsTrigger value="media" className="flex-1 px-4 h-full font-bold text-xs border-b-2 border-transparent data-[state=active]:border-primary transition-all">
            {isRtl ? "الوسائط" : "Media"}
          </TabsTrigger>
          <TabsTrigger value="likes" className="flex-1 px-4 h-full font-bold text-xs border-b-2 border-transparent data-[state=active]:border-primary transition-all">
            {isRtl ? "الإعجابات" : "Likes"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="m-0 min-h-[300px]">
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
                    name: profileData.name,
                    handle: profileData.handle,
                    avatar: profileData.avatarImage
                  }}
                  content={post.content}
                  image={post.mediaUrl}
                  likes={post.likesCount || 0}
                  comments={0}
                  reposts={0}
                  time={post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : ""}
                />
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-zinc-500 text-sm">
              {isRtl ? "لا توجد منشورات حتى الآن" : "No posts yet"}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AppSidebar />
    </div>
  );
}
