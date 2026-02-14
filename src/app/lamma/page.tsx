
"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Plus, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const COMMUNITIES = [
  { id: "politics", name: "Politics & News", topic: "Politics", members: "150k", activeNow: 1200, icon: "📰" },
  { id: "cooking", name: "Home Cooking", topic: "Food", members: "80k", activeNow: 450, icon: "🍲" },
  { id: "startup", name: "Startup Hub", topic: "Business", members: "45k", activeNow: 310, icon: "🚀" },
  { id: "wellness", name: "Mental Health Support", topic: "Wellness", members: "25k", activeNow: 98, icon: "🌱" },
  { id: "sports", name: "Football Fans", topic: "Sports", members: "300k", activeNow: 4500, icon: "⚽" },
  { id: "education", name: "Learning Arabic", topic: "Education", members: "60k", activeNow: 220, icon: "📚" },
];

export default function LammaPage() {
  const { t, isRtl } = useLanguage();

  return (
    <div className="flex flex-col md:flex-row min-h-screen max-w-7xl mx-auto">
      <AppSidebar />
      
      <main className="flex-1 bg-background border-x min-h-screen">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{t("lamma")}</h2>
            <Button size="sm" className="rounded-full gap-2">
              <Plus className="h-4 w-4" />
              {isRtl ? "إنشاء لمة" : "Create Lamma"}
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={isRtl ? "ابحث عن مجتمع..." : "Search for a community..."} 
              className="pl-10 rounded-full bg-muted/50 border-none h-10"
            />
          </div>
        </header>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 pb-20 md:pb-6">
          {COMMUNITIES.map((comm) => (
            <Card key={comm.id} className="group hover:border-primary transition-all shadow-sm">
              <CardHeader className="p-4 flex flex-row items-start justify-between space-y-0">
                <div className="flex gap-4">
                  <div className="text-4xl bg-muted h-16 w-16 rounded-2xl flex items-center justify-center shrink-0">
                    {comm.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{comm.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1 font-normal text-[10px] py-0">{comm.topic}</Badge>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{comm.members} {isRtl ? "عضو" : "members"}</span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        {comm.activeNow} {isRtl ? "متصل الآن" : "active now"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <Link href={`/lamma/${comm.id}`}>
                  <Button className="w-full rounded-xl gap-2 font-semibold">
                    <MessageSquare className="h-4 w-4" />
                    {isRtl ? "انضم للدردشة" : "Join Chat"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
