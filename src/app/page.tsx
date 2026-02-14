
"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { PostCard } from "@/components/feed/PostCard";
import { useLanguage } from "@/context/LanguageContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const MOCK_POSTS = [
  {
    id: "1",
    author: { 
      name: "الجزيرة - فلسطين", 
      handle: "AJApalestine", 
      avatar: "https://picsum.photos/seed/aja/100/100" 
    },
    content: "عاجل | الهلال الأحمر: إصابة فلسطيني برصاص إسرائيلي في بلدة حوسان غرب بيت لحم والاحتلال يمنع طواقمنا من الوصول للموقع...",
    image: "https://picsum.photos/seed/palestine/800/1000",
    likes: 1200,
    comments: 45,
    reposts: 89,
    time: "4:26 PM . 14 Feb 2026",
  },
  {
    id: "2",
    author: { 
      name: "Ahmed Salem", 
      handle: "ahmed_s", 
      avatar: "https://picsum.photos/seed/user1/100/100" 
    },
    content: "Beautiful day! 🇪🇬 Looking forward to connecting with the tech community here on Unbound. #Lamma #Unbound",
    image: "https://picsum.photos/seed/cairo/800/800",
    likes: 245,
    comments: 12,
    reposts: 5,
    time: "2:15 PM . 14 Feb 2026",
  }
];

export default function Home() {
  const { t, isRtl } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-800">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-zinc-900">
        <div className="w-8" />
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mb-1">
             <span className="text-white font-bold text-xl italic">U</span>
          </div>
        </div>
        <Link href="/lamma">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
            <MessageSquare className="h-6 w-6" />
          </Button>
        </Link>
      </header>

      {/* Tabs */}
      <Tabs defaultValue="following" className="w-full">
        <TabsList className="w-full bg-black h-12 rounded-none p-0 border-b border-zinc-900">
          <TabsTrigger 
            value="following" 
            className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:text-white text-muted-foreground font-bold text-sm border-b-2 border-transparent data-[state=active]:border-primary transition-all"
          >
            Following
          </TabsTrigger>
          <TabsTrigger 
            value="discover" 
            className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:text-white text-muted-foreground font-bold text-sm border-b-2 border-transparent data-[state=active]:border-primary transition-all"
          >
            Discover
          </TabsTrigger>
        </TabsList>

        <main className="pb-20">
          <div className="flex flex-col">
            {MOCK_POSTS.map(post => (
              <PostCard key={post.id} {...post} />
            ))}
          </div>
        </main>
      </Tabs>

      <AppSidebar />
    </div>
  );
}
