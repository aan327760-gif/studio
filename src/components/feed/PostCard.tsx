
"use client";

import { 
  MessageCircle, 
  MoreHorizontal, 
  Trash2, 
  Flag, 
  Bookmark,
  Send,
  ThumbsUp,
  Loader2
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
  const [isExpanded, setIsExpanded] = useState(false);

  const authorId = author?.uid || author?.id;
  const authorRef = useMemoFirebase(() => authorId ? doc(db, "users", authorId) : null, [db, authorId]);
  const { data: liveAuthor } = useDoc<any>(authorRef);

  const commentsQuery = useMemoFirebase(() => {
    if (!id) return null;
    return query(collection(db, "articles", id, "comments"), orderBy("createdAt", "asc"));
  }, [db, id]);
  const { data: commentsResult, isLoading: commentsLoading } = useCollection<any>(commentsQuery);
  const comments = commentsResult || [];

  const isLiked = user ? (likedBy || []).includes(user.uid) : false;
  const isSaved = user ? (savedBy || []).includes(user.uid) : false;
  const isSuper = user?.email === SUPER_ADMIN_EMAIL;
  const isOwner = user?.uid === authorId;
  const isLong = content?.length > 200;

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
    setNewComment("");
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!id || !commentId) return;
    await deleteDoc(doc(db, "articles", id, "comments", commentId));
    await updateDoc(doc(db, "articles", id), { 
      commentsCount: increment(-1),
      priorityScore: increment(-25)
    });
    updateDoc(doc(db, "users", authorId), { points: increment(-5) });
    toast({ title: isRtl ? "تم حذف التعليق" : "Comment Deleted" });
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !id) return;
    const articleRef = doc(db, "articles", id);
    if (isSaved) {
      updateDoc(articleRef, { savedBy: arrayRemove(user.uid) });
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
                <DropdownMenuItem className="text-orange-500 font-bold text-xs uppercase" onClick={(e) => e.stopPropagation()}><Flag className="h-4 w-4 mr-2" /> {isRtl ? "إبلاغ" : "Report"}</DropdownMenuItem>
                {(isSuper || isOwner) && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteDoc(doc(db, "articles", id)); }} className="text-red-500 font-bold text-xs uppercase">
                    <Trash2 className="h-4 w-4 mr-2" /> {isRtl ? "حذف" : "Delete"}
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
            <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="text-primary text-[10px] font-black uppercase">
              {isExpanded ? (isRtl ? "عرض أقل" : "Show Less") : (isRtl ? "اقرأ المزيد" : "Read More")}
            </button>
          )}
        </div>

        {image && (
          <div className="w-full bg-zinc-950 flex justify-center border-y border-zinc-900/50 mt-4">
            <img src={image} alt="Article Media" className="w-full h-auto max-h-[80vh] object-contain" />
          </div>
        )}

        <div className="px-5 py-5 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2 cursor-pointer" onClick={handleLike}>
              <ThumbsUp className={cn("h-5 w-5", isLiked ? "fill-primary text-primary" : "text-zinc-700")} />
              <span className="text-xs font-black">{likes}</span>
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer">
                  <MessageCircle className="h-5 w-5 text-zinc-700" />
                  <span className="text-xs font-black text-zinc-700">{commentsCount}</span>
                </div>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] bg-black border-zinc-900 rounded-t-[2.5rem] p-0 flex flex-col">
                <SheetHeader className="p-6 border-b border-zinc-900/50">
                  <SheetTitle className="text-white font-black text-xl text-center uppercase">{isRtl ? "التعليقات" : "Comments"}</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                   {commentsLoading ? (
                     <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary opacity-30" /></div>
                   ) : (comments && comments.length > 0) ? (
                     comments.map((comment: any) => (
                       <div key={comment.id} className="flex gap-4">
                          <Avatar className="h-9 w-9 shrink-0 border border-zinc-900">
                             <AvatarImage src={comment.authorAvatar} />
                             <AvatarFallback>{comment.authorName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-zinc-200">{comment.authorName}</span>
                                {(isSuper || user?.uid === comment.authorId || isOwner) && (
                                  <button onClick={() => handleDeleteComment(comment.id)} className="text-red-500/50 hover:text-red-500">
                                     <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                             </div>
                             <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{comment.text}</p>
                          </div>
                       </div>
                     ))
                   ) : (
                     <p className="text-center text-xs text-zinc-600 py-10">{isRtl ? "لا يوجد تعليقات بعد" : "No comments yet"}</p>
                   )}
                </div>
                <div className="p-4 pb-12 border-t border-zinc-900 bg-black flex gap-3">
                  <Input placeholder={isRtl ? "أضف تعليقاً..." : "Add comment..."} className="bg-zinc-900 border-none h-10 text-sm" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                  <Button size="icon" className="rounded-full bg-primary h-10 w-10" onClick={handleAddComment} disabled={!newComment.trim()}><Send className="h-4 w-4" /></Button>
                </div>
              </SheetContent>
            </Sheet>

            <button className={cn(isSaved ? "text-primary" : "text-zinc-700")} onClick={handleSave}>
              <Bookmark className="h-5 w-5" />
            </button>
          </div>
          <div className="cursor-pointer text-zinc-700" onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/post/${id}`);
            toast({ title: isRtl ? "نسخ الرابط" : "Link Copied" });
          }}><Send className="h-5 w-5" /></div>
        </div>
      </CardContent>
    </Card>
  );
});

PostCard.displayName = "PostCard";
