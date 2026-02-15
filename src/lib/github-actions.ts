
'use server';

import simpleGit from 'simple-git';
import path from 'path';

/**
 * محرك المزامنة السيادي مع GitHub.
 */
export async function syncToGitHub(repoUrl: string, token: string) {
  const rootDir = process.cwd();
  const git = simpleGit(rootDir);

  try {
    // 1. التأكد من تهيئة Git
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      await git.init();
    }

    // 2. بناء رابط المصادقة (إدراج الرمز السري في الرابط)
    // يحول: https://github.com/user/repo.git إلى https://token@github.com/user/repo.git
    const authenticatedUrl = repoUrl.replace('https://', `https://${token}@`);
    
    // تنظيف الريموت القديم إن وجد
    try {
      await git.removeRemote('origin');
    } catch (e) {}
    
    await git.addRemote('origin', authenticatedUrl);

    // 3. تسجيل التغييرات (Commit)
    await git.add('.');
    await git.commit(`Sovereign Deployment - ${new Date().toLocaleString()}`);

    // 4. الرفع (Push) بقوة السيادة
    await git.push('origin', 'main', { '--force': null });

    return { success: true };
  } catch (error: any) {
    console.error('Git Sync Error:', error);
    return { success: false, error: error.message || 'حدث خطأ غير متوقع أثناء المزامنة.' };
  }
}
