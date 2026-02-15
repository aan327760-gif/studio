
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
  ShieldCheck,
  Flag,
  CheckCircle,
  Users,
  MessageSquare,
  AlertTriangle,
  Activity,
  Megaphone,
  BrainCircuit,
  Star,
  Radio
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

  const usersQuery = useMemoFirebase(() => isAdmin ? query(collection(db, "users"), limit(100)) : null, [db, isAdmin]);
  const { data: allUsers = [], loading: usersLoading } = useCollection<any>(usersQuery);
  
  const reportsQuery = useMemoFirebase(() => isAdmin ? query(collection(db, "reports"), where("status", "==", "pending"), limit(50)) : null, [db, isAdmin]);
  const { data: reports = [], loading: reportsLoading } = useCollection<any>(reportsQuery);

  useEffect(() => {
    async function fetchStats() {
      if (!isAdmin || !db || !currentUserProfile) return;
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
        console.warn("Stats fetch error:", err.message);
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, [db, isAdmin, currentUserProfile?.id]);

  useEffect(() => {
    if (!userLoading && !isAdmin && user && currentUserProfile) router.replace("/");
  }, [user, userLoading, router, isAdmin, currentUserProfile]);

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim() || !isSuperAdmin) return;
    setIsBroadcasting(true);
    try {
      const batch = writeBatch(db);
      allUsers.slice(0, 50).forEach((member: any) => {
        const notifRef = doc(collection(db, "notifications"));
        batch.set(notifRef, {
          userId: member.id,
          type: "system",
          fromUserName: "UNBOUND ADMIN",
          message: broadcastMessage,
          read: false,
          createdAt: serverTimestamp()
        });
      });
      await batch.commit();
      toast({ title: isRtl ? "تم إرسال البث بنجاح" : "Broadcast sent" });
      setBroadcastMessage("");
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsBroadcasting(false);
    }
  };

  if (userLoading || (!isAdmin && !userLoading && user)) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest">{isRtl ? "جاري التحقق من الصلاحيات..." : "Verifying Permissions..."}</p>
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
            <Badge className="bg-primary/20 text-primary border-primary/20 text-[8px] font-black uppercase tracking-widest">
              {isSuperAdmin ? "SOVEREIGN ADMIN" : "MODERATOR"}
            </Badge>
          </div>
        </div>
        <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
           <BrainCircuit className="h-5 w-5 text-primary animate-pulse" />
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
            <Card key={i} className="bg-zinc-950 border-zinc-900">
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

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="w-full bg-zinc-950 border border-zinc-900 h-14 p-1 rounded-2xl mb-6">
            <TabsTrigger value="users" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary">
              {isRtl ? "الأعضاء" : "Members"}
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary">
              {isRtl ? "البلاغات" : "Reports"} {reports.length > 0 && <Badge className="ml-2 bg-red-500">{reports.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-primary">
              {isRtl ? "بث عام" : "Broadcast"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
             <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                <Input 
                  placeholder={isRtl ? "ابحث عن عضو..." : "Search member..."} 
                  className="bg-zinc-950 border-zinc-900 rounded-2xl pl-12 h-14 text-sm font-bold"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             {allUsers.filter((u: any) => u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())).map((member: any) => (
               <div key={member.id} className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-3xl">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-zinc-800">
                       <AvatarImage src={member.photoURL} />
                       <AvatarFallback>{member.displayName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                       <div className="flex items-center gap-1.5">
                          <p className="text-sm font-black">{member.displayName}</p>
                          {member.isVerified && <VerificationBadge className="h-3.5 w-3.5" />}
                          {member.isPro && <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />}
                       </div>
                       <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">@{member.email?.split('@')[0]}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                     {isSuperAdmin && (
                       <div className="flex gap-1">
                          {/* توثيق الهوية (Blue Rosette) */}
                          <Button 
                            variant="ghost" size="icon" 
                            className={cn("h-10 w-10", member.isVerified ? "text-primary" : "text-zinc-800")}
                            title={isRtl ? "توثيق هوية" : "Verify Citizen"}
                            onClick={() => updateDoc(doc(db, "users", member.id), { isVerified: !member.isVerified })}
                          >
                            <VerificationBadge className="h-5 w-5" />
                          </Button>
                          {/* توثيق قناة إعلامية (Media Pro) */}
                          <Button 
                            variant="ghost" size="icon" 
                            className={cn("h-10 w-10", member.isPro ? "text-yellow-500" : "text-zinc-800")}
                            title={isRtl ? "توثيق قناة إعلامية" : "Verify Media Channel"}
                            onClick={() => updateDoc(doc(db, "users", member.id), { isPro: !member.isPro })}
                          >
                            <Radio className="h-5 w-5" />
                          </Button>
                       </div>
                     )}
                     <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-700 hover:text-orange-500" onClick={() => {
                        const banUntil = new Date();
                        banUntil.setDate(banUntil.getDate() + 3);
                        updateDoc(doc(db, "users", member.id), { isBannedUntil: Timestamp.fromDate(banUntil) });
                        toast({ title: "Banned for 3 days" });
                     }}>
                       <Ban className="h-5 w-5" />
                     </Button>
                  </div>
               </div>
             ))}
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
             {reportsLoading ? (
               <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-800" /></div>
             ) : reports.length > 0 ? (
               reports.map((report: any) => (
                 <div key={report.id} className="p-6 bg-zinc-950 border border-zinc-900 rounded-[2rem] space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-red-500/10 rounded-2xl"><Flag className="h-6 w-6 text-red-500" /></div>
                        <div>
                          <p className="text-sm font-black">{isRtl ? "بلاغ عن " : "Report on "}{report.targetType}</p>
                          <p className="text-xs text-zinc-500 font-bold mt-1">السبب: {report.reason}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <Button size="sm" variant="ghost" className="flex-1 rounded-xl border border-zinc-800 font-black h-11" onClick={async () => {
                         await updateDoc(doc(db, "reports", report.id), { status: "resolved" });
                         toast({ title: "Resolved" });
                       }}>
                         {isRtl ? "تجاهل" : "Ignore"}
                       </Button>
                       <Button size="sm" className="flex-1 rounded-xl bg-red-500 text-white font-black h-11" onClick={async () => {
                         if (report.targetId) await deleteDoc(doc(db, "posts", report.targetId));
                         await updateDoc(doc(db, "reports", report.id), { status: "resolved" });
                         toast({ title: "Content Deleted" });
                       }}>
                         {isRtl ? "حذف المحتوى" : "Delete Content"}
                       </Button>
                    </div>
                 </div>
               ))
             ) : (
               <div className="py-32 text-center opacity-20">
                 <CheckCircle className="h-16 w-16 mb-4 mx-auto" />
                 <p className="text-sm font-black uppercase tracking-widest">{isRtl ? "لا توجد بلاغات معلقة" : "No pending reports"}</p>
               </div>
             )}
          </TabsContent>

          <TabsContent value="broadcast" className="space-y-6">
            <Card className="bg-zinc-950 border-zinc-900 border-2 border-dashed border-primary/20">
               <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                     <Megaphone className="h-4 w-4 text-primary" />
                     {isRtl ? "بيان النظام السيادي" : "Sovereign System Broadcast"}
                  </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  <Textarea 
                    placeholder={isRtl ? "اكتب هنا بيان النظام..." : "Write system announcement here..."}
                    className="bg-zinc-900 border-zinc-800 rounded-2xl min-h-[120px] resize-none"
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                  />
                  <Button 
                    className="w-full h-14 rounded-2xl bg-white text-black hover:bg-zinc-200 font-black"
                    disabled={isBroadcasting || !broadcastMessage.trim() || !isSuperAdmin}
                    onClick={handleBroadcast}
                  >
                    {isBroadcasting ? <Loader2 className="h-6 w-6 animate-spin" /> : (isRtl ? "إرسال البيان الآن" : "Broadcast Now")}
                  </Button>
               </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
