
"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft, Users, Shield, Loader2 } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useCollection, useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, doc } from "firebase/firestore";

export default function ChatGroupPage() {
  const { groupId } = useParams();
  const router = useRouter();
  const { isRtl } = useLanguage();
  const db = useFirestore();
  const { user } = useUser();
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch Group Info
  const groupRef = useMemoFirebase(() => groupId ? doc(db, "groups", groupId as string) : null, [db, groupId]);
  const { data: group, loading: groupLoading } = useDoc<any>(groupRef);

  // Fetch Messages
  const messagesQuery = useMemoFirebase(() => {
    if (!groupId) return null;
    return query(
      collection(db, "groups", groupId as string, "messages"),
      orderBy("createdAt", "asc"),
      limit(100)
    );
  }, [db, groupId]);

  const { data: messages, loading: messagesLoading } = useCollection<any>(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || !user || !groupId) return;
    
    const messageData = {
      senderId: user.uid,
      senderName: user.displayName || "User",
      senderAvatar: user.photoURL || "",
      text: newMessage,
      createdAt: serverTimestamp(),
    };

    addDoc(collection(db, "groups", groupId as string, "messages"), messageData);
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
    <div className="flex flex-col md:flex-row h-screen max-w-7xl mx-auto overflow-hidden bg-black">
      <AppSidebar />
      
      <main className="flex-1 bg-black border-x border-zinc-900 flex flex-col h-full text-white">
        <header className="p-4 border-b border-zinc-900 bg-black/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10" onClick={() => router.back()}>
              <ArrowLeft className={isRtl ? "rotate-180" : ""} />
            </Button>
            <Avatar className="h-10 w-10 border border-zinc-800">
              <AvatarImage src={`https://picsum.photos/seed/${groupId}/100/100`} />
              <AvatarFallback>{group?.name?.[0] || "G"}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-bold text-lg leading-none truncate max-w-[150px]">{group?.name || "Chat Group"}</h2>
              <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                <Users className="h-3 w-3" /> {group?.memberCount || 0} members
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-zinc-400">
            <Shield className="h-4 w-4" />
          </Button>
        </header>

        <ScrollArea className="flex-1 p-4 bg-zinc-950/50" ref={scrollRef}>
          <div className="flex flex-col gap-4 max-w-3xl mx-auto">
            {messages.map((msg: any) => {
              const isMe = msg.senderId === user?.uid;
              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  {!isMe && <span className="text-[10px] text-zinc-500 mb-1 ml-2">{msg.senderName}</span>}
                  <div className={`max-w-[80%] p-3 rounded-2xl shadow-lg text-sm ${
                    isMe 
                      ? "bg-primary text-white rounded-tr-none" 
                      : "bg-zinc-900 text-zinc-200 rounded-tl-none border border-zinc-800"
                  }`}>
                    {msg.text}
                    <p className={`text-[9px] mt-1 text-right opacity-60`}>
                      {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-zinc-900 bg-black sticky bottom-0">
          <div className="flex gap-2 max-w-3xl mx-auto items-center">
            <Input 
              placeholder={isRtl ? "اكتب رسالة..." : "Type a message..."} 
              className="rounded-full bg-zinc-900 border-none h-11 text-sm focus-visible:ring-1 focus-visible:ring-primary"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <Button 
              size="icon" 
              className="rounded-full h-11 w-11 shrink-0 bg-primary hover:bg-primary/90" 
              onClick={handleSend}
            >
              <Send className={`h-5 w-5 ${isRtl ? "rotate-180" : ""}`} />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
