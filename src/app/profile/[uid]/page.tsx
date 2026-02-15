
"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Loader2,
  Settings,
  ShieldCheck,
  Star,
  Heart,
  Calendar,
  MapPin,
  MessageSquare,
  Lock,
  Info,
  Bookmark,
  Users,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from "@/context/LanguageContext";
import { AppSidebar } from "@/components/layout/AppSidebar";
import Link from "next/link";
import { PostCard } from "@/components/feed/PostCard";
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, limit, doc, setDoc, deleteDoc, serverTimestamp, increment, updateDoc, addDoc, getDocs, getDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  const reverseFollowId = currentUser && uid ? `${uid}_${currentUser.uid}` : null;
  const reverseFollowRef = useMemoFirebase(() => (reverseFollowId && !isOwnProfile) ? doc(db, "follows", reverseFollowId) : null, [db, reverseFollowId, isOwnProfile]);
  const { data: reverseFollowDoc } = useDoc<any>(reverseFollowRef);
  const followsMe = !!reverseFollowDoc;

  const isFriend = isFollowing && followsMe;

  // Lists state
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const userPostsQuery = useMemoFirebase(() => {
    if (!uid) return null;
    return query(collection(db, "posts"), where("authorId", "==", uid), limit(30));
  }, [db, uid]);
  const { data: userPosts = [], loading: postsLoading } = useCollection<any>(userPostsQuery);

  const likedPostsQuery = useMemoFirebase(() => {
    if (!uid) return null;
    return query(collection(db, "posts"), where("likedBy", "array-contains", uid), limit(30));
  }, [db, uid]);
  const { data: likedPosts = [], loading: likedLoading } = useCollection<any>(likedPostsQuery);

  const savedPostsQuery = useMemoFirebase(() => {
    if (!uid || !isOwnProfile) return null;
    return query(collection(db, "posts"), where("savedBy", "array-contains", uid), limit(30));
  }, [db, uid, isOwnProfile]);
  const { data: savedPosts = [], loading: savedLoading } = useCollection<any>(savedPostsQuery);

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
        userId: uid, 
        type: "follow", 
        fromUserId: currentUser.uid,
        fromUserName: currentUserProfile?.displayName || currentUser.displayName || "User", 
        fromUserAvatar: currentUserProfile?.photoURL || currentUser.photoURL || "",
        message: isRtl ? "بدأ في متابعتك" : "started following you",
        read: false, 
        createdAt: serverTimestamp()
      });
    }
  };

  const handleStartMessage = async () => {
    if (!currentUser || !uid || isOwnProfile || !isFriend) return;
    
    try {
      const participants = [currentUser.uid, uid as string].sort();
      const chatId = participants.join("_");
      const chatRef = doc(db, "direct_conversations", chatId);
      
      const snap = await getDoc(chatRef);
      if (!snap.exists()) {
        await setDoc(chatRef, {
          participants,
          updatedAt: serverTimestamp(),
          lastMessage: "",
          createdAt: serverTimestamp()
        });
      }
      
      router.push(`/messages/${chatId}`);
    } catch (error) {
      toast({ variant: "destructive", title: "Chat initialization failed" });
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
  const isMediaChannel = profile?.isPro;

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

      <div className="px-6 relative -mt-14">
        <Avatar className="h-28 w-28 border-[6px] border-black shadow-2xl mb-4">
          <AvatarImage src={profile?.photoURL} />
          <AvatarFallback className="bg-zinc-800 text-3xl font-black">{profile?.displayName?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-2xl font-black tracking-tight">{profile?.displayName}</h2>
              {showCheckmark && <VerificationBadge className="h-5 w-5" />}
              {isMediaChannel && (
                <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                   <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                   <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">
                     {isRtl ? "قناة إعلامية" : "Media Channel"}
                   </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-zinc-500 text-sm font-medium">@{profile?.email?.split('@')[0] || "user"}</p>
              {isProfileAdmin && <span className="bg-primary/10 text-primary text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-primary/20">{isRtl ? "إدارة" : "Admin"}</span>}
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            {isOwnProfile ? (
              <Link href="/profile/edit"><Button variant="outline" className="rounded-full font-black px-6 border-zinc-700">{isRtl ? "تعديل" : "Edit"}</Button></Link>
            ) : (
              <div className="flex gap-2">
                {isFriend ? (
                  <Button variant="outline" size="icon" className="rounded-full border-zinc-700 h-10 w-10 bg-primary/10 border-primary/30" onClick={handleStartMessage}>
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </Button>
                ) : (
                  <Button variant="outline" size="icon" className="rounded-full border-zinc-800 h-10 w-10 opacity-40 cursor-not-allowed" disabled>
                    <Lock className="h-4 w-4 text-zinc-600" />
                  </Button>
                )}
                <Button onClick={handleFollow} className={cn("rounded-full font-black px-8 h-10", isFollowing ? "bg-zinc-900 text-white border border-zinc-800" : "bg-white text-black")}>
                  {isFollowing ? (isRtl ? "يتبع" : "Following") : (isRtl ? "متابعة" : "Follow")}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-[15px] leading-relaxed text-zinc-300 font-medium">
          {profile?.bio || (isRtl ? "لا توجد سيرة ذاتية.." : "No bio yet.")}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500 font-bold uppercase tracking-widest">
           {profile?.location && (
             <div className="flex items-center gap-1.5">
               <MapPin className="h-3.5 w-3.5" />
               <span>{profile.location}</span>
             </div>
           )}
           <div className="flex items-center gap-1.5">
             <Calendar className="h-3.5 w-3.5" />
             <span>{isRtl ? "انضم" : "Joined"} {profile?.createdAt?.toDate ? profile.createdAt.toDate().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' }) : "Recently"}</span>
           </div>
        </div>

        <div className="mt-6 flex gap-6 border-y border-zinc-900 py-4">
          <button onClick={() => setShowFollowing(true)} className="flex flex-col items-center flex-1 active:scale-95 transition-transform">
            <span className="font-black text-lg text-white">{profile?.followingCount || 0}</span>
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{isRtl ? "يتابع" : "Following"}</span>
          </button>
          <button onClick={() => setShowFollowers(true)} className="flex flex-col items-center flex-1 border-x border-zinc-900 active:scale-95 transition-transform">
            <span className="font-black text-lg text-white">{profile?.followersCount || 0}</span>
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{isRtl ? "متابع" : "Followers"}</span>
          </button>
          <div className="flex flex-col items-center flex-1">
            <span className="font-black text-lg text-white">{userPosts.length}</span>
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{isRtl ? "منشور" : "Posts"}</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="posts" className="mt-2 w-full">
        <TabsList className="w-full bg-black rounded-none h-14 p-0 border-b border-zinc-900 justify-around glass">
          <TabsTrigger value="posts" className="flex-1 font-black text-[10px] uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-primary">{isRtl ? "المنشورات" : "Posts"}</TabsTrigger>
          <TabsTrigger value="media" className="flex-1 font-black text-[10px] uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-primary">{isRtl ? "الوسائط" : "Media"}</TabsTrigger>
          {isOwnProfile && <TabsTrigger value="saved" className="flex-1 font-black text-[10px] uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-primary">{isRtl ? "الأرشيف" : "Archive"}</TabsTrigger>}
          <TabsTrigger value="likes" className="flex-1 font-black text-[10px] uppercase tracking-widest border-b-2 border-transparent data-[state=active]:border-primary">{isRtl ? "الإعجابات" : "Likes"}</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="m-0">
          {postsLoading ? <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" /></div> : userPosts.length > 0 ? (
            <div className="flex flex-col">{userPosts.map((post: any) => <PostCard key={post.id} id={post.id} author={{...profile, handle: profile.email?.split('@')[0], uid: uid, id: uid}} content={post.content} image={post.mediaUrl} mediaUrls={post.mediaUrls} mediaType={post.mediaType} likes={post.likesCount || 0} saves={post.savesCount || 0} likedBy={post.likedBy} savedBy={post.savedBy} commentsCount={post.commentsCount} time={post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : ""} />)}</div>
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

        {isOwnProfile && (
          <TabsContent value="saved" className="m-0">
            {savedLoading ? (
              <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" /></div>
            ) : savedPosts.length > 0 ? (
              <div className="flex flex-col">
                {savedPosts.map((post: any) => (
                  <PostCard 
                    key={post.id} 
                    id={post.id} 
                    author={post.author} 
                    content={post.content} 
                    image={post.mediaUrl} 
                    mediaUrls={post.mediaUrls}
                    mediaType={post.mediaType} 
                    likes={post.likesCount || 0} 
                    saves={post.savesCount || 0}
                    likedBy={post.likedBy}
                    savedBy={post.savedBy}
                    commentsCount={post.commentsCount}
                    time={post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : ""} 
                  />
                ))}
              </div>
            ) : (
              <div className="p-20 text-center flex flex-col items-center gap-4 opacity-20">
                <Bookmark className="h-12 w-12" />
                <p className="text-sm font-bold">{isRtl ? "الأرشيف فارغ" : "Archive is empty"}</p>
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="likes" className="m-0">
          {likedLoading ? (
            <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" /></div>
          ) : likedPosts.length > 0 ? (
            <div className="flex flex-col">
              {likedPosts.map((post: any) => (
                <PostCard 
                  key={post.id} 
                  id={post.id} 
                  author={post.author} 
                  content={post.content} 
                  image={post.mediaUrl} 
                  mediaUrls={post.mediaUrls}
                  mediaType={post.mediaType} 
                  likes={post.likesCount || 0} 
                  saves={post.savesCount || 0}
                  likedBy={post.likedBy}
                  savedBy={post.savedBy}
                  commentsCount={post.commentsCount}
                  time={post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : ""} 
                />
              ))}
            </div>
          ) : (
            <div className="p-20 text-center flex flex-col items-center gap-4 opacity-20">
              <Heart className="h-12 w-12" />
              <p className="text-sm font-bold">{isRtl ? "لا توجد إعجابات بعد" : "No likes yet"}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Followers/Following Dialogs */}
      <FollowListDialog 
        open={showFollowers} 
        onOpenChange={setShowFollowers} 
        userId={uid as string} 
        type="followers" 
        isRtl={isRtl} 
      />
      <FollowListDialog 
        open={showFollowing} 
        onOpenChange={setShowFollowing} 
        userId={uid as string} 
        type="following" 
        isRtl={isRtl} 
      />

      <AppSidebar />
    </div>
  );
}

function FollowListDialog({ open, onOpenChange, userId, type, isRtl }: any) {
  const db = useFirestore();
  const field = type === 'followers' ? 'followingId' : 'followerId';
  const targetField = type === 'followers' ? 'followerId' : 'followingId';
  
  const queryRef = useMemoFirebase(() => {
    return query(collection(db, "follows"), where(field, "==", userId), limit(50));
  }, [db, userId, field]);
  
  const { data: followDocs = [], loading } = useCollection<any>(queryRef);
  const [users, setUsers] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (followDocs.length === 0) {
        setUsers([]);
        return;
      }
      setFetching(true);
      const results = [];
      for (const docSnap of followDocs) {
        const uId = docSnap[targetField];
        const uDoc = await getDoc(doc(db, "users", uId));
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
          <DialogTitle className="text-center font-black uppercase tracking-widest text-sm">
            {type === 'followers' ? (isRtl ? "المتابعون" : "Followers") : (isRtl ? "يتابع" : "Following")}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 p-4">
          {loading || fetching ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary opacity-20" /></div>
          ) : users.length > 0 ? (
            <div className="space-y-4">
              {users.map((u) => (
                <Link key={u.id} href={`/profile/${u.id}`} onClick={() => onOpenChange(false)}>
                  <div className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl transition-all">
                    <Avatar className="h-10 w-10 ring-1 ring-zinc-800">
                      <AvatarImage src={u.photoURL} />
                      <AvatarFallback>{u.displayName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-black truncate">{u.displayName}</p>
                        {u.isVerified && <VerificationBadge className="h-3.5 w-3.5" />}
                      </div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">@{u.email?.split('@')[0]}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
               <Users className="h-12 w-12" />
               <p className="text-xs font-black uppercase tracking-widest">{isRtl ? "القائمة فارغة" : "List is empty"}</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
