
"use client";

import { useParams, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { PostCard } from "@/components/feed/PostCard";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function PostDetailPage() {
  const { postId } = useParams();
  const { isRtl } = useLanguage();
  const router = useRouter();
  const db = useFirestore();

  const postRef = useMemoFirebase(() => postId ? doc(db, "posts", postId as string) : null, [db, postId]);
  const { data: post, isLoading } = useDoc<any>(postRef);

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <p className="text-zinc-500 mb-4">{isRtl ? "المقال غير موجود" : "Article not found"}</p>
        <Button variant="outline" className="rounded-full" onClick={() => router.back()}>
          {isRtl ? "العودة" : "Go Back"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-800">
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md px-4 py-3 flex items-center gap-4 border-b border-zinc-900">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
          <ArrowLeft className={isRtl ? "rotate-180" : ""} />
        </Button>
        <h1 className="text-lg font-bold">{isRtl ? "عرض المقال" : "View Article"}</h1>
      </header>

      <main className="pb-24">
        <PostCard 
          id={post.id}
          author={post.author || { name: "User", handle: "user", avatar: "" }}
          content={post.content}
          image={post.mediaUrl}
          mediaType={post.mediaType}
          likes={post.likesCount || 0}
          commentsCount={post.commentsCount || 0}
          time={post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : ""}
        />
        
        <div className="p-4 text-zinc-500 text-xs text-center">
          {isRtl ? "التعليقات تظهر في الأسفل عند النقر على أيقونة التعليق" : "Comments appear in the sheet when clicking the comment icon"}
        </div>
      </main>

      <AppSidebar />
    </div>
  );
}
