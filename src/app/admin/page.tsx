
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  deleteDoc, 
  doc, 
  getDocs,
  getCountFromServer
} from "firebase/firestore";
import { 
  Users, 
  FileText, 
  MessageSquare, 
  ShieldAlert, 
  Trash2, 
  TrendingUp, 
  ArrowLeft,
  Loader2,
  Search,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ADMIN_EMAIL = "adelbenmaza3@gmail.com";

export default function AdminDashboard() {
  const { user, loading: userLoading } = useUser();
  const { isRtl } = useLanguage();
  const router = useRouter();
  const db = useFirestore();

  const [stats, setStats] = useState({ users: 0, posts: 0, groups: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // جلب البيانات العالمية للإدارة
  const { data: allUsers, loading: usersLoading } = useCollection<any>(
    query(collection(db, "users"), limit(100))
  );
  
  const { data: allPosts, loading: postsLoading } = useCollection<any>(
    query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(100))
  );

  const { data: allGroups, loading: groupsLoading } = useCollection<any>(
    query(collection(db, "groups"), orderBy("createdAt", "desc"), limit(50))
  );

  useEffect(() => {
    // حماية الصفحة: إذا لم يكن المستخدم هو المدير، يتم تحويله
    if (!userLoading && (!user || user.email !== ADMIN_EMAIL)) {
      router.replace("/");
    }

    const fetchStats = async () => {
      try {
        const usersCount = await getCountFromServer(collection(db, "users"));
        const postsCount = await getCountFromServer(collection(db, "posts"));
        const groupsCount = await getCountFromServer(collection(db, "groups"));
        
        setStats({
          users: usersCount.data().count,
          posts: postsCount.data().count,
          groups: groupsCount.data().count
        });
      } catch (error) {
        console.error("Stats fetch error:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    if (user?.email === ADMIN_EMAIL) {
      fetchStats();
    }
  }, [user, userLoading, router, db]);

  const handleDeletePost = async (postId: string) => {
    if (confirm(isRtl ? "حذف هذا المنشور نهائياً؟" : "Delete this post permanently?")) {
      try {
        await deleteDoc(doc(db, "posts", postId));
        toast({ title: isRtl ? "تم الحذف بنجاح" : "Deleted successfully" });
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete" });
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.uid) return;
    if (confirm(isRtl ? "حذف هذا المستخدم وجميع بياناته؟" : "Delete this user and all data?")) {
      try {
        await deleteDoc(doc(db, "users", userId));
        toast({ title: isRtl ? "تم حذف المستخدم" : "User deleted" });
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete user" });
      }
    }
  };

  if (userLoading || (!user && userLoading)) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-widest">{isRtl ? "جاري التحقق من الصلاحيات..." : "Verifying Permissions..."}</p>
      </div>
    );
  }

  if (user?.email !== ADMIN_EMAIL) return null;

  return (
    <div className="min-h-screen bg-black text-white max-w-4xl mx-auto border-x border-zinc-900 pb-20">
      <header className="p-6 border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className={cn("h-6 w-6", isRtl ? "rotate-180" : "")} />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tighter">{isRtl ? "مركز التحكم" : "Control Center"}</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">{isRtl ? "نظام الإدارة الموحد" : "Unified Admin OS"}</p>
          </div>
        </div>
        <div className="bg-primary/10 border border-primary/20 px-3 py-1 rounded-full flex items-center gap-2">
           <ShieldAlert className="h-3 w-3 text-primary" />
           <span className="text-[9px] font-black uppercase text-primary">{isRtl ? "وضع المدير" : "Admin Mode"}</span>
        </div>
      </header>

      <main className="p-6 space-y-8">
        {/* ملخص الإحصائيات */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title={isRtl ? "المستخدمين" : "Users"} 
            value={stats.users} 
            icon={Users} 
            color="text-blue-500" 
            loading={loadingStats}
          />
          <StatCard 
            title={isRtl ? "المنشورات" : "Posts"} 
            value={stats.posts} 
            icon={FileText} 
            color="text-orange-500" 
            loading={loadingStats}
          />
          <StatCard 
            title={isRtl ? "اللمة" : "Groups"} 
            value={stats.groups} 
            icon={MessageSquare} 
            color="text-purple-500" 
            loading={loadingStats}
          />
        </section>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full bg-zinc-950 border border-zinc-900 h-14 p-1 rounded-2xl mb-6">
            <TabsTrigger value="posts" className="flex-1 rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-zinc-900 transition-all">
              {isRtl ? "المنشورات" : "Posts"}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-zinc-900 transition-all">
              {isRtl ? "الأعضاء" : "Members"}
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex-1 rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-zinc-900 transition-all">
              {isRtl ? "المجموعات" : "Groups"}
            </TabsTrigger>
          </TabsList>

          {/* تبويب المنشورات */}
          <TabsContent value="posts" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">{isRtl ? "أحدث المنشورات" : "Latest Content"}</h3>
            </div>
            {postsLoading ? (
              <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-800" /></div>
            ) : allPosts.map((post: any) => (
              <div key={post.id} className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 flex items-start gap-4 group hover:border-primary/30 transition-all">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={post.author?.avatar} />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold">{post.author?.name || "Anonymous"}</p>
                      <p className="text-[10px] text-zinc-600">@{post.author?.handle}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-full h-8 w-8"
                      onClick={() => handleDeletePost(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-zinc-300 line-clamp-2">{post.content}</p>
                  {post.mediaUrl && (
                    <div className="mt-3 rounded-2xl overflow-hidden border border-zinc-900 max-h-40">
                      <img src={post.mediaUrl} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" alt="Media" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* تبويب المستخدمين */}
          <TabsContent value="users" className="space-y-4">
             <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                <Input 
                  placeholder={isRtl ? "ابحث عن عضو..." : "Search members..."} 
                  className="bg-zinc-950 border-zinc-900 rounded-2xl pl-12 h-12 focus:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             {usersLoading ? (
               <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-800" /></div>
             ) : allUsers.filter((u: any) => u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase())).map((member: any) => (
               <div key={member.id} className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-2xl hover:bg-zinc-900/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                       <AvatarImage src={member.photoURL} />
                       <AvatarFallback>{member.displayName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                       <div className="flex items-center gap-2">
                          <p className="text-sm font-bold">{member.displayName}</p>
                          {member.role === 'admin' && <CheckCircle className="h-3 w-3 text-primary" />}
                       </div>
                       <p className="text-[10px] text-zinc-600">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className={cn(
                       "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border",
                       member.isVerified ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-zinc-800 text-zinc-500 border-zinc-700"
                     )}>
                        {member.isVerified ? (isRtl ? "موثق" : "Verified") : (isRtl ? "عادي" : "User")}
                     </span>
                     {member.uid !== user?.uid && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-zinc-800 hover:text-red-500 hover:bg-red-500/10 rounded-full"
                          onClick={() => handleDeleteUser(member.uid)}
                        >
                           <Trash2 className="h-4 w-4" />
                        </Button>
                     )}
                  </div>
               </div>
             ))}
          </TabsContent>

          {/* تبويب المجموعات */}
          <TabsContent value="groups" className="space-y-4">
             {groupsLoading ? (
               <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-800" /></div>
             ) : allGroups.length > 0 ? (
               allGroups.map((group: any) => (
                 <div key={group.id} className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-2xl border border-zinc-800">
                          {group.icon || "👥"}
                       </div>
                       <div className="text-left">
                          <p className="text-sm font-bold">{group.name}</p>
                          <p className="text-[10px] text-zinc-600">{group.memberCount} {isRtl ? "عضو" : "members"}</p>
                       </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-zinc-800 hover:text-red-500 rounded-full h-9 w-9"
                      onClick={() => {
                        if (confirm(isRtl ? "حذف هذه المجموعة؟" : "Delete this group?")) {
                          deleteDoc(doc(db, "groups", group.id));
                        }
                      }}
                    >
                       <Trash2 className="h-4 w-4" />
                    </Button>
                 </div>
               ))
             ) : (
               <div className="py-20 text-center opacity-20">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm font-bold">{isRtl ? "لا توجد مجموعات" : "No groups found"}</p>
               </div>
             )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, loading }: any) {
  return (
    <Card className="bg-zinc-950 border-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl transition-all hover:scale-105 active:scale-95">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{title}</p>
            <div className="text-2xl font-black">
              {loading ? <Loader2 className="h-5 w-5 animate-spin text-zinc-800" /> : value}
            </div>
          </div>
          <div className={cn("p-3 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-inner", color)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
