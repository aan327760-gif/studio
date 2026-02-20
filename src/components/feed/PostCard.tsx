
"use client";

import { 
  MessageCircle, 
  MoreHorizontal, 
  Trash2, 
  Flag, 
  Share2,
  Send,
  Bookmark,
  X,
  CornerDownLeft,
  ThumbsUp,
  AlertTriangle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { useState, memo } from "react";
import { useFirestore, useUser } from "@/firebase";
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  collection, 
  addDoc, 
  serverTimestamp, 
  deleteDoc,
  increment
} from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
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

  const isLiked = user ? (likedBy || []).includes(user.uid) : false;
  const isSaved = user ? (savedBy || []).includes(user.uid) : false;
  const isSuper = user?.email === SUPER_ADMIN_EMAIL;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !id) return;
    const articleRef = doc(db, "articles", id);
    const authorRef = doc(db, "users", author.uid || author.id);
    
    if (isLiked) {
      updateDoc(articleRef, { likedBy: arrayRemove(user.uid), likesCount: increment(-1) });
      updateDoc(authorRef, { points: increment(-2) });
    } else {
      updateDoc(articleRef, { likedBy: arrayUnion(user.uid), likesCount: increment(1) });
      updateDoc(authorRef, { points: increment(2) });
      if ((author?.uid || author?.id) !== user.uid) {
        addDoc(collection(db, "notifications"), {
          userId: author.uid || author.id,
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

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !id) return;
    const articleRef = doc(db, "articles", id);
    if (isSaved) {
      updateDoc(articleRef, { savedBy: arrayRemove(user.uid), savesCount: increment(-1) });
      toast({ title: isRtl ? "تمت الإزالة من الأرشيف" : "Removed from Archive" });
    } else {
      updateDoc(articleRef, { savedBy: arrayUnion(user.uid), savesCount: increment(1) });
      toast({ title: isRtl ? "تم الحفظ في الأرشيف" : "Saved to Archive" });
    }
  };

  const handleReport = async (reason: string) => {
    if (!user || !id) return;
    await addDoc(collection(db, "reports"), {
      postId: id,
      postContent: content,
      authorId: author.uid || author.id,
      authorName: author.name || author.displayName,
      reporterId: user.uid,
      reporterName: user.displayName,
      reason,
      status: "pending",
      createdAt: serverTimestamp()
    });
    toast({ title: isRtl ? "تم إرسال البلاغ" : "Report sent" });
    setIsReportDialogOpen(false);
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !user || !id) return;
    const authorId = author.uid || author.id;
    
    addDoc(collection(db, "articles", id, "comments"), {
      authorId: user.uid, 
      authorName: user.displayName, 
      authorAvatar: user.photoURL, 
      text: newComment, 
      createdAt: serverTimestamp()
    });
    
    updateDoc(doc(db, "articles", id), { commentsCount: increment(1) });
    updateDoc(doc(db, "users", authorId), { points: increment(5) }); // +5 نقاط للتعليق
    
    if (authorId !== user.uid) {
      addDoc(collection(db, "notifications"), {
        userId: authorId,
        type: "comment",
        fromUserId: user.uid,
        fromUserName: user.displayName,
        message: isRtl ? "علق على مقالك" : "commented on your article",
        read: false,
        createdAt: serverTimestamp()
      });
    }
    setNewComment("");
  };

  return (
    <Card className="bg-black text-white border-none rounded-none border-b border-zinc-900/30 mb-1" onClick={() => router.push(`/post/${id}`)}>
      <CardHeader className="p-5 pb-3 flex flex-row items-center gap-4">
        <Link href={`/profile/${author?.uid || author?.id || '#'}`} onClick={(e) => e.stopPropagation()}>
          <Avatar className="h-11 w-11 border border-zinc-900">
            <AvatarImage src={author?.photoURL || author?.avatar} />
            <AvatarFallback>{author?.name?.[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-[15px] truncate tracking-tight">{author?.name || author?.displayName}</h3>
                {(author?.isVerified || author?.email === SUPER_ADMIN_EMAIL) && <VerificationBadge className="h-4 w-4" />}
              </div>
              <span className="text-[10px] text-zinc-600 font-bold uppercase">{author.nationality} • {time}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-9 w-9 rounded-full"><MoreHorizontal className="h-5 w-5" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-white rounded-2xl">
                <DropdownMenuItem className="text-orange-500 font-bold text-xs uppercase" onClick={(e) => { e.stopPropagation(); setIsReportDialogOpen(true); }}><Flag className="h-4 w-4 mr-2" /> {isRtl ? "إبلاغ" : "Report"}</DropdownMenuItem>
                {isSuper && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteDoc(doc(db, "articles", id)); }} className="text-red-500 font-bold text-xs uppercase"><Trash2 className="h-4 w-4 mr-2" /> Root Delete</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="px-5 pb-3 space-y-3">
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{content}</p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, idx) => (
                <span key={idx} className="text-[11px] font-black text-primary">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {image && (
          <div className="w-full bg-zinc-950 flex justify-center border-y border-zinc-900/50">
            <img src={image} alt="Article Media" className="w-full h-auto max-h-[80vh] object-contain" />
          </div>
        )}

        <div className="px-5 py-4 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={handleLike}>
              <ThumbsUp className={cn("h-5 w-5 transition-all", isLiked ? "fill-white text-white" : "text-zinc-700")} />
              <span className={cn("text-xs font-black", isLiked ? "text-white" : "text-zinc-700")}>{likes}</span>
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer">
                  <MessageCircle className="h-5 w-5 text-zinc-700" />
                  <span className="text-xs font-black text-zinc-700">{commentsCount}</span>
                </div>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] bg-black border-zinc-900 rounded-t-[2rem] p-0 flex flex-col shadow-2xl">
                <SheetHeader className="p-6 border-b border-zinc-900/50">
                  <SheetTitle className="text-white font-black text-xl">{isRtl ? "التعليقات السيادية" : "Sovereign Comments"}</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-6">
                   <p className="text-center text-zinc-600 text-[10px] font-bold uppercase">{isRtl ? "التعليقات تمنح الكاتب +5 نقاط" : "Comments grant author +5 points"}</p>
                </div>
                <div className="p-4 pb-10 border-t border-zinc-900 bg-black">
                  <div className="flex gap-3 items-center bg-zinc-900 rounded-full pl-5 pr-1.5 py-1.5">
                    <Input placeholder={isRtl ? "أضف تعليقاً..." : "Add a comment..."} className="bg-transparent border-none h-10 text-sm focus-visible:ring-0 shadow-none p-0" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} />
                    <Button size="icon" className="rounded-full bg-primary h-10 w-10" onClick={handleAddComment} disabled={!newComment.trim()}><Send className={cn("h-4 w-4", isRtl ? "rotate-180" : "")} /></Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Share2 className="h-5 w-5 text-zinc-700 cursor-pointer" onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/post/${id}`);
              toast({ title: isRtl ? "نسخ الرابط" : "Link Copied" });
            }} />
          </div>

          <Bookmark className={cn("h-5 w-5 cursor-pointer transition-all", isSaved ? "fill-primary text-primary" : "text-zinc-700")} onClick={handleSave} />
        </div>
      </CardContent>

      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-[2rem]">
          <DialogHeader><DialogTitle className="text-center font-black flex items-center justify-center gap-2"><AlertTriangle className="h-5 w-5 text-orange-500" /> {isRtl ? "بلاغ سيادي" : "Report Content"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-4">
            {[isRtl ? "خطاب كراهية" : "Hate Speech", isRtl ? "أخبار زائفة" : "Fake News", isRtl ? "محتوى غير لائق" : "Inappropriate"].map((reason) => (
              <Button key={reason} variant="ghost" className="w-full justify-start h-12 rounded-xl bg-zinc-900 border border-zinc-800 font-bold" onClick={() => handleReport(reason)}>{reason}</Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
});

PostCard.displayName = "PostCard";
