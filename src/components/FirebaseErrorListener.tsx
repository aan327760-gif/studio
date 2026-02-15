'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { Info, AlertTriangle, ExternalLink } from 'lucide-react';

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
          duration: 30000,
          title: 'تفعيل الفهرسين (Index) مطلوب',
          description: (
            <div className="space-y-4 mt-2 text-right" dir="rtl">
              <p className="text-xs leading-relaxed text-zinc-300">
                يا زعيم، لتعمل الصفحة الشخصية، نحتاج لإنشاء فهرسين في Firebase Console كما تظهر في شاشتك بالفرنسية:
              </p>
              
              <div className="space-y-3">
                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                  <p className="text-[10px] font-black text-primary mb-1 uppercase tracking-widest">Index 1 (المنشورات):</p>
                  <ul className="text-[9px] text-zinc-400 space-y-1">
                    <li>1. <span className="text-white">authorId</span> (Croissant)</li>
                    <li>2. <span className="text-white">createdAt</span> (Décroissant)</li>
                  </ul>
                </div>

                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                  <p className="text-[10px] font-black text-orange-500 mb-1 uppercase tracking-widest">Index 2 (الإعجابات):</p>
                  <ul className="text-[9px] text-zinc-400 space-y-1">
                    <li>1. <span className="text-white">likedBy</span> (Tableaux / Arrays)</li>
                    <li>2. <span className="text-white">createdAt</span> (Décroissant)</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg border border-primary/20">
                <Info className="h-3 w-3 text-primary" />
                <p className="text-[9px] text-primary-foreground font-medium">بمجرد تحول الحالة إلى "Actif"، ستعمل صفحتك فوراً.</p>
              </div>
            </div>
          ),
        });
        console.error("Firebase Index Error Context:", errorMessage);
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
