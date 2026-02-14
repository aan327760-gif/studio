
"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { Heart, UserPlus, MessageSquare, Repeat2, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const NOTIFICATIONS = [
  { id: 1, type: "like", user: "Ahmed Salem", avatar: "https://picsum.photos/seed/1/100/100", content: "Liked your post", time: "2h" },
  { id: 2, type: "follow", user: "Sarah K.", avatar: "https://picsum.photos/seed/2/100/100", content: "Started following you", time: "5h" },
  { id: 3, type: "comment", user: "Zaki Dz", avatar: "https://picsum.photos/seed/3/100/100", content: "Commented on your video", time: "1d" },
  { id: 4, type: "repost", user: "Amine", avatar: "https://picsum.photos/seed/4/100/100", content: "Reposted your thought", time: "2d" },
];

export default function NotificationsPage() {
  const { isRtl } = useLanguage();

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
          <TabsTrigger value="verified" className="flex-1 h-full rounded-none font-bold text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
            {isRtl ? "الموثقة" : "Verified"}
          </TabsTrigger>
        </TabsList>

        <main className="pb-24">
          <TabsContent value="all" className="m-0">
            <div className="flex flex-col">
              {NOTIFICATIONS.map((notif) => (
                <div key={notif.id} className="flex gap-4 p-4 border-b border-zinc-900 hover:bg-white/5 transition-colors cursor-pointer">
                  <div className="pt-1">
                    {notif.type === "like" && <Heart className="h-5 w-5 fill-red-500 text-red-500" />}
                    {notif.type === "follow" && <UserPlus className="h-5 w-5 text-primary" />}
                    {notif.type === "comment" && <MessageSquare className="h-5 w-5 text-green-500" />}
                    {notif.type === "repost" && <Repeat2 className="h-5 w-5 text-zinc-500" />}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={notif.avatar} />
                      <AvatarFallback>{notif.user[0]}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <span className="font-bold">{notif.user}</span>{" "}
                      <span className="text-zinc-400">{notif.content}</span>
                    </div>
                    <p className="text-xs text-zinc-500">{notif.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="mentions" className="p-10 text-center text-zinc-500">
             {isRtl ? "لا توجد إشارات حالياً" : "Nothing to see here — yet"}
          </TabsContent>
        </main>
      </Tabs>

      <AppSidebar />
    </div>
  );
}
