
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  deleteDoc, 
  doc, 
  updateDoc, 
  Timestamp,
  where,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { 
  Users, 
  FileText, 
  MessageSquare, 
  ShieldAlert, 
  Trash2, 
  ArrowLeft,
  Loader2,
  Search,
  Ban,
  Clock,
  UserCheck,
  UserX,
  ShieldCheck,
  Flag,
  CheckCircle,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const SUPER_ADMIN_EMAIL = "adelbenmaza3@gmail.com";

export default function AdminDashboard() {
  const { user, loading: userLoading } = useUser();
  const { isRtl } = useLanguage();
  const router = useRouter();
  const db = useFirestore();

  const userProfileRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: currentUserProfile } = useDoc<any>(userProfileRef);

  const [searchQuery, setSearchQuery] = useState("");
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;
  const isAdmin = isSuperAdmin || currentUserProfile?.role === "admin";

  // جلب المستخدمين
  const { data: allUsers, loading: usersLoading } = useCollection<any>(
    query(collection(db, "users"), limit(50))
  );
  
  // جلب البلاغات (توزيعها: غير المسندة أو المسندة لهذا المشرف)
  const reportsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, "reports"), 
      where("status", "==", "pending"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  }, [db, user]);
  const { data: reports = [], loading: reportsLoading } = useCollection<any>(reportsQuery);

  useEffect(() => {
    if (!userLoading && !isAdmin && !userLoading) {
      router.replace("/");
    }
  }, [user, userLoading, router, isAdmin]);

  const handleBanUser = async (userId: string) => {
    const banUntil = new Date();
    banUntil.setDate(banUntil.getDate() + 3);

    if (confirm(isRtl ? "إيقاف المستخدم عن التفاعل لمدة 3 أيام؟" : "Restrict user interaction for 3 days?")) {
      try {
        await updateDoc(doc(db, "users", userId), {
          isBannedUntil: Timestamp.fromDate(banUntil)
        });
        toast({ title: isRtl ? "تم إيقاف التفاعل" : "Interaction restricted" });
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to apply ban" });
      }
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
      toast({ title: "Updated" });
    }
  };

  if (userLoading || (!isAdmin && !userLoading)) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-widest">{isRtl ? "جاري التحقق..." : "Verifying..."}</p>
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
            <h1 className="text-2xl font-black tracking-tighter">{isRtl ? "مركز التحكم" : "Control Center"}</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
              {isSuperAdmin ? "SUPER ADMIN" : "MODERATOR"}
            </p>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-8">
        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="w-full bg-zinc-950 border border-zinc-900 h-14 p-1 rounded-2xl mb-6">
            <TabsTrigger value="reports" className="flex-1 rounded-xl font-black text-xs uppercase tracking-widest transition-all">
              {isRtl ? "البلاغات" : "Reports"} {reports.length > 0 && <Badge className="ml-2 bg-red-500">{reports.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 rounded-xl font-black text-xs uppercase tracking-widest transition-all">
              {isRtl ? "الأعضاء" : "Members"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4">
             {reportsLoading ? (
               <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-800" /></div>
             ) : reports.length > 0 ? (
               reports.map((report: any) => (
                 <div key={report.id} className="p-5 bg-zinc-950 border border-zinc-900 rounded-[2rem] space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-xl"><Flag className="h-5 w-5 text-red-500" /></div>
                        <div>
                          <p className="text-sm font-bold">{isRtl ? "بلاغ عن " : "Report on "}{report.targetType}</p>
                          <p className="text-[10px] text-zinc-500">{report.reason}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-red-500/50 text-red-500">PENDING</Badge>
                    </div>
                    <div className="flex gap-2">
                       <Button size="sm" variant="outline" className="flex-1 rounded-xl border-zinc-800" onClick={() => handleResolveReport(report.id, 'ignore')}>
                         {isRtl ? "تجاهل" : "Ignore"}
                       </Button>
                       <Button size="sm" className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold" onClick={() => handleResolveReport(report.id, 'delete')}>
                         {isRtl ? "حذف المحتوى" : "Delete Content"}
                       </Button>
                    </div>
                 </div>
               ))
             ) : (
               <div className="py-20 text-center opacity-30">
                 <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                 <p className="text-sm font-bold">{isRtl ? "لا توجد بلاغات معلقة" : "No pending reports"}</p>
               </div>
             )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
             <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                <Input 
                  placeholder={isRtl ? "ابحث عن عضو..." : "Search members..."} 
                  className="bg-zinc-950 border-zinc-900 rounded-2xl pl-12 h-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             {allUsers?.filter((u: any) => u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())).map((member: any) => {
               const isBanned = member.isBannedUntil && member.isBannedUntil.toDate() > new Date();
               return (
                 <div key={member.id} className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                         <AvatarImage src={member.photoURL} />
                         <AvatarFallback>{member.displayName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                         <div className="flex items-center gap-2">
                            <p className="text-sm font-bold">{member.displayName}</p>
                            {member.role === "admin" && <ShieldCheck className="h-3 w-3 text-primary" />}
                            {isBanned && <Clock className="h-3 w-3 text-orange-500" />}
                         </div>
                         <p className="text-[10px] text-zinc-600">@{member.email?.split('@')[0]}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       {member.email !== SUPER_ADMIN_EMAIL && (
                         <>
                           {isSuperAdmin && (
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               className={cn("h-8 w-8 rounded-full", member.role === "admin" ? "text-primary" : "text-zinc-700")}
                               onClick={() => handleToggleAdmin(member)}
                             >
                               <UserPlus className="h-4 w-4" />
                             </Button>
                           )}
                           {isBanned ? (
                             <Badge variant="outline" className="text-orange-500 border-orange-500/30">RESTRICTED</Badge>
                           ) : (
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-700 hover:text-orange-500" onClick={() => handleBanUser(member.id)}>
                               <Ban className="h-4 w-4" />
                             </Button>
                           )}
                           {isSuperAdmin && (
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-800 hover:text-red-500" onClick={() => deleteDoc(doc(db, "users", member.id))}>
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
        </Tabs>
      </main>
    </div>
  );
}
