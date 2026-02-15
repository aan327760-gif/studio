
'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  onSnapshot, 
  Query, 
  DocumentData, 
  QuerySnapshot 
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<T>) => {
        const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setData(items as (T & { id: string })[]);
        setLoading(false);
      },
      async (err: any) => {
        if (err.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: (query as any)._query?.path?.segments?.join('/') || 'unknown',
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
        } else if (err.message.toLowerCase().includes('index')) {
          errorEmitter.emit('permission-error', {
            message: err.message,
            context: {
              path: (query as any)._query?.path?.segments?.join('/') || 'unknown',
              operation: 'list',
            }
          });
        }
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
}

export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  return useMemo(factory, deps);
}
