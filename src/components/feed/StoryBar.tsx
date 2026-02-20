
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

  // جلب الستوريات التي لم تنتهِ صلاحيتها (24 ساعة)
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
    <div className="flex gap-4 overflow-x-auto no-scrollbar py-5 px-4 bg-black border-b border-zinc-900/50">
      {/* زر إضافة ستوري سيادي */}
      <Link href="/create-story" className="flex flex-col items-center gap-2 shrink-0 group">
        <div className="relative">
          <div className="h-16 w-16 rounded-[2rem] bg-zinc-900 border-2 border-dashed border-zinc-800 flex items-center justify-center group-active:scale-90 transition-all overflow-hidden">
            <Avatar className="h-full w-full opacity-40">
              <AvatarImage src={user?.photoURL || ""} />
              <AvatarFallback className="bg-zinc-900 font-black text-xs text-zinc-600">U</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center">
               <Plus className="h-6 w-6 text-primary stroke-[3px]" />
            </div>
          </div>
        </div>
        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
          {isRtl ? "إضافة" : "Add"}
        </span>
      </Link>

      {isLoading ? (
        <div className="flex items-center px-4"><Loader2 className="h-5 w-5 animate-spin text-zinc-800" /></div>
      ) : (
        stories?.map((story) => (
          <Link key={story.id} href={`/story/${story.id}`} className="flex flex-col items-center gap-2 shrink-0 group">
            <div className="h-16 w-16 rounded-[2rem] p-[2.5px] bg-gradient-to-tr from-primary via-accent to-primary shadow-lg shadow-primary/10 group-active:scale-95 transition-all">
              <div className="h-full w-full rounded-[1.8rem] bg-black p-0.5">
                <Avatar className="h-full w-full rounded-[1.6rem] border border-zinc-900">
                  <AvatarImage src={story.authorAvatar} className="object-cover" />
                  <AvatarFallback className="bg-zinc-900 text-[8px] font-black">{story.authorName?.[0]}</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-[9px] font-black text-zinc-400 truncate max-w-[64px] uppercase tracking-tighter">
              {story.authorName}
            </span>
          </Link>
        ))
      )}
    </div>
  );
}
