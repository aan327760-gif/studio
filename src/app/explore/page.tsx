
"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, Users, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const TRENDING_TOPICS = [
  { tag: "Algeria", posts: "120K", category: "Politics" },
  { tag: "UnboundApp", posts: "85K", category: "Tech" },
  { tag: "Ramadan2026", posts: "200K", category: "Culture" },
  { tag: "LammaChat", posts: "45K", category: "Social" },
];

const SUGGESTED_USERS = [
  { name: "Ahmed Salem", handle: "ahmed_dz", avatar: "https://picsum.photos/seed/a/100/100" },
  { name: "Sarah K.", handle: "sarah_k", avatar: "https://picsum.photos/seed/s/100/100" },
  { name: "Tech Algeria", handle: "tech_dz", avatar: "https://picsum.photos/seed/t/100/100" },
];

export default function ExplorePage() {
  const { t, isRtl } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-800">
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md p-4 border-b border-zinc-900">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input 
            placeholder={isRtl ? "ابحث في Unbound..." : "Search Unbound..."} 
            className="pl-10 bg-zinc-900 border-none rounded-full h-10 text-sm focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </header>

      <main className="pb-24">
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
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500">
                  <Hash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="link" className="text-primary text-xs p-0 mt-2">
            {isRtl ? "عرض المزيد" : "Show more"}
          </Button>
        </section>

        <section className="p-4 border-b border-zinc-900">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {isRtl ? "اقتراحات المتابعة" : "Who to follow"}
          </h2>
          <div className="space-y-4">
            {SUGGESTED_USERS.map((user, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex gap-3">
                  <Avatar>
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-bold">{user.name}</p>
                    <p className="text-xs text-zinc-500">@{user.handle}</p>
                  </div>
                </div>
                <Button size="sm" className="rounded-full bg-white text-black hover:bg-zinc-200 font-bold px-4 h-8 text-xs">
                  {isRtl ? "متابعة" : "Follow"}
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="p-4">
          <h2 className="text-lg font-bold mb-4">{isRtl ? "استكشف الصور" : "Explore Media"}</h2>
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div key={i} className="aspect-square bg-zinc-900 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                <img src={`https://picsum.photos/seed/${i+50}/300/300`} alt="Explore" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </section>
      </main>

      <AppSidebar />
    </div>
  );
}
