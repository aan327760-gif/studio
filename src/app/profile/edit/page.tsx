
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Camera, Loader2, Image as ImageIcon, MapPin } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

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
    location: "",
    photoURL: "",
    bannerURL: ""
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || "",
        bio: profile.bio || "",
        location: profile.location || "",
        photoURL: profile.photoURL || "",
        bannerURL: profile.bannerURL || ""
      });
    }
  }, [profile]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(type);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        const uploadedUrl = await uploadToCloudinary(base64Data, 'image');
        
        setFormData(prev => ({
          ...prev,
          [type === "avatar" ? "photoURL" : "bannerURL"]: uploadedUrl
        }));
        
        toast({
          title: isRtl ? "تم الرفع" : "Uploaded",
          description: isRtl ? "تم تحديث معاينة الصورة" : "Image preview updated."
        });
        setUploading(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload image."
      });
      setUploading(null);
    }
  };

  const handleSave = async () => {
    if (!user || !db) return;
    setLoading(true);

    try {
      await updateProfile(user, {
        displayName: formData.displayName,
        photoURL: formData.photoURL
      });

      await updateDoc(doc(db, "users", user.uid), {
        displayName: formData.displayName,
        bio: formData.bio,
        location: formData.location,
        photoURL: formData.photoURL,
        bannerURL: formData.bannerURL
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
    <div className="min-h-screen bg-black text-white max-w-md mx-auto border-x border-zinc-800 pb-20">
      <header className="p-4 flex items-center justify-between border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
            <ArrowLeft className={isRtl ? "rotate-180" : ""} />
          </Button>
          <h1 className="font-bold text-lg">{isRtl ? "تعديل الملف" : "Edit profile"}</h1>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={loading || !!uploading}
          className="rounded-full px-6 font-bold bg-white text-black hover:bg-zinc-200 h-8"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRtl ? "حفظ" : "Save")}
        </Button>
      </header>

      <main className="space-y-6">
        <div className="relative h-32 w-full bg-zinc-900 group cursor-pointer overflow-hidden" onClick={() => bannerInputRef.current?.click()}>
          {formData.bannerURL ? (
            <img src={formData.bannerURL} alt="Banner" className="w-full h-full object-cover opacity-60" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-700">
               <ImageIcon className="h-10 w-10" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-all">
            {uploading === "banner" ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
          </div>
          <input type="file" accept="image/*" className="hidden" ref={bannerInputRef} onChange={(e) => handleImageUpload(e, "banner")} />
        </div>

        <div className="px-6 relative -mt-12 flex items-end justify-between">
          <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
            <Avatar className="h-24 w-24 border-4 border-black shadow-xl">
              <AvatarImage src={formData.photoURL} />
              <AvatarFallback className="bg-zinc-800">U</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading === "avatar" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
            </div>
            <input type="file" accept="image/*" className="hidden" ref={avatarInputRef} onChange={(e) => handleImageUpload(e, "avatar")} />
          </div>
        </div>

        <div className="px-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{isRtl ? "الاسم المعروض" : "Display Name"}</Label>
            <Input 
              value={formData.displayName}
              onChange={(e) => setFormData({...formData, displayName: e.target.value})}
              className="bg-zinc-900 border-zinc-800 rounded-xl focus-visible:ring-primary h-12"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{isRtl ? "الموقع" : "Location"}</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
              <Input 
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder={isRtl ? "الجزائر، العاصمة" : "Algiers, Algeria"}
                className="bg-zinc-900 border-zinc-800 rounded-xl focus-visible:ring-primary h-12 pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{isRtl ? "السيرة الذاتية" : "Bio"}</Label>
              <span className={cn("text-[10px] font-black", formData.bio.length >= 150 ? "text-red-500" : "text-zinc-600")}>{formData.bio.length}/150</span>
            </div>
            <Textarea 
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              placeholder={isRtl ? "أخبرنا عن نفسك (150 حرف)..." : "Tell us about yourself (150 chars)..."}
              className="bg-zinc-900 border-zinc-800 rounded-xl focus-visible:ring-primary min-h-[120px] resize-none p-4"
              maxLength={150}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
