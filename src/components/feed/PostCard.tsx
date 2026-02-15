
"use client";

import { 
  Heart, 
  MessageCircle, 
  MoreHorizontal, 
  Trash2, 
  Flag, 
  Play, 
  Download,
  Send,
  Bookmark
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { useState, useEffect, useRef, memo } from "react";
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  onSnapshot, 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit, 
  deleteDoc,
  increment
} from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface PostCardProps {
  id: string;
  author: any;
  content: string;
  image?: string;
  mediaUrls?: string[];
  mediaType?: "image" | "video" | "audio" | "album";
  likes?: number;
  saves?: number;
  commentsCount?: number;
  time: string;
  allowComments?: boolean;
}

export const PostCard = memo(({ id, author, content, image, mediaUrls = [], mediaType, likes: initialLikes = 0, saves: initialSaves = 0, time, allowComments = true }: PostCardProps) => {
  const { isRtl } = useLanguage();
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const userProfileRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: currentUserProfile } = useDoc<any>(userProfileRef);
  const isBanned = currentUserProfile?.isBannedUntil && currentUserProfile.isBannedUntil.toDate() > new Date();
  const isAdmin = currentUserProfile?.role === "admin" || user?.email === "adelbenmaza3@gmail.com";

  const [likesCount, setLikesCount] = useState(initialLikes);
  const [savesCount, setSavesCount] = useState(initialSaves);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const truncationLimit = 240;
  const isLongContent = content?.length > truncationLimit;
  const displayContent = isExpanded ? content : content?.slice(0, truncationLimit) + "...";

  const commentsQuery = useMemoFirebase(() => {
    if (!id) return null;
    return query(collection(db, "posts", id, "comments"), orderBy("createdAt", "desc"), limit(20));
  }, [db, id]);
  const { data: comments = [] } = useCollection<any>(commentsQuery);

  useEffect(() => {
    if (!id || !db) return;
    const postRef = doc(db, "posts", id);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLikesCount(data.likesCount || 0);
        setSavesCount(data.savesCount || 0);
        if (user) {
          setIsLiked((data.likedBy || []).includes(user.uid));
          setIsSaved((data.savedBy || []).includes(user.uid));
        }
      }
    });
    return () => unsubscribe();
  }, [id, db, user]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !id || isBanned) return;
    const postRef = doc(db, "posts", id);
    updateDoc(postRef, isLiked ? { likedBy: arrayRemove(user.uid), likesCount: increment(-1) } : { likedBy: arrayUnion(user.uid), likesCount: increment(1) });
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !id || isBanned) return;
    updateDoc(doc(db, "posts", id), isSaved ? { savedBy: arrayRemove(user.uid), savesCount: increment(-1) } : { savedBy: arrayUnion(user.uid), savesCount: increment(1) });
    toast({ title: isSaved ? (isRtl ? "تمت الإزالة" : "Unsaved") : (isRtl ? "تم الحفظ" : "Saved") });
  };

  const handleAddComment = () => {
    if (isBanned || !newComment.trim() || !user || !id || !allowComments) return;
    addDoc(collection(db, "posts", id, "comments"), {
      authorId: user.uid, authorName: currentUserProfile?.displayName || user.displayName, authorAvatar: currentUserProfile?.photoURL || user.photoURL, authorHandle: user.email?.split('@')[0], text: newComment, createdAt: serverTimestamp(), likesCount: 0, likedBy: []
    });
    updateDoc(doc(db, "posts", id), { commentsCount: increment(1) });
    setNewComment("");
  };

  const carouselImages = mediaUrls.length > 0 ? mediaUrls : (image ? [image] : []);

  return (
    <Card className="bg-black text-white border-none rounded-none border-b border-zinc-900/30 cursor-pointer" onClick={() => router.push(`/post/${id}`)}>
      <CardHeader className="p-5 pb-3 flex flex-row items-center gap-4">
        <Link href={`/profile/${author?.uid || author?.id || '#'}`} onClick={(e) => e.stopPropagation()}>
          <Avatar className="h-11 w-11 border border-zinc-900 shadow-sm">
            <AvatarImage src={author?.avatar || author?.photoURL} />
            <AvatarFallback>{author?.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-[15px] truncate tracking-tight">{author?.name || author?.displayName}</h3>
                {(author?.isVerified || author?.role === 'admin' || author?.email === "adelbenmaza3@gmail.com") && <VerificationBadge className="h-4 w-4" />}
              </div>
              <span className="text-[10px] text-zinc-600 font-bold uppercase">@{author?.handle || author?.email?.split('@')[0]}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-800"><MoreHorizontal className="h-5 w-5" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-900 text-white rounded-2xl p-2 shadow-2xl">
                <DropdownMenuItem className="text-orange-500 rounded-xl font-black text-xs uppercase cursor-pointer"><Flag className="h-4 w-4 mr-2" /> {isRtl ? "إبلاغ" : "Report"}</DropdownMenuItem>
                {isAdmin && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteDoc(doc(db, "posts", id)); }} className="text-red-500 rounded-xl font-black text-xs uppercase cursor-pointer"><Trash2 className="h-4 w-4 mr-2" /> {isRtl ? "حذف" : "Delete"}</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="px-5 pb-3">
          {content && (
            <div className="space-y-1.5">
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{isLongContent ? displayContent : content}</p>
              {isLongContent && <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="text-primary font-black text-[11px] uppercase tracking-widest">{isExpanded ? (isRtl ? "عرض أقل" : "Show Less") : (isRtl ? "إقرأ المزيد" : "Read More")}</button>}
            </div>
          )}
        </div>

        {carouselImages.length > 0 && (
          <div className="w-full bg-black relative">
            {mediaType === 'video' ? (
              <div className="relative w-full flex items-center justify-center bg-zinc-950">
                <video ref={videoRef} src={carouselImages[0]} className="w-full h-auto object-contain max-h-[85vh]" onClick={(e) => { e.stopPropagation(); if(videoRef.current) isPlaying ? videoRef.current.pause() : videoRef.current.play(); setIsPlaying(!isPlaying); }} playsInline loop />
                {!isPlaying && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="h-16 w-16 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 flex items-center justify-center"><Play className="h-8 w-8 text-white fill-white" /></div></div>}
              </div>
            ) : (
              <Carousel className="w-full" onSelect={(api) => setCurrentSlide(api?.selectedScrollSnap() || 0)}>
                <CarouselContent>
                  {carouselImages.map((url, idx) => (
                    <CarouselItem key={idx} className="flex justify-center items-center bg-zinc-950">
                      <img src={url} alt="Media" className="w-full h-auto object-contain max-h-[85vh]" loading="lazy" />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {carouselImages.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                    {carouselImages.map((_, idx) => (
                      <div key={idx} className={cn("h-1 w-3 rounded-full transition-all", idx === currentSlide ? "bg-primary w-5" : "bg-white/30")} />
                    ))}
                  </div>
                )}
              </Carousel>
            )}
          </div>
        )}

        <div className="px-5 py-4 flex items-center justify-between border-t border-zinc-900/10" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 group cursor-pointer" onClick={handleLike}>
              <Heart className={cn("h-5 w-5 transition-transform active:scale-125", isLiked ? "fill-red-500 text-red-500" : "text-zinc-700")} />
              <span className={cn("text-xs font-black", isLiked ? "text-red-500" : "text-zinc-700")}>{likesCount}</span>
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <div className="flex items-center gap-2 group cursor-pointer">
                  <MessageCircle className="h-5 w-5 text-zinc-700" />
                  <span className="text-xs font-black text-zinc-700">{comments.length}</span>
                </div>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] bg-zinc-950 border-zinc-900 rounded-t-[3rem] p-0 flex flex-col outline-none shadow-2xl">
                <SheetHeader className="p-4 border-b border-zinc-900">
                  <div className="flex items-center justify-between">
                    <SheetClose asChild><Button variant="ghost" size="icon" className="text-zinc-500 rounded-full"><X className="h-5 w-5" /></Button></SheetClose>
                    <SheetTitle className="text-white font-black text-lg uppercase">{isRtl ? "التعليقات" : "Comments"}</SheetTitle>
                    <div className="w-10" />
                  </div>
                </SheetHeader>
                <ScrollArea className="flex-1 p-4 space-y-8 pb-32">
                  {comments.map((comment: any) => <CommentItem key={comment.id} comment={comment} postId={id} isRtl={isRtl} user={user} isBanned={isBanned} />)}
                </ScrollArea>
                <div className="p-4 pb-8 border-t border-zinc-900 bg-black/90">
                  <div className="flex gap-3 items-center">
                    <Avatar className="h-10 w-10"><AvatarImage src={currentUserProfile?.photoURL || user?.photoURL} /><AvatarFallback>U</AvatarFallback></Avatar>
                    <div className="flex-1 flex items-center bg-zinc-900 p-1.5 rounded-full pl-6 pr-1.5 border border-zinc-800">
                      <Input placeholder={isRtl ? "إضافة تعليق..." : "Add comment..."} className="bg-transparent border-none h-10 text-sm focus-visible:ring-0" value={newComment} onChange={(e) => setNewComment(e.target.value)} maxLength={100} onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} />
                      <Button size="icon" className="rounded-full h-10 w-10 bg-primary" onClick={handleAddComment} disabled={!newComment.trim()}><Send className={cn("h-4 w-4", isRtl ? "rotate-180" : "")} /></Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center gap-2 group cursor-pointer" onClick={handleSave}>
            <Bookmark className={cn("h-5 w-5 transition-transform active:scale-125", isSaved ? "fill-primary text-primary" : "text-zinc-700")} />
            {savesCount > 0 && <span className={cn("text-xs font-black", isSaved ? "text-primary" : "text-zinc-700")}>{savesCount}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

PostCard.displayName = "PostCard";

function CommentItem({ comment, postId, isRtl, user, isBanned }: any) {
  // ... (CommentItem Logic remains same but ensures light rendering)
  return (
    <div className="flex gap-4">
      <Avatar className="h-9 w-9"><AvatarImage src={comment.authorAvatar} /><AvatarFallback>U</AvatarFallback></Avatar>
      <div className="flex-1 space-y-1">
        <span className="text-xs font-black text-zinc-400 uppercase">@{comment.authorHandle}</span>
        <p className="text-[14px] text-zinc-200 leading-relaxed">{comment.text}</p>
      </div>
    </div>
  );
}
