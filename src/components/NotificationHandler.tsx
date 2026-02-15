
'use client';

import { useFCM } from "@/hooks/use-fcm";

/**
 * مكون خفي يقوم بتشغيل محرك التنبيهات فور دخول المواطن.
 */
export function NotificationHandler() {
  useFCM(); // تفعيل منطق طلب الإذن والربط مع FCM
  return null;
}
