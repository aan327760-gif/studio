
"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft, Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useCollection, useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, doc, updateDoc, arrayUnion, increment } from "firebase/firestore";
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
  const { data: group, isLoading: groupLoading } = useDoc<any>(groupRef);

  const isMember = group?.members?.includes(user?.uid);

  const currentUserProfileRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<any>(currentUserProfileRef);
  const isBanned = profile?.isBannedUntil && profile.isBannedUntil.toDate() > new Date();

  const messagesQuery = useMemoFirebase(() => {
    if (!groupId || !isMember) return null;
    return query(
      collection(db, "groups", groupId as string, "messages"),
      orderBy("createdAt", "asc"),
      limit(100)
    );
  }, [db, groupId, isMember]);

  const { data: rawMessages, isLoading: messagesLoading } = useCollection<any>(messagesQuery);
  const messages = rawMessages || [];

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = () => {
    if (isBanned || !isMember) return;
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

  const handleJoin = async () => {
    if (!user || !groupId) return;
    try {
      await updateDoc(doc(db, "groups", groupId as string), {
        members: arrayUnion(user.uid),
        memberCount: increment(1)
      });
      toast({ title: isRtl ? "تم الانضمام بنجاح" : "Successfully Joined" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  if (groupLoading) {
    return <div className="h-screen bg-black flex items-center justify-center text-white"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-900">
      <header className="p-4 border-b border-zinc-900 bg-black/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}><ArrowLeft className={cn("h-5 w-5", isRtl ? "rotate-180" : "")} /></Button>
          <Avatar className="h-10 w-10 ring-1 ring-zinc-800">
            <AvatarImage src={`https://picsum.photos/seed/${groupId}/100/100`} />
            <AvatarFallback>G</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h2 className="font-black text-sm truncate max-w-[150px] tracking-tight">{group?.name || "Lamma"}</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{group?.memberCount || 0} Members</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col">
        {!isMember ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-6">
             <div className="h-24 w-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center border border-primary/20">
                <UserPlus className="h-10 w-10 text-primary" />
             </div>
             <div className="space-y-2">
                <h3 className="text-xl font-black">{isRtl ? "انضم إلى هذه اللمة" : "Join this Lamma"}</h3>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed">{isRtl ? "تحتاج للانضمام للمجموعة لتتمكن من قراءة الرسائل والمشاركة في النقاش السيادي." : "You need to join to read messages and participate in sovereign discussion."}</p>
             </div>
             <Button className="w-full h-14 rounded-2xl bg-white text-black font-black text-lg shadow-xl" onClick={handleJoin}>
                {isRtl ? "انضم الآن" : "Join Now"}
             </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="flex flex-col gap-3 pb-6">
                <div className="py-10 text-center opacity-30">
                   <div className="w-16 h-16 bg-zinc-900 rounded-3xl mx-auto flex items-center justify-center mb-4"><ShieldCheck className="h-8 w-8 text-primary" /></div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em]">{isRtl ? "محادثة مشفرة سيادياً" : "Sovereign Encrypted Chat"}</p>
                </div>

                {messages.map((msg: any, index) => {
                  const isMe = msg.senderId === user?.uid;
                  const showAvatar = index === 0 || messages[index - 1]?.senderId !== msg.senderId;
                  return (
                    <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start", !showAvatar && "mt-[-8px]")}>
                      {showAvatar && !isMe && <p className="text-[9px] font-black text-zinc-600 mb-1 ml-11 uppercase tracking-tighter">{msg.senderName}</p>}
                      <div className={cn("flex gap-2 max-w-[85%]", isMe ? "flex-row-reverse" : "flex-row")}>
                        {!isMe && showAvatar ? <Avatar className="h-8 w-8 ring-1 ring-zinc-800 self-end"><AvatarImage src={msg.senderAvatar} /><AvatarFallback>U</AvatarFallback></Avatar> : !isMe && <div className="w-8" />}
                        <div className={cn("p-3.5 text-sm font-medium shadow-sm transition-all", isMe ? "bg-primary text-white rounded-2xl rounded-tr-none" : "bg-zinc-900 text-zinc-100 rounded-2xl rounded-tl-none border border-white/5")}>{msg.text}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <footer className="p-4 border-t border-zinc-900 bg-black/80 backdrop-blur-xl">
              {isBanned ? (
                <div className="bg-red-500/10 p-4 rounded-3xl flex items-center justify-center gap-3 text-red-500 text-[10px] font-black border border-red-500/20">{isRtl ? "لا يمكنك إرسال رسائل حالياً" : "Messaging disabled"}</div>
              ) : (
                <div className="flex gap-2 items-center bg-zinc-900/50 rounded-full pl-5 pr-1.5 py-1.5 border border-white/5">
                  <Input placeholder={isRtl ? "اكتب رسالة..." : "Type a message..."} className="bg-transparent border-none h-10 text-sm focus-visible:ring-0 shadow-none p-0" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} />
                  <Button size="icon" className="rounded-full bg-primary h-10 w-10 shrink-0" onClick={handleSend} disabled={!newMessage.trim()}><Send className={cn("h-4 w-4", isRtl ? "rotate-180" : "")} /></Button>
                </div>
              )}
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
