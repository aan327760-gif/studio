
"use client";

import { Heart, MessageCircle, Repeat2, Share2, MoreHorizontal, Languages, Send, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { useState, useEffect } from "react";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, collection, addDoc, serverTimestamp, query, orderBy, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface PostCardProps {
  id: string;
  author: {
    name: string;
    handle: string;
    avatar: string;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  reposts: number;
  time: string;
}

export function PostCard({ id, author, content, image, likes: initialLikes, comments: initialCommentsCount, reposts, time }: PostCardProps) {
  const { isRtl } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useUser();
  const db = useFirestore();
  
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postAuthorId, setPostAuthorId] = useState<string | null>(null);

  // Fetch comments
  const commentsQuery = useMemoFirebase(() => {
    if (!id) return null;
    return query(collection(db, "posts", id, "comments"), orderBy("createdAt", "desc"), limit(50));
  }, [db, id]);
  const { data: comments, loading: commentsLoading } = useCollection<any>(commentsQuery);

  useEffect(() => {
    if (!id || !db) return;
    const postRef = doc(db, "posts", id);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const likedBy = data.likedBy || [];
        setLikesCount(likedBy.length);
        setPostAuthorId(data.authorId || null);
        if (user) {
          setIsLiked(likedBy.includes(user.uid));
        }
      }
    });
    return () => unsubscribe();
  }, [id, db, user]);

  const handleLike = async () => {
    if (!user || !id) return;
    const postRef = doc(db, "posts", id);
    
    if (isLiked) {
      updateDoc(postRef, { likedBy: arrayRemove(user.uid) });
    } else {
      updateDoc(postRef, { likedBy: arrayUnion(user.uid) });
      
      // Create Notification if it's not the user's own post
      if (postAuthorId && postAuthorId !== user.uid) {
        addDoc(collection(db, "notifications"), {
          userId: postAuthorId,
          type: "like",
          fromUserId: user.uid,
          fromUserName: user.displayName || "Someone",
          fromUserAvatar: user.photoURL || "",
          postId: id,
          read: false,
          createdAt: serverTimestamp()
        });
      }
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !id) return;
    
    const commentData = {
      authorId: user.uid,
      authorName: user.displayName || "User",
      authorAvatar: user.photoURL || "",
      text: newComment,
      createdAt: serverTimestamp()
    };

    addDoc(collection(db, "posts", id, "comments"), commentData);
    
    // Create Notification
    if (postAuthorId && postAuthorId !== user.uid) {
      addDoc(collection(db, "notifications"), {
        userId: postAuthorId,
        type: "comment",
        fromUserId: user.uid,
        fromUserName: user.displayName || "Someone",
        fromUserAvatar: user.photoURL || "",
        postId: id,
        read: false,
        createdAt: serverTimestamp()
      });
    }

    setNewComment("");
  };

  return (
    <Card className="bg-black text-white border-none rounded-none mb-2 border-b border-zinc-900">
      <CardHeader className="p-4 flex flex-row items-center space-y-0 gap-3">
        <Avatar className="h-10 w-10 border-none">
          <AvatarImage src={author.avatar} />
          <AvatarFallback>{author.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-1">
            <h3 className="font-bold text-sm truncate">{author.name}</h3>
            <span className="text-xs text-muted-foreground">@{author.handle}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <div className="px-4 pb-2 text-sm leading-relaxed">
          <p className={cn("whitespace-pre-wrap", !isExpanded && content.length > 150 ? "line-clamp-3" : "")}>
            {content}
          </p>
          {!isExpanded && content.length > 150 && (
            <button 
              onClick={() => setIsExpanded(true)}
              className="text-primary font-semibold mt-1"
            >
              {isRtl ? "عرض المزيد" : "Show more"}
            </button>
          )}
        </div>

        {image && (
          <div className="relative w-full bg-zinc-900 overflow-hidden px-4">
            <img 
              src={image} 
              alt="Post content" 
              className="w-full h-auto max-h-[500px] object-cover rounded-2xl border border-zinc-800"
              loading="lazy"
            />
          </div>
        )}

        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div 
                className="flex items-center gap-1.5 group cursor-pointer"
                onClick={handleLike}
              >
                <Heart 
                  className={cn(
                    "h-5 w-5 transition-all",
                    isLiked ? "fill-red-500 text-red-500 scale-110" : "text-zinc-500 group-hover:text-red-500"
                  )} 
                />
                <span className={cn("text-xs font-medium", isLiked ? "text-red-500" : "text-zinc-500")}>
                  {likesCount}
                </span>
              </div>
              
              <Sheet>
                <SheetTrigger asChild>
                  <div className="flex items-center gap-1.5 group cursor-pointer text-zinc-500 hover:text-primary transition-colors">
                    <MessageCircle className="h-5 w-5" />
                    <span className="text-xs font-medium">{comments.length}</span>
                  </div>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh] bg-zinc-950 border-zinc-800 rounded-t-3xl p-0 flex flex-col">
                  <SheetHeader className="p-4 border-b border-zinc-900">
                    <SheetTitle className="text-white text-center">
                      {isRtl ? "التعليقات" : "Comments"}
                    </SheetTitle>
                  </SheetHeader>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {commentsLoading ? (
                      <div className="flex justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : comments.length > 0 ? (
                      comments.map((comment: any) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.authorAvatar} />
                            <AvatarFallback>{comment.authorName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 bg-zinc-900/50 p-3 rounded-2xl">
                            <p className="text-xs font-bold mb-1">{comment.authorName}</p>
                            <p className="text-sm text-zinc-300">{comment.text}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-zinc-500 text-sm py-10">
                        {isRtl ? "لا يوجد تعليقات بعد" : "No comments yet. Be the first!"}
                      </p>
                    )}
                  </div>
                  
                  <div className="p-4 bg-black border-t border-zinc-900 pb-10">
                    <div className="flex gap-2 items-center">
                      <Input 
                        placeholder={isRtl ? "أضف تعليقاً..." : "Add a comment..."} 
                        className="bg-zinc-900 border-none rounded-full h-11"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                      />
                      <Button size="icon" className="rounded-full bg-primary" onClick={handleAddComment}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-1.5 group cursor-pointer text-zinc-500 hover:text-green-500 transition-colors">
                <Repeat2 className="h-5 w-5" />
                <span className="text-xs font-medium">{reposts}</span>
              </div>
            </div>
            <Share2 className="h-5 w-5 text-zinc-500 cursor-pointer hover:text-white" />
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-600 uppercase tracking-wider">
            <div className="flex items-center gap-1 cursor-pointer hover:text-primary">
              <Languages className="h-3 w-3" />
              <span>{isRtl ? "ترجمة" : "Translate"}</span>
            </div>
            <span>{time}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
