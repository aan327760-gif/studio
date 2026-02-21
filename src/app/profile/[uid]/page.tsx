
"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Loader2,
  Settings,
  ShieldCheck,
  MessageSquare,
  Bookmark,
  Heart,
  Newspaper,
  Globe,
  MapPin,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from "@/context/LanguageContext";
import { AppSidebar } from "@/components/layout/AppSidebar";
import Link from "next/link";
import { PostCard } from "@/components/feed/PostCard";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, limit, doc, setDoc, deleteDoc, serverTimestamp, increment, updateDoc, addDoc, getDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const SUPER_ADMIN_EMAIL = "adelbenmaza3@gmail.com";

export default function UserProfilePage() {
  const { uid } = useParams();
  const { isRtl } = useLanguage();
  const { user: currentUser } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const isOwnProfile = currentUser?.uid === uid;
  const isSuper = currentUser?.email === SUPER_ADMIN_EMAIL;

  const profileRef = useMemoFirebase(() => uid ? doc(db, "users", uid as string) : null, [db, uid]);
  const { data: profile, isLoading: profileLoading } = useDoc<any>(profileRef);

  const followId = currentUser && uid ? `${currentUser.uid}_${uid}` : null;
  const followRef = useMemoFirebase(() => (followId && !isOwnProfile) ? doc(db, "follows", followId) : null, [db, followId, isOwnProfile]);
  const { data: followDoc } = useDoc<any>(followRef);
  const isFollowing = !!followDoc;

  const reverseFollowId = currentUser && uid ? `${uid}_${currentUser.uid}` : null;
  const reverseFollowRef = useMemoFirebase(() => (reverseFollowId && !isOwnProfile) ? doc(db, "follows", reverseFollowId) : null, [db, reverseFollowId, isOwnProfile]);
  const { data: followsMe } = useDoc<any>(reverseFollowRef);
  const isFriend = isFollowing && !!followsMe;

  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const userArticlesQuery = useMemoFirebase(() => uid ? query(collection(db, "articles"), where("authorId", "==", uid), limit(30)) : null, [db, uid]);
  const { data: userArticles, isLoading: articlesLoading } = useCollection<any>(userArticlesQuery);

  const likedArticlesQuery = useMemoFirebase(() => uid ? query(collection(db, "articles"), where("likedBy", "array-contains", uid), limit(30)) : null, [db, uid]);
  const { data: likedArticles, isLoading: likesLoading } = useCollection<any>(likedArticlesQuery);

  const userRank = useMemo(() => {
    const points = profile?.points || 0;
    if (points >= 500) return { label: isRtl ? "متميز" : "Distinguished", color: "text-orange-500 bg-orange-500/10 border-orange-500/20" };
    if (points >= 200) return { label: isRtl ? "نشط" : "Active", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" };
    return { label: isRtl ? "مبتدئ" : "Beginner", color: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20" };
  }, [profile?.points, isRtl]);

  const handleShare = async () => {
    if (!profile) return;
    const shareUrl = `${window.location.origin}/auth?ref=${profile.uid}`;
    const shareText = isRtl 
      ? `انضم إليّ في جريدة القوميون، المنصة الإعلامية السيادية. سجل من هنا لتحصل على نقاط ترحيبية:` 
      : `Join me on Al-Qaumiyun, the sovereign media platform. Register here to get welcome points:`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'جريدة القوميون',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({ title: isRtl ? "تم نسخ رابط الإحالة" : "Referral link copied" });
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !uid || isOwnProfile || !followRef) return;
    
    if (isFollowing) {
      await deleteDoc(followRef);
      updateDoc(doc(db, "users", currentUser.uid), { followingCount: increment(-1) });
      updateDoc(doc(db, "users", uid as string), { followersCount: increment(-1) });
    } else {
      await setDoc(followRef, { followerId: currentUser.uid, followingId: uid, createdAt: serverTimestamp() });
      updateDoc(doc(db, "users", currentUser.uid), { followingCount: increment(1) });
      updateDoc(doc(db, "users", uid as string), { followersCount: increment(1) });

      addDoc(collection(db, "notifications"), {
        userId: uid, 
        type: "follow", 
        fromUserId: currentUser.uid,
        fromUserName: currentUser.displayName || "Someone", 
        fromUserAvatar: currentUser.photoURL || "",
        message: isRtl ? "بدأ في متابعتك" : "started following you",
        read: false, 
        createdAt: serverTimestamp()
      });
    }
  };

  if (profileLoading) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const showCheckmark = profile?.isVerified || profile?.email === SUPER_ADMIN_EMAIL;

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-800 pb-20 overflow-x-hidden">
      <div className="relative h-48 w-full bg-zinc-900">
        {profile?.bannerURL && <img src={profile.bannerURL} alt="Cover" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <Button variant="ghost" size="icon" className="rounded-full bg-black/40 backdrop-blur-md" onClick={() => router.back()}>
            <ArrowLeft className={cn("h-5 w-5", isRtl ? "rotate-180" : "")} />
          </Button>
          <div className="flex gap-2">
            {isOwnProfile && (
              <Button variant="ghost" size="icon" className="rounded-full bg-primary/20 backdrop-blur-md text-primary" onClick={handleShare}>
                <Share2 className="h-5 w-5" />
              </Button>
            )}
            {isOwnProfile && isSuper && (
              <Button variant="ghost" size="icon" className="rounded-full bg-primary/20 backdrop-blur-md text-primary" onClick={() => router.push('/admin')}>
                <ShieldCheck className="h-5 w-5" />
              </Button>
            )}
            {isOwnProfile && <Link href="/settings"><Button variant="ghost" size="icon" className="rounded-full bg-black/40 backdrop-blur-md"><Settings className="h-5 w-5" /></Button></Link>}
          </div>
        </div>
      </div>

      <div className="px-6 relative -mt-14">
        <Avatar className="h-28 w-28 border-[6px] border-black shadow-2xl mb-4">
          <AvatarImage src={profile?.photoURL} />
          <AvatarFallback className="bg-zinc-800 text-3xl font-black">{profile?.displayName?.[0]}</AvatarFallback>
        </Avatar>

        <div className="flex justify-between items-start">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-2xl font-black truncate">{profile?.displayName}</h2>
              {showCheckmark && <VerificationBadge className="h-5 w-5" />}
            </div>
            <div className="flex items-center gap-2">
               <p className="text-zinc-500 text-sm font-medium">@{profile?.email?.split('@')[0]}</p>
               <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-widest px-2 h-5", userRank.color)}>
                  {userRank.label}
               </Badge>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            {isOwnProfile ? (
              <Link href="/profile/edit"><Button variant="outline" className="rounded-full font-black px-6">Edit</Button></Link>
            ) : (
              <div className="flex gap-2">
                {isFriend && (
                  <Button variant="outline" size="icon" className="rounded-full bg-primary/10 border-primary/30" onClick={() => router.push(`/messages/${[currentUser?.uid, uid].sort().join('_')}`)}>
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </Button>
                )}
                <Button onClick={handleFollow} className={cn("rounded-full font-black px-8", isFollowing ? "bg-zinc-900 text-white border border-zinc-800" : "bg-white text-black")}>
                  {isFollowing ? (isRtl ? "يتبع" : "Following") : (isRtl ? "متابعة" : "Follow")}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
           <div className="flex items-center gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-900 shadow-inner">
              <div className="flex-1 flex flex-col items-center border-r border-zinc-900">
                 <span className="text-lg font-black text-primary">{profile?.points || 0}</span>
                 <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{isRtl ? "نقطة" : "Points"}</span>
              </div>
              <div className="flex-1 flex flex-col items-center">
                 <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3 text-zinc-500" />
                    <span className="text-lg font-black">{profile?.nationality || "Global"}</span>
                 </div>
                 <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{isRtl ? "الوطن" : "Nation"}</span>
              </div>
           </div>
           {profile?.location && (
             <div className="flex items-center gap-2 px-2">
                <MapPin className="h-3 w-3 text-zinc-600" />
                <span className="text-xs text-zinc-500 font-bold">{profile.location}</span>
             </div>
           )}
        </div>

        <div className="mt-4 text-[15px] leading-relaxed text-zinc-300 font-medium whitespace-pre-line">{profile?.bio}</div>

        <div className="mt-6 flex gap-6 border-y border-zinc-900 py-4">
          <button onClick={() => setShowFollowing(true)} className="flex flex-col items-center flex-1 active:scale-95 transition-transform">
            <span className="font-black text-lg">{profile?.followingCount || 0}</span>
            <span className="text-[10px] text-zinc-500 font-black uppercase">{isRtl ? "يتابع" : "Following"}</span>
          </button>
          <button onClick={() => setShowFollowers(true)} className="flex flex-col items-center flex-1 border-x border-zinc-900 active:scale-95 transition-transform">
            <span className="font-black text-lg">{profile?.followersCount || 0}</span>
            <span className="text-[10px] text-zinc-500 font-black uppercase">{isRtl ? "متابع" : "Followers"}</span>
          </button>
          <div className="flex flex-col items-center flex-1">
            <span className="font-black text-lg">{userArticles?.length || 0}</span>
            <span className="text-[10px] text-zinc-500 font-black uppercase">{isRtl ? "مقال" : "Articles"}</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="articles" className="mt-2 w-full">
        <TabsList className="w-full bg-black h-14 p-0 border-b border-zinc-900 flex">
          <TabsTrigger value="articles" className="flex-1 font-black text-[10px] uppercase data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
            <Newspaper className="h-3 w-3 mr-2" /> {isRtl ? "مقالاتي" : "Articles"}
          </TabsTrigger>
          <TabsTrigger value="likes" className="flex-1 font-black text-[10px] uppercase data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
            <Heart className="h-3 w-3 mr-2" /> {isRtl ? "إعجابات" : "Likes"}
          </TabsTrigger>
          <TabsTrigger value="archive" className="flex-1 font-black text-[10px] uppercase data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
            <Bookmark className="h-3 w-3 mr-2" /> {isRtl ? "الأرشيف" : "Archive"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="m-0">
          {articlesLoading ? <div className="p-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" /></div> :
            (userArticles && userArticles.length > 0) ? userArticles.map((article: any) => (
              <PostCard 
                key={article.id} 
                id={article.id} 
                author={{
                  name: article.authorName, 
                  uid: article.authorId, 
                  nationality: article.authorNationality,
                  isVerified: article.authorIsVerified,
                  email: article.authorEmail
                }} 
                content={article.content} 
                image={article.mediaUrl} 
                likes={article.likesCount || 0} 
                commentsCount={article.commentsCount} 
                likedBy={article.likedBy}
                savedBy={article.savedBy}
                tags={article.tags}
                time={article.createdAt?.toDate ? article.createdAt.toDate().toLocaleDateString() : ""} 
              />
            )) : (
              <div className="py-24 text-center opacity-20 flex flex-col items-center gap-4">
                 <Newspaper className="h-12 w-12" />
                 <p className="text-xs font-black uppercase">{isRtl ? "لا توجد مقالات منشورة" : "No articles published"}</p>
              </div>
            )}
        </TabsContent>

        <TabsContent value="likes" className="m-0">
          {likesLoading ? <div className="p-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" /></div> :
            (likedArticles && likedArticles.length > 0) ? likedArticles.map((article: any) => (
              <PostCard 
                key={article.id} 
                id={article.id} 
                author={{
                  name: article.authorName, 
                  uid: article.authorId, 
                  nationality: article.authorNationality,
                  isVerified: article.authorIsVerified,
                  email: article.authorEmail
                }} 
                content={article.content} 
                image={article.mediaUrl} 
                likes={article.likesCount || 0} 
                commentsCount={article.commentsCount}
                likedBy={article.likedBy}
                savedBy={article.savedBy}
                tags={article.tags}
                time={article.createdAt?.toDate ? article.createdAt.toDate().toLocaleDateString() : ""} 
              />
            )) : (
              <div className="py-24 text-center opacity-20 flex flex-col items-center gap-4">
                 <Heart className="h-12 w-12" />
                 <p className="text-xs font-black uppercase">{isRtl ? "لا توجد مقالات معجب بها" : "No likes yet"}</p>
              </div>
            )}
        </TabsContent>

        <TabsContent value="archive" className="m-0">
          <div className="py-24 text-center opacity-20 flex flex-col items-center gap-4">
             <Bookmark className="h-12 w-12" />
             <p className="text-xs font-black uppercase">{isRtl ? "الأرشيف فارغ" : "Archive is empty"}</p>
          </div>
        </TabsContent>
      </Tabs>

      <FollowListDialog open={showFollowers} onOpenChange={setShowFollowers} userId={uid as string} type="followers" isRtl={isRtl} />
      <FollowListDialog open={showFollowing} onOpenChange={setShowFollowing} userId={uid as string} type="following" isRtl={isRtl} />

      <AppSidebar />
    </div>
  );
}

function FollowListDialog({ open, onOpenChange, userId, type, isRtl }: any) {
  const db = useFirestore();
  const field = type === 'followers' ? 'followingId' : 'followerId';
  const targetField = type === 'followers' ? 'followerId' : 'followingId';
  const queryRef = useMemoFirebase(() => query(collection(db, "follows"), where(field, "==", userId), limit(50)), [db, userId, field]);
  const { data: followDocs, isLoading } = useCollection<any>(queryRef);
  const [users, setUsers] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const list = followDocs || [];
      if (list.length === 0) { setUsers([]); return; }
      setFetching(true);
      const results = [];
      for (const docSnap of list) {
        const uDoc = await getDoc(doc(db, "users", docSnap[targetField]));
        if (uDoc.exists()) results.push({ ...uDoc.data(), id: uDoc.id });
      }
      setUsers(results);
      setFetching(false);
    };
    if (open) fetchUsers();
  }, [open, followDocs, db, targetField]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-900 text-white max-w-[90%] rounded-[2.5rem] p-0 overflow-hidden h-[60vh] flex flex-col">
        <DialogHeader className="p-6 border-b border-zinc-900">
          <DialogTitle className="text-center font-black uppercase text-sm">{type === 'followers' ? (isRtl ? "المتابعون" : "Followers") : (isRtl ? "يتابع" : "Following")}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 p-4">
          {(isLoading || fetching) ? <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin opacity-20" /></div> : users.map((u) => (
            <Link key={u.id} href={`/profile/${u.id}`} onClick={() => onOpenChange(false)}>
              <div className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl transition-all">
                <Avatar className="h-10 w-10 border border-zinc-800"><AvatarImage src={u.photoURL} /><AvatarFallback>U</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-black truncate">{u.displayName}</p>
                    {u.isVerified && <VerificationBadge className="h-3.5 w-3.5" />}
                  </div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase truncate">@{u.email?.split('@')[0]}</p>
                </div>
              </div>
            </Link>
          ))}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
