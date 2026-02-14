
"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  MoreHorizontal, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Search, 
  Edit2, 
  Compass,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from "@/context/LanguageContext";
import { AppSidebar } from "@/components/layout/AppSidebar";
import Link from "next/link";
import { PostCard } from "@/components/feed/PostCard";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { t, isRtl } = useLanguage();
  const [activeTab, setActiveTab] = useState("posts");
  const auth = useAuth();
  const { user: currentUser } = useUser();
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

  // Profile data
  const user = {
    name: currentUser?.displayName || (isRtl ? "مستخدم Unbound" : "Unbound User"),
    handle: currentUser?.email?.split('@')[0] || "user",
    bio: isRtl 
      ? "للمة ليست تطبيقاً عادياً، إنها مساحة حرة، تشارك فيها أفكارك، تصنع محتوى، ويُسمع صوتك بصدق." 
      : "Unbound is not just an app, it's a free space where you share your thoughts and create content.",
    followers: 116,
    following: 3,
    joinDate: isRtl ? "فبراير ٢٠٢٦" : "February 2026",
    location: isRtl ? "الجزائر" : "Algeria",
    isVerified: true,
    coverImage: "https://picsum.photos/seed/cover/1200/400",
    avatarImage: currentUser?.photoURL || "https://picsum.photos/seed/avatar/200/200"
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-800 pb-20">
      <div className="relative h-48 w-full group">
        <img 
          src={user.coverImage} 
          alt="Cover" 
          className="w-full h-full object-cover opacity-80"
        />
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

        <div className="absolute bottom-4 right-4 bg-orange-500 rounded-lg px-3 py-1.5 flex items-center gap-2 cursor-pointer shadow-lg hover:bg-orange-600 transition-colors">
          <div className="h-5 w-5 rounded-full border-2 border-white flex items-center justify-center">
            <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
          </div>
          <span className="text-xs font-bold">{isRtl ? "بث مباشر" : "Live"}</span>
        </div>
      </div>

      <div className="px-4 relative">
        <div className="absolute -top-12 left-4">
          <Avatar className="h-24 w-24 border-4 border-black ring-2 ring-zinc-800 shadow-xl">
            <AvatarImage src={user.avatarImage} />
            <AvatarFallback className="bg-primary text-3xl font-bold">U</AvatarFallback>
          </Avatar>
        </div>

        <div className="pt-14 space-y-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-xl font-bold tracking-tight">{user.name}</h2>
            {user.isVerified && <CheckCircle2 className="h-5 w-5 text-primary fill-primary text-black" />}
          </div>
          <p className="text-muted-foreground text-sm">@{user.handle}</p>
        </div>

        <div className="mt-4 text-[13px] leading-relaxed text-zinc-300">
          {user.bio}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{isRtl ? "انضم في" : "Joined"} {user.joinDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{user.location}</span>
          </div>
        </div>

        <div className="mt-4 flex gap-5 text-sm">
          <div className="flex gap-1 hover:underline cursor-pointer">
            <span className="font-bold text-white">{user.followers}</span>
            <span className="text-muted-foreground">{isRtl ? "المتابعون" : "Followers"}</span>
          </div>
          <div className="flex gap-1 hover:underline cursor-pointer">
            <span className="font-bold text-white">{user.following}</span>
            <span className="text-muted-foreground">{isRtl ? "متابعًا" : "Following"}</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="posts" className="mt-6 w-full" onValueChange={setActiveTab}>
        <TabsList className="w-full bg-black rounded-none h-12 p-0 border-b border-zinc-900 justify-start overflow-x-auto no-scrollbar">
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
          <div className="p-10 text-center text-zinc-500 text-sm">
            {isRtl ? "لا توجد منشورات حتى الآن" : "No posts yet"}
          </div>
        </TabsContent>
      </Tabs>

      <AppSidebar />
    </div>
  );
}
