
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Scale, 
  AlertOctagon, 
  FileText, 
  CheckCircle2,
  PenTool,
  Users
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function CommunityGuidelinesPage() {
  const { isRtl } = useLanguage();
  const router = useRouter();

  const sections = [
    {
      id: "preamble",
      icon: FileText,
      title: isRtl ? "1. الديباجة والسيادة" : "1. Preamble & Sovereignty",
      content: isRtl 
        ? "تؤمن منصة 'بلا قيود' أن السيادة الرقمية تبدأ من الفرد. هذا الميثاق يضمن ممارسة الحرية دون المساس بكرامة الآخرين أو استقرار المجتمع."
        : "Unbound believes that digital sovereignty begins with the individual. This charter ensures freedom without compromising dignity."
    },
    {
      id: "verification",
      icon: CheckCircle2,
      title: isRtl ? "2. رتبة المواطن الموثق" : "2. Verification Status",
      content: isRtl 
        ? "تُمنح شارة 'الروزيتا' للمواطنين الملتزمين بقيم المنصة. التوثيق يمنح صاحبه صلاحيات متقدمة، تشمل: قيادة مجتمعات اللمة، وأولوية التأثير في الخوارزمية."
        : "The Rosette badge is granted to committed citizens. Verification grants advanced powers and algorithm priority."
    },
    {
      id: "concise",
      icon: PenTool,
      title: isRtl ? "3. بروتوكول الإيجاز" : "3. Concise Protocol",
      content: isRtl 
        ? "للحفاظ على جودة الحوار، تلتزم المنصة بحدود صارمة للأحرف:\n• التعليقات: 100 حرف كحد أقصى.\n• السيرة الذاتية: 150 حرفاً.\nنهدف لتشجيع لغة فكرية مكثفة تليق بمجتمعنا."
        : "To maintain quality, the platform enforces strict limits:\n• Comments: Max 100 characters.\n• Citizen Bio: Max 150 characters."
    },
    {
      id: "safety",
      icon: AlertOctagon,
      title: isRtl ? "4. المحتوى المحظور" : "4. Prohibited Content",
      content: isRtl 
        ? "يُمنع منعاً باتاً: التحريض على العنف، خطاب الكراهية، المحتوى الإباحي، أو نشر الأخبار الزائفة لزعزعة الأمن."
        : "Incitement to violence, hate speech, pornographic content, or fake news is strictly prohibited."
    },
    {
      id: "legal",
      icon: Scale,
      title: isRtl ? "5. الامتثال القانوني" : "5. Legal Compliance",
      content: isRtl 
        ? "تخضع المنصة لولاية القضاء الجزائري. نحن نلتزم بالاتفاقية العربية لمكافحة جرائم تقنية المعلومات."
        : "The platform is subject to Algerian jurisdiction and the Arab Convention on Combating IT Crimes."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white max-w-md mx-auto border-x border-zinc-900 pb-20">
      <header className="p-6 border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-md z-50 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className={isRtl ? "rotate-180" : ""} />
        </Button>
        <h1 className="text-xl font-black tracking-tight">{isRtl ? "ميثاق المجتمع" : "Charter"}</h1>
      </header>

      <main className="p-8 space-y-12">
        <section className="text-center space-y-6 py-10 bg-zinc-950 rounded-[3rem] border border-zinc-900 relative overflow-hidden">
           <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto border border-primary/20 shadow-2xl">
              <ShieldCheck className="h-10 w-10 text-primary" />
           </div>
           <div className="space-y-2 px-10">
              <h2 className="text-3xl font-black tracking-tighter uppercase">{isRtl ? "ميثاق بلا قيود" : "The Unbound Charter"}</h2>
              <p className="text-sm text-zinc-500 font-bold leading-relaxed">
                {isRtl ? "القواعد التي تحمي سيادتك وتضمن بقاء مجتمعنا حراً." : "Rules that protect your sovereignty."}
              </p>
           </div>
        </section>

        <div className="grid gap-10">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-6 group">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-primary/10 transition-all shrink-0">
                    <section.icon className="h-6 w-6 text-zinc-500 group-hover:text-primary transition-colors" />
                 </div>
                 <h3 className="text-lg font-black tracking-tight">{section.title}</h3>
              </div>
              <div className="p-8 bg-zinc-950/50 rounded-[2.5rem] border border-zinc-900">
                 <p className="text-sm text-zinc-400 font-medium leading-[1.8] whitespace-pre-line">
                    {section.content}
                 </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
