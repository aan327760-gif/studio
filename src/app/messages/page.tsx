
"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc, getDoc } from "firebase/firestore";
import { useState, useEffect, useMemo } from "react";
import { Loader2, MessageSquare, Search, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function MessagesInboxPage() {
  const { isRtl } = useLanguage();
  const db = useFirestore();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [conversationsWithUsers, setConversationsWithUsers] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);

  // تم إزالة orderBy لتجنب أخطاء الفهارس (Indexes)
  const chatsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, "direct_conversations"),
      where("participants", "array-contains", user.uid)
    );
  }, [db, user]);

  const { data: rawConversations = [], loading: chatsLoading } = useCollection<any>(chatsQuery);

  // ترتيب المحادثات محلياً حسب آخر تحديث
  const sortedConversations = useMemo(() => {
    return [...rawConversations].sort((a, b) => {
      const timeA = a.updatedAt?.seconds || 0;
      const timeB = b.updatedAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [rawConversations]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (sortedConversations.length > 0 && user) {
        setFetching(true);
        const results = [];
        for (const chat of sortedConversations) {
          const otherUserId = chat.participants.find((p: string) => p !== user.uid);
          if (otherUserId) {
            const userDoc = await getDoc(doc(db, "users", otherUserId));
            if (userDoc.exists()) {
              results.push({
                ...chat,
                otherUser: { ...userDoc.data(), id: userDoc.id }
              });
            }
          }
        }
        setConversationsWithUsers(results);
        setFetching(false);
      } else {
        setConversationsWithUsers([]);
      }
    };
    fetchUserData();
  }, [sortedConversations, db, user]);

  const filteredConversations = conversationsWithUsers.filter(c => 
    c.otherUser?.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-900">
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-900 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tighter">{isRtl ? "الرسائل الخاصة" : "Private Messages"}</h1>
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
             <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
          <Input 
            placeholder={isRtl ? "ابحث في المحادثات..." : "Search messages..."} 
            className="pl-12 bg-zinc-900/50 border-zinc-800 rounded-2xl h-12 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {chatsLoading || fetching ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" /></div>
        ) : filteredConversations.length > 0 ? (
          <div className="flex flex-col divide-y divide-zinc-900/50">
            {filteredConversations.map((chat) => (
              <Link href={`/messages/${chat.id}`} key={chat.id}>
                <div className="flex items-center gap-4 p-5 hover:bg-white/[0.02] transition-all active:scale-[0.98]">
                  <Avatar className="h-14 w-14 border-2 border-zinc-900">
                    <AvatarImage src={chat.otherUser.photoURL} />
                    <AvatarFallback>{chat.otherUser.displayName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-black text-sm truncate">{chat.otherUser.displayName}</h3>
                      <span className="text-[9px] text-zinc-600 font-bold uppercase">
                        {chat.updatedAt?.toDate ? chat.updatedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 truncate font-medium">
                      {chat.lastMessage || (isRtl ? "بدء محادثة سيادية..." : "Start a sovereign chat...")}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-40 opacity-20 flex flex-col items-center gap-6">
            <MessageSquare className="h-16 w-16" />
            <p className="text-sm font-black uppercase tracking-widest">{isRtl ? "لا توجد رسائل بعد" : "No Private Messages"}</p>
          </div>
        )}
      </main>

      <AppSidebar />
    </div>
  );
}
