
"use client";

import { 
  Heart, 
  MessageCircle, 
  MoreHorizontal, 
  Send, 
  Trash2, 
  Flag, 
  Play, 
  Pause, 
  Volume2,
  X,
  Info,
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Star
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

interface PostCardProps {
  id: string;
  author: any;
  content: string;
  image?: string;
  mediaType?: "image" | "video" | "audio";
  likes: number;
  time: string;
  mediaSettings?: any;
  privacy?: string;
  allowComments?: boolean;
}

export function PostCard({ id, author, content, image, mediaType, likes: initialLikes, time, mediaSettings, allowComments = true }: PostCardProps) {
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
  const [isExpanded, setIsExpanded] = useState(false);

  const CONTENT_LIMIT = 280;
  const shouldTruncate = content.length > CONTENT_LIMIT;
  const displayContent = shouldTruncate && !isExpanded 
    ? content.substring(0, CONTENT_LIMIT) + "..." 
    : content;

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

    addDoc(collection(db, "posts", id, "comments"), commentData);
    setNewComment("");
  };

  const toggleMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mediaType === 'video' && videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    } else if (mediaType === 'audio' && audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <Card className="bg-black text-white border-none rounded-none border-b border-zinc-900/40 cursor-pointer active:bg-zinc-950/40 transition-colors" onClick={() => router.push(`/post/${id}`)}>
      <CardHeader className="p-5 pb-3 flex flex-row items-center space-y-0 gap-4">
        <Link href={`/profile/${author?.uid || author?.id || '#'}`} onClick={(e) => e.stopPropagation()}>
          <Avatar className="h-11 w-11 ring-1 ring-zinc-800 ring-offset-2 ring-offset-black">
            <AvatarImage src={author?.avatar || author?.photoURL} />
            <AvatarFallback className="bg-zinc-900">{author?.name?.[0] || author?.displayName?.[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <Link href={`/profile/${author?.uid || author?.id || '#'}`} onClick={(e) => e.stopPropagation()} className="min-w-0">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-black text-[15px] truncate tracking-tight">{author?.name || author?.displayName}</h3>
                  {(author?.isVerified || author?.email === "adelbenmaza3@gmail.com") && <VerificationBadge className="h-4 w-4" />}
                  {author?.isPro && <div className="flex items-center gap-0.5 bg-yellow-500/10 px-1.5 py-0.5 rounded-full border border-yellow-500/20"><Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /><span className="text-[7px] font-black text-yellow-500 uppercase tracking-widest">{isRtl ? "إعلام" : "Media"}</span></div>}
                </div>
                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">@{author?.handle || author?.email?.split('@')[0]}</span>
              </div>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-700 hover:text-white rounded-full"><MoreHorizontal className="h-5 w-5" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-900 text-white rounded-2xl shadow-2xl p-2">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); addDoc(collection(db, "reports"), { targetId: id, targetType: "post", reason: "Policy Violation", reportedBy: user?.uid, status: "pending", createdAt: serverTimestamp() }); toast({ title: "Reported" }); }} className="text-orange-500 rounded-xl m-1 h-11 font-black text-xs uppercase"><Flag className="h-4 w-4 mr-2" /> {isRtl ? "إبلاغ" : "Report"}</DropdownMenuItem>
                {isAdmin && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); if (confirm("Delete?")) deleteDoc(doc(db, "posts", id)); }} className="text-red-500 rounded-xl m-1 h-11 font-black text-xs uppercase"><Trash2 className="h-4 w-4 mr-2" /> {isRtl ? "حذف" : "Delete"}</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="px-5 pb-3">
          {content && (
            <div className="space-y-2 mb-3">
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{displayContent}</p>
              {shouldTruncate && <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">{isExpanded ? (isRtl ? "عرض أقل" : "Show less") : (isRtl ? "أقرأ المزيد" : "Read more")}</button>}
            </div>
          )}
        </div>

        {image && (
          <div className="px-5 mb-4">
            <div className="relative rounded-[2rem] overflow-hidden border border-zinc-900 bg-zinc-950 shadow-2xl group">
              {mediaType === 'video' ? (
                <div className="relative aspect-video bg-black flex items-center justify-center">
                  <video ref={videoRef} src={image} className="w-full h-full object-contain" onClick={toggleMedia} />
                  {!isPlaying && <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none"><div className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20"><Play className="h-8 w-8 text-white fill-white" /></div></div>}
                </div>
              ) : mediaType === 'audio' ? (
                <div className="p-6 bg-zinc-900/50 flex flex-col gap-4">
                  <audio ref={audioRef} src={image} className="hidden" onEnded={() => setIsPlaying(false)} />
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-primary text-white" onClick={toggleMedia}>{isPlaying ? <Pause className="h-6 w-6 fill-white" /> : <Play className="h-6 w-6 fill-white" />}</Button>
                    <div className="flex-1 space-y-1"><div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden"><div className={cn("h-full bg-primary transition-all duration-300", isPlaying ? "w-full" : "w-0")} /></div></div>
                    <Volume2 className="h-5 w-5 text-zinc-600" />
                  </div>
                </div>
              ) : (
                <img src={image} alt="Media" className={cn("w-full h-auto max-h-[600px] object-cover", mediaSettings?.filter || "filter-none")} />
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
                  <div className="flex items-center gap-2">
                    <SheetClose asChild><Button variant="ghost" size="icon" className="text-zinc-400 rounded-full"><X className="h-5 w-5" /></Button></SheetClose>
                  </div>
                  <SheetTitle className="text-white font-black text-lg tracking-tighter uppercase">{isRtl ? "التعليقات" : "Comments"}</SheetTitle>
                  <Button variant="ghost" size="icon" className="text-zinc-400 rounded-full"><Info className="h-5 w-5" /></Button>
                </div>
              </SheetHeader>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-8 pb-32">
                  {comments.map((comment: any) => (
                    <CommentItem 
                      key={comment.id} 
                      comment={comment} 
                      postId={id} 
                      isRtl={isRtl} 
                      user={user} 
                      isBanned={isBanned}
                    />
                  ))}
                </div>
              </ScrollArea>

              <div className="p-4 pb-8 border-t border-zinc-900 bg-black/90 backdrop-blur-xl">
                {isBanned ? (
                  <div className="p-4 text-center text-red-500 font-black uppercase bg-red-500/10 rounded-2xl">RESTRICTED: MESSAGING DISABLED</div>
                ) : !allowComments ? (
                  <div className="p-4 text-center text-zinc-500 font-black uppercase bg-zinc-900/50 rounded-2xl">COMMENTS DISABLED</div>
                ) : (
                  <div className="flex gap-3 items-center">
                    <Avatar className="h-10 w-10"><AvatarImage src={currentUserProfile?.photoURL || user?.photoURL} /><AvatarFallback className="bg-zinc-900">U</AvatarFallback></Avatar>
                    <div className="flex-1 flex items-center bg-zinc-900 p-1.5 rounded-full pl-6 pr-1.5 border border-zinc-800">
                      <Input placeholder={isRtl ? "إضافة تعليق..." : "Add a comment..."} className="bg-transparent border-none h-10 text-sm focus-visible:ring-0" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} />
                      <Button size="icon" className="rounded-full h-10 w-10 bg-primary" onClick={handleAddComment} disabled={!newComment.trim()}><Send className={cn("h-4 w-4", isRtl ? "rotate-180" : "")} /></Button>
                    </div>
                  </div>
                )}
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

  const repliesQuery = useMemoFirebase(() => query(collection(db, "posts", postId, "comments", comment.id, "replies"), orderBy("createdAt", "asc")), [db, postId, comment.id]);
  const { data: replies = [] } = useCollection<any>(repliesQuery);
  const isCommentLiked = user && Array.isArray(comment.likedBy) && comment.likedBy.includes(user.uid);

  const handleLike = () => {
    if (!user || isBanned) return;
    const commentRef = doc(db, "posts", postId, "comments", comment.id);
    const updateData = isCommentLiked 
      ? { likedBy: arrayRemove(user.uid), likesCount: increment(-1) }
      : { likedBy: arrayUnion(user.uid), likesCount: increment(1) };
    updateDoc(commentRef, updateData);
  };

  const handleAddReply = () => {
    if (isBanned || !replyText.trim() || !user) return;
    addDoc(collection(db, "posts", postId, "comments", comment.id, "replies"), {
      authorId: user.uid,
      authorName: user.displayName || "User",
      authorAvatar: user.photoURL || "",
      authorHandle: user.email?.split('@')[0] || "user",
      text: replyText,
      createdAt: serverTimestamp(),
      likesCount: 0,
      likedBy: []
    });
    setReplyText("");
    setIsReplying(false);
    setShowReplies(true);
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      <div className="flex gap-4 group">
        <Avatar className="h-9 w-9 shrink-0"><AvatarImage src={comment.authorAvatar} /><AvatarFallback className="bg-zinc-900">{comment.authorName?.[0]}</AvatarFallback></Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black text-zinc-300 uppercase">@{comment.authorHandle}</span>
              <span className="text-[10px] text-zinc-500 font-bold">• {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' }) : ""}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-700 opacity-0 group-hover:opacity-100"><MoreVertical className="h-4 w-4" /></Button>
          </div>
          <p className="text-[14px] text-zinc-100 leading-relaxed font-medium">{comment.text}</p>
          <div className="flex items-center gap-6 pt-3">
            <div className="flex items-center gap-1.5 text-zinc-500 cursor-pointer" onClick={handleLike}>
              <ThumbsUp className={cn("h-4 w-4 transition-all", isCommentLiked ? "text-primary fill-primary" : "")} />
              <span className={cn("text-[10px] font-black", isCommentLiked ? "text-primary" : "")}>{comment.likesCount || 0}</span>
            </div>
            <ThumbsDown className="h-4 w-4 text-zinc-500" />
            <div className="flex items-center gap-1.5 text-zinc-500 cursor-pointer" onClick={() => setIsReplying(!isReplying)}>
              <MessageSquare className="h-4 w-4" />
              <span className="text-[10px] font-black">{isRtl ? "رد" : "Reply"}</span>
            </div>
          </div>

          {isReplying && (
            <div className="mt-4 flex gap-3 items-center bg-zinc-900 p-1.5 rounded-full pl-4 pr-1.5 border border-zinc-800">
              <Input placeholder={isRtl ? "الرد..." : "Reply..."} className="bg-transparent border-none h-8 text-xs focus-visible:ring-0 shadow-none" value={replyText} onChange={(e) => setReplyText(e.target.value)} autoFocus />
              <Button variant="ghost" size="sm" className="text-zinc-500 h-8 font-black text-[10px] uppercase" onClick={() => setIsReplying(false)}>{isRtl ? "إلغاء" : "X"}</Button>
              <Button size="icon" className="rounded-full h-8 w-8 bg-primary" onClick={handleAddReply} disabled={!replyText.trim()}><Send className="h-3 w-3" /></Button>
            </div>
          )}

          {replies.length > 0 && (
            <button className="mt-3 flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest" onClick={() => setShowReplies(!showReplies)}>
              {showReplies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {replies.length} {isRtl ? "رد" : "Replies"}
            </button>
          )}

          {showReplies && replies.map((reply: any) => (
            <div key={reply.id} className="mt-4 flex gap-3 border-l border-zinc-900 pl-4">
              <Avatar className="h-7 w-7"><AvatarImage src={reply.authorAvatar} /><AvatarFallback className="bg-zinc-900">U</AvatarFallback></Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2"><span className="text-[11px] font-black text-zinc-400 uppercase">@{reply.authorHandle}</span></div>
                <p className="text-[13px] text-zinc-200 leading-relaxed">{reply.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
