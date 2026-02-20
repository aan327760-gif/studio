
"use client";

import React, { createContext, useContext, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";
import { useFirestore } from "@/firebase";

interface UploadContextType {
  isUploading: boolean;
  progress: number;
  startUpload: (data: any) => Promise<void>;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

const compressImage = async (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1080; 
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

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const db = useFirestore();

  const startUpload = async (payload: any) => {
    const { content, localImages, videoUrl, authorInfo, isRtl, title, section, tags } = payload;
    
    setIsUploading(true);
    setProgress(10); 

    try {
      let finalMediaUrl: string | null = null;

      if (localImages && localImages.length > 0) {
        const compressed = await compressImage(localImages[0]);
        setProgress(40);
        finalMediaUrl = await uploadToCloudinary(compressed, 'image');
        setProgress(80);
      } else if (videoUrl) {
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        finalMediaUrl = await uploadToCloudinary(base64, 'video');
        setProgress(85);
      }

      // تصحيح: الرفع لمجموعة articles المعتمدة
      await addDoc(collection(db, "articles"), {
        title: title || (isRtl ? "مقال جديد" : "New Article"),
        content,
        section: section || "National",
        tags: tags || [],
        mediaUrl: finalMediaUrl,
        authorId: authorInfo.uid,
        authorName: authorInfo.displayName,
        authorEmail: authorInfo.email,
        authorNationality: authorInfo.nationality || "Global",
        authorIsVerified: authorInfo.isVerified || false,
        likesCount: 0,
        commentsCount: 0,
        likedBy: [],
        savedBy: [],
        createdAt: serverTimestamp(),
      });

      // خصم نقاط النشر
      const userRef = doc(db, "users", authorInfo.uid);
      await updateDoc(userRef, { points: increment(-20) });

      setProgress(100);
      toast({ title: isRtl ? "تم النشر بنجاح" : "Article Published" });
    } catch (error: any) {
      console.error("Upload Failure:", error);
      toast({ variant: "destructive", title: isRtl ? "فشل الرفع" : "Upload Failed" });
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
