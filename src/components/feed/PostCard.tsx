
"use client";

import { 
  MessageCircle, 
  MoreHorizontal, 
  Trash2, 
  Flag, 
  Bookmark,
  Send,
  ThumbsUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Clock
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { useState, memo } from "react";
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  collection, 
  addDoc, 
  serverTimestamp, 
  deleteDoc,
  increment,
  query,
  orderBy
} from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SUPER_ADMIN_EMAIL = "adelbenmaza3@gmail.com";

interface PostCardProps {
  id: string;
  author: any;
  content: string;
  image?: string;
  likes?: number;
  likedBy?: string[];
  savedBy?: string[];
  commentsCount?: number;
  time: string;
  tags?: string[];
}

export const PostCard = memo(({ 
  id, author, content, image, 
  likes = 0, likedBy = [], savedBy = [], 
  commentsCount = 0,
  time, tags = []
}: PostCardProps) => {
  const { isRtl } = useLanguage();
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  
  const [newComment, setNewComment] = useState("");
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const authorId = author?.uid || author?.id;
  
  const authorRef = useMemoFirebase(() => authorId ? doc(db, "users", authorId) : null, [db, authorId]);
  const { data: liveAuthor } = useDoc<any>(authorRef);

  const commentsQuery = useMemoFirebase(() => {
    if (!id) return null;
    return query(collection(db, "articles", id, "comments"), orderBy("createdAt", "asc"));
  }, [db, id]);
  const { data: rawComments, isLoading: commentsLoading } = useCollection<any>(commentsQuery);
  const comments = rawComments || [];

  const isLiked = user ? (likedBy || []).includes(user.uid) : false;
  const isSaved = user ? (savedBy || []).includes(user.uid) : false;
  const isSuper = user?.email === SUPER_ADMIN_EMAIL;
  const isOwner = user?.uid === authorId;
  const isLong = content.length > 200;

  const displayAvatar = liveAuthor?.photoURL || author?.photoURL;
  const displayName = liveAuthor?.displayName || author?.name;
  const isVerified = liveAuthor?.isVerified || (liveAuthor?.email === SUPER_ADMIN_EMAIL);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !id) return;
    const articleRef = doc(db, "articles", id);
    const authorDocRef = doc(db, "users", authorId);
    
    if (isLiked) {
      updateDoc(articleRef, { 
        likedBy: arrayRemove(user.uid), 
        likesCount: increment(-1),
        priorityScore: increment(-10)
      });
      updateDoc(authorDocRef, { points: increment(-2) });
    } else {
      updateDoc(articleRef, { 
        likedBy: arrayUnion(user.uid), 
        likesCount: increment(1),
        priorityScore: increment(10)
      });
      updateDoc(authorDocRef, { points: increment(2) });
      if (authorId !== user.uid) {
        addDoc(collection(db, "notifications"), {
          userId: authorId,
          type: "like",
          fromUserId: user.uid,
          fromUserName: user.displayName,
          fromUserAvatar: user.photoURL,
          message: isRtl ? "أعجب بمقالك" : "liked your article",
          read: false,
          createdAt: serverTimestamp()
        });
      }
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !user || !id) return;
    
    addDoc(collection(db, "articles", id, "comments"), {
      authorId: user.uid, 
      authorName: user.displayName, 
      authorAvatar: user.photoURL, 
      text: newComment, 
      createdAt: serverTimestamp()
    });
    
    updateDoc(doc(db, "articles", id), { 
      commentsCount: increment(1),
      priorityScore: increment(25) 
    });
    updateDoc(doc(db, "users", authorId), { points: increment(5) });
    
    if (authorId !== user.uid) {
      addDoc(collection(db, "notifications"), {
        userId: authorId,
        type: "comment",
        fromUserId: user.uid,
        fromUserName: user.displayName,
        fromUserAvatar: user.photoURL,
        message: isRtl ? "علق على مقالك" : "commented on your article",
        read: false,
        createdAt: serverTimestamp()
      });
    }
    setNewComment("");
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!id || !commentId) return;
    if (confirm(isRtl ? "حذف هذا التعليق؟" : "Delete this comment?")) {
      await deleteDoc(doc(db, "articles", id, "comments", commentId));
      await updateDoc(doc(db, "articles", id), { commentsCount: increment(-1) });
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !id) return;
    const articleRef = doc(db, "articles", id);
    if (isSaved) {
      updateDoc(articleRef, { savedBy: arrayRemove(user.uid) });
      toast({ title: isRtl ? "تمت الإزالة من الأرشيف" : "Removed from archive" });
    } else {
      updateDoc(articleRef, { savedBy: arrayUnion(user.uid) });
      toast({ title: isRtl ? "تم الحفظ في الأرشيف" : "Saved to archive" });
    }
  };

  return (
    <Card className="bg-black text-white border-none rounded-none border-b border-zinc-900/50 mb-1" onClick={() => router.push(`/post/${id}`)}>
      <CardHeader className="p-5 pb-3 flex flex-row items-center gap-4">
        <Link href={`/profile/${authorId || '#'}`} onClick={(e) => e.stopPropagation()}>
          <Avatar className="h-11 w-11 border border-zinc-900 ring-1 ring-white/5">
            <AvatarImage src={displayAvatar} />
            <AvatarFallback className="bg-zinc-900">{displayName?.[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-[15px] truncate tracking-tight">{displayName}</h3>
                {isVerified && <VerificationBadge className="h-4 w-4" />}
              </div>
              <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{author?.nationality} • {time}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-9 w-9 rounded-full"><MoreHorizontal className="h-5 w-5" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-white rounded-2xl">
                <DropdownMenuItem className="text-orange-500 font-bold text-xs uppercase" onClick={(e) => { e.stopPropagation(); setIsReportDialogOpen(true); }}><Flag className="h-4 w-4 mr-2" /> {isRtl ? "إبلاغ" : "Report"}</DropdownMenuItem>
                {(isSuper || isOwner) && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteDoc(doc(db, "articles", id)); }} className="text-red-500 font-bold text-xs uppercase">
                    <Trash2 className="h-4 w-4 mr-2" /> {isRtl ? "حذف المقال" : "Delete Article"}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="px-5 pb-3 space-y-3">
          <p className={cn(
            "text-[15px] leading-relaxed whitespace-pre-wrap transition-all duration-300 font-medium text-zinc-300",
            !isExpanded && isLong ? "line-clamp-4" : ""
          )}>
            {content}
          </p>
          
          {isLong && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="text-primary text-[10px] font-black uppercase flex items-center gap-1 hover:underline"
            >
              {isExpanded ? (isRtl ? "عرض أقل" : "Show Less") : (isRtl ? "اقرأ المزيد" : "Read More")}
            </button>
          )}
        </div>

        {image && (
          <div className="w-full bg-zinc-950 flex justify-center border-y border-zinc-900/50 mt-4 shadow-inner">
            <img src={image} alt="Article Media" className="w-full h-auto max-h-[80vh] object-contain" />
          </div>
        )}

        <div className="px-5 py-5 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2 cursor-pointer group active:scale-125 transition-transform" onClick={handleLike}>
              <ThumbsUp className={cn("h-5 w-5 transition-all", isLiked ? "fill-primary text-primary" : "text-zinc-700")} />
              <span className={cn("text-xs font-black", isLiked ? "text-primary" : "text-zinc-700")}>{likes}</span>
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer active:scale-125 transition-transform">
                  <MessageCircle className="h-5 w-5 text-zinc-700" />
                  <span className="text-xs font-black text-zinc-700">{commentsCount}</span>
                </div>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] bg-black border-zinc-900 rounded-t-[2.5rem] p-0 flex flex-col shadow-2xl">
                <SheetHeader className="p-6 border-b border-zinc-900/50">
                  <SheetTitle className="text-white font-black text-xl text-center uppercase tracking-tighter">{isRtl ? "التعليقات السيادية" : "Sovereign Comments"}</SheetTitle>
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                   {commentsLoading ? (
                     <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary opacity-30" /></div>
                   ) : (comments && comments.length > 0) ? (
                     comments.map((comment: any) => (
                       <div key={comment.id} className="flex gap-4 group/item">
                          <Avatar className="h-9 w-9 shrink-0 border border-zinc-900">
                             <AvatarImage src={comment.authorAvatar} />
                             <AvatarFallback className="bg-zinc-900 text-[10px]">{comment.authorName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                   <span className="text-xs font-black text-zinc-200">{comment.authorName}</span>
                                   <span className="text-[8px] text-zinc-600 font-bold uppercase flex items-center gap-1">
                                      <Clock className="h-2 w-2" />
                                      {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleDateString() : ""}
                                   </span>
                                </div>
                                {(isSuper || user?.uid === comment.authorId || isOwner) && (
                                  <button onClick={() => handleDeleteComment(comment.id)} className="opacity-0 group-hover/item:opacity-100 transition-opacity text-red-500/50 hover:text-red-500">
                                     <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                             </div>
                             <p className="text-sm text-zinc-400 mt-1 leading-relaxed font-medium">{comment.text}</p>
                          </div>
                       </div>
                     ))
                   ) : (
                     <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
                        <MessageCircle className="h-12 w-12" />
                        <p className="text-xs font-black uppercase tracking-widest">{isRtl ? "كن أول من يعلق" : "Be the first to comment"}</p>
                     </div>
                   )}
                </div>

                <div className="p-4 pb-12 border-t border-zinc-900 bg-black">
                  <div className="flex gap-3 items-center bg-zinc-900 rounded-full pl-5 pr-1.5 py-1.5 shadow-inner border border-white/5">
                    <Input 
                      placeholder={isRtl ? "أضف تعليقاً..." : "Add a comment..."} 
                      className="bg-transparent border-none h-10 text-sm focus-visible:ring-0 shadow-none p-0" 
                      value={newComment} 
                      onChange={(e) => setNewComment(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} 
                    />
                    <Button size="icon" className="rounded-full bg-primary h-10 w-10 shadow-lg" onClick={handleAddComment} disabled={!newComment.trim()}>
                      <Send className={cn("h-4 w-4", isRtl ? "rotate-180" : "")} />
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <button className={cn("transition-all active:scale-125", isSaved ? "text-primary" : "text-zinc-700 hover:text-white")} onClick={handleSave}>
              <Bookmark className={cn("h-5 w-5", isSaved && "fill-primary")} />
            </button>
          </div>

          <div className="flex items-center gap-2 cursor-pointer text-zinc-700 hover:text-white active:scale-125 transition-transform" onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/post/${id}`);
            toast({ title: isRtl ? "نسخ الرابط" : "Link Copied" });
          }}>
            <Send className="h-5 w-5" />
          </div>
        </div>
      </CardContent>

      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-[2.5rem]">
          <DialogHeader><DialogTitle className="text-center font-black flex items-center justify-center gap-2 uppercase"><AlertTriangle className="h-5 w-5 text-orange-500" /> {isRtl ? "بلاغ سيادي" : "Report Content"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-6">
            {[isRtl ? "خطاب كراهية" : "Hate Speech", isRtl ? "أخبار زائفة" : "Fake News", isRtl ? "محتوى غير لائق" : "Inappropriate"].map((reason) => (
              <Button key={reason} variant="ghost" className="w-full justify-start h-14 rounded-2xl bg-zinc-900 border border-white/5 font-black uppercase text-[10px] tracking-widest" onClick={() => { setIsReportDialogOpen(false); toast({ title: "Report Submitted Successfully" }); }}>{reason}</Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
});

PostCard.displayName = "PostCard";
