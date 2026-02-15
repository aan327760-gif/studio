
"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Plus, MessageSquare, Loader2, Users, UserPlus, Globe, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, where, addDoc, serverTimestamp, getDocs, limit, doc, getDoc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const ADMIN_EMAIL = "adelbenmaza3@gmail.com";

export default function LammaPage() {
  const { isRtl } = useLanguage();
  const db = useFirestore();
  const { user } = useUser();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [selectedFollowers, setSelectedFollowers] = useState<string[]>([]);
  const [followersDetails, setFollowersDetails] = useState<any[]>([]);
  const [fetchingFollowers, setFetchingFollowers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const userProfileRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<any>(userProfileRef);

  // صلاحية الإنشاء: الموثقين، الإعلام، أو المدير العام
  const isAuthorizedToCreate = profile?.isVerified || profile?.isPro || user?.email === ADMIN_EMAIL;

  // جلب المتابعين للدعوة
  const followersQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, "follows"), where("followingId", "==", user.uid), limit(50));
  }, [db, user]);
  
  const { data: followDocs = [] } = useCollection<any>(followersQuery);

  useEffect(() => {
    const fetchFollowerDetails = async () => {
      if (followDocs.length > 0 && user) {
        setFetchingFollowers(true);
        try {
          const details = [];
          for (const f of followDocs) {
            const uDocRef = doc(db, "users", f.followerId);
            const uDoc = await getDoc(uDocRef);
            if (uDoc.exists()) {
              details.push({ ...uDoc.data(), id: uDoc.id });
            }
          }
          setFollowersDetails(details);
        } catch (error) {
          console.error("Error details:", error);
        } finally {
          setFetchingFollowers(false);
        }
      } else {
        setFollowersDetails([]);
      }
    };
    fetchFollowerDetails();
  }, [followDocs, db, user]);

  // جلب مجموعاتي
  const myGroupsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, "groups"), where("members", "array-contains", user.uid));
  }, [db, user]);
  const { data: myGroups = [], loading: myGroupsLoading } = useCollection<any>(myGroupsQuery);

  // جلب المجموعات العامة للاكتشاف
  const discoverGroupsQuery = useMemoFirebase(() => {
    return query(collection(db, "groups"), where("isPrivate", "==", false), limit(20));
  }, [db]);
  const { data: publicGroups = [], loading: discoverLoading } = useCollection<any>(discoverGroupsQuery);

  const filteredMyGroups = useMemo(() => {
    if (!searchQuery.trim()) return myGroups;
    return myGroups.filter(g => g.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [myGroups, searchQuery]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !user || !isAuthorizedToCreate) return;
    try {
      await addDoc(collection(db, "groups"), {
        name: newGroupName,
        description: newGroupDesc,
        createdBy: user.uid,
        memberCount: selectedFollowers.length + 1,
        members: [user.uid, ...selectedFollowers],
        icon: isPrivate ? "🔒" : "🌍",
        isPrivate: isPrivate,
        createdAt: serverTimestamp()
      });
      setIsCreateOpen(false);
      setNewGroupName("");
      setNewGroupDesc("");
      setSelectedFollowers([]);
      toast({ title: isRtl ? "تم إنشاء اللمة" : "Lamma Created" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const handleJoin = async (groupId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "groups", groupId), {
        members: arrayUnion(user.uid),
        memberCount: increment(1)
      });
      toast({ title: isRtl ? "تم الانضمام" : "Joined" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const toggleFollower = (id: string) => {
    setSelectedFollowers(prev => prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-900">
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-900 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight">{isRtl ? "اللمة" : "Lamma"}</h2>
          
          {isAuthorizedToCreate && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-xl gap-2 bg-primary font-bold h-9">
                  <Plus className="h-4 w-4" />
                  {isRtl ? "لمة جديدة" : "New Lamma"}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-[90%] rounded-[2.5rem]">
                <DialogHeader><DialogTitle className="text-center font-black uppercase">{isRtl ? "بدء لمة سيادية" : "Sovereign Lamma"}</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <Input placeholder={isRtl ? "اسم المجموعة" : "Group Name"} className="bg-zinc-900 border-zinc-800 rounded-xl h-12" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
                  <Input placeholder={isRtl ? "الوصف" : "Description"} className="bg-zinc-900 border-zinc-800 rounded-xl h-12" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} />
                  <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                     <span className="text-xs font-bold">{isRtl ? "مجموعة خاصة" : "Private Group"}</span>
                     <Checkbox checked={isPrivate} onCheckedChange={(v) => setIsPrivate(!!v)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-zinc-500">{isRtl ? "دعوة المواطنين" : "Invite Citizens"}</Label>
                    <div className="max-h-40 overflow-y-auto space-y-1 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800">
                      {followersDetails.length > 0 ? followersDetails.map((f) => (
                        <div key={f.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg cursor-pointer" onClick={() => toggleFollower(f.id)}>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8"><AvatarImage src={f.photoURL} /><AvatarFallback>U</AvatarFallback></Avatar>
                            <span className="text-xs font-bold">{f.displayName}</span>
                          </div>
                          <Checkbox checked={selectedFollowers.includes(f.id)} className="rounded-full" />
                        </div>
                      )) : (
                        <p className="text-[10px] text-center py-4 opacity-40">{isRtl ? "لا يوجد متابعون حالياً" : "No followers found"}</p>
                      )}
                    </div>
                  </div>
                  <Button className="w-full bg-white text-black font-black rounded-xl h-12" onClick={handleCreateGroup}>{isRtl ? "إنشاء الآن" : "Create Now"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input placeholder={isRtl ? "ابحث في اللمة..." : "Search Lamma..."} className="pl-10 rounded-full bg-zinc-900 border-none h-11 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <Tabs defaultValue="my" className="w-full">
          <TabsList className="w-full bg-black h-12 rounded-none p-0 border-b border-zinc-900">
            <TabsTrigger value="my" className="flex-1 h-full rounded-none font-black text-[10px] uppercase data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
              {isRtl ? "محادثاتي" : "My Chats"}
            </TabsTrigger>
            <TabsTrigger value="discover" className="flex-1 h-full rounded-none font-black text-[10px] uppercase data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
              {isRtl ? "اكتشف" : "Discover"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my" className="p-4 m-0 space-y-3">
            {myGroupsLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" /></div>
            ) : filteredMyGroups.length > 0 ? (
              filteredMyGroups.map((group) => (
                <Link href={`/lamma/${group.id}`} key={group.id}>
                  <div className="flex items-center gap-4 p-4 bg-zinc-950 border border-zinc-900 hover:border-primary rounded-3xl transition-all shadow-sm active:scale-95">
                    <div className="text-2xl bg-zinc-900 h-12 w-12 rounded-2xl flex items-center justify-center border border-zinc-800 shrink-0">{group.icon || "👥"}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-white truncate">{group.name}</h3>
                        {group.isPrivate && <ShieldCheck className="h-3 w-3 text-primary" />}
                      </div>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">{group.description || (isRtl ? "مجموعة سيادية" : "Sovereign group")}</p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-32 opacity-20 flex flex-col items-center gap-6"><MessageSquare className="h-16 w-16" /><p className="text-sm font-black uppercase">{isRtl ? "لا توجد محادثات" : "No Chats"}</p></div>
            )}
          </TabsContent>

          <TabsContent value="discover" className="p-4 m-0 space-y-3">
            {discoverLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" /></div>
            ) : publicGroups.length > 0 ? (
              publicGroups.filter(g => !g.members?.includes(user?.uid)).map((group) => (
                <div key={group.id} className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-3xl transition-all group">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl">{group.icon || "🌍"}</div>
                    <div className="min-w-0">
                      <h3 className="font-black text-sm text-white truncate">{group.name}</h3>
                      <p className="text-[10px] text-zinc-500 font-bold">{group.memberCount || 0} {isRtl ? "عضو" : "Members"}</p>
                    </div>
                  </div>
                  <Button size="sm" className="rounded-full bg-white text-black font-black px-6 h-9" onClick={() => handleJoin(group.id)}>
                    {isRtl ? "انضمام" : "Join"}
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-32 opacity-20 flex flex-col items-center gap-6"><Globe className="h-16 w-16" /><p className="text-sm font-black uppercase">{isRtl ? "لا توجد مجتمعات عامة" : "No Public Spaces"}</p></div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <AppSidebar />
    </div>
  );
}
