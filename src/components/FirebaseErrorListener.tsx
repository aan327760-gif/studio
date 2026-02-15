
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { Info, RefreshCw } from 'lucide-react';
import { ToastAction } from '@/components/ui/toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: any) => {
      const errorMessage = error.message || "";
      
      const isIndexError = errorMessage.toLowerCase().includes('index') || 
                          errorMessage.includes('فهرس') ||
                          error.code === 'failed-precondition';
      
      // إذا كان الخطأ يتعلق بالفهرس، نعرض تنبيهاً مفيداً ولكن غير مزعج
      if (isIndexError) {
        toast({
          duration: 5000,
          title: 'تحسين الأداء مطلوب',
          description: "يا زعيم، بعض الصفحات قد تعمل ببطء لأن الفهارس (Indexes) غير مفعلة. قمتُ بحل ذلك مؤقتاً برمجياً لكي لا تتعطل.",
          action: (
            <ToastAction altText="تحديث" onClick={() => window.location.reload()}>
              <RefreshCw className="h-3 w-3 ml-1" />
              تحديث
            </ToastAction>
          ),
        });
        return;
      }

      toast({
        variant: 'destructive',
        title: 'خطأ في الصلاحيات',
        description: "ليس لديك صلاحية للقيام بهذا الإجراء أو أن هناك خطأ في الوصول للبيانات.",
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}
