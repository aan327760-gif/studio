
"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft, Loader2, ShieldCheck, MoreVertical, Lock } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useCollection, useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, doc, updateDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export default function DirectChatRoomPage() {
  const { chatId } = useParams();
  const router = useRouter();
  const { isRtl } = useLanguage();
  const db = useFirestore();
  const { user } = useUser();
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatRef = useMemoFirebase(() => chatId ? doc(db, "direct_conversations", chatId as string) : null, [db, chatId]);
  const { data: chat, loading: chatLoading } = useDoc<any>(chatRef);

  const otherUserId = chat?.participants?.find((p: string) => p !== user?.uid);
  const otherUserRef = useMemoFirebase(() => otherUserId ? doc(db, "users", otherUserId) : null, [db, otherUserId]);
  const { data: otherUser } = useDoc<any>(otherUserRef);

  // فحص علاقة الصداقة (المتابعة المتبادلة)
  const followId = user && otherUserId ? `${user.uid}_${otherUserId}` : null;
  const followRef = useMemoFirebase(() => followId ? doc(db, "follows", followId) : null, [db, followId]);
  const { data: followDoc } = useDoc<any>(followRef);

  const reverseFollowId = user && otherUserId ? `${otherUserId}_${user.uid}` : null;
  const reverseFollowRef = useMemoFirebase(() => reverseFollowId ? doc(db, "follows", reverseFollowId) : null, [db, reverseFollowId]);
  const { data: reverseFollowDoc } = useDoc<any>(reverseFollowRef);

  const isFriend = !!followDoc && !!reverseFollowDoc;

  const messagesQuery = useMemoFirebase(() => {
    if (!chatId) return null;
    return query(
      collection(db, "direct_conversations", chatId as string, "messages"),
      orderBy("createdAt", "asc"),
      limit(100)
    );
  }, [db, chatId]);

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
    if (!isFriend) {
      toast({ variant: "destructive", title: isRtl ? "المراسلة للأصدقاء فقط" : "Friends only" });
      return;
    }
    if (!newMessage.trim() || !user || !chatId) return;
    
    const msgData = {
      senderId: user.uid,
      senderName: user.displayName || "User",
      senderAvatar: user.photoURL || "",
      text: newMessage,
      createdAt: serverTimestamp(),
    };

    addDoc(collection(db, "direct_conversations", chatId as string, "messages"), msgData);
    
    updateDoc(doc(db, "direct_conversations", chatId as string), {
      lastMessage: newMessage,
      updatedAt: serverTimestamp()
    });

    setNewMessage("");
  };

  if (chatLoading) {
    return <div className="h-screen bg-black flex items-center justify-center text-white"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-900">
      <header className="p-4 border-b border-zinc-900 bg-black/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}><ArrowLeft className={cn("h-5 w-5", isRtl ? "rotate-180" : "")} /></Button>
          <Avatar className="h-10 w-10 ring-1 ring-zinc-800">
            <AvatarImage src={otherUser?.photoURL} />
            <AvatarFallback>{otherUser?.displayName?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h2 className="font-black text-sm truncate max-w-[150px] tracking-tight">{otherUser?.displayName || "Citizen"}</h2>
            <div className="flex items-center gap-1">
               <ShieldCheck className="h-2.5 w-2.5 text-primary" />
               <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">{isRtl ? "تواصل مشفر سيادياً" : "Sovereign Encrypted Chat"}</p>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full text-zinc-600"><MoreVertical className="h-5 w-5" /></Button>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="flex flex-col gap-3 pb-6">
            <div className="py-10 text-center opacity-30">
               <div className="w-16 h-16 bg-zinc-900 rounded-3xl mx-auto flex items-center justify-center mb-4"><ShieldCheck className="h-8 w-8 text-primary" /></div>
               <p className="text-[9px] font-black uppercase tracking-[0.3em]">{isRtl ? "هذه المحادثة محمية سيادياً" : "Sovereign Protected Discussion"}</p>
            </div>

            {messages.map((msg: any, index) => {
              const isMe = msg.senderId === user?.uid;
              return (
                <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                  <div className={cn(
                    "p-3.5 text-sm font-medium shadow-xl max-w-[85%] transition-all", 
                    isMe ? "bg-primary text-white rounded-2xl rounded-tr-none" : "bg-zinc-900 text-zinc-100 rounded-2xl rounded-tl-none border border-white/5"
                  )}>
                    {msg.text}
                  </div>
                  <span className="text-[8px] text-zinc-700 mt-1 font-black px-1">
                    {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <footer className="p-4 border-t border-zinc-900 bg-black/80 backdrop-blur-xl">
          {!isFriend ? (
            <div className="p-4 bg-red-500/10 rounded-[1.5rem] border border-red-500/20 text-center space-y-2">
               <div className="flex justify-center mb-1"><Lock className="h-4 w-4 text-red-500" /></div>
               <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                 {isRtl ? "المراسلة للأصدقاء فقط" : "Messages restricted to friends"}
               </p>
               <p className="text-[8px] font-bold text-zinc-500 uppercase">
                 {isRtl ? "يجب أن تكون المتابعة متبادلة لإرسال الرسائل" : "Mutual follow required to send messages"}
               </p>
            </div>
          ) : (
            <div className="flex gap-2 items-center bg-zinc-900/50 rounded-full pl-5 pr-1.5 py-1.5 border border-white/5 shadow-inner">
              <Input 
                placeholder={isRtl ? "اكتب رسالة خاصة..." : "Type a private message..."} 
                className="bg-transparent border-none h-10 text-sm focus-visible:ring-0 shadow-none p-0" 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
                onKeyDown={(e) => e.key === "Enter" && handleSend()} 
              />
              <Button size="icon" className="rounded-full bg-primary h-10 w-10 shrink-0 shadow-lg" onClick={handleSend} disabled={!newMessage.trim()}>
                <Send className={cn("h-4 w-4", isRtl ? "rotate-180" : "")} />
              </Button>
            </div>
          )}
        </footer>
      </main>
    </div>
  );
}
