
"use client";

import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, where, Timestamp } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export function StoryBar() {
  const { isRtl } = useLanguage();
  const db = useFirestore();
  const { user } = useUser();

  // جلب الستوريات النشطة (التي لم تنتهِ صلاحيتها بعد)
  const storiesQuery = useMemoFirebase(() => {
    return query(
      collection(db, "stories"),
      where("expiresAt", ">", Timestamp.now()),
      orderBy("expiresAt", "asc"),
      limit(20)
    );
  }, [db]);

  const { data: stories, isLoading } = useCollection<any>(storiesQuery);

  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar py-4 px-4 bg-black border-b border-zinc-900">
      {/* زر إضافة ستوري الخاص بي */}
      <Link href="/create-story" className="flex flex-col items-center gap-1.5 shrink-0 group">
        <div className="relative">
          <Avatar className="h-16 w-16 border-2 border-zinc-800 p-0.5 group-active:scale-90 transition-transform">
            <AvatarImage src={user?.photoURL || ""} />
            <AvatarFallback className="bg-zinc-900 text-[10px] font-black">U</AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0 h-5 w-5 bg-primary rounded-full border-2 border-black flex items-center justify-center">
            <Plus className="h-3 w-3 text-white stroke-[4px]" />
          </div>
        </div>
        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
          {isRtl ? "قصتي" : "My Story"}
        </span>
      </Link>

      {isLoading ? (
        <div className="flex items-center px-4"><Loader2 className="h-5 w-5 animate-spin text-zinc-800" /></div>
      ) : (
        stories?.map((story) => (
          <Link key={story.id} href={`/story/${story.id}`} className="flex flex-col items-center gap-1.5 shrink-0 group">
            <div className="h-16 w-16 rounded-full p-[2.5px] bg-gradient-to-tr from-primary via-accent to-primary shadow-lg shadow-primary/10 group-active:scale-95 transition-all">
              <Avatar className="h-full w-full border-2 border-black">
                <AvatarImage src={story.authorAvatar} />
                <AvatarFallback className="bg-zinc-900 text-[8px]">{story.authorName?.[0]}</AvatarFallback>
              </Avatar>
            </div>
            <span className="text-[9px] font-black text-zinc-400 truncate max-w-[64px] uppercase">
              {story.authorName}
            </span>
          </Link>
        ))
      )}
    </div>
  );
}
