
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft, Users, Shield } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// This would ideally come from Firestore
const MOCK_MESSAGES = [
  { id: "1", sender: "Ahmed", text: "السلام عليكم جميعاً", time: "10:00 AM", isMe: false },
  { id: "2", sender: "Me", text: "وعليكم السلام يا أحمد، كيف الحال؟", time: "10:02 AM", isMe: true },
  { id: "3", sender: "Sarah", text: "The new Lamma layout looks great!", time: "10:05 AM", isMe: false },
];

export default function ChatGroupPage() {
  const { groupId } = useParams();
  const { t, isRtl } = useLanguage();
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg = {
      id: Date.now().toString(),
      sender: "Me",
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };
    setMessages([...messages, msg]);
    setNewMessage("");
  };

  return (
    <div className="flex flex-col md:flex-row h-screen max-w-7xl mx-auto overflow-hidden">
      <AppSidebar />
      
      <main className="flex-1 bg-background border-x flex flex-col h-full">
        <header className="p-4 border-b bg-white flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <Link href="/lamma">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className={isRtl ? "rotate-180" : ""} />
              </Button>
            </Link>
            <Avatar className="h-10 w-10">
              <AvatarImage src={`https://picsum.photos/seed/${groupId}/100/100`} />
              <AvatarFallback>G</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-bold text-lg leading-none">Group Chat #{groupId}</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Users className="h-3 w-3" /> 1.2k members
              </p>
            </div>
          </div>
          <Button variant="outline" size="icon" className="rounded-full">
            <Shield className="h-4 w-4" />
          </Button>
        </header>

        <ScrollArea className="flex-1 p-4 bg-[#f8fafc]" ref={scrollRef}>
          <div className="flex flex-col gap-4 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}
              >
                {!msg.isMe && <span className="text-[10px] text-muted-foreground mb-1 ml-2">{msg.sender}</span>}
                <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm text-sm ${
                  msg.isMe 
                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                    : "bg-white text-foreground rounded-tl-none"
                }`}>
                  {msg.text}
                  <p className={`text-[10px] mt-1 text-right opacity-70`}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-white sticky bottom-0">
          <div className="flex gap-2 max-w-3xl mx-auto items-center">
            <Input 
              placeholder={isRtl ? "اكتب رسالة..." : "Type a message..."} 
              className="rounded-full bg-muted/50 border-none h-11"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <Button 
              size="icon" 
              className="rounded-full h-11 w-11 shrink-0" 
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
