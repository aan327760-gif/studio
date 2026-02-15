
"use client";

import React, { createContext, useContext, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { collection, addDoc, serverTimestamp, doc } from "firebase/firestore";
import { useFirestore } from "@/firebase";

interface UploadContextType {
  isUploading: boolean;
  progress: number;
  startUpload: (data: any) => Promise<void>;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const db = useFirestore();

  const startUpload = async (payload: any) => {
    const { content, localImages, videoUrl, authorInfo, privacy, allowComments, isRtl } = payload;
    
    setIsUploading(true);
    setProgress(10); // بدأت المعالجة

    try {
      let finalMediaUrls: string[] = [];
      let mediaType: "image" | "video" | "audio" | "album" | null = null;

      // محاكاة تقدم الضغط
      setProgress(30);

      if (localImages.length > 0) {
        const uploadPromises = localImages.map(async (url: string, idx: number) => {
          // جلب وتحويل للرفع
          const response = await fetch(url);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          
          const uploadedUrl = await uploadToCloudinary(base64, 'image');
          setProgress(prev => Math.min(90, prev + (60 / localImages.length)));
          return uploadedUrl;
        });
        finalMediaUrls = await Promise.all(uploadPromises);
        mediaType = finalMediaUrls.length > 1 ? 'album' : 'image';
      } else if (videoUrl) {
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        const url = await uploadToCloudinary(base64, 'video');
        finalMediaUrls = [url];
        mediaType = 'video';
        setProgress(85);
      }

      await addDoc(collection(db, "posts"), {
        content,
        mediaUrl: finalMediaUrls[0] || null,
        mediaUrls: finalMediaUrls,
        mediaType,
        authorId: payload.userId,
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
      }, 1000);
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
