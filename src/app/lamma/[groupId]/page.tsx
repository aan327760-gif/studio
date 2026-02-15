
"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft, Users, Shield, Loader2, Info, MoreVertical } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useCollection, useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, doc } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function ChatGroupPage() {
  const { groupId } = useParams();
  const router = useRouter();
  const { isRtl } = useLanguage();
  const db = useFirestore();
  const { user } = useUser();
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // جلب معلومات المجموعة
  const groupRef = useMemoFirebase(() => groupId ? doc(db, "groups", groupId as string) : null, [db, groupId]);
  const { data: group, loading: groupLoading } = useDoc<any>(groupRef);

  // جلب الرسائل بترتيب زمني
  const messagesQuery = useMemoFirebase(() => {
    if (!groupId) return null;
    return query(
      collection(db, "groups", groupId as string, "messages"),
      orderBy("createdAt", "asc"),
      limit(100)
    );
  }, [db, groupId]);

  const { data: messages, loading: messagesLoading } = useCollection<any>(messagesQuery);

  // تمرير تلقائي لآخر رسالة
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
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
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-900">
      <header className="p-4 border-b border-zinc-900 bg-black/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10" onClick={() => router.back()}>
            <ArrowLeft className={cn("h-5 w-5", isRtl ? "rotate-180" : "")} />
          </Button>
          <Avatar className="h-10 w-10 ring-1 ring-zinc-800 ring-offset-1 ring-offset-black">
            <AvatarImage src={`https://picsum.photos/seed/${groupId}/100/100`} />
            <AvatarFallback>{group?.name?.[0] || "G"}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h2 className="font-bold text-sm truncate max-w-[120px]">{group?.name || "Lamma"}</h2>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <p className="text-[10px] text-zinc-500">{group?.memberCount || 0} {isRtl ? "عضو" : "members"}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full text-zinc-400">
            <Shield className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full text-zinc-400">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="flex flex-col gap-4 pb-4">
            {messagesLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-zinc-800" /></div>
            ) : messages.length > 0 ? (
              messages.map((msg: any, index) => {
                const isMe = msg.senderId === user?.uid;
                const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId;
                
                return (
                  <div 
                    key={msg.id} 
                    className={cn(
                      "flex gap-2 max-w-[85%]",
                      isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    {!isMe && (
                      <div className="w-8 shrink-0">
                        {showAvatar && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={msg.senderAvatar} />
                            <AvatarFallback>{msg.senderName?.[0]}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}
                    <div className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                      {showAvatar && !isMe && (
                        <span className="text-[10px] text-zinc-500 mb-1 ml-1">{msg.senderName}</span>
                      )}
                      <div className={cn(
                        "p-3 text-sm shadow-md",
                        isMe 
                          ? "bg-primary text-white rounded-2xl rounded-tr-none" 
                          : "bg-zinc-900 text-zinc-200 rounded-2xl rounded-tl-none border border-zinc-800"
                      )}>
                        {msg.text}
                        <div className={cn(
                          "text-[9px] mt-1 opacity-50 text-right",
                          isMe ? "text-white/80" : "text-zinc-500"
                        )}>
                          {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center px-10">
                <Users className="h-16 w-16 mb-4" />
                <p className="text-sm font-bold">{isRtl ? "ابدأ النقاش في هذه اللمة" : "Start the discussion in this Lamma"}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <footer className="p-4 border-t border-zinc-900 bg-black/50 backdrop-blur-md">
          <div className="flex gap-2 items-center bg-zinc-900 rounded-2xl px-2 py-1 border border-zinc-800 focus-within:border-primary transition-colors">
            <Input 
              placeholder={isRtl ? "اكتب رسالة..." : "Type a message..."} 
              className="bg-transparent border-none h-10 text-sm focus-visible:ring-0 shadow-none"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <Button 
              size="icon" 
              disabled={!newMessage.trim()}
              className="rounded-xl h-9 w-9 shrink-0 bg-primary hover:bg-primary/90 text-white disabled:opacity-30" 
              onClick={handleSend}
            >
              <Send className={cn("h-4 w-4", isRtl ? "rotate-180" : "")} />
            </Button>
          </div>
        </footer>
      </main>
    </div>
  );
}
