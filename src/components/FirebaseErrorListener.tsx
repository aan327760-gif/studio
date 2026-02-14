'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: any) => {
      // التعامل مع الخطأ سواء كان كائناً مهيئاً أو خطأ خاماً
      const context = error.context || {};
      const message = context.message || `You don't have permission to ${context.operation || 'access'} at ${context.path || 'this location'}`;
      
      toast({
        variant: 'destructive',
        title: context.message ? 'Database Error' : 'Permission Denied',
        description: message,
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}