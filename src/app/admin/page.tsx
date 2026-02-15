
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
  Users,
  AlertTriangle,
  Megaphone,
  Star,
  ShieldAlert,
  ShieldCheck,
  Github,
  Rocket,
  CheckCircle,
  Trash2,
  Activity,
  Zap,
  BrainCircuit
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
import { syncToGitHub } from "@/lib/github-actions";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, ResponsiveContainer, Tooltip } from "recharts";

const SUPER_ADMIN_EMAIL = "adelbenmaza3@gmail.com";

export default function AdminDashboard() {
  const { user, loading: userLoading } = useUser();
  const { isRtl } = useLanguage();
  const router = useRouter();
  const db = useFirestore();

  const [searchQuery, setSearchQuery] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

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
          fromUserName: "SOVEREIGN COMMAND",
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

  const handleAiPlaceholder = () => {
    toast({ title: isRtl ? "الذكاء الاصطناعي قريباً" : "AI Coming Soon" });
  };

  const handleActionOnReport = async (reportId: string, action: 'ignore' | 'delete' | 'ban', postId?: string, authorId?: string) => {
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

  const handleToggleVerify = async (userId: string, current: boolean) => {
    await updateDoc(doc(db, "users", userId), { isVerified: !current });
    toast({ title: isRtl ? "تم تحديث التوثيق" : "Verification Updated" });
  };

  const handleTogglePro = async (userId: string, current: boolean) => {
    await updateDoc(doc(db, "users", userId), { isPro: !current });
    toast({ title: isRtl ? "تم تحديث رتبة الإعلام" : "Media Status Updated" });
  };

  const handleGitHubSync = async () => {
    if (!repoUrl.includes("github.com") || !githubToken) {
      toast({ variant: "destructive", title: isRtl ? "بيانات ناقصة" : "Missing Info" });
      return;
    }
    setIsSyncing(true);
    const result = await syncToGitHub(repoUrl, githubToken);
    if (result.success) {
      toast({ title: isRtl ? "تمت المزامنة بنجاح" : "Sync Successful" });
    } else {
      toast({ variant: "destructive", title: "Sync Failed", description: result.error });
    }
    setIsSyncing(false);
  };

  if (userLoading) {
    return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
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
              <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{isRtl ? "نبض المنصة" : "Sovereign Pulse"}</h2>
           </div>
           <Card className="bg-zinc-950 border-zinc-900 p-6 rounded-[2rem] h-[200px]">
              <ChartContainer config={{ value: { label: "Count", color: "#1E6FC9" } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" stroke="#3f3f46" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="var(--color-value)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
           </Card>
        </section>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="w-full bg-zinc-950 border border-zinc-900 h-14 p-1 rounded-2xl mb-6">
            <TabsTrigger value="users" className="flex-1 rounded-xl font-black text-[10px] uppercase data-[state=active]:bg-primary">{isRtl ? "الهويات" : "Identity"}</TabsTrigger>
            <TabsTrigger value="threats" className="flex-1 rounded-xl font-black text-[10px] uppercase data-[state=active]:bg-primary">{isRtl ? "التهديدات" : "Threats"}</TabsTrigger>
            <TabsTrigger value="broadcast" className="flex-1 rounded-xl font-black text-[10px] uppercase data-[state=active]:bg-primary">{isRtl ? "البث" : "Broadcast"}</TabsTrigger>
            <TabsTrigger value="deploy" className="flex-1 rounded-xl font-black text-[10px] uppercase data-[state=active]:bg-primary">{isRtl ? "النشر" : "Deploy"}</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                <Input placeholder={isRtl ? "ابحث عن مواطن..." : "Search citizen..."} className="bg-zinc-950 border-zinc-900 rounded-2xl pl-11 h-12 text-xs font-bold" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
             </div>
             <div className="space-y-3">
               {usersLoading ? (
                 <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary opacity-30" /></div>
               ) : (
                 allUsers.filter((u: any) => u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())).map((member: any) => (
                   <div key={member.id} className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-[2rem] hover:border-zinc-800 transition-all">
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
                         <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-xl", member.isVerified ? "bg-blue-500/10 text-blue-500" : "bg-zinc-900 text-zinc-700")} onClick={() => handleToggleVerify(member.id, member.isVerified)}>
                           <ShieldCheck className="h-4 w-4" />
                         </Button>
                         <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-xl", member.isPro ? "bg-yellow-500/10 text-yellow-500" : "bg-zinc-900 text-zinc-700")} onClick={() => handleTogglePro(member.id, member.isPro)}>
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
                         <Button variant="ghost" size="sm" className="h-7 rounded-lg bg-primary/10 text-primary text-[8px] font-black gap-1" onClick={handleAiPlaceholder}>
                            <BrainCircuit className="h-3 w-3" /> ذكاء اصطناعي (قريباً)
                         </Button>
                      </div>
                      <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                         <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 italic">"{r.postContent}"</p>
                         <p className="text-[9px] text-zinc-600 mt-2 font-bold">— {r.authorName}</p>
                      </div>
                      <div className="flex gap-2">
                         <Button variant="ghost" size="sm" className="flex-1 rounded-xl bg-green-500/10 text-green-500 font-black text-[10px]" onClick={() => handleActionOnReport(r.id, 'ignore')}>
                           <CheckCircle className="h-3 w-3 mr-1" /> {isRtl ? "تجاهل" : "Ignore"}
                         </Button>
                         <Button variant="ghost" size="sm" className="flex-1 rounded-xl bg-red-500/10 text-red-500 font-black text-[10px]" onClick={() => handleActionOnReport(r.id, 'delete', r.postId)}>
                           <Trash2 className="h-3 w-3 mr-1" /> {isRtl ? "حذف" : "Delete"}
                         </Button>
                         <Button variant="ghost" size="sm" className="flex-1 rounded-xl bg-zinc-900 text-white font-black text-[10px]" onClick={() => handleActionOnReport(r.id, 'ban', undefined, r.authorId)}>
                           <Ban className="h-3 w-3 mr-1" /> {isRtl ? "حظر" : "Ban"}
                         </Button>
                      </div>
                   </Card>
                 ))
               ) : (
                 <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
                   <CheckCircle className="h-12 w-12" />
                   <p className="text-sm font-black uppercase">{isRtl ? "لا توجد تهديدات" : "Zero Threats"}</p>
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
                <Button 
                  className="w-full h-14 rounded-2xl bg-white text-black font-black" 
                  disabled={isBroadcasting || !broadcastMessage.trim()} 
                  onClick={handleBroadcast}
                >
                  {isBroadcasting ? <Loader2 className="h-6 w-6 animate-spin" /> : (isRtl ? "تنفيذ البث" : "Execute")}
                </Button>
             </Card>
          </TabsContent>

          <TabsContent value="deploy" className="space-y-6">
             <Card className="bg-zinc-950 border-zinc-900 border-2 border-primary/10 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5"><Github className="h-24 w-24" /></div>
                <div className="flex items-center gap-3 mb-6">
                   <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                     <Github className="h-5 w-5 text-white" />
                   </div>
                   <h3 className="font-black text-sm uppercase tracking-widest">{isRtl ? "ي" : "Deploy"}</h3>
                </div>
                <div className="space-y-5">
                   <Input placeholder="GitHub Repo URL" className="bg-zinc-900 border-zinc-800 h-12 rounded-xl text-xs" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} />
                   <Input type="password" placeholder="PAT Token" className="bg-zinc-900 border-zinc-800 h-12 rounded-xl text-xs" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} />
                   <Button className="w-full h-14 rounded-2xl bg-white text-black font-black text-lg gap-3" disabled={isSyncing || !repoUrl || !githubToken} onClick={handleGitHubSync}>
                     {isSyncing ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Rocket className="h-5 w-5" /> {isRtl ? "رفع الكود" : "Push Code"}</>}
                   </Button>
                </div>
             </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
