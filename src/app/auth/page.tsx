
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp, query, collection, where, getDocs, limit, updateDoc, increment } from "firebase/firestore";
import { useAuth, useFirestore } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import { Loader2 } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COUNTRIES = [
  "Algeria", "Egypt", "Saudi Arabia", "Morocco", "Tunisia", "Jordan", "Syria", "Lebanon", "Iraq", "Palestine", "UAE", "Qatar", "Kuwait", "Oman", "Global"
];

const ADMIN_EMAIL = "adelbenmaza3@gmail.com";

export default function AuthPage() {
  const { isRtl } = useLanguage();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
    nationality: "Algeria"
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        toast({ title: isRtl ? "مرحباً بك مجدداً" : "Welcome back" });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: formData.displayName });

        const userProfileData = {
          uid: user.uid,
          email: user.email,
          displayName: formData.displayName,
          nationality: formData.nationality,
          // المدير العام يحصل على 1000 نقطة سيادية، المواطن العادي 100
          points: formData.email === ADMIN_EMAIL ? 1000 : 100, 
          photoURL: `https://picsum.photos/seed/${user.uid}/200/200`,
          createdAt: serverTimestamp(),
          followersCount: 0,
          followingCount: 0,
          role: formData.email === ADMIN_EMAIL ? "admin" : "user",
          isVerified: formData.email === ADMIN_EMAIL
        };

        await setDoc(doc(db, "users", user.uid), userProfileData);

        // بروتوكول الولاء التلقائي: متابعة حساب المدير العام فوراً
        try {
          const adminQuery = query(collection(db, "users"), where("email", "==", ADMIN_EMAIL), limit(1));
          const adminSnap = await getDocs(adminQuery);
          if (!adminSnap.empty) {
            const adminDoc = adminSnap.docs[0];
            const adminId = adminDoc.id;
            
            if (user.uid !== adminId) {
              const followId = `${user.uid}_${adminId}`;
              await setDoc(doc(db, "follows", followId), {
                followerId: user.uid,
                followingId: adminId,
                createdAt: serverTimestamp()
              });

              await updateDoc(doc(db, "users", adminId), { followersCount: increment(1) });
              await updateDoc(doc(db, "users", user.uid), { followingCount: increment(1) });
            }
          }
        } catch (followError) {
          console.error("Auto-follow admin failed:", followError);
        }

        toast({ 
          title: isRtl ? "تم التسجيل بنجاح" : "Registered Successfully", 
          description: formData.email === ADMIN_EMAIL 
            ? (isRtl ? "تم منحك 1000 نقطة سيادية." : "You received 1000 sovereign points.")
            : (isRtl ? "حصلت على 100 نقطة هدية للبدء." : "You received 100 points gift.") 
        });
      }
      router.push("/");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Auth Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-950 border-zinc-900 text-white shadow-2xl rounded-[3rem] overflow-hidden">
        <CardHeader className="text-center py-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center rotate-3 shadow-xl">
              <span className="text-white font-black text-3xl italic">ق</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tighter">
            {isLogin ? (isRtl ? "دخول القوميين" : "Editor Login") : (isRtl ? "انضم للقوميين" : "Join Al-Qaumiyun")}
          </CardTitle>
          <CardDescription className="text-zinc-500 font-medium">
            {isRtl ? "الجريدة العالمية بلسان الشعوب" : "Global newspaper by the people"}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8">
          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 px-1">{isRtl ? "الاسم" : "Name"}</Label>
                  <Input placeholder="John Doe" className="bg-zinc-900 border-none h-12 rounded-2xl" value={formData.displayName} onChange={(e) => setFormData({...formData, displayName: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 px-1">{isRtl ? "الوطن" : "Nation"}</Label>
                  <Select value={formData.nationality} onValueChange={(v) => setFormData({...formData, nationality: v})}>
                    <SelectTrigger className="bg-zinc-900 border-none h-12 rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                      {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 px-1">Email</Label>
              <Input type="email" placeholder="name@example.com" className="bg-zinc-900 border-none h-12 rounded-2xl" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 px-1">Password</Label>
              <Input type="password" placeholder="••••••••" className="bg-zinc-900 border-none h-12 rounded-2xl" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
            </div>
            <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200 font-black h-14 rounded-2xl mt-4" disabled={loading}>
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isLogin ? (isRtl ? "دخول" : "Sign In") : (isRtl ? "إنشاء حساب" : "Join Now"))}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-6 pb-10">
          <div className="text-center text-xs font-bold text-zinc-600">
            {isLogin ? (isRtl ? "ليس لديك حساب؟" : "New writer?") : (isRtl ? "لديك حساب بالفعل؟" : "Already registered?")}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline ml-1">
              {isLogin ? (isRtl ? "سجل الآن" : "Register") : (isRtl ? "دخول" : "Login")}
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
