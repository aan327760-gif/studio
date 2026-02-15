
'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, DocumentReference, DocumentData } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      ref,
      (doc) => {
        setData(doc.exists() ? ({ ...doc.data(), id: doc.id } as T) : null);
        setLoading(false);
      },
      async (err) => {
        if (err.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: ref.path,
            operation: 'get',
          });
          errorEmitter.emit('permission-error', permissionError);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref]);

  return { data, loading };
}
