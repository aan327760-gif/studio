"use client";

import { useState, useRef } from "react";
import { X, Newspaper, Loader2, Award, Type, Globe, Camera, Plus, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useUpload } from "@/context/UploadContext";
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

export default function CreateArticlePage() {
  const { isRtl } = useLanguage();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { startUpload, isUploading } = useUpload();

  const userRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc<any>(userRef);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [section, setSection] = useState("National");
  const [localImages, setLocalImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canPublish = (profile?.points || 0) >= 20;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (localImages.length >= 2) {
      toast({ variant: "destructive", title: isRtl ? "الحد الأقصى صورتان" : "Max 2 images" });
      return;
    }

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      setLocalImages(prev => [...prev, base64Data]);
    };
    reader.readAsDataURL(file);
    // مسح القيمة للسماح باختيار نفس الصورة مرة أخرى إذا حذفت
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setLocalImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    if (!user || !profile || !canPublish) return;
    if (!title.trim() || !content.trim()) {
      toast({ variant: "destructive", title: isRtl ? "أكمل البيانات" : "Fill all fields" });
      return;
    }

    const success = await startUpload({
      title,
      content,
      section,
      localImages,
      authorInfo: {
        uid: user.uid,
        displayName: profile.displayName,
        email: user.email,
        nationality: profile.nationality,
        isVerified: profile.isVerified,
      },
      isRtl
    });

    if (success) {
      router.push("/");
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
          disabled={isUploading || !title.trim() || !content.trim() || !canPublish} 
          className="rounded-full px-8 font-black bg-white text-black hover:bg-zinc-200"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRtl ? "نشر" : "Publish")}
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
          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">{isRtl ? "صور المقال (بحد أقصى 2)" : "Article Images (Max 2)"}</label>
          <div className="grid grid-cols-2 gap-4">
            {localImages.map((url, index) => (
              <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-zinc-800 group">
                <img src={url} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}
            {localImages.length < 2 && (
              <div 
                className="aspect-square rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="h-6 w-6 text-zinc-600" />
                <span className="text-[8px] font-black text-zinc-600 uppercase">{isRtl ? "إضافة صورة" : "Add Image"}</span>
              </div>
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
