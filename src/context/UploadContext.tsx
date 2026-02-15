
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
 * محرك الضغط السيادي - معالجة خفيفة لا ترهق المعالج
 */
const compressImage = async (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1080; // عرض قياسي عالمي
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height = (MAX_WIDTH / width) * height;
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
      }
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => resolve(url);
  });
};

/**
 * نظام الرفع في الخلفية - إصدار "السيادة السلسة"
 */
export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const db = useFirestore();

  const startUpload = async (payload: any) => {
    const { content, localImages, videoUrl, authorInfo, privacy, allowComments, isRtl } = payload;
    
    setIsUploading(true);
    setProgress(10); 

    try {
      let finalMediaUrls: string[] = [];
      let mediaType: "image" | "video" | "audio" | "album" | null = null;

      // 1. معالجة الصور (الضغط التدريجي)
      if (localImages && localImages.length > 0) {
        mediaType = localImages.length > 1 ? 'album' : 'image';
        
        const uploadPromises = localImages.map(async (rawUrl: string, idx: number) => {
          const compressed = await compressImage(rawUrl);
          setProgress(prev => Math.min(40, prev + (20 / localImages.length)));
          const url = await uploadToCloudinary(compressed, 'image');
          setProgress(prev => Math.min(90, prev + (50 / localImages.length)));
          return url;
        });
        finalMediaUrls = await Promise.all(uploadPromises);
      } 
      
      // 2. معالجة الفيديوهات (التدفق المباشر)
      else if (videoUrl) {
        mediaType = 'video';
        setProgress(30);
        
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        
        const url = await uploadToCloudinary(base64, 'video');
        finalMediaUrls = [url];
        setProgress(95);
      }

      // 3. التوثيق النهائي في Firestore
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
      toast({ title: isRtl ? "تم النشر بنجاح" : "Sovereign Post Published" });
    } catch (error: any) {
      console.error("Sovereign Upload Engine Failure:", error);
      toast({ variant: "destructive", title: isRtl ? "فشل البروتوكول" : "Upload Failed" });
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
