
"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Plus, MessageSquare, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";

export default function LammaPage() {
  const { t, isRtl } = useLanguage();
  const db = useFirestore();

  const groupsQuery = useMemoFirebase(() => {
    return query(collection(db, "groups"), limit(50));
  }, [db]);

  const { data: groups, loading } = useCollection<any>(groupsQuery);

  return (
    <div className="flex flex-col md:flex-row min-h-screen max-w-7xl mx-auto">
      <AppSidebar />
      
      <main className="flex-1 bg-black border-x border-zinc-900 min-h-screen text-white">
        <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-900 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{t("lamma")}</h2>
            <Button size="sm" className="rounded-full gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              {isRtl ? "إنشاء لمة" : "Create Lamma"}
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder={isRtl ? "ابحث عن مجتمع..." : "Search for a community..."} 
              className="pl-10 rounded-full bg-zinc-900 border-none h-10 text-sm focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </header>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 pb-20 md:pb-6">
          {loading ? (
            <div className="col-span-full flex justify-center p-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : groups.length > 0 ? (
            groups.map((comm) => (
              <Card key={comm.id} className="group bg-zinc-950 border-zinc-800 hover:border-primary transition-all shadow-xl">
                <CardHeader className="p-4 flex flex-row items-start justify-between space-y-0">
                  <div className="flex gap-4">
                    <div className="text-4xl bg-zinc-900 h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 border border-zinc-800">
                      {comm.icon || "🌍"}
                    </div>
                    <div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors text-white">{comm.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1 font-normal text-[10px] py-0 bg-zinc-800 text-zinc-400">{comm.topic || "General"}</Badge>
                      <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                        <span>{comm.memberCount || 0} {isRtl ? "عضو" : "members"}</span>
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          {isRtl ? "نشط" : "active"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <Link href={`/lamma/${comm.id}`}>
                    <Button className="w-full rounded-xl gap-2 font-semibold bg-white text-black hover:bg-zinc-200">
                      <MessageSquare className="h-4 w-4" />
                      {isRtl ? "انضم للدردشة" : "Join Chat"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center p-10 text-zinc-500">
              {isRtl ? "لا توجد مجتمعات حالياً، كن أول من ينشئ واحدة!" : "No communities found. Be the first to create one!"}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
