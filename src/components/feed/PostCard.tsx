
"use client";

import { Heart, MessageCircle, MoreHorizontal, Send, Trash2, Flag, Languages, Loader2, Star, Radio, Sparkles, Globe, Lock, ShieldAlert, Play, Pause, Volume2 } from "lucide-react";
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
  deleteDoc 
} from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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

export function PostCard({ id, author, content, image, mediaType, likes: initialLikes, time, mediaSettings, privacy, allowComments = true }: PostCardProps) {
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

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !id || isBanned) return;
    const postRef = doc(db, "posts", id);
    if (isLiked) {
      updateDoc(postRef, { likedBy: arrayRemove(user.uid) });
    } else {
      updateDoc(postRef, { likedBy: arrayUnion(user.uid) });
      
      // إرسال تنبيه للمؤلف (إذا لم يكن هو الفاعل)
      if (author?.id !== user.uid) {
        addDoc(collection(db, "notifications"), {
          userId: author?.id || author?.uid,
          type: "like",
          fromUserId: user.uid,
          fromUserName: currentUserProfile?.displayName || user.displayName,
          fromUserAvatar: currentUserProfile?.photoURL || user.photoURL,
          postId: id,
          message: isRtl ? "أعجب بمنشورك" : "liked your post",
          read: false,
          createdAt: serverTimestamp()
        });
      }
    }
  };

  const handleAddComment = async () => {
    if (isBanned || !newComment.trim() || !user || !id || !allowComments) return;
    
    await addDoc(collection(db, "posts", id, "comments"), {
      authorId: user.uid,
      authorName: currentUserProfile?.displayName || user.displayName || "User",
      authorAvatar: currentUserProfile?.photoURL || user.photoURL || "",
      authorHandle: user.email?.split('@')[0] || "user",
      text: newComment,
      createdAt: serverTimestamp()
    });

    // إرسال تنبيه للمؤلف
    if (author?.id !== user.uid) {
      addDoc(collection(db, "notifications"), {
        userId: author?.id || author?.uid,
        type: "comment",
        fromUserId: user.uid,
        fromUserName: currentUserProfile?.displayName || user.displayName,
        fromUserAvatar: currentUserProfile?.photoURL || user.photoURL,
        postId: id,
        message: isRtl ? "علق على منشورك" : "commented on your post",
        read: false,
        createdAt: serverTimestamp()
      });
    }

    setNewComment("");
  };

  const handleTranslateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({
      title: isRtl ? "الترجمة السيادية (قريباً)" : "Sovereign Translate (Soon)",
      description: isRtl ? "هذه الميزة ستتوفر في التحديث القادم لكسر الحواجز اللغوية." : "Coming in the next update.",
    });
  };

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !id) return;
    try {
      await addDoc(collection(db, "reports"), {
        targetId: id,
        targetType: "post",
        reason: isRtl ? "محتوى مخالف" : "Inappropriate content",
        reportedBy: user.uid,
        status: "pending",
        createdAt: serverTimestamp()
      });
      toast({ title: isRtl ? "تم إرسال البلاغ" : "Report sent" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin || !id) return;
    if (confirm(isRtl ? "حذف هذا المنشور؟" : "Delete this insight?")) {
      await deleteDoc(doc(db, "posts", id));
      toast({ title: "Deleted" });
    }
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

  const isAuthorVerified = author?.isVerified || author?.email === "adelbenmaza3@gmail.com";
  const isMediaChannel = author?.isPro;

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
                  {isAuthorVerified && <VerificationBadge className="h-4 w-4" />}
                  {isMediaChannel && (
                    <div className="flex items-center gap-0.5 bg-yellow-500/10 px-1.5 py-0.5 rounded-full border border-yellow-500/20">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      <span className="text-[7px] font-black text-yellow-500 uppercase tracking-widest">{isRtl ? "إعلام" : "Media"}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">@{author?.handle || author?.email?.split('@')[0]}</span>
                   {privacy === 'followers' && <Lock className="h-2.5 w-2.5 text-zinc-700" />}
                </div>
              </div>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-700 hover:text-white rounded-full"><MoreHorizontal className="h-5 w-5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-900 text-white rounded-2xl shadow-2xl p-2 min-w-[140px]">
                <DropdownMenuItem onClick={handleReport} className="flex gap-3 text-orange-500 focus:bg-orange-500/10 focus:text-orange-500 rounded-xl m-1 h-11 font-black text-xs uppercase tracking-widest">
                  <Flag className="h-4 w-4" /> {isRtl ? "إبلاغ" : "Report"}
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={handleDelete} className="flex gap-3 text-red-500 focus:bg-red-500/10 focus:text-red-500 rounded-xl m-1 h-11 font-black text-xs uppercase tracking-widest">
                    <Trash2 className="h-4 w-4" /> {isRtl ? "حذف" : "Delete"}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="px-5 pb-3">
          {content && (
            <div className="space-y-2 mb-3">
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                {displayContent}
              </p>
              {shouldTruncate && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                  className="text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-80 transition-opacity"
                >
                  {isExpanded ? (isRtl ? "عرض أقل" : "Show less") : (isRtl ? "أقرأ المزيد" : "Read more")}
                </button>
              )}
            </div>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-3 bg-zinc-900/50 text-zinc-400 hover:text-primary rounded-xl font-black text-[9px] uppercase tracking-widest gap-2.5 transition-all"
            onClick={handleTranslateClick}
          >
            <Languages className="h-3.5 w-3.5" />
            {isRtl ? "الترجمة السيادية (قريباً)" : "Sovereign Translate (Soon)"}
          </Button>
        </div>

        {image && (
          <div className="px-5 mb-4">
            <div className="relative rounded-[2rem] overflow-hidden border border-zinc-900 bg-zinc-950 shadow-2xl group">
              {mediaType === 'video' ? (
                <div className="relative aspect-video bg-black flex items-center justify-center">
                  <video 
                    ref={videoRef} 
                    src={image} 
                    className="w-full h-full object-contain" 
                    onClick={toggleMedia}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                      <div className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                        <Play className="h-8 w-8 text-white fill-white" />
                      </div>
                    </div>
                  )}
                </div>
              ) : mediaType === 'audio' ? (
                <div className="p-6 bg-zinc-900/50 flex flex-col gap-4">
                  <audio ref={audioRef} src={image} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} className="hidden" />
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-primary text-white hover:bg-primary/90 shadow-lg" onClick={toggleMedia}>
                      {isPlaying ? <Pause className="h-6 w-6 fill-white" /> : <Play className="h-6 w-6 fill-white" />}
                    </Button>
                    <div className="flex-1 space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">{isRtl ? "بصمة صوتية" : "Voice Note"}</p>
                      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div className={cn("h-full bg-primary transition-all duration-300", isPlaying ? "w-full" : "w-0")} />
                      </div>
                    </div>
                    <Volume2 className="h-5 w-5 text-zinc-600" />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img src={image} alt="Media" className={cn("w-full h-auto max-h-[600px] object-cover transition-transform duration-700 group-hover:scale-105", mediaSettings?.filter || "filter-none")} />
                  
                  {mediaSettings && (
                    <div className="absolute inset-0 pointer-events-none select-none">
                      {mediaSettings.textOverlay && (
                        <div 
                          className={cn("absolute z-10 transition-transform", mediaSettings.textEffect)}
                          style={{ left: `${mediaSettings.textX}%`, top: `${mediaSettings.textY}%`, transform: 'translate(-50%, -50%)' }}
                        >
                          <span className={cn(
                            "text-xl md:text-2xl font-black px-4 py-2 rounded-xl text-center block drop-shadow-2xl",
                            mediaSettings.textColor || "text-white",
                            mediaSettings.textBg ? "bg-black/60 backdrop-blur-md border border-white/10" : ""
                          )}>
                            {mediaSettings.textOverlay}
                          </span>
                        </div>
                      )}
                      {mediaSettings.stickers?.map((s: any) => (
                        <div 
                          key={s.id}
                          className="absolute z-10"
                          style={{ left: `${s.x}%`, top: `${s.y}%`, transform: `translate(-50%, -50%) scale(${s.scale}) rotate(${s.rotation}deg)` }}
                        >
                          <img src={s.imageUrl} alt="Sticker" className="w-20 h-20 md:w-24 md:h-24 object-contain drop-shadow-2xl" />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="px-5 py-4 flex items-center gap-8 border-t border-zinc-900/20" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 group cursor-pointer active:scale-90 transition-transform" onClick={handleLike}>
            <div className={cn("p-2 rounded-full transition-all", isLiked ? "bg-red-500/10" : "group-hover:bg-red-500/5")}>
               <Heart className={cn("h-5 w-5", isLiked ? "fill-red-500 text-red-500 scale-110" : "text-zinc-600 group-hover:text-red-500/60")} />
            </div>
            <span className={cn("text-xs font-black", isLiked ? "text-red-500" : "text-zinc-600")}>{likesCount}</span>
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <div className="flex items-center gap-2 group cursor-pointer active:scale-90 transition-transform">
                <div className="p-2 rounded-full group-hover:bg-primary/5 transition-all">
                   <MessageCircle className="h-5 w-5 text-zinc-600 group-hover:text-primary/60" />
                </div>
                <span className="text-xs font-black text-zinc-600">{comments.length}</span>
              </div>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] bg-zinc-950 border-zinc-900 rounded-t-[3rem] p-0 outline-none overflow-hidden flex flex-col shadow-2xl">
              <SheetHeader className="p-8 border-b border-zinc-900 shrink-0">
                <div className="w-14 h-1.5 bg-zinc-900 rounded-full mx-auto mb-6" />
                <SheetTitle className="text-white font-black text-xl text-center tracking-tighter uppercase">{isRtl ? "غرفة النقاش" : "Sovereign Discussion"}</SheetTitle>
              </SheetHeader>
              <ScrollArea className="flex-1 px-8 py-6">
                <div className="space-y-8 pb-10">
                  {comments.length > 0 ? comments.map((comment: any) => (
                    <div key={comment.id} className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <Avatar className="h-10 w-10 border border-zinc-900"><AvatarImage src={comment.authorAvatar} /></Avatar>
                      <div className="flex-1 bg-zinc-900/40 p-5 rounded-2xl border border-white/5 shadow-xl">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest">@{comment.authorHandle}</p>
                        </div>
                        <p className="text-[14px] text-zinc-200 leading-relaxed font-medium">{comment.text}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="py-24 text-center opacity-10 flex flex-col items-center gap-6">
                      <MessageCircle className="h-16 w-16" />
                      <p className="text-sm font-black uppercase tracking-widest">{isRtl ? "ابدأ النقاش الآن" : "Zero arguments found"}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-6 pb-10 border-t border-zinc-900 bg-black/50 backdrop-blur-xl shrink-0">
                {isBanned ? (
                  <div className="p-4 text-center text-[11px] text-red-500 font-black uppercase bg-red-500/10 rounded-2xl border border-red-500/20 tracking-[0.2em]">
                    RESTRICTED STATUS: MESSAGING DISABLED
                  </div>
                ) : !allowComments ? (
                  <div className="p-4 text-center text-[11px] text-zinc-500 font-black uppercase bg-zinc-900/50 rounded-2xl border border-zinc-800 tracking-[0.2em]">
                    COMMENTS DISABLED BY AUTHOR
                  </div>
                ) : (
                  <div className="flex gap-3 items-center bg-zinc-900/80 p-1.5 rounded-full pl-6 border border-zinc-800 shadow-2xl">
                    <Input 
                      placeholder={isRtl ? "أضف مساهمتك..." : "Contribute to discussion..."} 
                      className="bg-transparent border-none h-12 text-sm focus-visible:ring-0 shadow-none p-0" 
                      value={newComment} 
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <Button size="icon" className="rounded-full h-12 w-12 bg-primary hover:bg-primary/90 shrink-0 shadow-lg active:scale-90 transition-transform" onClick={handleAddComment} disabled={!newComment.trim()}>
                      <Send className="h-5 w-5" />
                    </Button>
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
