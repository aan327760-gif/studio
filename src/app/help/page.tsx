
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  CircleHelp, 
  ShieldCheck, 
  Flame, 
  Lock,
  Scale,
  PenTool
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function HelpCenterPage() {
  const { isRtl } = useLanguage();
  const router = useRouter();

  const helpSections = [
    {
      title: isRtl ? "حول السيادة" : "About Sovereignty",
      faqs: [
        {
          question: isRtl ? "ما هي منصة بلا قيود؟" : "What is Unbound?",
          answer: isRtl 
            ? "بلا قيود هي منصة تواصل اجتماعي سيادية تركز على حرية التعبير، الخصوصية، والتواصل العميق دون قيود الخوارزميات التقليدية." 
            : "Unbound is a sovereign social platform focused on free expression and privacy.",
          icon: Flame
        },
        {
          question: isRtl ? "ماذا تعني السيادة الرقمية؟" : "What is Digital Sovereignty?",
          answer: isRtl 
            ? "تعني أن بياناتك ملك لك بالكامل. نحن لا نقوم ببيع بياناتك للمعلنين. أنت صاحب القرار في مساحتك الخاصة." 
            : "It means your data is yours. We don't sell it.",
          icon: ShieldCheck
        }
      ]
    },
    {
      title: isRtl ? "الخصوصية والأمان" : "Privacy & Security",
      faqs: [
        {
          question: isRtl ? "كيف يتم تأمين المحادثات؟" : "How are chats secured?",
          answer: isRtl 
            ? "نعتمد بروتوكول 'الصداقة السيادية'؛ حيث لا يمكن مراسلة أي مواطن إلا إذا كانت المتابعة متبادلة (Mutual Follow) لضمان بيئة آمنة." 
            : "Messaging is restricted to mutual followers for safety.",
          icon: Lock
        },
        {
          question: isRtl ? "أين تخزن بياناتي؟" : "Where is data stored?",
          answer: isRtl 
            ? "تخضع المنصة لولاية القضاء في الجمهورية الجزائرية الديمقراطية الشعبية، متماشية مع المعايير الأخلاقية العربية." 
            : "Stored under Algerian jurisdiction and Arab ethical standards.",
          icon: Scale
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white max-w-md mx-auto border-x border-zinc-900 pb-20">
      <header className="p-6 border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-md z-50 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className={isRtl ? "rotate-180" : ""} />
        </Button>
        <h1 className="text-xl font-black tracking-tight">{isRtl ? "مركز المساعدة" : "Help"}</h1>
      </header>

      <main className="p-6 space-y-8">
        <div className="text-center space-y-4 py-12 bg-zinc-950 rounded-[3rem] border border-zinc-900 shadow-2xl relative overflow-hidden">
          <div className="h-24 w-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto border border-primary/20">
             <CircleHelp className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2 px-6">
            <h2 className="text-2xl font-black">{isRtl ? "دليل المواطن" : "Citizen Guide"}</h2>
            <p className="text-sm text-zinc-500 font-medium">{isRtl ? "كل ما تحتاجه للعيش والتواصل في بلا قيود." : "How to connect in Unbound."}</p>
          </div>
        </div>

        {helpSections.map((section, idx) => (
          <section key={idx} className="space-y-4">
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
              <span className="h-1 w-4 bg-primary rounded-full" />
              {section.title}
            </h3>
            <Accordion type="single" collapsible className="space-y-3">
              {section.faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${idx}-${i}`} className="border border-zinc-900 bg-zinc-950/50 rounded-2xl px-4 overflow-hidden">
                  <AccordionTrigger className="hover:no-underline py-5">
                    <div className="flex items-center gap-4 text-left">
                       <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                          <faq.icon className="h-4 w-4 text-zinc-400" />
                       </div>
                       <span className="text-sm font-bold">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-400 text-sm leading-relaxed pb-5 font-medium border-t border-zinc-900 pt-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}
      </main>
    </div>
  );
}
