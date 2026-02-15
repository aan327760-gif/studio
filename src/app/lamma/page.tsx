
"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Plus, MessageSquare, Loader2, Users, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, addDoc, serverTimestamp, getDocs, limit, doc, getDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";

export default function LammaPage() {
  const { isRtl } = useLanguage();
  const db = useFirestore();
  const { user } = useUser();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [selectedFollowers, setSelectedFollowers] = useState<string[]>([]);
  const [followersDetails, setFollowersDetails] = useState<any[]>([]);
  const [fetchingFollowers, setFetchingFollowers] = useState(false);

  // جلب المتابعين (من يتابعني)
  const followersQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, "follows"), where("followingId", "==", user.uid), limit(50));
  }, [db, user]);
  
  const { data: followDocs = [], loading: followersLoading } = useCollection<any>(followersQuery);

  // جلب تفاصيل المتابعين من مجموعة الـ UIDs
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
          console.error("Error fetching followers details:", error);
        } finally {
          setFetchingFollowers(false);
        }
      } else {
        setFollowersDetails([]);
      }
    };
    fetchFollowerDetails();
  }, [followDocs, db, user]);

  // جلب المجموعات التي أنا عضو فيها
  const groupsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, "groups"), 
      where("members", "array-contains", user.uid)
    );
  }, [db, user]);

  const { data: groups = [], loading: groupsLoading } = useCollection<any>(groupsQuery);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !user) {
      toast({
        variant: "destructive",
        title: isRtl ? "تنبيه" : "Alert",
        description: isRtl ? "يرجى إدخال اسم للمجموعة" : "Please provide a group name.",
      });
      return;
    }
    
    try {
      await addDoc(collection(db, "groups"), {
        name: newGroupName,
        description: newGroupDesc,
        createdBy: user.uid,
        memberCount: selectedFollowers.length + 1,
        members: [user.uid, ...selectedFollowers],
        icon: "👥",
        isPrivate: true,
        createdAt: serverTimestamp()
      });
      
      setIsCreateOpen(false);
      setNewGroupName("");
      setNewGroupDesc("");
      setSelectedFollowers([]);
      toast({
        title: isRtl ? "تم إنشاء اللمة" : "Lamma Created",
        description: isRtl ? "يمكنك الآن البدء في الدردشة" : "You can now start chatting.",
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create group" });
    }
  };

  const toggleFollower = (id: string) => {
    setSelectedFollowers(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-900">
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black tracking-tight">{isRtl ? "اللمة" : "Lamma"}</h2>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl gap-2 bg-primary hover:bg-primary/90 font-bold h-9">
                <Plus className="h-4 w-4" />
                {isRtl ? "لمة جديدة" : "New Lamma"}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-[90%] rounded-[2rem] outline-none">
              <DialogHeader>
                <DialogTitle className="text-center font-black">{isRtl ? "بدء لمة جديدة" : "Start New Lamma"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{isRtl ? "اسم المجموعة" : "Group Name"}</Label>
                  <Input 
                    placeholder={isRtl ? "مثلاً: نقاشات حرة" : "e.g. Free Discussions"} 
                    className="bg-zinc-900 border-zinc-800 rounded-xl h-12"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="flex justify-between items-center text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                    {isRtl ? "من المتابعين" : "From Followers"}
                    <span className="text-primary">{selectedFollowers.length} {isRtl ? "مختار" : "selected"}</span>
                  </Label>
                  <div className="max-h-48 overflow-y-auto space-y-1 bg-zinc-900/50 p-2 rounded-xl custom-scrollbar border border-zinc-800">
                    {fetchingFollowers ? (
                      <div className="p-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                    ) : followersDetails.length > 0 ? (
                      followersDetails.map((f) => (
                        <div key={f.uid} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors" onClick={() => toggleFollower(f.uid)}>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={f.photoURL} />
                              <AvatarFallback>{f.displayName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="text-left">
                              <p className="text-xs font-bold">{f.displayName}</p>
                              <p className="text-[10px] text-zinc-500">@{f.email?.split('@')[0]}</p>
                            </div>
                          </div>
                          <Checkbox checked={selectedFollowers.includes(f.uid)} className="rounded-full h-5 w-5" />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 space-y-3">
                        <Users className="h-8 w-8 mx-auto text-zinc-800" />
                        <p className="text-[10px] text-zinc-600 font-bold px-4">{isRtl ? "يجب أن يتابعك شخص ما لتتمكن من دعوته" : "Someone must follow you to invite them"}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Button className="w-full bg-white text-black hover:bg-zinc-200 font-black rounded-xl h-12 shadow-xl" onClick={handleCreateGroup}>
                  {isRtl ? "إنشاء الآن" : "Create Now"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder={isRtl ? "ابحث في محادثاتك..." : "Search in your chats..."} 
            className="pl-10 rounded-full bg-zinc-900 border-none h-11 text-sm focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {groupsLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest">Syncing Chats</p>
          </div>
        ) : groups.length > 0 ? (
          <div className="space-y-3">
            {groups.map((group) => (
              <Link href={`/lamma/${group.id}`} key={group.id}>
                <div className="flex items-center gap-4 p-4 bg-zinc-950 border border-zinc-900 hover:border-primary transition-all rounded-[1.5rem] group shadow-sm active:scale-95">
                  <div className="text-2xl bg-zinc-900 h-12 w-12 rounded-2xl flex items-center justify-center border border-zinc-800 shrink-0">
                    {group.icon || "👥"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-white truncate group-hover:text-primary transition-colors">{group.name}</h3>
                      <Badge variant="outline" className="text-[8px] border-zinc-800 text-zinc-500 font-bold tracking-tighter uppercase">{isRtl ? "نشط" : "Active"}</Badge>
                    </div>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{group.description || (isRtl ? "مجموعة خاصة" : "Private group")}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 px-10 flex flex-col items-center gap-6">
            <div className="h-20 w-20 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center">
              <MessageSquare className="h-10 w-10 text-zinc-800" />
            </div>
            <div className="space-y-2">
              <p className="font-black text-lg">{isRtl ? "لا توجد محادثات بعد" : "No chats yet"}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {isRtl ? "ابدأ بمتابعة الأشخاص واطلب منهم متابعتك لتبدأ في بناء لمتك الخاصة." : "Start following people and ask them to follow back to build your Lamma."}
              </p>
            </div>
            <Link href="/explore">
              <Button variant="outline" className="rounded-full border-zinc-800 font-bold h-10 px-8">
                {isRtl ? "اكتشف أشخاصاً" : "Discover People"}
              </Button>
            </Link>
          </div>
        )}
      </main>

      <AppSidebar />
    </div>
  );
}
