
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
  Flag
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export default function CommunityGuidelinesPage() {
  const { isRtl } = useLanguage();
  const router = useRouter();

  const sections = [
    {
      id: "sovereignty",
      icon: Flag,
      title: isRtl ? "1. قدسية الوطن" : "1. National Sanctity",
      content: isRtl 
        ? "يُمنع منعاً باتاً الإساءة لأي وطن أو شعب أو ثقافة. نحن منبر يجمع القوميين للبناء، وليس للهدم أو إثارة الفتن بين الشعوب."
        : "Strictly prohibited to insult any nation, people, or culture. We build, not destroy."
    },
    {
      id: "concise",
      icon: PenTool,
      title: isRtl ? "2. بروتوكول الإيجاز" : "2. Concise Protocol",
      content: isRtl 
        ? "لضمان جودة المحتوى، نلتزم بحد الـ 1000 حرف للمقال الواحد. المقال القوي هو المقال المكثف الذي يحمل فكرة واضحة ومباشرة."
        : "To ensure quality, we adhere to the 1000 character limit. Strong articles are concise."
    },
    {
      id: "points",
      icon: ShieldCheck,
      title: isRtl ? "3. نظام الجدارة (النقاط)" : "3. Merit System (Points)",
      content: isRtl 
        ? "النشر في الجريدة هو امتياز يُمنح للأعضاء الفاعلين. استهلاك النقاط للنشر يضمن أن كل كاتب يراجع كلماته بعناية قبل الضغط على زر النشر."
        : "Publishing is a privilege. Point consumption ensures careful writing."
    },
    {
      id: "safety",
      icon: AlertOctagon,
      title: isRtl ? "4. الخطوط الحمراء" : "4. Red Lines",
      content: isRtl 
        ? "التحريض على العنف، الكراهية، الأخبار الزائفة، والمحتوى غير اللائق هي جرائم تؤدي للحظر الفوري والنهائي من غرفة العمليات."
        : "Violence incitement, hate, fake news, and inappropriate content lead to immediate ban."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white max-w-md mx-auto border-x border-zinc-900 pb-20">
      <header className="p-6 border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-md z-50 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className={cn("h-5 w-5", isRtl ? "rotate-180" : "")} />
        </Button>
        <h1 className="text-xl font-black tracking-tight">{isRtl ? "ميثاق المجتمع" : "Community Charter"}</h1>
      </header>

      <main className="p-8 space-y-12">
        <section className="text-center space-y-6 py-10 bg-zinc-950 rounded-[2.5rem] border border-zinc-900 overflow-hidden relative">
           <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20">
              <Scale className="h-8 w-8 text-primary" />
           </div>
           <div className="space-y-2 px-6">
              <h2 className="text-2xl font-black">{isRtl ? "الميثاق القومي" : "The National Charter"}</h2>
              <p className="text-xs text-zinc-500 font-bold leading-relaxed">
                {isRtl ? "القواعد التي تحمي صوتك وتضمن رقي الحوار في جريدتنا." : "Rules that protect your voice."}
              </p>
           </div>
        </section>

        <div className="space-y-10">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-4">
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <section.icon className="h-5 w-5 text-zinc-500" />
                 </div>
                 <h3 className="text-lg font-black tracking-tight">{section.title}</h3>
              </div>
              <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-900">
                 <p className="text-sm text-zinc-400 font-medium leading-relaxed">
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
