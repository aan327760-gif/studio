
"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, Users, Hash, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit, orderBy } from "firebase/firestore";

const TRENDING_TOPICS = [
  { tag: "Algeria", posts: "120K", category: "Politics" },
  { tag: "UnboundApp", posts: "85K", category: "Tech" },
  { tag: "Ramadan2026", posts: "200K", category: "Culture" },
  { tag: "LammaChat", posts: "45K", category: "Social" },
];

export default function ExplorePage() {
  const { t, isRtl } = useLanguage();
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState("");

  const searchResultsQuery = useMemoFirebase(() => {
    if (!searchQuery.trim()) return null;
    return query(
      collection(db, "users"),
      where("displayName", ">=", searchQuery),
      where("displayName", "<=", searchQuery + "\uf8ff"),
      limit(10)
    );
  }, [db, searchQuery]);

  const { data: searchResults, loading: searchLoading } = useCollection<any>(searchResultsQuery);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-800">
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md p-4 border-b border-zinc-900">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? "ابحث عن أشخاص..." : "Search people..."} 
            className="pl-10 bg-zinc-900 border-none rounded-full h-10 text-sm focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </header>

      <main className="pb-24">
        {searchQuery.trim() ? (
          <section className="p-4">
            <h2 className="text-sm font-bold text-zinc-500 mb-4 uppercase tracking-wider">
              {isRtl ? "نتائج البحث" : "Search Results"}
            </h2>
            {searchLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex gap-3">
                      <Avatar>
                        <AvatarImage src={user.photoURL} />
                        <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold">{user.displayName}</p>
                        <p className="text-xs text-zinc-500">@{user.email?.split('@')[0]}</p>
                      </div>
                    </div>
                    <Button size="sm" className="rounded-full bg-white text-black hover:bg-zinc-200 font-bold px-4 h-8 text-xs">
                      {isRtl ? "عرض" : "View"}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-zinc-600 text-sm mt-10">
                {isRtl ? "لا توجد نتائج" : "No results found"}
              </p>
            )}
          </section>
        ) : (
          <>
            <section className="p-4 border-b border-zinc-900">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                {isRtl ? "المواضيع الرائجة" : "Trending for you"}
              </h2>
              <div className="space-y-4">
                {TRENDING_TOPICS.map((topic, i) => (
                  <div key={i} className="flex justify-between items-start cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors">
                    <div>
                      <p className="text-xs text-zinc-500">{topic.category}</p>
                      <p className="font-bold">#{topic.tag}</p>
                      <p className="text-xs text-zinc-500">{topic.posts} {isRtl ? "منشور" : "posts"}</p>
                    </div>
                    <Hash className="h-4 w-4 text-zinc-500" />
                  </div>
                ))}
              </div>
            </section>

            <section className="p-4">
              <h2 className="text-lg font-bold mb-4">{isRtl ? "استكشف الصور" : "Explore Media"}</h2>
              <div className="grid grid-cols-3 gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <div key={i} className="aspect-square bg-zinc-900 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                    <img src={`https://picsum.photos/seed/${i+100}/300/300`} alt="Explore" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <AppSidebar />
    </div>
  );
}
