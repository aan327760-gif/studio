'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: any) => {
      const context = error.context || {};
      const errorMessage = error.message || context.message || "";
      
      // التحقق من خطأ الفهرس (Index Error)
      const isIndexError = errorMessage.toLowerCase().includes('index') || 
                          errorMessage.includes('فهرس');
      
      if (isIndexError) {
        toast({
          duration: 10000,
          title: 'إعداد قاعدة البيانات مطلوب',
          description: (
            <div className="space-y-2 mt-1">
              <p className="text-xs leading-relaxed">
                هذه الصفحة تتطلب إنشاء "فهرس" في Firestore. الرابط المباشر موجود الآن في سجل المتصفح (Console).
              </p>
              <p className="text-[10px] font-bold opacity-70 italic">
                افتح Console (F12) واضغط على الرابط الذي يظهر هناك.
              </p>
            </div>
          ),
        });
        return;
      }

      toast({
        variant: 'destructive',
        title: 'خطأ في الصلاحيات',
        description: context.message || "ليس لديك صلاحية للقيام بهذا الإجراء.",
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}
