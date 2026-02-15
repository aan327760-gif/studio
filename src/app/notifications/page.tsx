"use client";

import { useEffect } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { Heart, UserPlus, MessageSquare, Repeat2, Settings, Loader2, Trash2, BellOff, Info, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, limit, doc, deleteDoc, writeBatch } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function NotificationsPage() {
  const { isRtl } = useLanguage();
  const db = useFirestore();
  const { user: currentUser } = useUser();

  const notificationsQuery = useMemoFirebase(() => {
    if (!currentUser) return null;
    return query(
      collection(db, "notifications"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  }, [db, currentUser]);

  const { data: notifications, loading } = useCollection<any>(notificationsQuery);

  useEffect(() => {
    const markAllAsRead = async () => {
      if (!currentUser || !db || notifications.length === 0) return;
      
      const unread = notifications.filter(n => !n.read);
      if (unread.length === 0) return;

      const batch = writeBatch(db);
      unread.forEach(notif => {
        batch.update(doc(db, "notifications", notif.id), { read: true });
      });
      await batch.commit();
    };

    markAllAsRead();
  }, [notifications, currentUser, db]);

  const clearAllNotifications = async () => {
    if (!db || !currentUser || notifications.length === 0) return;
    
    if (confirm(isRtl ? "هل تريد مسح جميع التنبيهات؟" : "Clear all notifications?")) {
      const batch = writeBatch(db);
      notifications.forEach(notif => {
        batch.delete(doc(db, "notifications", notif.id));
      });
      await batch.commit();
      toast({ title: isRtl ? "تم المسح" : "Cleared" });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "like": return <Heart className="h-4 w-4 fill-red-500 text-red-500" />;
      case "comment": return <MessageSquare className="h-4 w-4 text-green-500" />;
      case "follow": return <UserPlus className="h-4 w-4 text-primary" />;
      case "system": return <Info className="h-4 w-4 text-primary" />;
      default: return <Repeat2 className="h-4 w-4 text-zinc-500" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-800">
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md px-6 py-5 flex items-center justify-between border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black tracking-tighter">{isRtl ? "التنبيهات" : "Alerts"}</h1>
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="h-2 w-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_#1E6FC9]" />
          )}
        </div>
        <div className="flex items-center gap-1">
          {notifications.length > 0 && (
            <Button variant="ghost" size="icon" onClick={clearAllNotifications} className="text-zinc-500 hover:text-red-500 rounded-full">
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="text-white rounded-full">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full bg-black h-12 rounded-none p-0 border-b border-zinc-900">
          <TabsTrigger value="all" className="flex-1 h-full rounded-none font-black text-[10px] uppercase tracking-widest data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
            {isRtl ? "الكل" : "All Activity"}
          </TabsTrigger>
          <TabsTrigger value="mentions" className="flex-1 h-full rounded-none font-black text-[10px] uppercase tracking-widest data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
            {isRtl ? "رسائل النظام" : "System Messages"}
          </TabsTrigger>
        </TabsList>

        <main className="pb-24 overflow-y-auto">
          <TabsContent value="all" className="m-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Syncing</p>
              </div>
            ) : notifications.length > 0 ? (
              <div className="flex flex-col">
                {notifications.map((notif) => (
                  <div key={notif.id} className={cn(
                    "flex items-start gap-4 p-5 border-b border-zinc-900/50 hover:bg-white/[0.02] transition-colors group relative",
                    !notif.read && "bg-primary/[0.04]"
                  )}>
                    {!notif.read && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary shadow-[0_0_5px_#1E6FC9]" />}
                    <div className="mt-1 bg-zinc-950 p-3 rounded-2xl ring-1 ring-zinc-900 shadow-xl">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {notif.type !== 'system' && (
                          <Avatar className="h-7 w-7 ring-1 ring-zinc-800">
                            <AvatarImage src={notif.fromUserAvatar} />
                            <AvatarFallback>{notif.fromUserName?.[0]}</AvatarFallback>
                          </Avatar>
                        )}
                        <p className="text-sm leading-snug">
                          {notif.type === 'system' ? (
                            <span className="font-black text-primary uppercase tracking-widest text-[10px]">{isRtl ? "بيان سيادي" : "SOVEREIGN ALERT"}</span>
                          ) : (
                            <span className="font-bold">{notif.fromUserName}</span>
                          )}
                        </p>
                      </div>
                      <p className={cn("text-sm", notif.type === 'system' ? "font-bold text-zinc-200" : "text-zinc-400")}>
                         {notif.message || (isRtl ? "تفاعل مع محتواك" : "interacted with you")}
                      </p>
                      <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">
                        {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString(isRtl ? 'ar' : 'en', {hour: '2-digit', minute:'2-digit'}) : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-32 px-10 text-center flex flex-col items-center gap-6 opacity-20">
                <div className="h-20 w-20 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center">
                  <BellOff className="h-10 w-10" />
                </div>
                <p className="text-sm font-black uppercase tracking-widest">{isRtl ? "هدوء تام هنا" : "Total silence here"}</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="mentions" className="m-0">
             {notifications.filter(n => n.type === 'system').length > 0 ? (
               <div className="flex flex-col">
                 {notifications.filter(n => n.type === 'system').map((notif) => (
                   <div key={notif.id} className="p-6 border-b border-zinc-900 bg-primary/[0.02]">
                      <Badge className="bg-primary/20 text-primary border-primary/20 mb-3 text-[8px] font-black tracking-widest">SYSTEM BROADCAST</Badge>
                      <p className="text-sm font-bold leading-relaxed">{notif.message}</p>
                      <p className="text-[10px] text-zinc-600 mt-4 font-black uppercase tracking-widest">
                        {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString() : ""}
                      </p>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="py-40 text-center opacity-20 flex flex-col items-center">
                 <BellOff className="h-12 w-12 mb-4" />
                 <p className="text-xs font-black uppercase tracking-widest">{isRtl ? "لا توجد رسائل رسمية" : "No official alerts"}</p>
               </div>
             )}
          </TabsContent>
        </main>
      </Tabs>

      <AppSidebar />
    </div>
  );
}
