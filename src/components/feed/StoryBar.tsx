
"use client";

import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, where, Timestamp } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export function StoryBar() {
  const { isRtl } = useLanguage();
  const db = useFirestore();
  const { user } = useUser();

  const storiesQuery = useMemoFirebase(() => {
    return query(
      collection(db, "stories"),
      where("expiresAt", ">", Timestamp.now()),
      orderBy("expiresAt", "asc"),
      limit(20)
    );
  }, [db]);

  const { data: rawStories, isLoading } = useCollection<any>(storiesQuery);
  const stories = rawStories || [];

  return (
    <div className="flex gap-5 overflow-x-auto no-scrollbar py-6 px-5 bg-black border-b border-zinc-900/50">
      <Link href="/create-story" className="flex flex-col items-center gap-2.5 shrink-0 group">
        <div className="relative">
          <div className="h-[70px] w-[70px] rounded-[2.2rem] bg-zinc-950 border-2 border-dashed border-zinc-800 flex items-center justify-center transition-all overflow-hidden">
            <Avatar className="h-full w-full opacity-20">
              <AvatarImage src={user?.photoURL || ""} />
              <AvatarFallback className="bg-zinc-900 font-black text-xs text-zinc-600">U</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
               <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <Plus className="h-5 w-5 text-white stroke-[4px]" />
               </div>
            </div>
          </div>
        </div>
        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">
          {isRtl ? "إضافة" : "Add"}
        </span>
      </Link>

      {isLoading ? (
        <div className="flex items-center px-6"><Loader2 className="h-6 w-6 animate-spin text-zinc-800" /></div>
      ) : (
        stories.map((story) => (
          <Link key={story.id} href={`/story/${story.id}`} className="flex flex-col items-center gap-2.5 shrink-0 group">
            <div className="h-[70px] w-[70px] rounded-[2.2rem] p-[2.5px] bg-gradient-to-tr from-primary via-accent to-primary shadow-2xl relative">
              <div className="h-full w-full rounded-[2rem] bg-black p-0.5">
                <Avatar className="h-full w-full rounded-[1.8rem] border border-zinc-900">
                  <AvatarImage src={story.authorAvatar} className="object-cover" />
                  <AvatarFallback className="bg-zinc-900 text-[10px] font-black">{story.authorName?.[0]}</AvatarFallback>
                </Avatar>
              </div>
              <div className="absolute -top-1 -right-1">
                 <Sparkles className="h-3 w-3 text-accent fill-accent animate-pulse" />
              </div>
            </div>
            <span className="text-[9px] font-black text-zinc-400 truncate max-w-[70px] uppercase tracking-tighter">
              {story.authorName}
            </span>
          </Link>
        ))
      )}
    </div>
  );
}
