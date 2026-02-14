
"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { useLanguage } from "@/context/LanguageContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Plus, MessageSquare, Loader2, Users, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";

export default function LammaPage() {
  const { t, isRtl } = useLanguage();
  const db = useFirestore();
  const { user } = useUser();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [selectedFollowers, setSelectedFollowers] = useState<string[]>([]);

  // Fetch only my followers to invite
  const followersQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, "follows"), where("followingId", "==", user.uid));
  }, [db, user]);
  const { data: followDocs, loading: followersLoading } = useCollection<any>(followersQuery);

  const [followersDetails, setFollowersDetails] = useState<any[]>([]);

  useEffect(() => {
    const fetchFollowerDetails = async () => {
      if (followDocs.length > 0) {
        const details = [];
        for (const f of followDocs) {
          const uDoc = await getDocs(query(collection(db, "users"), where("uid", "==", f.followerId)));
          if (!uDoc.empty) {
            details.push(uDoc.docs[0].data());
          }
        }
        setFollowersDetails(details);
      }
    };
    fetchFollowerDetails();
  }, [followDocs, db]);

  const groupsQuery = useMemoFirebase(() => {
    return query(collection(db, "groups"), where("isPrivate", "==", true));
  }, [db]);

  const { data: groups, loading } = useCollection<any>(groupsQuery);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !user || selectedFollowers.length === 0) {
      toast({
        variant: "destructive",
        title: isRtl ? "تنبيه" : "Alert",
        description: isRtl ? "يرجى اختيار اسم للمجموعة ومتابع واحد على الأقل" : "Please provide a name and select at least one follower.",
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
        topic: "Followers Only",
        createdAt: serverTimestamp()
      });
      
      setIsCreateOpen(false);
      setNewGroupName("");
      setNewGroupDesc("");
      setSelectedFollowers([]);
      toast({
        title: isRtl ? "تم إنشاء اللمة" : "Lamma Created",
        description: isRtl ? "تم إنشاء مجموعتك الخاصة بمتابعيك" : "Your private followers group has been created.",
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
    <div className="flex flex-col md:flex-row min-h-screen max-w-7xl mx-auto">
      <AppSidebar />
      
      <main className="flex-1 bg-black border-x border-zinc-900 min-h-screen text-white">
        <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-900 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{isRtl ? "رسائلي (اللمة)" : "My Messages (Lamma)"}</h2>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-full gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  {isRtl ? "بدأ لمة جديدة" : "New Lamma"}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md">
                <DialogHeader>
                  <DialogTitle>{isRtl ? "إنشاء مجموعة لمتابعيك" : "Create Group for Followers"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>{isRtl ? "اسم المجموعة" : "Group Name"}</Label>
                    <Input 
                      placeholder={isRtl ? "مثلاً: ديوانية الأصدقاء" : "e.g. Friends Lounge"} 
                      className="bg-zinc-900 border-zinc-800"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex justify-between">
                      {isRtl ? "اختر من متابعيك" : "Select from Followers"}
                      <span className="text-primary text-xs">{selectedFollowers.length} {isRtl ? "مختار" : "selected"}</span>
                    </Label>
                    <div className="max-h-48 overflow-y-auto space-y-2 bg-zinc-900/50 p-2 rounded-lg custom-scrollbar">
                      {followersLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 
                        followersDetails.length > 0 ? followersDetails.map((f) => (
                          <div key={f.uid} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-md cursor-pointer" onClick={() => toggleFollower(f.uid)}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={f.photoURL} />
                                <AvatarFallback>{f.displayName?.[0]}</AvatarFallback>
                              </Avatar>
                              <div className="text-left">
                                <p className="text-sm font-medium">{f.displayName}</p>
                                <p className="text-[10px] text-zinc-500">@{f.email?.split('@')[0]}</p>
                              </div>
                            </div>
                            <Checkbox checked={selectedFollowers.includes(f.uid)} className="rounded-full" />
                          </div>
                        )) : <p className="text-center text-xs text-zinc-600 py-4">{isRtl ? "لا يوجد متابعون حالياً" : "No followers yet"}</p>
                      }
                    </div>
                  </div>

                  <Button className="w-full bg-primary hover:bg-primary/90 font-bold" onClick={handleCreateGroup}>
                    {isRtl ? "إنشاء الآن" : "Create Now"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder={isRtl ? "ابحث في محادثاتك..." : "Search in your chats..."} 
              className="pl-10 rounded-full bg-zinc-900 border-none h-10 text-sm focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </header>

        <div className="p-4 grid grid-cols-1 gap-3 pb-24">
          {loading ? (
            <div className="flex justify-center p-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : groups.length > 0 ? (
            groups.filter(g => g.members?.includes(user?.uid)).map((comm) => (
              <Link href={`/lamma/${comm.id}`} key={comm.id}>
                <div className="flex items-center gap-4 p-4 bg-zinc-950 border border-zinc-900 hover:border-primary transition-all rounded-2xl group shadow-sm">
                  <div className="text-2xl bg-zinc-900 h-14 w-14 rounded-full flex items-center justify-center border border-zinc-800 shrink-0">
                    {comm.icon || "👥"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-white truncate group-hover:text-primary transition-colors">{comm.name}</h3>
                      <Badge variant="outline" className="text-[8px] border-zinc-800 text-zinc-500">{isRtl ? "متابعين فقط" : "Followers"}</Badge>
                    </div>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{comm.description || (isRtl ? "مجموعة خاصة" : "Private group")}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Users className="h-3 w-3 text-zinc-600" />
                      <span className="text-[10px] text-zinc-600">{comm.memberCount || 0} {isRtl ? "عضو" : "members"}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center p-12 text-zinc-600 flex flex-col items-center gap-4">
              <MessageSquare className="h-12 w-12 opacity-20" />
              <p>{isRtl ? "ابدأ أول لمة خاصة بمتابعيك الآن!" : "Start your first followers-only Lamma!"}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
