
"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft, Users, Shield, Loader2, Info, MoreVertical, Ban } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useCollection, useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export default function ChatGroupPage() {
  const { groupId } = useParams();
  const router = useRouter();
  const { isRtl } = useLanguage();
  const db = useFirestore();
  const { user } = useUser();
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const groupRef = useMemoFirebase(() => groupId ? doc(db, "groups", groupId as string) : null, [db, groupId]);
  const { data: group, loading: groupLoading } = useDoc<any>(groupRef);

  const currentUserProfileRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<any>(currentUserProfileRef);
  const isBanned = profile?.isBannedUntil && profile.isBannedUntil.toDate() > new Date();

  const messagesQuery = useMemoFirebase(() => {
    if (!groupId) return null;
    return query(
      collection(db, "groups", groupId as string, "messages"),
      orderBy("createdAt", "asc"),
      limit(100)
    );
  }, [db, groupId]);

  const { data: messages = [], loading: messagesLoading } = useCollection<any>(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = () => {
    if (isBanned) {
      toast({ variant: "destructive", title: isRtl ? "موقوف" : "Banned" });
      return;
    }
    if (!newMessage.trim() || !user || !groupId) return;
    
    addDoc(collection(db, "groups", groupId as string, "messages"), {
      senderId: user.uid,
      senderName: user.displayName || "User",
      senderAvatar: user.photoURL || "",
      text: newMessage,
      createdAt: serverTimestamp(),
    });
    setNewMessage("");
  };

  if (groupLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-900">
      <header className="p-4 border-b border-zinc-900 bg-black/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
            <ArrowLeft className={cn("h-5 w-5", isRtl ? "rotate-180" : "")} />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={`https://picsum.photos/seed/${groupId}/100/100`} />
            <AvatarFallback>{group?.name?.[0] || "G"}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h2 className="font-bold text-sm truncate max-w-[120px]">{group?.name || "Lamma"}</h2>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="flex flex-col gap-4 pb-4">
            {messages.map((msg: any, index) => {
              const isMe = msg.senderId === user?.uid;
              return (
                <div key={msg.id} className={cn("flex gap-2 max-w-[85%]", isMe ? "ml-auto flex-row-reverse" : "mr-auto")}>
                  <div className={cn("p-3 text-sm rounded-2xl", isMe ? "bg-primary text-white" : "bg-zinc-900 text-zinc-200")}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <footer className="p-4 border-t border-zinc-900 bg-black/50 backdrop-blur-md">
          {isBanned ? (
            <div className="bg-red-500/10 p-3 rounded-2xl flex items-center justify-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-500/20">
              <Ban className="h-4 w-4" />
              {isRtl ? "لا يمكنك إرسال رسائل حالياً بسبب الحظر" : "Messaging disabled due to restriction"}
            </div>
          ) : (
            <div className="flex gap-2 items-center bg-zinc-900 rounded-2xl px-2 py-1 border border-zinc-800">
              <Input 
                placeholder={isRtl ? "اكتب رسالة..." : "Type a message..."} 
                className="bg-transparent border-none h-10 text-sm focus-visible:ring-0 shadow-none"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <Button size="icon" className="rounded-xl bg-primary h-9 w-9" onClick={handleSend} disabled={!newMessage.trim()}>
                <Send className={cn("h-4 w-4", isRtl ? "rotate-180" : "")} />
              </Button>
            </div>
          )}
        </footer>
      </main>
    </div>
  );
}
