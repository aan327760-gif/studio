
"use client";

import React, { createContext, useContext, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useFirestore } from "@/firebase";

interface UploadContextType {
  isUploading: boolean;
  progress: number;
  startUpload: (data: any) => Promise<void>;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

/**
 * محرك الرفع في الخلفية - نسخة محسنة للأداء
 */
export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const db = useFirestore();

  const startUpload = async (payload: any) => {
    const { content, localImages, videoUrl, authorInfo, privacy, allowComments, isRtl } = payload;
    
    setIsUploading(true);
    setProgress(5); 

    try {
      let finalMediaUrls: string[] = [];
      let mediaType: "image" | "video" | "audio" | "album" | null = null;

      // 1. معالجة الصور في الخلفية
      if (localImages.length > 0) {
        mediaType = localImages.length > 1 ? 'album' : 'image';
        const uploadPromises = localImages.map(async (base64: string, idx: number) => {
          const url = await uploadToCloudinary(base64, 'image');
          setProgress(prev => Math.min(85, prev + (80 / localImages.length)));
          return url;
        });
        finalMediaUrls = await Promise.all(uploadPromises);
      } 
      
      // 2. معالجة الفيديو في الخلفية
      else if (videoUrl) {
        mediaType = 'video';
        setProgress(20);
        
        // جلب الفيديو وتحويله لبيانات قابلة للرفع دون تجميد الواجهة
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        
        const url = await uploadToCloudinary(base64, 'video');
        finalMediaUrls = [url];
        setProgress(90);
      }

      // 3. حفظ التدوينة النهائية في Firestore
      await addDoc(collection(db, "posts"), {
        content,
        mediaUrl: finalMediaUrls[0] || null,
        mediaUrls: finalMediaUrls,
        mediaType,
        authorId: authorInfo.uid,
        author: authorInfo,
        likesCount: 0,
        likedBy: [],
        savesCount: 0,
        savedBy: [],
        commentsCount: 0,
        createdAt: serverTimestamp(),
        privacy,
        allowComments
      });

      setProgress(100);
      toast({ title: isRtl ? "تم النشر بنجاح" : "Post Published" });
    } catch (error: any) {
      console.error("Global Upload Error:", error);
      toast({ variant: "destructive", title: isRtl ? "فشل النشر" : "Upload Failed" });
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setProgress(0);
      }, 1500);
    }
  };

  return (
    <UploadContext.Provider value={{ isUploading, progress, startUpload }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (!context) throw new Error("useUpload must be used within UploadProvider");
  return context;
}
