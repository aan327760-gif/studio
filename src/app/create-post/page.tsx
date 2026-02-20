
"use client";

import { useState, useRef } from "react";
import { X, Newspaper, Loader2, Award, Type, Globe, Hash, Camera, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, increment, updateDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SECTIONS = [
  { id: "Politics", label: "Politics" },
  { id: "Culture", label: "Culture" },
  { id: "Sports", label: "Sports" },
  { id: "Economy", label: "Economy" },
  { id: "National", label: "National" },
];

const SUPER_ADMIN_EMAIL = "adelbenmaza3@gmail.com";

export default function CreateArticlePage() {
  const { isRtl } = useLanguage();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();

  const userRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<any>(userRef);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [section, setSection] = useState("National");
  const [tags, setTags] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canPublish = (profile?.points || 0) >= 20;

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        // الرفع لـ Cloudinary
        const uploadedUrl = await uploadToCloudinary(base64Data, 'image');
        setMediaUrl(uploadedUrl);
        toast({ title: isRtl ? "تم رفع الصورة بنجاح" : "Image uploaded successfully" });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({ variant: "destructive", title: isRtl ? "فشل الرفع" : "Upload Failed" });
      setIsUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!user || !profile) return;
    if (!title.trim() || !content.trim()) return;
    if (!canPublish) {
      toast({ variant: "destructive", title: isRtl ? "نقاط غير كافية" : "Insufficient Points", description: isRtl ? "تحتاج لـ 20 نقطة لنشر مقال." : "You need 20 points to publish." });
      return;
    }

    setIsPublishing(true);
    try {
      const tagsArray = tags.split(' ').map(t => t.replace('#', '').trim()).filter(t => t.length > 0);

      await addDoc(collection(db, "articles"), {
        title,
        content,
        section,
        tags: tagsArray,
        mediaUrl: mediaUrl || null,
        authorId: user.uid,
        authorName: profile.displayName,
        authorEmail: user.email,
        authorNationality: profile.nationality,
        authorIsVerified: profile.isVerified || user.email === SUPER_ADMIN_EMAIL,
        likesCount: 0,
        commentsCount: 0,
        likedBy: [],
        savedBy: [],
        createdAt: serverTimestamp()
      });

      // خصم النقاط فوراً
      await updateDoc(userRef!, { points: increment(-20) });

      toast({ title: isRtl ? "تم نشر المقال القومي" : "Article Published", description: isRtl ? "تم خصم 20 نقطة من رصيدك." : "20 points deducted." });
      router.push("/");
    } catch (e) {
      toast({ variant: "destructive", title: "Publish Error" });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-md mx-auto relative shadow-2xl border-x border-zinc-900">
      <header className="p-4 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur-xl z-20 border-b border-zinc-900">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full"><X className="h-6 w-6" /></Button>
        <div className="flex flex-col items-center">
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Al-Qaumiyun</span>
           <div className="flex items-center gap-1">
              <Award className="h-2 w-2 text-zinc-500" />
              <span className="text-[8px] font-black text-zinc-500 uppercase">{profile?.points || 0} Points</span>
           </div>
        </div>
        <Button 
          onClick={handlePublish} 
          disabled={isPublishing || isUploading || !title.trim() || !content.trim() || !canPublish} 
          className="rounded-full px-8 font-black bg-white text-black hover:bg-zinc-200"
        >
          {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRtl ? "نشر" : "Publish")}
        </Button>
      </header>

      <main className="flex-1 p-6 space-y-6 overflow-y-auto pb-20">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
             <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <Type className="h-4 w-4 text-primary" />
             </div>
             <h2 className="text-sm font-black uppercase tracking-widest">{isRtl ? "عنوان المقال" : "Article Title"}</h2>
          </div>
          <Input 
            placeholder={isRtl ? "اكتب عنواناً جذاباً..." : "Enter a catchy title..."}
            className="bg-zinc-950 border-zinc-900 h-14 text-lg font-black rounded-2xl"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                   <Newspaper className="h-4 w-4 text-zinc-500" />
                </div>
                <h2 className="text-sm font-black uppercase tracking-widest">{isRtl ? "المحتوى" : "Content"}</h2>
             </div>
             <span className={cn("text-[10px] font-black", content.length > 1000 ? "text-red-500" : "text-zinc-600")}>{content.length}/1000</span>
          </div>
          <Textarea 
            placeholder={isRtl ? "اكتب مقالك هنا (1000 حرف كحد أقصى)..." : "Write your article (max 1000 chars)..."}
            className="bg-zinc-950 border-zinc-900 min-h-[250px] rounded-[2rem] p-6 text-base font-medium resize-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
             <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                <Hash className="h-4 w-4 text-zinc-500" />
             </div>
             <h2 className="text-sm font-black uppercase tracking-widest">{isRtl ? "الوسوم" : "Tags"}</h2>
          </div>
          <Input 
            placeholder={isRtl ? "مثال: الجزائر القوميون السيادة" : "e.g. Algeria Qaumiyun"}
            className="bg-zinc-950 border-zinc-900 h-12 rounded-xl"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">{isRtl ? "القسم" : "Section"}</label>
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger className="bg-zinc-950 border-zinc-900 h-12 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-900 text-white">
                {SECTIONS.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">{isRtl ? "الصورة" : "Media"}</label>
            <div 
              className="w-full aspect-video rounded-[2rem] border-2 border-dashed border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/50 transition-all overflow-hidden relative group"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : mediaUrl ? (
                <>
                  <img src={mediaUrl} alt="Upload preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <Camera className="h-10 w-10 text-white" />
                  </div>
                </>
              ) : (
                <>
                  <div className="h-16 w-16 rounded-full bg-zinc-900 flex items-center justify-center">
                    <Camera className="h-8 w-8 text-zinc-500" />
                  </div>
                  <p className="text-xs font-bold text-zinc-500">{isRtl ? "ارفع صورة من هاتفك" : "Upload from phone"}</p>
                </>
              )}
            </div>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageSelect} 
            />
          </div>
        </div>

        <div className="p-6 bg-primary/5 border border-primary/20 rounded-[2.5rem] flex items-center justify-between">
           <div className="flex gap-4 items-center">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20">
                 <Globe className="h-6 w-6 text-primary" />
              </div>
              <div className="flex flex-col">
                 <span className="text-xs font-black uppercase tracking-tight">{isRtl ? "النشر القومي" : "National Publish"}</span>
                 <span className="text-[9px] text-zinc-500 font-bold uppercase">{profile?.nationality}</span>
              </div>
           </div>
           <div className="text-right">
              <span className="block text-sm font-black text-red-500">-20</span>
              <span className="text-[8px] font-bold text-zinc-600 uppercase">Points</span>
           </div>
        </div>
      </main>
    </div>
  );
}
