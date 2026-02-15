
"use client";

import { useEffect } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { Heart, UserPlus, MessageSquare, Repeat2, Settings, Loader2, Trash2, CheckCheck, BellOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, limit, doc, deleteDoc, writeBatch, getDocs } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

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
      default: return <Repeat2 className="h-4 w-4 text-zinc-500" />;
    }
  };

  const getMessage = (type: string, isAr: boolean) => {
    switch (type) {
      case "like": return isAr ? "أعجب بمنشورك" : "liked your post";
      case "comment": return isAr ? "علق على منشورك" : "commented on your post";
      case "follow": return isAr ? "بدأ بمتابعتك" : "started following you";
      default: return isAr ? "تفاعل معك" : "interacted with you";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-800">
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-black tracking-tight">{isRtl ? "التنبيهات" : "Alerts"}</h1>
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="h-2 w-2 bg-primary rounded-full animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-1">
          {notifications.length > 0 && (
            <Button variant="ghost" size="icon" onClick={clearAllNotifications} className="text-zinc-500 hover:text-red-500">
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="text-white">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full bg-black h-12 rounded-none p-0 border-b border-zinc-900">
          <TabsTrigger value="all" className="flex-1 h-full rounded-none font-bold text-[10px] uppercase tracking-widest data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
            {isRtl ? "الكل" : "All Activity"}
          </TabsTrigger>
          <TabsTrigger value="mentions" className="flex-1 h-full rounded-none font-bold text-[10px] uppercase tracking-widest data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
            {isRtl ? "الإشارات" : "Mentions"}
          </TabsTrigger>
        </TabsList>

        <main className="pb-24">
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
                    "flex items-start gap-4 p-4 border-b border-zinc-900/50 hover:bg-white/[0.02] transition-colors group relative",
                    !notif.read && "bg-primary/[0.03]"
                  )}>
                    {!notif.read && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />}
                    <div className="mt-1 bg-zinc-900 p-2 rounded-xl">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 ring-1 ring-zinc-800">
                          <AvatarImage src={notif.fromUserAvatar} />
                          <AvatarFallback>{notif.fromUserName?.[0]}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm">
                          <span className="font-bold">{notif.fromUserName}</span>{" "}
                          <span className="text-zinc-500">{getMessage(notif.type, isRtl)}</span>
                        </p>
                      </div>
                      <p className="text-[10px] text-zinc-600 font-medium">
                        {notif.createdAt?.toDate ? new Intl.RelativeTimeFormat(isRtl ? 'ar' : 'en', { numeric: 'auto' }).format(
                          Math.floor((notif.createdAt.toDate().getTime() - Date.now()) / 60000), 'minute'
                        ) : ""}
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
                <p className="text-sm font-bold tracking-tight">{isRtl ? "هدوء تام هنا" : "Total silence here"}</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="mentions" className="py-32 text-center opacity-20">
             <CheckCheck className="h-12 w-12 mx-auto mb-4" />
             <p className="text-xs font-bold uppercase tracking-widest">{isRtl ? "لا توجد إشارات" : "No mentions found"}</p>
          </TabsContent>
        </main>
      </Tabs>

      <AppSidebar />
    </div>
  );
}
