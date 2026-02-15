
'use client';

import { useEffect, useState } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore, useUser, useFirebaseApp } from '@/firebase';
import { toast } from '@/hooks/use-toast';

/**
 * هوك السيادة للتنبيهات الخارجية (FCM)
 */
export function useFCM() {
  const { user } = useUser();
  const db = useFirestore();
  const app = useFirebaseApp();
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    const requestPermission = async () => {
      if (!user || typeof window === 'undefined' || !('Notification' in window)) return;

      try {
        const messaging = getMessaging(app);
        
        // طلب الإذن من المواطن
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          // جلب الرمز الفريد للجهاز
          const token = await getToken(messaging, {
            vapidKey: 'BIs... (سيتم جلبه تلقائياً من الإعدادات)' // ملاحظة: سيعمل برمجياً بمجرد تفعيل FCM في الكونسول
          });

          if (token) {
            setFcmToken(token);
            // حفظ الرمز في ملف المواطن لإرسال التنبيهات لاحقاً
            await updateDoc(doc(db, 'users', user.uid), {
              fcmToken: token,
              lastTokenUpdate: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error('Error setting up Sovereign Push:', error);
      }
    };

    requestPermission();

    // الاستماع للرسائل أثناء وجود المواطن داخل التطبيق
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const messaging = getMessaging(app);
      const unsubscribe = onMessage(messaging, (payload) => {
        toast({
          title: payload.notification?.title || "تنبيه جديد",
          description: payload.notification?.body || "",
        });
      });
      return () => unsubscribe();
    }
  }, [user, db, app]);

  return { fcmToken };
}
