
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { 
  collection, 
  query, 
  limit, 
  deleteDoc, 
  doc, 
  updateDoc, 
  Timestamp,
  where,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { 
  ArrowLeft,
  Loader2,
  Search,
  Ban,
  Users,
  MessageSquare,
  AlertTriangle,
  Activity,
  Megaphone,
  Star,
  CheckCircle,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  MoreVertical,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const SUPER_ADMIN_EMAIL = "adelbenmaza3@gmail.com";

export default function AdminDashboard() {
  const { user, loading: userLoading } = useUser();
  const { isRtl } = useLanguage();
  const router = useRouter();
  const db = useFirestore();

  const [searchQuery, setSearchQuery] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const isSuper = user?.email === SUPER_ADMIN_EMAIL;

  useEffect(() => {
    if (!userLoading && !isSuper && user) {
      router.replace("/");
    }
  }, [user, userLoading, router, isSuper]);

  const usersQuery = useMemoFirebase(() => isSuper ? query(collection(db, "users"), limit(100)) : null, [db, isSuper]);
  const { data: allUsers = [], loading: usersLoading } = useCollection<any>(usersQuery);
  
  const reportsQuery = useMemoFirebase(() => isSuper ? query(collection(db, "reports"), where("status", "==", "pending"), limit(50)) : null, [db, isSuper]);
  const { data: reports = [], loading: reportsLoading } = useCollection<any>(reportsQuery);

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim() || !isSuper) return;
    setIsBroadcasting(true);
    try {
      const batch = writeBatch(db);
      // بث للمواطنين الموجودين في القائمة (MVP)
      allUsers.forEach((member: any) => {
        const notifRef = doc(collection(db, "notifications"));
        batch.set(notifRef, {
          userId: member.id,
          type: "system",
          fromUserName: "UNBOUND COMMAND",
          message: broadcastMessage,
          read: false,
          createdAt: serverTimestamp()
        });
      });
      await batch.commit();
      toast({ title: isRtl ? "تم إرسال البيان السيادي" : "Sovereign Proclamation Sent" });
      setBroadcastMessage("");
    } catch (error) {
      toast({ variant: "destructive", title: "Broadcast Failed" });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleToggleVerify = async (userId: string, current: boolean) => {
    await updateDoc(doc(db, "users", userId), { isVerified: !current });
    toast({ title: isRtl ? "تم تحديث التوثيق" : "Verification Updated" });
  };

  const handleTogglePro = async (userId: string, current: boolean) => {
    await updateDoc(doc(db, "users", userId), { isPro: !current });
    toast({ title: isRtl ? "تم تحديث رتبة الإعلام" : "Media Rank Updated" });
  };

  if (userLoading) {
    return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!isSuper) return null;

  return (
    <div className="min-h-screen bg-black text-white max-w-md mx-auto border-x border-zinc-900 pb-24 selection:bg-primary/30">
      <header className="p-6 border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-zinc-900 h-10 w-10">
            <ArrowLeft className={cn("h-5 w-5", isRtl ? "rotate-180" : "")} />
          </Button>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase">{isRtl ? "غرفة العمليات" : "War Room"}</h1>
            <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black tracking-widest mt-0.5">ROOT ACCESS</Badge>
          </div>
        </div>
        <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
           <ShieldAlert className="h-5 w-5 text-primary" />
        </div>
      </header>

      <main className="p-4 space-y-8">
        <div className="grid grid-cols-2 gap-3">
           <Card className="bg-zinc-950 border-zinc-900 shadow-xl p-4 flex flex-col items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-[9px] font-black text-zinc-500 uppercase">{isRtl ? "المواطنين" : "Citizens"}</span>
              <span className="text-xl font-black">{allUsers.length}</span>
           </Card>
           <Card className="bg-zinc-950 border-zinc-900 shadow-xl p-4 flex flex-col items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-[9px] font-black text-zinc-500 uppercase">{isRtl ? "التهديدات" : "Threats"}</span>
              <span className="text-xl font-black">{reports.length}</span>
           </Card>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="w-full bg-zinc-950 border border-zinc-900 h-14 p-1 rounded-2xl mb-6">
            <TabsTrigger value="users" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary">
              {isRtl ? "الهويات" : "Identity"}
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary">
              {isRtl ? "البلاغات" : "Reports"}
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary">
              {isRtl ? "البث" : "Broadcast"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                <Input 
                  placeholder={isRtl ? "ابحث عن مواطن..." : "Search citizen..."} 
                  className="bg-zinc-950 border-zinc-900 rounded-2xl pl-11 h-12 text-xs font-bold"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             
             <div className="space-y-3">
               {usersLoading ? <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary opacity-30" /></div> : 
                allUsers.filter((u: any) => u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())).map((member: any) => (
                 <div key={member.id} className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-[2rem] hover:border-zinc-800 transition-all shadow-lg group">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border border-zinc-800">
                         <AvatarImage src={member.photoURL} />
                         <AvatarFallback>{member.displayName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                         <div className="flex items-center gap-1.5">
                            <p className="text-sm font-black truncate max-w-[100px]">{member.displayName}</p>
                            {member.isVerified && <VerificationBadge className="h-3 w-3" />}
                         </div>
                         <p className="text-[9px] text-zinc-600 font-bold uppercase truncate">@{member.email?.split('@')[0]}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <Button 
                         variant="ghost" size="icon" 
                         className={cn("h-9 w-9 rounded-xl", member.isVerified ? "bg-blue-500/10 text-blue-500" : "bg-zinc-900 text-zinc-700")}
                         onClick={() => handleToggleVerify(member.id, member.isVerified)}
                       >
                         <ShieldCheck className="h-4 w-4" />
                       </Button>
                       <Button 
                         variant="ghost" size="icon" 
                         className={cn("h-9 w-9 rounded-xl", member.isPro ? "bg-yellow-500/10 text-yellow-500" : "bg-zinc-900 text-zinc-700")}
                         onClick={() => handleTogglePro(member.id, member.isPro)}
                       >
                         <Star className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-zinc-900 text-zinc-700 hover:text-red-500" onClick={() => {
                          const banUntil = new Date();
                          banUntil.setDate(banUntil.getDate() + 7);
                          updateDoc(doc(db, "users", member.id), { isBannedUntil: Timestamp.fromDate(banUntil) });
                          toast({ title: "7 Days Sanction Applied" });
                       }}>
                         <Ban className="h-4 w-4" />
                       </Button>
                    </div>
                 </div>
               ))}
             </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
             {reportsLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto opacity-20" /> : 
              reports.length > 0 ? reports.map((report: any) => (
                <Card key={report.id} className="bg-zinc-950 border-zinc-900 p-5 rounded-[2rem] shadow-xl overflow-hidden relative">
                   <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle className="h-12 w-12 text-red-500" /></div>
                   <div className="flex items-center gap-3 mb-4">
                      <div className="h-8 w-8 rounded-xl bg-red-500/10 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-red-500" /></div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{isRtl ? "خرق للبروتوكول" : "Protocol Breach"}</span>
                   </div>
                   <p className="text-xs text-zinc-400 italic mb-6 leading-relaxed">"{report.reason}"</p>
                   <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 rounded-xl h-10 text-[10px] font-black uppercase border-zinc-800" onClick={() => updateDoc(doc(db, "reports", report.id), { status: "resolved" })}>
                        {isRtl ? "تجاهل" : "Dismiss"}
                      </Button>
                      <Button className="flex-1 rounded-xl h-10 text-[10px] font-black uppercase bg-red-600 hover:bg-red-700" onClick={async () => {
                         if (report.targetId) {
                           if (report.targetType === 'post') await deleteDoc(doc(db, "posts", report.targetId));
                           if (report.targetType === 'user') await updateDoc(doc(db, "users", report.targetId), { isBannedUntil: Timestamp.fromDate(new Date(Date.now() + 31536000000)) });
                         }
                         await updateDoc(doc(db, "reports", report.id), { status: "resolved" });
                         toast({ title: "Action Taken" });
                      }}>
                        {isRtl ? "تطبيق" : "Enforce"}
                      </Button>
                   </div>
                </Card>
              )) : (
                <div className="py-20 text-center opacity-10 flex flex-col items-center gap-4">
                   <CheckCircle className="h-16 w-16" />
                   <p className="text-[10px] font-black uppercase tracking-widest">{isRtl ? "البيئة آمنة تماماً" : "Pure Sovereignty"}</p>
                </div>
              )}
          </TabsContent>

          <TabsContent value="broadcast" className="space-y-6">
             <Card className="bg-zinc-950 border-zinc-900 border-2 border-dashed border-primary/20 rounded-[2.5rem] p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                   <Megaphone className="h-6 w-6 text-primary animate-pulse" />
                   <h3 className="font-black text-sm uppercase tracking-widest">{isRtl ? "بث أمر القيادة" : "Command Broadcast"}</h3>
                </div>
                <Textarea 
                  placeholder={isRtl ? "اكتب هنا نص البيان الموجه لجميع المواطنين..." : "Enter official proclamation..."}
                  className="bg-zinc-900 border-zinc-800 rounded-2xl min-h-[150px] resize-none text-sm font-bold p-5 shadow-inner mb-6"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                />
                <Button 
                  className="w-full h-14 rounded-2xl bg-white text-black hover:bg-zinc-200 font-black text-lg shadow-xl transition-all"
                  disabled={isBroadcasting || !broadcastMessage.trim() || !isSuper}
                  onClick={handleBroadcast}
                >
                  {isBroadcasting ? <Loader2 className="h-6 w-6 animate-spin" /> : (isRtl ? "تنفيذ البث" : "Execute")}
                </Button>
             </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
