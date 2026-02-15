
"use client";

import { 
  MessageCircle, 
  MoreHorizontal, 
  Trash2, 
  Flag, 
  Play, 
  Share2,
  Send,
  Bookmark,
  X,
  Loader2,
  CornerDownLeft,
  ThumbsUp,
  ThumbsDown,
  Info,
  ChevronRight,
  Star
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { useState, useRef, memo, useMemo } from "react";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  collection, 
  addDoc, 
  serverTimestamp, 
  orderBy, 
  limit, 
  deleteDoc,
  increment,
  query,
  where
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const SUPER_ADMIN_EMAIL = "adelbenmaza3@gmail.com";

interface PostCardProps {
  id: string;
  author: any;
  content: string;
  image?: string;
  mediaUrls?: string[];
  mediaType?: "image" | "video" | "audio" | "album";
  likes?: number;
  saves?: number;
  likedBy?: string[];
  savedBy?: string[];
  commentsCount?: number;
  time: string;
  allowComments?: boolean;
}

export const PostCard = memo(({ 
  id, author, content, image, mediaUrls = [], mediaType, 
  likes = 0, saves = 0, likedBy = [], savedBy = [], 
  commentsCount = 0,
  time, allowComments = true 
}: PostCardProps) => {
  const { isRtl } = useLanguage();
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const isSuper = user?.email === SUPER_ADMIN_EMAIL;

  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortType, setSortType] = useState<'top' | 'latest'>('top');

  const isLiked = user ? likedBy.includes(user.uid) : false;
  const isSaved = user ? savedBy.includes(user.uid) : false;

  const truncationLimit = 200;
  const isLongContent = content?.length > truncationLimit;
  const displayContent = isExpanded ? content : content?.slice(0, truncationLimit) + (isLongContent ? "..." : "");

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !id) return;
    const postRef = doc(db, "posts", id);
    updateDoc(postRef, isLiked ? { likedBy: arrayRemove(user.uid), likesCount: increment(-1) } : { likedBy: arrayUnion(user.uid), likesCount: increment(1) });
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !id) return;
    updateDoc(doc(db, "posts", id), isSaved ? { savedBy: arrayRemove(user.uid), savesCount: increment(-1) } : { savedBy: arrayUnion(user.uid), savesCount: increment(1) });
    toast({ title: isSaved ? (isRtl ? "تمت الإزالة" : "Unsaved") : (isRtl ? "تم الحفظ في الأرشيف" : "Saved to Archive") });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/post/${id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: isRtl ? "تم نسخ الرابط السيادي" : "Sovereign link copied" });
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !user || !id || !allowComments) return;
    
    const commentData = {
      authorId: user.uid, 
      authorName: user.displayName, 
      authorAvatar: user.photoURL, 
      authorHandle: user.email?.split('@')[0], 
      text: replyTo ? `@${replyTo.handle} ${newComment}` : newComment, 
      createdAt: serverTimestamp(), 
      likesCount: 0, 
      likedBy: [],
      parentId: replyTo?.id || null
    };

    addDoc(collection(db, "posts", id, "comments"), commentData);
    updateDoc(doc(db, "posts", id), { commentsCount: increment(1) });
    setNewComment("");
    setReplyTo(null);
  };

  const carouselImages = mediaUrls.length > 0 ? mediaUrls : (image ? [image] : []);

  return (
    <Card className="bg-black text-white border-none rounded-none border-b border-zinc-900/30 cursor-pointer overflow-hidden mb-1" onClick={() => router.push(`/post/${id}`)}>
      <CardHeader className="p-5 pb-3 flex flex-row items-center gap-4">
        <Link href={`/profile/${author?.uid || author?.id || '#'}`} onClick={(e) => e.stopPropagation()}>
          <Avatar className="h-11 w-11 border border-zinc-900 shadow-sm">
            <AvatarImage src={author?.avatar || author?.photoURL} />
            <AvatarFallback>{author?.name?.[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-[15px] truncate tracking-tight">{author?.name || author?.displayName}</h3>
                {(author?.isVerified || author?.email === SUPER_ADMIN_EMAIL) && <VerificationBadge className="h-4 w-4" />}
                {author?.isPro && (
                  <div className="flex items-center gap-0.5 bg-yellow-500/10 border border-yellow-500/20 px-1 rounded-full">
                    <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                    <span className="text-[7px] font-black text-yellow-500 uppercase">PRO</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-zinc-600 font-bold uppercase">@{author?.handle || author?.email?.split('@')[0]}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-800 hover:bg-zinc-900 rounded-full"><MoreHorizontal className="h-5 w-5" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-white rounded-2xl p-2 shadow-2xl">
                <DropdownMenuItem className="text-orange-500 rounded-xl font-black text-xs uppercase cursor-pointer" onClick={(e) => e.stopPropagation()}><Flag className="h-4 w-4 mr-2" /> {isRtl ? "إبلاغ" : "Report"}</DropdownMenuItem>
                {isSuper && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteDoc(doc(db, "posts", id)); }} className="text-red-500 rounded-xl font-black text-xs uppercase cursor-pointer"><Trash2 className="h-4 w-4 mr-2" /> {isRtl ? "حذف سيادي" : "Root Delete"}</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="px-5 pb-3">
          {content && (
            <div className="space-y-3">
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{isLongContent ? displayContent : content}</p>
              {isLongContent && (
                <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="text-primary font-black text-[11px] uppercase tracking-widest">
                  {isExpanded ? (isRtl ? "عرض أقل" : "Show Less") : (isRtl ? "إقرأ المزيد" : "Read More")}
                </button>
              )}
            </div>
          )}
        </div>

        {carouselImages.length > 0 && (
          <div className="w-full bg-black relative">
            {mediaType === 'video' ? (
              <div className="relative w-full flex items-center justify-center bg-zinc-950">
                <video ref={videoRef} src={carouselImages[0]} className="w-full h-auto object-contain max-h-[85vh]" onClick={(e) => { e.stopPropagation(); if(videoRef.current) isPlaying ? videoRef.current.pause() : videoRef.current.play(); setIsPlaying(!isPlaying); }} playsInline loop preload="metadata" />
                {!isPlaying && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="h-16 w-16 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-2xl"><Play className="h-8 w-8 text-white fill-white ml-1" /></div></div>}
              </div>
            ) : (
              <Carousel className="w-full" onSelect={(api) => setCurrentSlide(api?.selectedScrollSnap() || 0)}>
                <CarouselContent className="-ml-0">
                  {carouselImages.map((url, idx) => (
                    <CarouselItem key={idx} className="pl-0 flex justify-center items-center bg-zinc-950">
                      <img src={url} alt="Media" className="w-full h-auto object-contain max-h-[85vh]" loading="lazy" />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {carouselImages.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                    {carouselImages.map((_, idx) => (
                      <div key={idx} className={cn("h-1 w-3 rounded-full transition-all duration-300", idx === currentSlide ? "bg-primary w-5" : "bg-white/20")} />
                    ))}
                  </div>
                )}
              </Carousel>
            )}
          </div>
        )}

        <div className="px-5 py-4 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 group cursor-pointer" onClick={handleLike}>
              <ThumbsUp className={cn("h-5 w-5 transition-all", isLiked ? "fill-white text-white" : "text-zinc-700")} />
              <span className={cn("text-xs font-black", isLiked ? "text-white" : "text-zinc-700")}>{likes}</span>
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <div className="flex items-center gap-2 group cursor-pointer">
                  <MessageCircle className="h-5 w-5 text-zinc-700" />
                  <span className="text-xs font-black text-zinc-700">{commentsCount || 0}</span>
                </div>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[95vh] bg-black border-zinc-900 rounded-t-[1.5rem] p-0 flex flex-col outline-none shadow-2xl">
                <SheetHeader className="p-4 border-b border-zinc-900/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <SheetClose asChild><Button variant="ghost" size="icon" className="text-white hover:bg-zinc-900 rounded-full"><X className="h-6 w-6" /></Button></SheetClose>
                      <SheetTitle className="text-white font-black text-lg">{isRtl ? "التعليقات" : "Comments"}</SheetTitle>
                      <Button variant="ghost" size="icon" className="text-zinc-400 h-8 w-8"><Info className="h-5 w-5" /></Button>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={() => setSortType('top')} className={cn("h-8 px-4 rounded-lg text-xs font-bold transition-all", sortType === 'top' ? "bg-white text-black" : "bg-zinc-900 text-white hover:bg-zinc-800")}>{isRtl ? "الأهم" : "Top"}</Button>
                    <Button onClick={() => setSortType('latest')} className={cn("h-8 px-4 rounded-lg text-xs font-bold transition-all", sortType === 'latest' ? "bg-white text-black" : "bg-zinc-900 text-white hover:bg-zinc-800")}>{isRtl ? "أحدث التعليقات" : "Newest"}</Button>
                  </div>
                </SheetHeader>

                <CommentsList postId={id} isRtl={isRtl} sortType={sortType} onReply={(c: any) => setReplyTo(c)} />

                <div className="p-3 pb-8 border-t border-zinc-900 bg-black sticky bottom-0">
                  {replyTo && (
                    <div className="flex items-center justify-between bg-zinc-900 p-2 px-4 rounded-t-xl border-x border-t border-zinc-800">
                      <div className="flex items-center gap-2">
                        <CornerDownLeft className="h-3 w-3 text-zinc-400" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">الرد على @{replyTo.handle}</span>
                      </div>
                      <button onClick={() => setReplyTo(null)}><X className="h-3 w-3 text-zinc-500" /></button>
                    </div>
                  )}
                  <div className="flex gap-3 items-center">
                    <Avatar className="h-9 w-9"><AvatarImage src={user?.photoURL} /><AvatarFallback>U</AvatarFallback></Avatar>
                    <div className="flex-1 flex items-center bg-zinc-900 rounded-full pl-4 pr-1 py-1">
                      <Input placeholder={isRtl ? "إضافة تعليق..." : "Add a comment..."} className="bg-transparent border-none h-8 text-sm focus-visible:ring-0 shadow-none p-0" value={newComment} onChange={(e) => setNewComment(e.target.value)} maxLength={100} onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} />
                      <Button size="icon" className="rounded-full h-8 w-8 bg-transparent text-white" onClick={handleAddComment} disabled={!newComment.trim()}><Send className={cn("h-4 w-4", isRtl ? "rotate-180" : "")} /></Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2 group cursor-pointer" onClick={handleShare}><Share2 className="h-5 w-5 text-zinc-700" /></div>
          </div>

          <div className="flex items-center gap-2 group cursor-pointer" onClick={handleSave}>
            <Bookmark className={cn("h-5 w-5 transition-all", isSaved ? "fill-primary text-primary" : "text-zinc-700")} />
            {saves > 0 && <span className={cn("text-xs font-black", isSaved ? "text-primary" : "text-zinc-700")}>{saves}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

PostCard.displayName = "PostCard";

function CommentsList({ postId, isRtl, sortType, onReply }: any) {
  const db = useFirestore();
  const { user } = useUser();
  const isSuper = user?.email === SUPER_ADMIN_EMAIL;

  const commentsQuery = useMemoFirebase(() => {
    const orderField = sortType === 'top' ? 'likesCount' : 'createdAt';
    return query(collection(db, "posts", postId, "comments"), orderBy(orderField, "desc"), limit(100));
  }, [db, postId, sortType]);

  const { data: rawComments = [] } = useCollection<any>(commentsQuery);

  const organized = useMemo(() => {
    const main = rawComments.filter(c => !c.parentId);
    const replies = rawComments.filter(c => c.parentId);
    return { main, replies };
  }, [rawComments]);

  const handleLikeComment = (commentId: string, likedBy: string[]) => {
    if (!user) return;
    const isLiked = (likedBy || []).includes(user.uid);
    const commentRef = doc(db, "posts", postId, "comments", commentId);
    updateDoc(commentRef, isLiked ? { likedBy: arrayRemove(user.uid), likesCount: increment(-1) } : { likedBy: arrayUnion(user.uid), likesCount: increment(1) });
  };

  const formatTime = (createdAt: any) => {
    if (!createdAt) return "";
    const date = createdAt.toDate ? createdAt.toDate() : new Date();
    const diff = (new Date().getTime() - date.getTime()) / 1000;
    if (diff < 60) return isRtl ? "الآن" : "now";
    if (diff < 3600) return `${Math.floor(diff/60)}m`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h`;
    return date.toLocaleDateString();
  };

  return (
    <ScrollArea className="flex-1 px-4 py-2">
      {organized.main.length > 0 ? organized.main.map((comment: any) => (
        <div key={comment.id} className="mb-6 group">
          <div className="flex gap-3">
            <Avatar className="h-9 w-9"><AvatarImage src={comment.authorAvatar} /><AvatarFallback>U</AvatarFallback></Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-bold text-zinc-400">@{comment.authorHandle}</span>
                <span className="text-[10px] text-zinc-600">• {formatTime(comment.createdAt)}</span>
              </div>
              <p className="text-[14px] text-zinc-100 leading-relaxed mb-2">{comment.text}</p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleLikeComment(comment.id, comment.likedBy)}><ThumbsUp className={cn("h-4 w-4", (comment.likedBy || []).includes(user?.uid) && "fill-white text-white")} /></button>
                  <span className="text-[11px] font-bold text-zinc-500">{comment.likesCount || 0}</span>
                  <button><ThumbsDown className="h-4 w-4 text-zinc-400" /></button>
                </div>
                <button onClick={() => onReply({ id: comment.id, handle: comment.authorHandle })} className="text-[11px] font-bold text-zinc-500">Reply</button>
                {(isSuper || user?.uid === comment.authorId) && (
                  <button onClick={() => deleteDoc(doc(db, "posts", postId, "comments", comment.id))} className="text-zinc-700 ml-auto"><Trash2 className="h-3.5 w-3.5" /></button>
                )}
              </div>
              <ReplyThread commentId={comment.id} allReplies={organized.replies} isRtl={isRtl} onReply={onReply} onLike={handleLikeComment} formatTime={formatTime} user={user} isSuper={isSuper} postId={postId} db={db} />
            </div>
          </div>
        </div>
      )) : (
        <div className="py-20 text-center opacity-20"><MessageCircle className="h-12 w-12 mx-auto mb-4" /><p className="text-xs font-black uppercase">{isRtl ? "لا توجد نقاشات" : "No comments"}</p></div>
      )}
    </ScrollArea>
  );
}

function ReplyThread({ commentId, allReplies, isRtl, onReply, onLike, formatTime, user, isSuper, postId, db }: any) {
  const [showReplies, setShowReplies] = useState(false);
  const replies = allReplies.filter((r: any) => r.parentId === commentId);
  if (replies.length === 0) return null;

  return (
    <div className="mt-2">
      {!showReplies ? (
        <button onClick={() => setShowReplies(true)} className="flex items-center gap-2 text-primary font-bold text-[12px]">
          <ChevronRight className={cn("h-4 w-4", isRtl && "rotate-180")} /> {replies.length} {isRtl ? "ردود" : "replies"}
        </button>
      ) : (
        <div className={cn("mt-4 space-y-4 border-l border-zinc-800 pl-4", isRtl && "border-l-0 border-r pr-4")}>
          {replies.map((reply: any) => (
            <div key={reply.id}>
              <div className="flex gap-3">
                <Avatar className="h-6 w-6"><AvatarImage src={reply.authorAvatar} /><AvatarFallback>U</AvatarFallback></Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold text-zinc-400">@{reply.authorHandle}</span>
                    <span className="text-[9px] text-zinc-600">• {formatTime(reply.createdAt)}</span>
                  </div>
                  <p className="text-[13px] text-zinc-200 leading-relaxed mb-2">{reply.text}</p>
                  <div className="flex items-center gap-4">
                    <button onClick={() => onLike(reply.id, reply.likedBy)}><ThumbsUp className={cn("h-3.5 w-3.5", (reply.likedBy || []).includes(user?.uid) && "fill-white text-white")} /></button>
                    <button onClick={() => onReply({ id: reply.id, handle: reply.authorHandle })} className="text-[10px] font-bold text-zinc-500 uppercase">Reply</button>
                    {(isSuper || user?.uid === reply.authorId) && (
                      <button onClick={() => deleteDoc(doc(db, "posts", postId, "comments", reply.id))} className="text-zinc-800 ml-auto"><Trash2 className="h-3 w-3" /></button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => setShowReplies(false)} className="text-[11px] font-bold text-zinc-500 block pt-2">{isRtl ? "إخفاء الردود" : "Hide"}</button>
        </div>
      )}
    </div>
  );
}
