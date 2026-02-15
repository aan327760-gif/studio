
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
  getDocs,
  getCountFromServer
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
  UserPlus,
  Trash2,
  Users,
  MessageSquare,
  BarChart3,
  AlertTriangle,
  Settings2,
  Lock,
  LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SUPER_ADMIN_EMAIL = "adelbenmaza3@gmail.com";

export default function AdminDashboard() {
  const { user, loading: userLoading } = useUser();
  const { isRtl } = useLanguage();
  const router = useRouter();
  const db = useFirestore();

  const userProfileRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: currentUserProfile } = useDoc<any>(userProfileRef);

  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ users: 0, posts: 0, groups: 0, reports: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;
  const isAdmin = isSuperAdmin || currentUserProfile?.role === "admin";

  // جلب البيانات الأساسية
  const usersQuery = useMemoFirebase(() => query(collection(db, "users"), limit(100)), [db]);
  const { data: allUsers, loading: usersLoading } = useCollection<any>(usersQuery);
  
  const reportsQuery = useMemoFirebase(() => query(collection(db, "reports"), where("status", "==", "pending"), limit(50)), [db]);
  const { data: reports = [], loading: reportsLoading } = useCollection<any>(reportsQuery);

  const groupsQuery = useMemoFirebase(() => query(collection(db, "groups"), limit(50)), [db]);
  const { data: allGroups, loading: groupsLoading } = useCollection<any>(groupsQuery);

  // جلب الإحصائيات السريعة
  useEffect(() => {
    async function fetchStats() {
      if (!isAdmin) return;
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
      } catch (e) {
        console.error("Stats fetch error:", e);
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

  const handleBanUser = async (userId: string) => {
    const banUntil = new Date();
    banUntil.setDate(banUntil.getDate() + 3);

    if (confirm(isRtl ? "إيقاف المستخدم عن التفاعل (نشر/تعليق/دردشة) لمدة 3 أيام؟" : "Restrict user from interaction (post/comment/chat) for 3 days?")) {
      try {
        await updateDoc(doc(db, "users", userId), {
          isBannedUntil: Timestamp.fromDate(banUntil)
        });
        toast({ title: isRtl ? "تم إيقاف التفاعل بنجاح" : "Interaction restricted successfully" });
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to apply restriction" });
      }
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        isBannedUntil: null
      });
      toast({ title: isRtl ? "تم إلغاء الحظر" : "Restriction lifted" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const handleResolveReport = async (reportId: string, action: 'delete' | 'ignore') => {
    try {
      if (action === 'delete') {
        const report = reports.find(r => r.id === reportId);
        if (report && report.targetType === 'post') {
          await deleteDoc(doc(db, "posts", report.targetId));
        }
      }
      await updateDoc(doc(db, "reports", reportId), {
        status: "resolved",
        resolvedBy: user?.uid,
        resolvedAt: serverTimestamp()
      });
      toast({ title: isRtl ? "تمت معالجة البلاغ" : "Report resolved" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const handleToggleAdmin = async (targetUser: any) => {
    if (!isSuperAdmin) return;
    const newRole = targetUser.role === "admin" ? "user" : "admin";
    if (confirm(isRtl ? `تغيير رتبة ${targetUser.displayName}؟` : `Change role for ${targetUser.displayName}?`)) {
      await updateDoc(doc(db, "users", targetUser.id), { role: newRole });
      toast({ title: isRtl ? "تم تحديث الرتبة" : "Role updated" });
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (confirm(isRtl ? "حذف هذه المجموعة نهائياً؟" : "Delete this group permanently?")) {
      await deleteDoc(doc(db, "groups", groupId));
      toast({ title: isRtl ? "تم حذف المجموعة" : "Group deleted" });
    }
  };

  if (userLoading || (!isAdmin && !userLoading)) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-widest">{isRtl ? "جاري التحقق من الصلاحيات..." : "Verifying permissions..."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white max-w-4xl mx-auto border-x border-zinc-900 pb-20">
      <header className="p-6 border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className={cn("h-6 w-6", isRtl ? "rotate-180" : "")} />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tighter">{isRtl ? "مركز العمليات" : "Operations Center"}</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
              {isSuperAdmin ? "SUPER ADMIN ACCESS" : "MODERATOR ACCESS"}
            </p>
          </div>
        </div>
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <Settings2 className="h-5 w-5 text-primary" />
        </div>
      </header>

      <main className="p-6 space-y-8">
        {/* إحصائيات سريعة */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: isRtl ? "الأعضاء" : "Members", value: stats.users, icon: Users, color: "text-blue-500" },
            { label: isRtl ? "المنشورات" : "Posts", value: stats.posts, icon: LayoutDashboard, color: "text-green-500" },
            { label: isRtl ? "اللمة" : "Groups", value: stats.groups, icon: MessageSquare, color: "text-purple-500" },
            { label: isRtl ? "بلاغات" : "Reports", value: stats.reports, icon: AlertTriangle, color: "text-red-500" },
          ].map((stat, i) => (
            <Card key={i} className="bg-zinc-950 border-zinc-900 overflow-hidden group">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center relative">
                <stat.icon className={cn("h-4 w-4 mb-2 opacity-20 absolute top-2 right-2", stat.color)} />
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{stat.label}</p>
                <h3 className="text-xl font-black mt-1">
                  {statsLoading ? <Loader2 className="h-4 w-4 animate-spin inline" /> : stat.value}
                </h3>
              </CardContent>
            </Card>
          ))}
        </section>

        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="w-full bg-zinc-950 border border-zinc-900 h-14 p-1 rounded-2xl mb-6">
            <TabsTrigger value="reports" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
              {isRtl ? "البلاغات" : "Reports"} {reports.length > 0 && <Badge className="ml-2 bg-red-500">{reports.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
              {isRtl ? "الأعضاء" : "Members"}
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
              {isRtl ? "المجموعات" : "Groups"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4">
             {reportsLoading ? (
               <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-800" /></div>
             ) : reports.length > 0 ? (
               reports.map((report: any) => (
                 <div key={report.id} className="p-5 bg-zinc-950 border border-zinc-900 rounded-[2rem] space-y-4 transition-all hover:border-red-500/30">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-500/10 rounded-2xl"><Flag className="h-5 w-5 text-red-500" /></div>
                        <div>
                          <p className="text-sm font-bold">{isRtl ? "بلاغ عن " : "Report on "}{report.targetType}</p>
                          <p className="text-[10px] text-zinc-500 font-medium">السبب: {report.reason}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-red-500/50 text-red-500 text-[8px] font-black">PENDING</Badge>
                    </div>
                    <div className="flex gap-2">
                       <Button size="sm" variant="ghost" className="flex-1 rounded-xl border border-zinc-800 text-xs font-bold" onClick={() => handleResolveReport(report.id, 'ignore')}>
                         {isRtl ? "تجاهل" : "Ignore"}
                       </Button>
                       <Button size="sm" className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs" onClick={() => handleResolveReport(report.id, 'delete')}>
                         {isRtl ? "حذف المحتوى" : "Delete Content"}
                       </Button>
                    </div>
                 </div>
               ))
             ) : (
               <div className="py-24 text-center opacity-20 flex flex-col items-center">
                 <CheckCircle className="h-16 w-16 mb-4 text-zinc-600" />
                 <p className="text-sm font-black uppercase tracking-widest">{isRtl ? "نظيف.. لا توجد بلاغات" : "All clean.. no reports"}</p>
               </div>
             )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
             <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                <Input 
                  placeholder={isRtl ? "ابحث بالاسم أو البريد..." : "Search name or email..."} 
                  className="bg-zinc-950 border-zinc-900 rounded-2xl pl-12 h-12 text-sm"
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
               return (
                 <div key={member.id} className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-2xl hover:bg-zinc-900/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11 ring-1 ring-zinc-800">
                         <AvatarImage src={member.photoURL} />
                         <AvatarFallback>{member.displayName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                         <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold">{member.displayName}</p>
                            {member.role === "admin" && <ShieldCheck className="h-3.5 w-3.5 text-primary fill-primary" />}
                            {isBanned && <Clock className="h-3.5 w-3.5 text-orange-500 animate-pulse" />}
                         </div>
                         <p className="text-[10px] text-zinc-600 font-medium">@{member.email?.split('@')[0]}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                       {member.email !== SUPER_ADMIN_EMAIL && (
                         <>
                           {isSuperAdmin && (
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               className={cn("h-9 w-9 rounded-xl", member.role === "admin" ? "bg-primary/20 text-primary" : "text-zinc-700")}
                               onClick={() => handleToggleAdmin(member)}
                             >
                               <UserPlus className="h-4 w-4" />
                             </Button>
                           )}
                           {isBanned ? (
                             <Button variant="ghost" size="icon" className="h-9 w-9 text-orange-500" onClick={() => handleUnbanUser(member.id)}>
                               <CheckCircle className="h-4 w-4" />
                             </Button>
                           ) : (
                             <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-700 hover:text-orange-500" onClick={() => handleBanUser(member.id)}>
                               <Ban className="h-4 w-4" />
                             </Button>
                           )}
                           {isSuperAdmin && (
                             <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-800 hover:text-red-500" onClick={() => { if(confirm(isRtl ? "حذف العضو نهائياً؟" : "Delete user?")) deleteDoc(doc(db, "users", member.id)) }}>
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           )}
                         </>
                       )}
                    </div>
                 </div>
               );
             })}
          </TabsContent>

          <TabsContent value="groups" className="space-y-4">
             {groupsLoading ? (
               <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
             ) : allGroups.length > 0 ? (
               allGroups.map((group: any) => (
                 <div key={group.id} className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-xl border border-zinc-800">
                        {group.icon || "👥"}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{group.name}</p>
                        <p className="text-[10px] text-zinc-600 font-medium">{group.members?.length || 0} {isRtl ? "عضو" : "members"}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-800 hover:text-red-500" onClick={() => handleDeleteGroup(group.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                 </div>
               ))
             ) : (
               <div className="py-24 text-center opacity-20">
                 <p className="text-sm font-black uppercase tracking-widest">{isRtl ? "لا توجد مجموعات حالياً" : "No groups yet"}</p>
               </div>
             )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
