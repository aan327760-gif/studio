'use server';

/**
 * تم تعطيل محرك المزامنة السيادي مع GitHub بناءً على أوامر القيادة.
 */
export async function syncToGitHub(repoUrl: string, token: string) {
  return { success: false, error: 'تم تعطيل هذه الميزة في هذا الإصدار.' };
}