"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { CreatePost } from "@/components/feed/CreatePost";
import { PostCard } from "@/components/feed/PostCard";
import { useLanguage } from "@/context/LanguageContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MOCK_POSTS = [
  {
    id: "1",
    author: { name: "Ahmed Salem", handle: "ahmed_s", avatar: "https://picsum.photos/seed/ahmed/100/100" },
    content: "Beautiful day in Cairo! 🇪🇬 Looking forward to connecting with the tech community here on LammaFeed.",
    image: "https://picsum.photos/seed/cairo/800/500",
    likes: 245,
    comments: 12,
    reposts: 5,
    time: "2h",
  },
  {
    id: "2",
    author: { name: "Sarah Connor", handle: "sconnor", avatar: "https://picsum.photos/seed/sarah/100/100" },
    content: "Just started learning React. The ecosystem is huge! Any advice for beginners?",
    likes: 89,
    comments: 45,
    reposts: 2,
    time: "4h",
  },
  {
    id: "3",
    author: { name: "Community Talk", handle: "lamma_talk", avatar: "https://picsum.photos/seed/lamma/100/100" },
    content: "Join our 'Lamma' tonight at 8 PM to discuss the future of AI in the Arab world. Don't miss out! #AI #Tech",
    isLamma: true,
    likes: 512,
    comments: 108,
    reposts: 88,
    time: "6h",
  }
];

export default function Home() {
  const { t, isRtl } = useLanguage();

  return (
    <div className="flex flex-col md:flex-row min-h-screen max-w-7xl mx-auto">
      <AppSidebar />
      
      <main className="flex-1 bg-background border-x min-h-screen">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b">
          <div className="p-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">{t("home")}</h2>
          </div>
          <Tabs defaultValue="forYou" className="w-full">
            <TabsList className="w-full bg-transparent h-12 rounded-none p-0">
              <TabsTrigger value="forYou" className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary font-semibold">
                {t("forYou")}
              </TabsTrigger>
              <TabsTrigger value="latest" className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary font-semibold">
                {t("latest")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </header>

        <div className="pb-20 md:pb-4 max-w-2xl mx-auto md:px-4 md:mt-4">
          <CreatePost />
          
          <div className="flex flex-col">
            {MOCK_POSTS.map(post => (
              <PostCard key={post.id} {...post} />
            ))}
          </div>
        </div>
      </main>

      <aside className="hidden lg:flex flex-col w-80 p-6 gap-6 sticky top-0 h-screen overflow-y-auto">
        <div className="bg-white rounded-2xl border p-4 shadow-sm">
          <h3 className="font-bold text-lg mb-4">{t("trending")}</h3>
          <div className="space-y-4">
            {["#LammaFeed", "#CairoTech", "#NextJS", "#ArabicCode"].map((tag, i) => (
              <div key={i} className="group cursor-pointer">
                <p className="text-xs text-muted-foreground">{i + 1} • Trending</p>
                <p className="font-semibold group-hover:text-primary transition-colors">{tag}</p>
                <p className="text-xs text-muted-foreground">{Math.floor(Math.random() * 5000)} posts</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-4 shadow-sm">
          <h3 className="font-bold text-lg mb-4">{t("communities")}</h3>
          <div className="space-y-4">
            {[
              { name: "Arabic Cooking", members: "12k" },
              { name: "Global Nomads", members: "45k" },
              { name: "Mental Support", members: "8k" }
            ].map((comm, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                    <span className="text-accent font-bold">C</span>
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-semibold text-sm truncate">{comm.name}</p>
                    <p className="text-xs text-muted-foreground">{comm.members} members</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-8 rounded-full text-xs">
                  {t("join")}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
