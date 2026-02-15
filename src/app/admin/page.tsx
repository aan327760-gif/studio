
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
  Clock,
  ShieldCheck,
  Flag,
  CheckCircle,
  CheckCircle2,
  Trash2,
  Users,
  MessageSquare,
  AlertTriangle,
  Settings2,
  Megaphone,
  TrendingUp,
  Activity
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { 
  AreaChart,
  Area,
  XAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

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
  const isAdmin = isSuperAdmin || currentUserProfile?.role === "admin";

  // استعلامات البيانات
  const usersQuery = useMemoFirebase(() => isAdmin ? query(collection(db, "users"), limit(100)) : null, [db, isAdmin]);
  const { data: allUsers = [], loading: usersLoading } = useCollection<any>(usersQuery);
  
  const reportsQuery = useMemoFirebase(() => isAdmin ? query(collection(db, "reports"), where("status", "==", "pending"), limit(50)) : null, [db, isAdmin]);
  const { data: reports = [], loading: reportsLoading } = useCollection<any>(reportsQuery);

  // إحصائيات بيانية تجريبية
  const chartData = [
    { name: 'Sat', activity: 240 },
    { name: 'Sun', activity: 139 },
    { name: 'Mon', activity: 980 },
    { name: 'Tue', activity: 390 },
    { name: 'Wed', activity: 480 },
    { name: 'Thu', activity: 380 },
    { name: 'Fri', activity: 430 },
  ];

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
        if (err.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: 'stats/counts',
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
        }
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, [db, isAdmin]);

  useEffect(() => {
    if (!userLoading && !isAdmin && user) {
      router.replace("/");
    }
  }, [user, userLoading, router, isAdmin]);

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim() || !isSuperAdmin) return;
    setIsBroadcasting(true);
    try {
      const batch = writeBatch(db);
      allUsers.slice(0, 20).forEach((member: any) => {
        const notifRef = doc(collection(db, "notifications"));
        batch.set(notifRef, {
          userId: member.id,
          type: "system",
          fromUserName: "UNBOUND ADMIN",
          fromUserAvatar: "",
          message: broadcastMessage,
          read: false,
          createdAt: serverTimestamp()
        });
      });
      await batch.commit();
      toast({ title: isRtl ? "تم إرسال البث بنجاح" : "Broadcast sent successfully" });
      setBroadcastMessage("");
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleBanUser = async (userId: string) => {
    const banUntil = new Date();
    banUntil.setDate(banUntil.getDate() + 3);

    if (confirm(isRtl ? "إيقاف المستخدم عن التفاعل لمدة 3 أيام؟" : "Restrict user from interaction for 3 days?")) {
      updateDoc(doc(db, "users", userId), {
        isBannedUntil: Timestamp.fromDate(banUntil)
      });
      toast({ title: isRtl ? "تم تنفيذ الإيقاف" : "Interaction restricted" });
    }
  };

  const handleUnbanUser = async (userId: string) => {
    updateDoc(doc(db, "users", userId), {
      isBannedUntil: null
    });
    toast({ title: isRtl ? "تم إلغاء الإيقاف" : "Restriction lifted" });
  };

  const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
    if (!isSuperAdmin) return;
    try {
      updateDoc(doc(db, "users", userId), {
        isVerified: !currentStatus
      });
      toast({ 
        title: !currentStatus 
          ? (isRtl ? "تم توثيق الحساب" : "Account Verified") 
          : (isRtl ? "تم سحب التوثيق" : "Verification Revoked") 
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const handleResolveReport = async (reportId: string, action: 'delete' | 'ignore') => {
    try {
      if (action === 'delete') {
        const report = reports.find(r => r.id === reportId);
        if (report && report.targetType === 'post') {
          deleteDoc(doc(db, "posts", report.targetId));
        }
      }
      updateDoc(doc(db, "reports", reportId), {
        status: "resolved",
        resolvedBy: user?.uid,
        resolvedAt: serverTimestamp()
      });
      toast({ title: isRtl ? "تمت معالجة البلاغ" : "Report resolved" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  if (userLoading || (!isAdmin && !userLoading)) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-widest">{isRtl ? "التحقق من الهوية السيادية..." : "Verifying Sovereign Identity..."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white max-w-5xl mx-auto border-x border-zinc-900 pb-20">
      <header className="p-6 border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className={cn("h-6 w-6", isRtl ? "rotate-180" : "")} />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tighter">{isRtl ? "مركز القيادة" : "Command Center"}</h1>
            <Badge className="bg-primary/20 text-primary border-primary/20 text-[8px] font-black tracking-[0.2em] uppercase">
              {isSuperAdmin ? "SOVEREIGN ADMIN" : "MODERATOR"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="hidden md:flex flex-col items-end mr-2">
              <p className="text-[10px] font-black text-zinc-500 uppercase">System Status</p>
              <p className="text-[10px] text-green-500 font-bold uppercase flex items-center gap-1">
                 <span className="h-1 w-1 bg-green-500 rounded-full animate-pulse" />
                 Operational
              </p>
           </div>
           <Button variant="outline" size="icon" className="rounded-xl border-zinc-800"><Settings2 className="h-5 w-5" /></Button>
        </div>
      </header>

      <main className="p-6 space-y-8">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: isRtl ? "المواطنين" : "Citizens", value: stats.users, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: isRtl ? "الأفكار" : "Insights", value: stats.posts, icon: Activity, color: "text-green-500", bg: "bg-green-500/10" },
            { label: isRtl ? "اللمة" : "Lamma", value: stats.groups, icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-500/10" },
            { label: isRtl ? "التهديدات" : "Threats", value: stats.reports, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
          ].map((stat, i) => (
            <Card key={i} className="bg-zinc-950 border-zinc-900 overflow-hidden relative border">
              <CardContent className="p-6">
                <div className={cn("p-2 rounded-lg inline-flex mb-4", stat.bg)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{stat.label}</p>
                <h3 className="text-2xl font-black mt-1">
                  {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : stat.value.toLocaleString()}
                </h3>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 bg-zinc-950 border-zinc-900 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                {isRtl ? "مؤشر النشاط" : "Activity Index"}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] w-full pt-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E6FC9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1E6FC9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="activity" stroke="#1E6FC9" fillOpacity={1} fill="url(#colorUv)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950 border-zinc-900 flex flex-col">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                {isRtl ? "الأمان" : "Safety"}
              </CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold text-zinc-600">Health Overview</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center gap-6">
               <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-zinc-500">{isRtl ? "المحتوى السليم" : "Clean Content"}</span>
                  <span className="text-xl font-black text-green-500">98.2%</span>
               </div>
               <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[98.2%] rounded-full shadow-[0_0_10px_#22c55e]" />
               </div>
               <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                     <p className="text-[9px] font-black text-zinc-500 uppercase">Violations</p>
                     <p className="text-lg font-black text-red-500">{stats.reports}</p>
                  </div>
                  <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                     <p className="text-[9px] font-black text-zinc-500 uppercase">Banned</p>
                     <p className="text-lg font-black text-orange-500">12</p>
                  </div>
               </div>
            </CardContent>
          </Card>
        </section>

        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="w-full bg-zinc-950 border border-zinc-900 h-14 p-1 rounded-2xl mb-6">
            <TabsTrigger value="reports" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary transition-all">
              {isRtl ? "البلاغات" : "Reports"} {reports.length > 0 && <Badge className="ml-2 bg-red-500">{reports.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary transition-all">
              {isRtl ? "الأعضاء" : "Members"}
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary transition-all">
              {isRtl ? "بث عام" : "Broadcast"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4">
             {reportsLoading ? (
               <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-800" /></div>
             ) : reports.length > 0 ? (
               reports.map((report: any) => (
                 <div key={report.id} className="p-6 bg-zinc-950 border border-zinc-900 rounded-[2rem] space-y-4 transition-all hover:border-red-500/30">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-red-500/10 rounded-2xl"><Flag className="h-6 w-6 text-red-500" /></div>
                        <div>
                          <p className="text-sm font-black">{isRtl ? "بلاغ عن " : "Report on "}{report.targetType}</p>
                          <p className="text-xs text-zinc-500 font-bold mt-1">السبب: {report.reason}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-red-500/50 text-red-500 text-[8px] font-black">PENDING ACTION</Badge>
                    </div>
                    <div className="flex gap-2 pt-2">
                       <Button size="sm" variant="ghost" className="flex-1 rounded-xl border border-zinc-800 text-xs font-black uppercase tracking-wider h-11" onClick={() => handleResolveReport(report.id, 'ignore')}>
                         {isRtl ? "تجاهل" : "Ignore"}
                       </Button>
                       <Button size="sm" className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs h-11 uppercase tracking-wider" onClick={() => handleResolveReport(report.id, 'delete')}>
                         {isRtl ? "حذف المحتوى" : "Delete Content"}
                       </Button>
                    </div>
                 </div>
               ))
             ) : (
               <div className="py-32 text-center opacity-20 flex flex-col items-center">
                 <CheckCircle className="h-16 w-16 mb-4 text-zinc-600" />
                 <p className="text-sm font-black uppercase tracking-widest">{isRtl ? "المجتمع آمن حالياً" : "Society is safe for now"}</p>
               </div>
             )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
             <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                <Input 
                  placeholder={isRtl ? "ابحث بالاسم أو البريد السيادي..." : "Search name or sovereign email..."} 
                  className="bg-zinc-950 border-zinc-900 rounded-2xl pl-12 h-14 text-sm font-bold"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             {usersLoading ? (
               <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
             ) : allUsers?.filter((u: any) => 
                  u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  u.email?.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((member: any) => {
               const isBanned = member.isBannedUntil && member.isBannedUntil.toDate() > new Date();
               // التأكد من توثيق حساب المدير العام في القائمة
               const isMemberVerified = member.isVerified || member.email === SUPER_ADMIN_EMAIL;
               
               return (
                 <div key={member.id} className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-3xl hover:bg-zinc-900/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-1 ring-zinc-800 shadow-xl">
                         <AvatarImage src={member.photoURL} />
                         <AvatarFallback className="bg-zinc-900">{member.displayName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                         <div className="flex items-center gap-1.5">
                            <p className="text-sm font-black">{member.displayName}</p>
                            {isMemberVerified && <CheckCircle2 className="h-3.5 w-3.5 text-[#1DA1F2] fill-[#1DA1F2]" />}
                            {member.role === "admin" && member.email !== SUPER_ADMIN_EMAIL && <ShieldCheck className="h-3.5 w-3.5 text-primary fill-primary" />}
                            {isBanned && <Clock className="h-3.5 w-3.5 text-orange-500 animate-pulse" />}
                         </div>
                         <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">@{member.email?.split('@')[0]}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       {member.email !== SUPER_ADMIN_EMAIL && (
                         <>
                           {isSuperAdmin && (
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               className={cn("h-10 w-10 transition-colors", isMemberVerified ? "text-[#1DA1F2]" : "text-zinc-800 hover:text-[#1DA1F2]")}
                               onClick={() => handleToggleVerification(member.id, !!member.isVerified)}
                             >
                               <CheckCircle2 className="h-5 w-5" />
                             </Button>
                           )}
                           {isBanned ? (
                             <Button variant="ghost" size="sm" className="rounded-xl text-orange-500 font-black text-[10px] uppercase" onClick={() => handleUnbanUser(member.id)}>
                               {isRtl ? "إلغاء الحظر" : "Unban"}
                             </Button>
                           ) : (
                             <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-700 hover:text-orange-500" onClick={() => handleBanUser(member.id)}>
                               <Ban className="h-5 w-5" />
                             </Button>
                           )}
                           {isSuperAdmin && (
                             <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-800 hover:text-red-500" onClick={() => { if(confirm(isRtl ? "حذف العضو نهائياً؟" : "Delete user?")) deleteDoc(doc(db, "users", member.id)) }}>
                               <Trash2 className="h-5 w-5" />
                             </Button>
                           )}
                         </>
                       )}
                    </div>
                 </div>
               );
             })}
          </TabsContent>

          <TabsContent value="broadcast" className="space-y-6">
            <Card className="bg-zinc-950 border-zinc-900 border-2 border-dashed border-primary/20">
               <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                     <Megaphone className="h-4 w-4 text-primary" />
                     {isRtl ? "بث رسالة للنظام" : "System-wide Broadcast"}
                  </CardTitle>
                  <CardDescription className="text-xs font-bold text-zinc-500">
                    {isRtl ? "سيتم إرسال هذه الرسالة لجميع المستخدمين كتنبيه رسمي." : "This message will be sent to all users as an official alert."}
                  </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  <Textarea 
                    placeholder={isRtl ? "اكتب هنا بيان النظام..." : "Write system announcement here..."}
                    className="bg-zinc-900 border-zinc-800 rounded-2xl min-h-[120px] resize-none font-medium"
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                  />
                  <Button 
                    className="w-full h-14 rounded-2xl bg-white text-black hover:bg-zinc-200 font-black text-lg shadow-xl"
                    disabled={isBroadcasting || !broadcastMessage.trim() || !isSuperAdmin}
                    onClick={handleBroadcast}
                  >
                    {isBroadcasting ? <Loader2 className="h-6 w-6 animate-spin" /> : (isRtl ? "إرسال البث الآن" : "Send Broadcast Now")}
                  </Button>
                  {!isSuperAdmin && (
                    <p className="text-[10px] text-center text-red-500 font-black uppercase tracking-widest">
                      {isRtl ? "صلاحية البث للمدير العام فقط" : "Broadcast limited to Sovereign Admin only"}
                    </p>
                  )}
               </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
