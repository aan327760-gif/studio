
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
  getCountFromServer,
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
  Radio,
  CheckCircle,
  ShieldAlert,
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

const SUPER_ADMIN_EMAIL = "adelbenmaza3@gmail.com";

export default function AdminDashboard() {
  const { user, loading: userLoading } = useUser();
  const { isRtl } = useLanguage();
  const router = useRouter();
  const db = useFirestore();

  const userProfileRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: currentUserProfile } = useDoc<any>(userProfileRef);

  const [searchQuery, setSearchQuery] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [stats, setStats] = useState({ users: 0, posts: 0, groups: 0, reports: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;
  const isAdmin = isSuperAdmin || (currentUserProfile && currentUserProfile.role === "admin");

  // تحسين جلب البيانات بحد أقصى (MVP Limit)
  const usersQuery = useMemoFirebase(() => isAdmin ? query(collection(db, "users"), limit(50)) : null, [db, isAdmin]);
  const { data: allUsers = [], loading: usersLoading } = useCollection<any>(usersQuery);
  
  const reportsQuery = useMemoFirebase(() => isAdmin ? query(collection(db, "reports"), where("status", "==", "pending"), limit(20)) : null, [db, isAdmin]);
  const { data: reports = [], loading: reportsLoading } = useCollection<any>(reportsQuery);

  useEffect(() => {
    async function fetchStats() {
      if (!isAdmin || !db) return;
      try {
        const uCount = await getCountFromServer(collection(db, "users"));
        const pCount = await getCountFromServer(collection(db, "posts"));
        const gCount = await getCountFromServer(collection(db, "groups"));
        const rCount = await getCountFromServer(query(collection(db, "reports"), where("status", "==", "pending")));
        
        setStats({
          users: uCount.data().count,
          posts: pCount.data().count,
          groups: gCount.data().count,
          reports: rCount.data().count
        });
      } catch (err: any) {
        console.warn("Stats fetch skipped due to permissions or index.");
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, [db, isAdmin]);

  useEffect(() => {
    if (!userLoading && !isAdmin && user) router.replace("/");
  }, [user, userLoading, router, isAdmin]);

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim() || !isSuperAdmin) return;
    setIsBroadcasting(true);
    try {
      const batch = writeBatch(db);
      // بث لآخر المواطنين النشطين (كفاءة الأداء)
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

  if (userLoading) {
    return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-black text-white max-w-5xl mx-auto border-x border-zinc-900 pb-20 selection:bg-primary/30">
      <header className="p-8 border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-zinc-900 h-12 w-12 border border-zinc-800">
            <ArrowLeft className={cn("h-6 w-6", isRtl ? "rotate-180" : "")} />
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tighter">{isRtl ? "غرفة العمليات" : "War Room"}</h1>
            <Badge className="bg-primary/20 text-primary border-primary/20 text-[9px] font-black uppercase tracking-widest mt-1">
              {isSuperAdmin ? "ROOT ACCESS" : "COMMAND MODERATOR"}
            </Badge>
          </div>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
           <ShieldAlert className="h-6 w-6 text-primary" />
        </div>
      </header>

      <main className="p-6 space-y-10">
        {/* ملخص الإحصائيات */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: isRtl ? "المواطنين" : "Citizens", value: stats.users, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: isRtl ? "الأفكار" : "Insights", value: stats.posts, icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: isRtl ? "المجتمعات" : "Lamma", value: stats.groups, icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-500/10" },
            { label: isRtl ? "التهديدات" : "Threats", value: stats.reports, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
          ].map((stat, i) => (
            <Card key={i} className="bg-zinc-950 border-zinc-900 shadow-2xl overflow-hidden group">
              <CardContent className="p-8">
                <div className={cn("p-3 rounded-2xl inline-flex mb-6 group-hover:scale-110 transition-transform", stat.bg)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">{stat.label}</p>
                <h3 className="text-3xl font-black">
                  {statsLoading ? "..." : stat.value.toLocaleString()}
                </h3>
              </CardContent>
            </Card>
          ))}
        </section>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="w-full bg-zinc-950 border border-zinc-900 h-16 p-1.5 rounded-[2rem] mb-10 shadow-xl">
            <TabsTrigger value="users" className="flex-1 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest data-[state=active]:bg-primary">
              {isRtl ? "إدارة الهويات" : "Identity MGMT"}
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-1 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest data-[state=active]:bg-primary">
              {isRtl ? "التهديدات" : "Threats"} {reports.length > 0 && <Badge className="ml-2 bg-red-600 border-none h-5 px-1.5 text-[10px]">{reports.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="flex-1 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest data-[state=active]:bg-primary">
              {isRtl ? "بيان سيادي" : "Proclamation"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
             <div className="relative mb-8">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600" />
                <Input 
                  placeholder={isRtl ? "ابحث عن مواطن..." : "Search citizen..."} 
                  className="bg-zinc-950 border-zinc-900 rounded-[1.5rem] pl-14 h-16 text-sm font-bold"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             <div className="grid gap-4">
               {allUsers.filter((u: any) => u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())).map((member: any) => (
                 <div key={member.id} className="flex items-center justify-between p-5 bg-zinc-950 border border-zinc-900 rounded-[2rem] hover:border-zinc-800 transition-all shadow-lg">
                    <div className="flex items-center gap-5">
                      <Avatar className="h-14 w-14 border-2 border-zinc-800">
                         <AvatarImage src={member.photoURL} />
                         <AvatarFallback className="bg-zinc-900">{member.displayName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                         <div className="flex items-center gap-2">
                            <p className="text-base font-black tracking-tight">{member.displayName}</p>
                            {member.isVerified && <VerificationBadge className="h-4 w-4" />}
                            {member.isPro && <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />}
                         </div>
                         <p className="text-[10px] text-zinc-600 font-bold uppercase">@{member.email?.split('@')[0]}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                       {isSuperAdmin && (
                         <div className="flex gap-2">
                            <Button 
                              variant="ghost" size="icon" 
                              className={cn("h-12 w-12 rounded-2xl transition-all", member.isVerified ? "bg-primary/10 text-primary border border-primary/20" : "bg-zinc-900 text-zinc-700 border border-zinc-800")}
                              onClick={() => updateDoc(doc(db, "users", member.id), { isVerified: !member.isVerified })}
                            >
                              <VerificationBadge className="h-6 w-6" />
                            </Button>
                            <Button 
                              variant="ghost" size="icon" 
                              className={cn("h-12 w-12 rounded-2xl transition-all", member.isPro ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" : "bg-zinc-900 text-zinc-700 border border-zinc-800")}
                              onClick={() => updateDoc(doc(db, "users", member.id), { isPro: !member.isPro })}
                            >
                              <Radio className="h-6 w-6" />
                            </Button>
                         </div>
                       )}
                       <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-zinc-900 text-zinc-700 hover:text-red-500 border border-zinc-800 transition-all" onClick={() => {
                          const banUntil = new Date();
                          banUntil.setDate(banUntil.getDate() + 3); // 3 days ban
                          updateDoc(doc(db, "users", member.id), { isBannedUntil: Timestamp.fromDate(banUntil) });
                          toast({ title: "Citizen restricted for 72h" });
                       }}>
                         <Ban className="h-6 w-6" />
                       </Button>
                    </div>
                 </div>
               ))}
             </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
             {reportsLoading ? (
               <div className="py-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" /></div>
             ) : reports.length > 0 ? (
               <div className="grid gap-6">
                 {reports.map((report: any) => (
                   <div key={report.id} className="p-8 bg-zinc-950 border border-zinc-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-5"><AlertTriangle className="h-20 w-20 text-red-500" /></div>
                      <div className="flex justify-between items-start relative z-10 mb-6">
                        <div className="flex items-center gap-6">
                          <div className="p-5 bg-red-500/10 rounded-2xl border border-red-500/20"><AlertTriangle className="h-8 w-8 text-red-500" /></div>
                          <div className="space-y-1">
                            <p className="text-lg font-black">{isRtl ? "مخالفة سيادية" : "Protocol Violation"}</p>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Type: {report.targetType}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 mb-6">
                         <p className="text-sm font-bold text-zinc-300 leading-relaxed italic">"{report.reason}"</p>
                      </div>
                      <div className="flex gap-4 relative z-10">
                         <Button variant="ghost" className="flex-1 rounded-2xl border border-zinc-800 font-black h-14 hover:bg-zinc-900" onClick={async () => {
                           await updateDoc(doc(db, "reports", report.id), { status: "resolved" });
                           toast({ title: "Dismissed" });
                         }}>
                           {isRtl ? "تجاهل" : "Dismiss"}
                         </Button>
                         <Button className="flex-1 rounded-2xl bg-red-600 text-white font-black h-14 hover:bg-red-700 shadow-xl" onClick={async () => {
                           if (report.targetId) {
                             if (report.targetType === 'post') await deleteDoc(doc(db, "posts", report.targetId));
                             if (report.targetType === 'user') {
                                const banDate = new Date();
                                banDate.setFullYear(banDate.getFullYear() + 1); // 1 year ban
                                await updateDoc(doc(db, "users", report.targetId), { isBannedUntil: Timestamp.fromDate(banDate) });
                             }
                           }
                           await updateDoc(doc(db, "reports", report.id), { status: "resolved" });
                           toast({ title: "Sanction Applied" });
                         }}>
                           {isRtl ? "تطبيق العقوبة" : "Sanction"}
                         </Button>
                      </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="py-40 text-center opacity-10 flex flex-col items-center gap-6">
                 <CheckCircle className="h-24 w-24" />
                 <p className="text-lg font-black uppercase tracking-widest">{isRtl ? "البيئة آمنة تماماً" : "Pure Sovereignty"}</p>
               </div>
             )}
          </TabsContent>

          <TabsContent value="broadcast" className="space-y-10">
            <Card className="bg-zinc-950 border-zinc-900 border-2 border-dashed border-primary/30 rounded-[3rem] shadow-2xl overflow-hidden">
               <CardHeader className="p-10 pb-6 text-center">
                  <CardTitle className="text-xl font-black uppercase tracking-widest flex items-center justify-center gap-4">
                     <Megaphone className="h-8 w-8 text-primary animate-pulse" />
                     {isRtl ? "بث بيان القيادة العليا" : "Command Broadcast"}
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-10 pt-0 space-y-8">
                  <Textarea 
                    placeholder={isRtl ? "اكتب هنا نص البيان الموجه لجميع المواطنين..." : "Enter official proclamation for all citizens..."}
                    className="bg-zinc-900 border-zinc-800 rounded-[2rem] min-h-[200px] resize-none text-lg font-bold p-8 shadow-inner"
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                  />
                  <Button 
                    className="w-full h-18 rounded-[2rem] bg-white text-black hover:bg-zinc-200 font-black text-xl shadow-2xl transition-all active:scale-95"
                    disabled={isBroadcasting || !broadcastMessage.trim() || !isSuperAdmin}
                    onClick={handleBroadcast}
                  >
                    {isBroadcasting ? <Loader2 className="h-8 w-8 animate-spin" /> : (isRtl ? "تنفيذ البث الفوري" : "Execute Broadcast")}
                  </Button>
                  <p className="text-center text-[10px] text-zinc-600 font-black uppercase tracking-widest">
                    ⚠️ {isRtl ? "سيظهر هذا البيان لجميع المواطنين في شريط الصفحة الرئيسية" : "This message will be pinned for all citizens"}
                  </p>
               </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
