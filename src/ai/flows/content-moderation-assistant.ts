'use server';
/**
 * تم تعطيل مساعد الرقابة الآلي.
 */
export async function moderateContent(input: any) {
  return { isAppropriate: true, reasoning: "تم تعطيل الرقابة الآلية." };
}
export async function analyzeReportAI(input: any) {
  return { recommendation: "مراجعة بشرية مطلوبة.", suggestedAction: "ignore" };
}