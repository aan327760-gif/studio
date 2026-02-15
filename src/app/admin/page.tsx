"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
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
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  Activity,
  Megaphone,
  UserCheck
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
import { Card } from "@/components/ui/card";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, ResponsiveContainer } from "recharts";

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
    if (!userLoading && !isSuper) {
      router.replace("/");
    }
  }, [user, userLoading, router, isSuper]);

  const usersQuery = useMemoFirebase(() => isSuper ? query(collection(db, "users"), limit(100)) : null, [db, isSuper]);
  const { data: allUsers = [], loading: usersLoading } = useCollection<any>(usersQuery);
  
  const reportsQuery = useMemoFirebase(() => isSuper ? query(collection(db, "reports"), where("status", "==", "pending"), limit(50)) : null, [db, isSuper]);
  const { data: reports = [], loading: reportsLoading } = useCollection<any>(reportsQuery);

  const chartData = useMemo(() => [
    { name: isRtl ? "مواطنين" : "Citizens", value: allUsers.length },
    { name: isRtl ? "بلاغات" : "Reports", value: reports.length },
    { name: isRtl ? "موثقين" : "Verified", value: allUsers.filter((u:any) => u.isVerified).length }
  ], [allUsers, reports, isRtl]);

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim() || !isSuper) return;
    setIsBroadcasting(true);
    try {
      const batch = writeBatch(db);
      allUsers.forEach((member: any) => {
        const notifRef = doc(collection(db, "notifications"));
        batch.set(notifRef, {
          userId: member.id,
          type: "system",
          fromUserName: "القيادة السيادية",
          message: broadcastMessage,
          read: false,
          createdAt: serverTimestamp()
        });
      });
      await batch.commit();
      toast({ title: isRtl ? "تم بث البيان الرسمي" : "Broadcasted" });
      setBroadcastMessage("");
    } catch (error) {
      toast({ variant: "destructive", title: "Broadcast Failed" });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleActionOnReport = async (reportId: string, action: 'ignore' | 'delete' | 'ban', postId?: string, authorId?: string) => {
    if (!isSuper) return;
    try {
      if (action === 'delete' && postId) {
        await deleteDoc(doc(db, "posts", postId));
      } else if (action === 'ban' && authorId) {
        const banUntil = new Date();
        banUntil.setDate(banUntil.getDate() + 30);
        await updateDoc(doc(db, "users", authorId), { isBannedUntil: Timestamp.fromDate(banUntil) });
      }
      await updateDoc(doc(db, "reports", reportId), { status: "resolved", actionTaken: action });
      toast({ title: isRtl ? "تم تنفيذ الإجراء" : "Action Executed" });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  if (userLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuper) return null;

  return (
    <div className="min-h-screen bg-black text-white max-w-md mx-auto border-x border-zinc-900 pb-24">
      <header className="p-6 border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10">
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
        <section className="space-y-4">
           <div className="flex items-center gap-2 px-2">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{isRtl ? "نبض المنصة" : "Pulse"}</h2>
           </div>
           <Card className="bg-zinc-950 border-zinc-900 p-6 rounded-[2rem] h-[200px]">
              <ChartContainer config={{ value: { label: "Count", color: "#1E6FC9" } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" stroke="#3f3f46" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="var(--color-value)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
           </Card>
        </section>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="w-full bg-zinc-950 border border-zinc-900 h-14 p-1 rounded-2xl mb-6">
            <TabsTrigger value="users" className="flex-1 rounded-xl font-black text-[10px] uppercase data-[state=active]:bg-primary">Citizens</TabsTrigger>
            <TabsTrigger value="threats" className="flex-1 rounded-xl font-black text-[10px] uppercase data-[state=active]:bg-primary">Threats</TabsTrigger>
            <TabsTrigger value="broadcast" className="flex-1 rounded-xl font-black text-[10px] uppercase data-[state=active]:bg-primary">Broadcast</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                <Input placeholder={isRtl ? "ابحث عن مواطن..." : "Search..."} className="bg-zinc-950 border-zinc-900 rounded-2xl pl-11 h-12 text-xs font-bold" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
             </div>
             <div className="space-y-3">
               {usersLoading ? (
                 <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary opacity-30" /></div>
               ) : (
                 allUsers.filter((u: any) => u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())).map((member: any) => (
                   <div key={member.id} className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-[2rem]">
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
                           <p className="text-[9px] text-zinc-600 font-bold uppercase">@{member.email?.split('@')[0]}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                         <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-xl", member.isVerified ? "bg-blue-500/10 text-blue-500" : "bg-zinc-900 text-zinc-700")} onClick={() => updateDoc(doc(db, "users", member.id), { isVerified: !member.isVerified })}>
                           <ShieldCheck className="h-4 w-4" />
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
                 ))
               )}
             </div>
          </TabsContent>

          <TabsContent value="threats" className="space-y-4">
             {reportsLoading ? (
               <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary opacity-30" /></div>
             ) : (
               reports.length > 0 ? (
                 reports.map((r: any) => (
                   <Card key={r.id} className="bg-zinc-950 border-zinc-900 p-5 rounded-[2rem] space-y-4">
                      <div className="flex items-center justify-between">
                         <Badge className="bg-orange-500/10 text-orange-500 border-none font-black text-[8px]">{r.reason}</Badge>
                         <Button variant="ghost" size="sm" className="h-7 text-[8px] font-black uppercase text-zinc-500 bg-zinc-900 rounded-lg border border-zinc-800">تحليل (قريباً)</Button>
                      </div>
                      <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                         <p className="text-xs text-zinc-400 italic">"{r.postContent}"</p>
                         <p className="text-[9px] text-zinc-600 mt-2 font-bold">— {r.authorName}</p>
                      </div>
                      <div className="flex gap-2">
                         <Button variant="ghost" size="sm" className="flex-1 rounded-xl bg-green-500/10 text-green-500 font-black text-[10px]" onClick={() => handleActionOnReport(r.id, 'ignore')}>Ignore</Button>
                         <Button variant="ghost" size="sm" className="flex-1 rounded-xl bg-red-500/10 text-red-500 font-black text-[10px]" onClick={() => handleActionOnReport(r.id, 'delete', r.postId)}>Delete</Button>
                         <Button variant="ghost" size="sm" className="flex-1 rounded-xl bg-zinc-900 text-white font-black text-[10px]" onClick={() => handleActionOnReport(r.id, 'ban', undefined, r.authorId)}>Ban</Button>
                      </div>
                   </Card>
                 ))
               ) : (
                 <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
                   <CheckCircle className="h-12 w-12" />
                   <p className="text-sm font-black uppercase">Zero Threats</p>
                 </div>
               )
             )}
          </TabsContent>

          <TabsContent value="broadcast" className="space-y-6">
             <Card className="bg-zinc-950 border-zinc-900 border-2 border-dashed border-primary/20 rounded-[2.5rem] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Megaphone className="h-6 w-6 text-primary" />
                  <h3 className="font-black text-sm uppercase tracking-widest">{isRtl ? "بث أمر القيادة" : "Broadcast"}</h3>
                </div>
                <Textarea 
                  placeholder={isRtl ? "اكتب هنا نص البيان الموجه لجميع المواطنين..." : "Enter proclamation..."} 
                  className="bg-zinc-900 border-zinc-800 rounded-2xl min-h-[150px] text-sm font-bold p-5 mb-6" 
                  value={broadcastMessage} 
                  onChange={(e) => setBroadcastMessage(e.target.value)} 
                />
                <div className="flex gap-3">
                   <Button 
                    className="flex-1 h-14 rounded-2xl bg-white text-black font-black" 
                    disabled={isBroadcasting || !broadcastMessage.trim()} 
                    onClick={handleBroadcast}
                  >
                    {isBroadcasting ? <Loader2 className="h-6 w-6 animate-spin" /> : (isRtl ? "تنفيذ البث" : "Execute")}
                  </Button>
                  <Button variant="outline" className="flex-1 h-14 rounded-2xl border-zinc-800 font-black text-zinc-500">
                     رفع الكود (ي)
                  </Button>
                </div>
             </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
