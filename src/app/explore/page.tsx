
"use client";

import { useState, useMemo } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Flame, Hash, TrendingUp, Users, Newspaper, Zap } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, limit, orderBy } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VerificationBadge } from "@/components/ui/verification-badge";
import Link from "next/link";
import { ArticleCard } from "@/components/feed/ArticleCard";
import { cn } from "@/lib/utils";

const NATIONAL_TRENDS = [
  { tag: "الجزائر", category: "وطنية", posts: "1.2K" },
  { tag: "السيادة_الرقمية", category: "تقنية", posts: "850" },
  { tag: "القوميون", category: "مجتمع", posts: "2.4K" },
  { tag: "فلسطين", category: "سياسة", posts: "5.1K" },
  { tag: "الاقتصاد_الحر", category: "اقتصاد", posts: "420" },
];

export default function ExplorePage() {
  const { isRtl } = useLanguage();
  const db = useFirestore();
  const { user: currentUser } = useUser();
  const [searchQuery, setSearchQuery] = useState("");

  // بحث عن المواطنين
  const usersQuery = useMemoFirebase(() => {
    if (!searchQuery.trim()) return null;
    return query(
      collection(db, "users"),
      where("displayName", ">=", searchQuery),
      where("displayName", "<=", searchQuery + "\uf8ff"),
      limit(10)
    );
  }, [db, searchQuery]);

  const { data: userResults, isLoading: usersLoading } = useCollection<any>(usersQuery);

  // بحث عن المقالات (بالوسوم)
  const articlesQuery = useMemoFirebase(() => {
    if (!searchQuery.trim()) return null;
    const cleanTag = searchQuery.startsWith("#") ? searchQuery.substring(1) : searchQuery;
    return query(
      collection(db, "articles"),
      where("tags", "array-contains", cleanTag),
      limit(15)
    );
  }, [db, searchQuery]);

  const { data: articleResults, isLoading: articlesLoading } = useCollection<any>(articlesQuery);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-900">
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md p-4 border-b border-zinc-900">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? "ابحث عن وسم أو مواطن..." : "Search tags or citizens..."} 
            className="pl-12 bg-zinc-950 border-zinc-800 rounded-2xl h-12 text-sm focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {!searchQuery ? (
          <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
                <h2 className="text-xl font-black tracking-tighter uppercase">{isRtl ? "النبض القومي الآن" : "Trending Now"}</h2>
              </div>
              
              <div className="grid gap-4">
                {NATIONAL_TRENDS.map((trend, i) => (
                  <button 
                    key={i} 
                    className="flex items-center justify-between p-5 bg-zinc-950 border border-zinc-900 rounded-[2rem] hover:border-primary/30 transition-all text-right"
                    onClick={() => setSearchQuery("#" + trend.tag)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Hash className="h-3 w-3 text-primary" />
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{trend.category}</span>
                      </div>
                      <p className="font-black text-lg">#{trend.tag}</p>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase">{trend.posts} {isRtl ? "مقال" : "Articles"}</p>
                    </div>
                    <TrendingUp className="h-5 w-5 text-zinc-800" />
                  </button>
                ))}
              </div>
            </section>

            <section className="p-8 bg-primary/5 border border-primary/20 rounded-[3rem] text-center space-y-4">
               <Zap className="h-10 w-10 text-primary mx-auto animate-pulse" />
               <h3 className="text-lg font-black">{isRtl ? "اكتشف رفاق القلم" : "Find Fellow Writers"}</h3>
               <p className="text-xs text-zinc-500 font-bold leading-relaxed">{isRtl ? "ابحث عن كتاب من وطنك أو من دول أخرى لتبادل الفكر والسيادة." : "Search for writers from your nation or others to exchange thoughts."}</p>
            </section>
          </div>
        ) : (
          <Tabs defaultValue="articles" className="w-full">
            <TabsList className="w-full bg-black h-12 rounded-none p-0 border-b border-zinc-900">
              <TabsTrigger value="articles" className="flex-1 font-black text-[10px] uppercase tracking-widest data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
                <Newspaper className="h-3 w-3 mr-2" /> {isRtl ? "مقالات" : "Articles"}
              </TabsTrigger>
              <TabsTrigger value="people" className="flex-1 font-black text-[10px] uppercase tracking-widest data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
                <Users className="h-3 w-3 mr-2" /> {isRtl ? "مواطنون" : "Citizens"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="articles" className="m-0">
              {articlesLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" /></div>
              ) : articleResults && articleResults.length > 0 ? (
                <div className="flex flex-col">
                  {articleResults.map((article: any) => (
                    <ArticleCard 
                      key={article.id}
                      id={article.id}
                      author={{ 
                        name: article.authorName, 
                        nationality: article.authorNationality, 
                        uid: article.authorId,
                        isVerified: article.authorIsVerified,
                        email: article.authorEmail
                      }}
                      title={article.title}
                      content={article.content}
                      section={article.section}
                      tags={article.tags}
                      image={article.mediaUrl}
                      likes={article.likesCount || 0}
                      comments={article.commentsCount || 0}
                      likedBy={article.likedBy}
                      savedBy={article.savedBy}
                      time={article.createdAt?.toDate ? article.createdAt.toDate().toLocaleDateString() : ""}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center opacity-20 flex flex-col items-center gap-4">
                  <Hash className="h-12 w-12" />
                  <p className="text-xs font-black uppercase tracking-widest">{isRtl ? "لا توجد مقالات بهذا الوسم" : "No articles found"}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="people" className="p-4 space-y-3">
              {usersLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" /></div>
              ) : userResults && userResults.length > 0 ? (
                userResults.filter((u:any) => u.uid !== currentUser?.uid).map((user: any) => (
                  <Link href={`/profile/${user.uid}`} key={user.uid}>
                    <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-[2.5rem] hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 border-2 border-zinc-900">
                          <AvatarImage src={user.photoURL} />
                          <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-black truncate">{user.displayName}</p>
                            {user.isVerified && <VerificationBadge className="h-4 w-4" />}
                          </div>
                          <p className="text-[10px] text-zinc-600 font-bold uppercase">@{user.email?.split('@')[0]}</p>
                          <p className="text-[9px] text-primary font-black uppercase mt-1 tracking-widest">{user.nationality}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="rounded-full text-zinc-800"><Zap className="h-4 w-4" /></Button>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-24 text-center opacity-20 flex flex-col items-center gap-4">
                  <Users className="h-12 w-12" />
                  <p className="text-xs font-black uppercase tracking-widest">{isRtl ? "لم نجد هذا المواطن" : "No citizens found"}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      <AppSidebar />
    </div>
  );
}
