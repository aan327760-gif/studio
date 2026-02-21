
"use client";

import React, { createContext, useContext, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";
import { useFirestore } from "@/firebase";

interface UploadContextType {
  isUploading: boolean;
  progress: number;
  startUpload: (payload: any) => Promise<boolean>;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

const compressImage = async (base64: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1200;
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
        ctx.drawImage(img, 0, 0, width, height);
      }
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => resolve(base64);
  });
};

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const db = useFirestore();

  const startUpload = async (payload: any) => {
    const { content, localImages, authorInfo, isRtl, title, section, tags } = payload;
    
    // بدء الرفع في الخلفية
    setIsUploading(true);
    setProgress(5);

    // تنفيذ الرفع الفعلي بشكل غير متزامن للسماح بالتصفح
    const executeUpload = async () => {
      try {
        let finalMediaUrls: string[] = [];

        if (localImages && localImages.length > 0) {
          for (let i = 0; i < localImages.length; i++) {
            const compressed = await compressImage(localImages[i]);
            const uploadedUrl = await uploadToCloudinary(compressed, 'image');
            finalMediaUrls.push(uploadedUrl);
            setProgress(10 + ((i + 1) / localImages.length) * 80);
          }
        }

        await addDoc(collection(db, "articles"), {
          title: title || (isRtl ? "مقال سيادي" : "Sovereign Article"),
          content,
          section: section || "National",
          tags: tags || [],
          mediaUrls: finalMediaUrls,
          mediaUrl: finalMediaUrls[0] || null,
          authorId: authorInfo.uid,
          authorName: authorInfo.displayName,
          authorEmail: authorInfo.email,
          authorNationality: authorInfo.nationality || "Global",
          authorIsVerified: authorInfo.isVerified || false,
          likesCount: 0,
          commentsCount: 0,
          likedBy: [],
          savedBy: [],
          priorityScore: authorInfo.isVerified ? 1000 : 0,
          createdAt: serverTimestamp(),
        });

        const userRef = doc(db, "users", authorInfo.uid);
        await updateDoc(userRef, { points: increment(-20) });

        setProgress(100);
        toast({ title: isRtl ? "تم النشر بنجاح" : "Published Successfully" });
      } catch (error: any) {
        console.error("Upload Failure:", error);
        toast({ variant: "destructive", title: isRtl ? "فشل النشر" : "Publish Failed" });
      } finally {
        setTimeout(() => {
          setIsUploading(false);
          setProgress(0);
        }, 1500);
      }
    };

    executeUpload(); // تشغيل بدون await للسماح للمكون بالاستمرار
    return true; 
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
