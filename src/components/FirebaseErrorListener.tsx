'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ExternalLink, Info } from 'lucide-react';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: any) => {
      const context = error.context || {};
      const errorMessage = error.message || context.message || "";
      
      // التحقق من خطأ الفهرس (Index Error)
      const isIndexError = errorMessage.toLowerCase().includes('index') || 
                          errorMessage.includes('فهرس') ||
                          error.code === 'failed-precondition';
      
      if (isIndexError) {
        toast({
          duration: 15000,
          title: 'إعداد قاعدة البيانات مطلوب (فهرس)',
          description: (
            <div className="space-y-3 mt-2">
              <p className="text-xs leading-relaxed">
                هذا الجزء يتطلب "فهرس" (Index) في Firestore ليعمل الترتيب بشكل صحيح.
              </p>
              <div className="bg-zinc-900 p-2 rounded border border-zinc-800 space-y-1">
                <p className="text-[10px] font-bold text-primary">الخطوات اليدوية:</p>
                <p className="text-[9px] text-zinc-400">1. اذهب لـ Firestore ثم تبويب Indexes.</p>
                <p className="text-[9px] text-zinc-400">2. أضف فهرس لمجموعة posts بالحقول (authorId تصاعدي و createdAt تنازلي).</p>
              </div>
              <p className="text-[10px] font-bold opacity-70 italic flex items-center gap-1">
                <Info className="h-3 w-3" /> الرابط المباشر متاح الآن في الـ Console (F12).
              </p>
            </div>
          ),
        });
        console.error("Firebase Index Link:", errorMessage);
        return;
      }

      toast({
        variant: 'destructive',
        title: 'خطأ في الصلاحيات',
        description: context.message || "ليس لديك صلاحية للقيام بهذا الإجراء أو أن هناك خطأ في الوصول للبيانات.",
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}
