
"use client";

import { 
  Heart, 
  MessageCircle, 
  MoreHorizontal, 
  Trash2, 
  Flag, 
  Play, 
  Pause, 
  Volume2,
  X,
  ThumbsUp,
  MessageSquare,
  Star,
  Download,
  Loader2,
  Send
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { useState, useEffect, useRef } from "react";
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
  likes: number;
  time: string;
  mediaSettings?: any;
  privacy?: string;
  allowComments?: boolean;
}

export function PostCard({ id, author, content, image, mediaUrls = [], mediaType, likes: initialLikes, time, allowComments = true }: PostCardProps) {
  const { isRtl } = useLanguage();
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const userProfileRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: currentUserProfile } = useDoc<any>(userProfileRef);
  const isBanned = currentUserProfile?.isBannedUntil && currentUserProfile.isBannedUntil.toDate() > new Date();
  const isAdmin = currentUserProfile?.role === "admin" || user?.email === "adelbenmaza3@gmail.com";

  const [likesCount, setLikesCount] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const truncationLimit = 240;
  const isLongContent = content?.length > truncationLimit;
  const displayContent = isExpanded ? content : content?.slice(0, truncationLimit) + "...";

  const commentsQuery = useMemoFirebase(() => {
    if (!id) return null;
    return query(collection(db, "posts", id, "comments"), orderBy("createdAt", "desc"), limit(50));
  }, [db, id]);
  const { data: comments = [] } = useCollection<any>(commentsQuery);

  useEffect(() => {
    if (!id || !db) return;
    const postRef = doc(db, "posts", id);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const likedBy = data.likedBy || [];
        setLikesCount(likedBy.length);
        if (user) setIsLiked(likedBy.includes(user.uid));
      }
    });
    return () => unsubscribe();
  }, [id, db, user]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !id || isBanned) return;
    const postRef = doc(db, "posts", id);
    const updateData = isLiked 
      ? { likedBy: arrayRemove(user.uid), likesCount: increment(-1) }
      : { likedBy: arrayUnion(user.uid), likesCount: increment(1) };

    updateDoc(postRef, updateData).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: postRef.path, operation: 'update', requestResourceData: updateData }));
    });
  };

  const handleAddComment = () => {
    if (isBanned || !newComment.trim() || !user || !id || !allowComments) return;
    
    const commentData = {
      authorId: user.uid,
      authorName: currentUserProfile?.displayName || user.displayName || "User",
      authorAvatar: currentUserProfile?.photoURL || user.photoURL || "",
      authorHandle: user.email?.split('@')[0] || "user",
      text: newComment,
      createdAt: serverTimestamp(),
      likesCount: 0,
      likedBy: []
    };

    addDoc(collection(db, "posts", id, "comments"), commentData).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `posts/${id}/comments`, operation: 'create', requestResourceData: commentData }));
    });
    setNewComment("");
  };

  const handleDownloadVideo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !image || mediaType !== 'video' || isDownloading) return;

    const isViewerVerified = currentUserProfile?.isVerified || currentUserProfile?.role === 'admin' || user?.email === "adelbenmaza3@gmail.com";

    if (!isViewerVerified) {
      toast({
        title: isRtl ? "امتياز سيادي محدود" : "Sovereign Privilege",
        description: isRtl ? "عذراً، ميزة التحميل متاحة حصرياً للمواطنين الموثقين." : "Exclusively for verified citizens."
      });
      return;
    }

    try {
      setIsDownloading(true);
      const response = await fetch(image);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `unbound-video-${id}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({ variant: "destructive", title: "Download Failed" });
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mediaType === 'video' && videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const carouselImages = mediaUrls.length > 0 ? mediaUrls : (image ? [image] : []);

  return (
    <Card className="bg-black text-white border-none rounded-none border-b border-zinc-900/40 cursor-pointer active:bg-zinc-950/40 transition-colors" onClick={() => router.push(`/post/${id}`)}>
      <CardHeader className="p-5 pb-3 flex flex-row items-center space-y-0 gap-4">
        <Link href={`/profile/${author?.uid || author?.id || '#'}`} onClick={(e) => e.stopPropagation()}>
          <Avatar className="h-11 w-11 ring-1 ring-zinc-800">
            <AvatarImage src={author?.avatar || author?.photoURL} />
            <AvatarFallback className="bg-zinc-900">{author?.name?.[0] || author?.displayName?.[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-black text-[15px] truncate tracking-tight">{author?.name || author?.displayName}</h3>
                {(author?.isVerified || author?.email === "adelbenmaza3@gmail.com" || author?.role === 'admin') && <VerificationBadge className="h-4 w-4" />}
                {author?.isPro && <div className="flex items-center gap-0.5 bg-yellow-500/10 px-1.5 py-0.5 rounded-full border border-yellow-500/20"><Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" /><span className="text-[7px] font-black text-yellow-500 uppercase tracking-widest">{isRtl ? "إعلام" : "Media"}</span></div>}
              </div>
              <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">@{author?.handle || author?.email?.split('@')[0]}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-700 hover:text-white rounded-full"><MoreHorizontal className="h-5 w-5" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-900 text-white rounded-2xl shadow-2xl p-2">
                {mediaType === 'video' && <DropdownMenuItem onClick={handleDownloadVideo} className="rounded-xl m-1 h-11 font-black text-xs uppercase cursor-pointer"><Download className="h-4 w-4 mr-2" /> {isRtl ? "تحميل" : "Download"}</DropdownMenuItem>}
                <DropdownMenuItem className="text-orange-500 rounded-xl m-1 h-11 font-black text-xs uppercase cursor-pointer"><Flag className="h-4 w-4 mr-2" /> {isRtl ? "إبلاغ" : "Report"}</DropdownMenuItem>
                {isAdmin && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteDoc(doc(db, "posts", id)); }} className="text-red-500 rounded-xl m-1 h-11 font-black text-xs uppercase cursor-pointer"><Trash2 className="h-4 w-4 mr-2" /> {isRtl ? "حذف" : "Delete"}</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="px-5 pb-3">
          {content && (
            <div className="space-y-1.5">
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                {isLongContent ? displayContent : content}
              </p>
              {isLongContent && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                  className="text-primary font-black text-[11px] uppercase tracking-widest hover:underline"
                >
                  {isExpanded ? (isRtl ? "عرض أقل" : "Show Less") : (isRtl ? "إقرأ المزيد" : "Read More")}
                </button>
              )}
            </div>
          )}
        </div>

        {carouselImages.length > 0 && (
          <div className="w-full mb-4">
            <div className="relative overflow-hidden bg-zinc-950 shadow-2xl group w-full">
              {mediaType === 'video' ? (
                <div className="relative aspect-video bg-black">
                  <video ref={videoRef} src={carouselImages[0]} className="w-full h-full object-contain" onClick={toggleMedia} />
                  {!isPlaying && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center"><Play className="h-8 w-8 text-white fill-white" /></div></div>}
                </div>
              ) : mediaType === 'audio' ? (
                <div className="p-6 bg-zinc-900/50 flex flex-col gap-4">
                  <audio ref={audioRef} src={carouselImages[0]} className="hidden" onEnded={() => setIsPlaying(false)} />
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-primary text-white" onClick={() => { if(audioRef.current) isPlaying ? audioRef.current.pause() : audioRef.current.play(); setIsPlaying(!isPlaying); }}>{isPlaying ? <Pause className="h-6 w-6 fill-white" /> : <Play className="h-6 w-6 fill-white" />}</Button>
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className={cn("h-full bg-primary transition-all duration-300", isPlaying ? "w-full" : "w-0")} /></div>
                    <Volume2 className="h-5 w-5 text-zinc-600" />
                  </div>
                </div>
              ) : (
                <Carousel className="w-full" onSelect={(api) => setCurrentSlide(api?.selectedScrollSnap() || 0)}>
                  <CarouselContent>
                    {carouselImages.map((url, idx) => (
                      <CarouselItem key={idx} className="flex justify-center items-center">
                        <img src={url} alt={`Media ${idx}`} className="w-full h-auto max-h-[600px] object-cover aspect-[4/5] md:aspect-square" />
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
          </div>
        )}

        <div className="px-5 py-4 flex items-center gap-8 border-t border-zinc-900/20" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 group cursor-pointer active:scale-90" onClick={handleLike}>
            <div className={cn("p-2 rounded-full", isLiked ? "bg-red-500/10" : "group-hover:bg-red-500/5")}><Heart className={cn("h-5 w-5", isLiked ? "fill-red-500 text-red-500 scale-110" : "text-zinc-600")} /></div>
            <span className={cn("text-xs font-black", isLiked ? "text-red-500" : "text-zinc-600")}>{likesCount}</span>
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <div className="flex items-center gap-2 group cursor-pointer active:scale-90">
                <div className="p-2 rounded-full group-hover:bg-primary/5"><MessageCircle className="h-5 w-5 text-zinc-600" /></div>
                <span className="text-xs font-black text-zinc-600">{comments.length}</span>
              </div>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] bg-zinc-950 border-zinc-900 rounded-t-[3rem] p-0 flex flex-col outline-none">
              <SheetHeader className="p-4 border-b border-zinc-900">
                <div className="flex items-center justify-between">
                  <SheetClose asChild><Button variant="ghost" size="icon" className="text-zinc-400 rounded-full"><X className="h-5 w-5" /></Button></SheetClose>
                  <SheetTitle className="text-white font-black text-lg uppercase">{isRtl ? "التعليقات" : "Comments"}</SheetTitle>
                  <div className="w-10" />
                </div>
              </SheetHeader>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-8 pb-32">
                  {comments.map((comment: any) => <CommentItem key={comment.id} comment={comment} postId={id} isRtl={isRtl} user={user} isBanned={isBanned} />)}
                </div>
              </ScrollArea>
              <div className="p-4 pb-8 border-t border-zinc-900 bg-black/90">
                <div className="flex gap-3 items-center">
                  <Avatar className="h-10 w-10"><AvatarImage src={currentUserProfile?.photoURL || user?.photoURL} /><AvatarFallback>U</AvatarFallback></Avatar>
                  <div className="flex-1 flex items-center bg-zinc-900 p-1.5 rounded-full pl-6 pr-1.5 border border-zinc-800">
                    <Input placeholder={isRtl ? "إضافة تعليق..." : "Add a comment..."} className="bg-transparent border-none h-10 text-sm focus-visible:ring-0" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} />
                    <Button size="icon" className="rounded-full h-10 w-10 bg-primary" onClick={handleAddComment} disabled={!newComment.trim()}><Send className={cn("h-4 w-4", isRtl ? "rotate-180" : "")} /></Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </CardContent>
    </Card>
  );
}

function CommentItem({ comment, postId, isRtl, user, isBanned }: any) {
  const db = useFirestore();
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState(false);

  const repliesQuery = useMemoFirebase(() => showReplies ? query(collection(db, "posts", postId, "comments", comment.id, "replies"), orderBy("createdAt", "asc")) : null, [db, postId, comment.id, showReplies]);
  const { data: replies = [] } = useCollection<any>(repliesQuery);
  const isCommentLiked = user && Array.isArray(comment.likedBy) && comment.likedBy.includes(user.uid);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Avatar className="h-9 w-9 shrink-0"><AvatarImage src={comment.authorAvatar} /><AvatarFallback>U</AvatarFallback></Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black text-zinc-300 uppercase">@{comment.authorHandle}</span>
          </div>
          <p className="text-[14px] text-zinc-100 leading-relaxed">{comment.text}</p>
          <div className="flex items-center gap-6 pt-3">
            <div className="flex items-center gap-1.5 text-zinc-500 cursor-pointer" onClick={() => {
              const ref = doc(db, "posts", postId, "comments", comment.id);
              updateDoc(ref, isCommentLiked ? { likedBy: arrayRemove(user.uid), likesCount: increment(-1) } : { likedBy: arrayUnion(user.uid), likesCount: increment(1) });
            }}>
              <ThumbsUp className={cn("h-4 w-4", isCommentLiked && "text-primary fill-primary")} />
              <span className="text-[10px] font-black">{comment.likesCount || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-500 cursor-pointer" onClick={() => setIsReplying(!isReplying)}>
              <MessageSquare className="h-4 w-4" />
              <span className="text-[10px] font-black">{isRtl ? "رد" : "Reply"}</span>
            </div>
          </div>
          {isReplying && (
            <div className="mt-4 flex gap-3 items-center bg-zinc-900 p-1.5 rounded-full pl-4 pr-1.5 border border-zinc-800">
              <Input placeholder={isRtl ? "الرد..." : "Reply..."} className="bg-transparent border-none h-8 text-xs focus-visible:ring-0" value={replyText} onChange={(e) => setReplyText(e.target.value)} />
              <Button size="icon" className="rounded-full h-8 w-8 bg-primary" onClick={() => {
                if (!replyText.trim()) return;
                addDoc(collection(db, "posts", postId, "comments", comment.id, "replies"), { authorId: user.uid, authorName: user.displayName, authorAvatar: user.photoURL, authorHandle: user.email.split('@')[0], text: replyText, createdAt: serverTimestamp() });
                setReplyText(""); setIsReplying(false); setShowReplies(true);
              }}><Send className="h-3 w-3" /></Button>
            </div>
          )}
          {comment.likesCount > 0 && (
            <button className="mt-3 text-primary font-black text-[10px] uppercase tracking-widest" onClick={() => setShowReplies(!showReplies)}>
              {showReplies ? (isRtl ? "إخفاء الردود" : "Hide Replies") : (isRtl ? "عرض الردود" : "Show Replies")}
            </button>
          )}
          {showReplies && (
            <div className="space-y-4">
              {replies.map((reply: any) => (
                <div key={reply.id} className="mt-4 flex gap-3 border-l border-zinc-900 pl-4">
                  <Avatar className="h-7 w-7"><AvatarImage src={reply.authorAvatar} /><AvatarFallback>U</AvatarFallback></Avatar>
                  <div className="flex-1 space-y-1">
                    <span className="text-[11px] font-black text-zinc-400 uppercase">@{reply.authorHandle}</span>
                    <p className="text-[13px] text-zinc-200 leading-relaxed">{reply.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
