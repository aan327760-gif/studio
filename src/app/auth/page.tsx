
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
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
        const userDoc = await getDoc(userRef);
        
        if (user.email === SUPER_ADMIN_EMAIL) {
          await updateDoc(userRef, {
            role: "admin",
            isVerified: true,
            isPro: true
          });
        }

        toast({
          title: isRtl ? "تم تسجيل الدخول" : "Logged In",
          description: user.email === SUPER_ADMIN_EMAIL 
            ? (isRtl ? "مرحباً أيها المدير العام!" : "Welcome, Master Admin!") 
            : (isRtl ? "مرحباً بك مجدداً في Unbound" : "Welcome back back to Unbound"),
        });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        await updateProfile(user, { 
          displayName: formData.displayName,
          photoURL: "https://picsum.photos/seed/" + user.uid + "/200/200"
        });

        const isSuper = formData.email === SUPER_ADMIN_EMAIL;

        const userProfileData = {
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
          description: isRtl ? "مرحباً بك في مجتمع Unbound" : "Welcome to the Unbound community",
        });
      }
      router.push("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: isRtl ? "خطأ" : "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-950 border-zinc-800 text-white shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-2xl italic">U</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {isLogin ? (isRtl ? "تسجيل الدخول" : "Welcome Back") : (isRtl ? "إنشاء حساب جديد" : "Create Account")}
          </CardTitle>
          <CardDescription className="text-zinc-500">
            {isLogin 
              ? (isRtl ? "أدخل بياناتك للعودة إلى حسابك" : "Enter your details to access your account")
              : (isRtl ? "انضم إلى Unbound وشارك أفكارك بحرية" : "Join Unbound and share your voice freely")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="displayName">{isRtl ? "الاسم الكامل" : "Full Name"}</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                  <Input
                    id="displayName"
                    placeholder={isRtl ? "أحمد محمد" : "John Doe"}
                    className="bg-zinc-900 border-zinc-800 pl-10"
                    required
                    value={formData.displayName}
                    onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{isRtl ? "البريد الإلكتروني" : "Email"}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="bg-zinc-900 border-zinc-800 pl-10"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{isRtl ? "كلمة السر" : "Password"}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <Input
                  id="password"
                  type="password"
                  className="bg-zinc-900 border-zinc-800 pl-10"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="phone">{isRtl ? "رقم الهاتف (اختياري)" : "Phone Number (Optional)"}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+213..."
                    className="bg-zinc-900 border-zinc-800 pl-10"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
            )}
            <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200 font-bold h-11 rounded-xl mt-6" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? (isRtl ? "دخول" : "Sign In") : (isRtl ? "إنشاء حساب" : "Create Account")}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-zinc-500">
            {isLogin ? (isRtl ? "ليس لديك حساب؟" : "Don't have an account?") : (isRtl ? "لديك حساب بالفعل؟" : "Already have an account?")}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-bold hover:underline">
              {isLogin ? (isRtl ? "سجل الآن" : "Sign Up") : (isRtl ? "تسجيل الدخول" : "Log In")}
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
