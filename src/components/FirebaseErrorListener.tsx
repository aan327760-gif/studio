'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: any) => {
      const context = error.context || {};
      
      // تمييز رسالة خطأ الفهرس
      const isIndexError = context.message?.includes('index') || error.message?.includes('index');
      
      toast({
        variant: isIndexError ? 'default' : 'destructive',
        title: isIndexError ? 'إعداد مطلوب (Index)' : 'خطأ في الصلاحيات',
        description: isIndexError 
          ? "يرجى إنشاء الفهرس عبر الرابط الموجود في سجل المتصفح (Console) لتعمل هذه الصفحة."
          : (context.message || "ليس لديك صلاحية للقيام بهذا الإجراء."),
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}
