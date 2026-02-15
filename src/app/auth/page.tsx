
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  serverTimestamp, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  limit, 
  increment 
} from "firebase/firestore";
import { useAuth, useFirestore } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import { Loader2, Mail, Lock, Phone, User as UserIcon } from "lucide-react";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const SUPER_ADMIN_EMAIL = "adelbenmaza3@gmail.com";

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
    phone: ""
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        
        const userRef = doc(db, "users", user.uid);
        
        // التوثيق التلقائي للمدير العام عند الدخول لضمان الصلاحيات
        if (user.email === SUPER_ADMIN_EMAIL) {
          await updateDoc(userRef, {
            role: "admin",
            isVerified: true,
            isPro: true
          });
        }

        toast({
          title: isRtl ? "تم تسجيل الدخول بنجاح" : "Logged In Successfully",
          description: user.email === SUPER_ADMIN_EMAIL 
            ? (isRtl ? "مرحباً أيها المدير العام، السلطة بين يديك." : "Welcome back, Super Admin.") 
            : (isRtl ? "مرحباً بك مجدداً في Unbound" : "Welcome back to Unbound"),
        });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        await updateProfile(user, { 
          displayName: formData.displayName,
          photoURL: "https://picsum.photos/seed/" + user.uid + "/200/200"
        });

        const isSuper = formData.email === SUPER_ADMIN_EMAIL;

        // البيانات الأساسية للملف الشخصي
        const userProfileData: any = {
          uid: user.uid,
          displayName: formData.displayName,
          email: formData.email,
          phoneNumber: formData.phone || null,
          photoURL: "https://picsum.photos/seed/" + user.uid + "/200/200",
          createdAt: serverTimestamp(),
          isPro: isSuper,
          isVerified: isSuper,
          role: isSuper ? "admin" : "user",
          followersCount: 0,
          followingCount: 0,
          bio: "",
          language: isRtl ? "ar" : "en"
        };

        // بروتوكول المتابعة التلقائية للمدير العام
        if (!isSuper) {
          try {
            const adminQuery = query(collection(db, "users"), where("email", "==", SUPER_ADMIN_EMAIL), limit(1));
            const adminSnapshot = await getDocs(adminQuery);
            
            if (!adminSnapshot.empty) {
              const adminDoc = adminSnapshot.docs[0];
              const adminUid = adminDoc.id;
              
              // تحديث بيانات المستخدم الجديد قبل الحفظ ليكون متابعاً للأدمن
              userProfileData.followingCount = 1;
              
              // إنشاء وثيقة المتابعة في قاعدة البيانات
              const followId = `${user.uid}_${adminUid}`;
              await setDoc(doc(db, "follows", followId), {
                followerId: user.uid,
                followingId: adminUid,
                createdAt: serverTimestamp()
              });

              // زيادة عدد متابعي المدير العام
              await updateDoc(doc(db, "users", adminUid), {
                followersCount: increment(1)
              });
            }
          } catch (followError) {
            console.warn("Auto-follow admin failed, proceeding with registration.", followError);
          }
        }

        // حفظ ملف المستخدم النهائي
        await setDoc(doc(db, "users", user.uid), userProfileData)
          .catch(async (err) => {
            const permissionError = new FirestorePermissionError({
              path: `users/${user.uid}`,
              operation: 'create',
              requestResourceData: userProfileData
            });
            errorEmitter.emit('permission-error', permissionError);
          });

        toast({
          title: isRtl ? "تم إنشاء الحساب" : "Account Created",
          description: isRtl ? "مرحباً بك في مجتمع Unbound الحر" : "Welcome to the Unbound community",
        });
      }
      router.push("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: isRtl ? "خطأ في المصادقة" : "Auth Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-950 border-zinc-800 text-white shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="space-y-1 text-center py-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center rotate-3 shadow-xl shadow-primary/20">
              <span className="text-white font-black text-3xl italic">U</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tighter">
            {isLogin ? (isRtl ? "عودة حميدة" : "Welcome Back") : (isRtl ? "ابدأ رحلتك" : "Start Journey")}
          </CardTitle>
          <CardDescription className="text-zinc-500 font-medium">
            {isLogin 
              ? (isRtl ? "أدخل بياناتك لتكمل تواصلك بحرية" : "Enter details to continue freely")
              : (isRtl ? "كن جزءاً من منصة بلا قيود" : "Be part of Unbound OS")}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8">
          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 px-1">{isRtl ? "الاسم الكامل" : "Full Name"}</Label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                  <Input
                    id="displayName"
                    placeholder={isRtl ? "أحمد محمد" : "John Doe"}
                    className="bg-zinc-900 border-zinc-800 pl-12 h-12 rounded-2xl focus:ring-primary"
                    required
                    value={formData.displayName}
                    onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 px-1">{isRtl ? "البريد الإلكتروني" : "Email"}</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="bg-zinc-900 border-zinc-800 pl-12 h-12 rounded-2xl focus:ring-primary"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 px-1">{isRtl ? "كلمة السر" : "Password"}</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                <Input
                  id="password"
                  type="password"
                  className="bg-zinc-900 border-zinc-800 pl-12 h-12 rounded-2xl focus:ring-primary"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>
            {!isLogin && (
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 px-1">{isRtl ? "رقم الهاتف (اختياري)" : "Phone (Optional)"}</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+213..."
                    className="bg-zinc-900 border-zinc-800 pl-12 h-12 rounded-2xl"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
            )}
            <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200 font-black h-14 rounded-2xl mt-4 shadow-xl active:scale-95 transition-all" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (isLogin ? (isRtl ? "دخول" : "Sign In") : (isRtl ? "إنشاء حساب" : "Join Now"))}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-6 pb-10">
          <div className="text-center text-xs font-bold text-zinc-600">
            {isLogin ? (isRtl ? "ليس لديك حساب؟" : "New to Unbound?") : (isRtl ? "لديك حساب بالفعل؟" : "Already member?")}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline ml-1">
              {isLogin ? (isRtl ? "سجل الآن" : "Create one") : (isRtl ? "دخول" : "Sign In")}
            </button>
          </div>
          <div className="flex items-center gap-2 opacity-10">
            <div className="h-[1px] flex-1 bg-white" />
            <span className="text-[8px] font-black uppercase tracking-[0.4em]">Secure Auth</span>
            <div className="h-[1px] flex-1 bg-white" />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
