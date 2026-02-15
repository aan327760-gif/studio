
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CircleHelp, ShieldCheck, UserCheck, MessageSquare, Flame } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function HelpCenterPage() {
  const { isRtl } = useLanguage();
  const router = useRouter();

  const faqs = [
    {
      question: isRtl ? "ما هي منصة بلا قيود (Unbound)؟" : "What is Unbound?",
      answer: isRtl 
        ? "بلا قيود هي منصة تواصل اجتماعي سيادية تركز على حرية التعبير، الخصوصية، والتواصل العميق دون قيود الخوارزميات التقليدية." 
        : "Unbound is a sovereign social platform focused on free expression, privacy, and deep connection without traditional algorithmic constraints.",
      icon: Flame
    },
    {
      question: isRtl ? "كيف أحصل على شارة التوثيق؟" : "How do I get verified?",
      answer: isRtl 
        ? "التوثيق في بلا قيود يتم من قبل الإدارة بعد التأكد من هوية المستخدم أو نشاطه المميز في المنصة لضمان بيئة موثوقة." 
        : "Verification in Unbound is granted by admin after verifying user identity or notable activity to ensure a trusted environment.",
      icon: UserCheck
    },
    {
      question: isRtl ? "ما هي القنوات الإعلامية الموثقة؟" : "What are Media Channels?",
      answer: isRtl 
        ? "هي حسابات مخصصة للمؤسسات الإخبارية والإعلامية، تتميز بنجمة ذهبية وأولوية في الظهور لنشر الأخبار الموثوقة." 
        : "These are accounts dedicated to news and media organizations, featuring a golden star and priority visibility for trusted news.",
      icon: ShieldCheck
    },
    {
      question: isRtl ? "كيف تعمل ميزة اللمة (Lamma)؟" : "How does Lamma work?",
      answer: isRtl 
        ? "اللمة هي مساحات دردشة خاصة أو عامة تتيح لك التواصل المباشر مع متابعيك أو الانضمام لمجتمعات تشاركك نفس الاهتمامات." 
        : "Lamma are private or public chat spaces that allow direct communication with followers or joining communities with shared interests.",
      icon: MessageSquare
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white max-w-md mx-auto border-x border-zinc-900 pb-20">
      <header className="p-6 border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-md z-50 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-zinc-900">
          <ArrowLeft className={isRtl ? "rotate-180" : ""} />
        </Button>
        <h1 className="text-xl font-black tracking-tight">{isRtl ? "مركز المساعدة" : "Help Center"}</h1>
      </header>

      <main className="p-6 space-y-8">
        <div className="text-center space-y-4 py-10 bg-zinc-950 rounded-[3rem] border border-zinc-900 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-all" />
          <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto border border-primary/20 shadow-xl">
             <CircleHelp className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2 px-6">
            <h2 className="text-2xl font-black">{isRtl ? "كيف يمكننا مساعدتك؟" : "How can we help?"}</h2>
            <p className="text-sm text-zinc-500 font-medium">{isRtl ? "ابحث عن إجابات لاستفساراتك حول المنصة السيادية." : "Find answers to your inquiries about the sovereign platform."}</p>
          </div>
        </div>

        <section className="space-y-4">
           <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] px-2">{isRtl ? "الأسئلة الشائعة" : "Common Questions"}</h3>
           <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border border-zinc-900 bg-zinc-950/50 rounded-2xl px-4 overflow-hidden">
                  <AccordionTrigger className="hover:no-underline py-5">
                    <div className="flex items-center gap-4 text-left">
                       <faq.icon className="h-5 w-5 text-primary shrink-0" />
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

        <section className="p-8 bg-zinc-950 border border-zinc-900 rounded-[2.5rem] text-center space-y-4">
           <p className="text-xs text-zinc-500 font-bold">{isRtl ? "لم تجد ما تبحث عنه؟" : "Didn't find what you need?"}</p>
           <Button className="w-full rounded-2xl bg-white text-black font-black h-12 hover:bg-zinc-200">
              {isRtl ? "تواصل مع الدعم" : "Contact Support"}
           </Button>
        </section>
      </main>
    </div>
  );
}
