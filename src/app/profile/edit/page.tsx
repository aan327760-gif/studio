
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function EditProfilePage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { isRtl } = useLanguage();

  const profileRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<any>(profileRef);

  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    photoURL: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || "",
        bio: profile.bio || "",
        photoURL: profile.photoURL || ""
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user || !db) return;
    setLoading(true);

    try {
      // Update Auth Profile
      await updateProfile(user, {
        displayName: formData.displayName,
        photoURL: formData.photoURL
      });

      // Update Firestore Profile
      await updateDoc(doc(db, "users", user.uid), {
        displayName: formData.displayName,
        bio: formData.bio,
        photoURL: formData.photoURL
      });

      toast({
        title: isRtl ? "تم التحديث" : "Profile Updated",
        description: isRtl ? "تم حفظ تغييراتك بنجاح" : "Your changes have been saved."
      });
      router.back();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white max-w-md mx-auto border-x border-zinc-800">
      <header className="p-4 flex items-center justify-between border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
            <ArrowLeft className={isRtl ? "rotate-180" : ""} />
          </Button>
          <h1 className="font-bold text-lg">{isRtl ? "تعديل الملف" : "Edit profile"}</h1>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="rounded-full px-6 font-bold bg-white text-black hover:bg-zinc-200 h-8"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRtl ? "حفظ" : "Save")}
        </Button>
      </header>

      <main className="p-6 space-y-8">
        <div className="flex flex-col items-center">
          <div className="relative group cursor-pointer" onClick={() => {
            const url = prompt(isRtl ? "أدخل رابط الصورة الجديدة:" : "Enter new image URL:");
            if (url) setFormData({...formData, photoURL: url});
          }}>
            <Avatar className="h-24 w-24 border-2 border-zinc-800">
              <AvatarImage src={formData.photoURL} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-6 w-6" />
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2">{isRtl ? "اضغط لتغيير الصورة" : "Tap to change photo"}</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-zinc-500 text-xs">{isRtl ? "الاسم" : "Name"}</Label>
            <Input 
              value={formData.displayName}
              onChange={(e) => setFormData({...formData, displayName: e.target.value})}
              className="bg-zinc-900 border-zinc-800 rounded-xl focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-500 text-xs">{isRtl ? "السيرة الذاتية" : "Bio"}</Label>
            <Textarea 
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              placeholder={isRtl ? "أخبرنا عن نفسك..." : "Tell us about yourself..."}
              className="bg-zinc-900 border-zinc-800 rounded-xl focus-visible:ring-primary min-h-[100px] resize-none"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
