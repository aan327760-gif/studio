'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { Info, AlertTriangle } from 'lucide-react';

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
          duration: 20000,
          title: 'إعداد قاعدة البيانات مطلوب (فهرسين)',
          description: (
            <div className="space-y-4 mt-2">
              <p className="text-xs leading-relaxed text-zinc-300">
                يا زعيم، لتعمل الصفحة الشخصية بالكامل، نحتاج لإنشاء فهرسين في Firebase Console:
              </p>
              
              <div className="space-y-3">
                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                  <p className="text-[10px] font-black text-primary mb-1 uppercase tracking-widest">الفهرس 1 (للمنشورات):</p>
                  <ul className="text-[9px] text-zinc-400 space-y-1">
                    <li>• المجموعة: <span className="text-white">posts</span></li>
                    <li>• الحقول: <span className="text-white">authorId</span> (Asc) ثم <span className="text-white">createdAt</span> (Desc)</li>
                  </ul>
                </div>

                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                  <p className="text-[10px] font-black text-orange-500 mb-1 uppercase tracking-widest">الفهرس 2 (للإعجابات):</p>
                  <ul className="text-[9px] text-zinc-400 space-y-1">
                    <li>• المجموعة: <span className="text-white">posts</span></li>
                    <li>• الحقول: <span className="text-white">likedBy</span> (Arrays) ثم <span className="text-white">createdAt</span> (Desc)</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg border border-primary/20">
                <Info className="h-3 w-3 text-primary" />
                <p className="text-[9px] text-primary-foreground font-medium">الرابط المباشر لكل فهرس موجود الآن في الـ Console (اضغط F12).</p>
              </div>
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
