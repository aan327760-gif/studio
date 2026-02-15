
"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft, Loader2, ShieldCheck, MoreVertical, Lock, ChevronDown } from "lucide-react";
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
  const [showScrollDown, setShowScrollDown] = useState(false);
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
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
      }
    }
  };

  const handleScroll = (e: any) => {
    const target = e.target;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
    setShowScrollDown(!isAtBottom);
  };

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

  const formatMessageDate = (date: Date) => {
    return date.toLocaleDateString(isRtl ? 'ar-EG' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).toUpperCase();
  };

  if (chatLoading) {
    return <div className="h-screen bg-black flex items-center justify-center text-white"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-900 overflow-hidden">
      {/* Header */}
      <header className="p-4 border-b border-zinc-900 bg-black/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-zinc-900" onClick={() => router.back()}>
            <ArrowLeft className={cn("h-6 w-6", isRtl ? "rotate-180" : "")} />
          </Button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 ring-1 ring-zinc-800">
                <AvatarImage src={otherUser?.photoURL} />
                <AvatarFallback>{otherUser?.displayName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-black" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-black text-[15px] truncate max-w-[150px] tracking-tight">{otherUser?.displayName || "Citizen"}</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{isRtl ? "نشط الآن" : "Active now"}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full text-zinc-400 h-10 w-10 hover:bg-zinc-900"><MoreVertical className="h-5 w-5" /></Button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        <ScrollArea className="flex-1" ref={scrollRef} onScroll={handleScroll}>
          <div className="flex flex-col gap-1 p-4 pb-10">
            {messages.map((msg: any, index: number) => {
              const isMe = msg.senderId === user?.uid;
              const msgDate = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date();
              
              // عرض فاصل زمني إذا كان الفرق بين الرسائل كبيراً (أكثر من ساعة)
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const prevDate = prevMsg?.createdAt?.toDate ? prevMsg.createdAt.toDate() : null;
              const showTimeSeparator = !prevDate || (msgDate.getTime() - prevDate.getTime() > 3600000);

              return (
                <div key={msg.id} className="flex flex-col">
                  {showTimeSeparator && (
                    <div className="py-8 flex justify-center">
                      <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest bg-zinc-950 px-3 py-1 rounded-full border border-zinc-900">
                        {formatMessageDate(msgDate)}
                      </span>
                    </div>
                  )}
                  
                  <div className={cn(
                    "flex items-end gap-2 mb-1 animate-in fade-in duration-300",
                    isMe ? "justify-end" : "justify-start"
                  )}>
                    {!isMe && (
                      <Avatar className="h-7 w-7 ring-1 ring-zinc-900 mb-0.5 shrink-0">
                        <AvatarImage src={otherUser?.photoURL} />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={cn(
                      "p-3.5 text-[15px] font-medium shadow-sm max-w-[75%] leading-snug break-words", 
                      isMe 
                        ? "bg-primary text-white rounded-3xl rounded-tr-sm" 
                        : "bg-zinc-800 text-zinc-100 rounded-3xl rounded-tl-sm"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {showScrollDown && (
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={scrollToBottom}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 h-10 w-10 rounded-full shadow-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all z-10"
          >
            <ChevronDown className="h-6 w-6" />
          </Button>
        )}
      </main>

      {/* Input Footer */}
      <footer className="p-4 border-t border-zinc-900 bg-black">
        {!isFriend ? (
          <div className="p-4 bg-red-500/10 rounded-[2rem] border border-red-500/20 text-center space-y-2 animate-in slide-in-from-bottom-4">
             <div className="flex justify-center mb-1"><Lock className="h-4 w-4 text-red-500" /></div>
             <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
               {isRtl ? "المراسلة للأصدقاء فقط" : "Messages restricted to friends"}
             </p>
             <p className="text-[8px] font-bold text-zinc-500 uppercase">
               {isRtl ? "يجب أن تكون المتابعة متبادلة لإرسال الرسائل" : "Mutual follow required to send messages"}
             </p>
          </div>
        ) : (
          <div className="flex gap-3 items-center">
            <div className="flex-1 flex gap-3 items-center bg-zinc-900 rounded-full pl-5 pr-1.5 py-1.5 border border-zinc-800/50 shadow-inner group focus-within:ring-1 focus-within:ring-primary/30 transition-all">
              <Input 
                placeholder={isRtl ? "اكتب رسالة..." : "Type a message..."} 
                className="bg-transparent border-none h-9 text-[15px] focus-visible:ring-0 shadow-none p-0 placeholder:text-zinc-600" 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
                onKeyDown={(e) => e.key === "Enter" && handleSend()} 
              />
              <Button 
                size="icon" 
                className={cn(
                  "rounded-full h-9 w-9 shrink-0 shadow-lg transition-all",
                  newMessage.trim() ? "bg-primary text-white scale-100" : "bg-zinc-800 text-zinc-600 scale-90"
                )} 
                onClick={handleSend} 
                disabled={!newMessage.trim()}
              >
                <Send className={cn("h-4 w-4", isRtl ? "rotate-180" : "")} />
              </Button>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}
