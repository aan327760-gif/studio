
"use client";

import { useEffect, useMemo } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { Heart, UserPlus, MessageSquare, Settings, Loader2, Trash2, BellOff, Megaphone, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, where, limit, doc, deleteDoc, writeBatch } from "firebase/firestore";
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
      limit(100)
    );
  }, [db, currentUser]);

  const { data: rawNotifications = [], loading } = useCollection<any>(notificationsQuery);

  const notifications = useMemo(() => {
    return [...rawNotifications].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [rawNotifications]);

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
    if (confirm(isRtl ? "مسح جميع التنبيهات؟" : "Clear all alerts?")) {
      const batch = writeBatch(db);
      notifications.forEach(notif => batch.delete(doc(db, "notifications", notif.id)));
      await batch.commit();
      toast({ title: isRtl ? "تم المسح" : "Cleared" });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "like": return <Heart className="h-4 w-4 fill-red-500 text-red-500" />;
      case "comment": return <MessageSquare className="h-4 w-4 text-emerald-500" />;
      case "follow": return <UserPlus className="h-4 w-4 text-primary" />;
      case "system": return <Megaphone className="h-4 w-4 text-primary animate-bounce" />;
      default: return <Info className="h-4 w-4 text-zinc-500" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-900">
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md px-6 py-5 flex items-center justify-between border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black tracking-tighter">{isRtl ? "التنبيهات" : "Alerts"}</h1>
          {notifications.filter(n => !n.read).length > 0 && (
            <Badge className="bg-primary animate-pulse border-none h-5 px-1.5 min-w-[20px] justify-center text-[10px] font-black">
              {notifications.filter(n => !n.read).length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {notifications.length > 0 && (
            <Button variant="ghost" size="icon" onClick={clearAllNotifications} className="text-zinc-600 hover:text-red-500 rounded-full">
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="text-zinc-400 rounded-full">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full bg-black h-12 rounded-none p-0 border-b border-zinc-900 sticky top-[73px] z-40 backdrop-blur-md">
          <TabsTrigger value="all" className="flex-1 h-full rounded-none font-black text-[10px] uppercase tracking-widest data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
            {isRtl ? "النشاط" : "Activity"}
          </TabsTrigger>
          <TabsTrigger value="official" className="flex-1 h-full rounded-none font-black text-[10px] uppercase tracking-widest data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
            {isRtl ? "رسمي" : "Official"}
          </TabsTrigger>
        </TabsList>

        <main className="pb-24">
          <TabsContent value="all" className="m-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Syncing Alerts</p>
              </div>
            ) : notifications.length > 0 ? (
              <div className="flex flex-col">
                {notifications.map((notif) => (
                  <div key={notif.id} className={cn(
                    "flex items-start gap-4 p-5 border-b border-zinc-900/40 hover:bg-white/[0.02] transition-all relative group",
                    !notif.read && "bg-primary/[0.03]"
                  )}>
                    {!notif.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_#1E6FC9]" />}
                    <div className="mt-1 bg-zinc-950 p-3 rounded-2xl ring-1 ring-zinc-900 shadow-xl group-hover:scale-110 transition-transform">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        {notif.type !== 'system' && (
                          <Avatar className="h-7 w-7 border border-zinc-800">
                            <AvatarImage src={notif.fromUserAvatar} />
                            <AvatarFallback>{notif.fromUserName?.[0]}</AvatarFallback>
                          </Avatar>
                        )}
                        <p className="text-sm font-bold truncate">
                          {notif.type === 'system' ? (
                            <span className="text-primary font-black uppercase tracking-widest text-[10px]">SOVEREIGN COMMAND</span>
                          ) : notif.fromUserName}
                        </p>
                      </div>
                      <p className={cn("text-sm leading-relaxed", notif.type === 'system' ? "font-black text-zinc-100" : "text-zinc-400 font-medium")}>
                         {notif.message}
                      </p>
                      <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">
                        {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString() : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-40 px-10 text-center flex flex-col items-center gap-6 opacity-20">
                <BellOff className="h-16 w-16" />
                <p className="text-sm font-black uppercase tracking-widest">{isRtl ? "لا توجد تنبيهات" : "Zero Alerts"}</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="official" className="m-0">
             {notifications.filter(n => n.type === 'system').length > 0 ? (
               <div className="flex flex-col p-4 gap-4">
                 {notifications.filter(n => n.type === 'system').map((notif) => (
                   <div key={notif.id} className="p-6 bg-zinc-950 border border-primary/20 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-3"><Megaphone className="h-5 w-5 text-primary opacity-20" /></div>
                      <Badge className="bg-primary/20 text-primary border-primary/30 mb-4 text-[8px] font-black tracking-widest">OFFICIAL PROCLAMATION</Badge>
                      <p className="text-[15px] font-black leading-relaxed text-zinc-100">{notif.message}</p>
                      <p className="text-[9px] text-zinc-600 mt-6 font-black uppercase tracking-widest">
                        {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString() : ""}
                      </p>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="py-40 text-center opacity-20 flex flex-col items-center gap-4">
                 <Megaphone className="h-16 w-16" />
                 <p className="text-xs font-black uppercase tracking-widest">{isRtl ? "لا توجد بيانات رسمية" : "No official records"}</p>
               </div>
             )}
          </TabsContent>
        </main>
      </Tabs>

      <AppSidebar />
    </div>
  );
}
