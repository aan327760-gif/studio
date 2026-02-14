
"use client";

import { useEffect } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { Heart, UserPlus, MessageSquare, Repeat2, Settings, Loader2, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, limit, doc, deleteDoc, updateDoc, writeBatch, getDocs } from "firebase/firestore";

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

  // تحديث التنبيهات لتصبح "مقروءة" عند فتح الصفحة
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

  const clearNotification = async (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, "notifications", id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "like": return <Heart className="h-5 w-5 fill-red-500 text-red-500" />;
      case "comment": return <MessageSquare className="h-5 w-5 text-green-500" />;
      case "follow": return <UserPlus className="h-5 w-5 text-primary" />;
      default: return <Repeat2 className="h-5 w-5 text-zinc-500" />;
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
        <h1 className="text-xl font-bold">{isRtl ? "التنبيهات" : "Notifications"}</h1>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full bg-black h-12 rounded-none p-0 border-b border-zinc-900">
          <TabsTrigger value="all" className="flex-1 h-full rounded-none font-bold text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
            {isRtl ? "الكل" : "All"}
          </TabsTrigger>
          <TabsTrigger value="mentions" className="flex-1 h-full rounded-none font-bold text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
            {isRtl ? "الإشارات" : "Mentions"}
          </TabsTrigger>
        </TabsList>

        <main className="pb-24">
          <TabsContent value="all" className="m-0">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : notifications.length > 0 ? (
              <div className="flex flex-col">
                {notifications.map((notif) => (
                  <div key={notif.id} className={cn(
                    "flex items-start gap-4 p-4 border-b border-zinc-900 hover:bg-white/5 transition-colors group",
                    !notif.read && "bg-primary/5"
                  )}>
                    <div className="pt-1">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Avatar className="h-8 w-8 border border-zinc-800">
                        <AvatarImage src={notif.fromUserAvatar} />
                        <AvatarFallback>{notif.fromUserName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <span className="font-bold">{notif.fromUserName}</span>{" "}
                        <span className="text-zinc-400">{getMessage(notif.type, isRtl)}</span>
                      </div>
                      <p className="text-[10px] text-zinc-600">
                        {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString() : ""}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500"
                      onClick={() => clearNotification(notif.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-20 text-center text-zinc-500 text-sm">
                {isRtl ? "لا توجد تنبيهات حالياً" : "No notifications yet"}
              </div>
            )}
          </TabsContent>
          <TabsContent value="mentions" className="p-20 text-center text-zinc-500 text-sm">
             {isRtl ? "لا توجد إشارات حالياً" : "Nothing to see here — yet"}
          </TabsContent>
        </main>
      </Tabs>

      <AppSidebar />
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
