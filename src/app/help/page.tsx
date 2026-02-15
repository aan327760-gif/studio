
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  CircleHelp, 
  ShieldCheck, 
  UserCheck, 
  MessageSquare, 
  Flame, 
  Zap, 
  Star, 
  Video, 
  Mic, 
  ShieldAlert,
  Globe,
  Lock,
  Bookmark,
  Hash,
  PenTool
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export default function HelpCenterPage() {
  const { isRtl } = useLanguage();
  const router = useRouter();

  const helpSections = [
    {
      title: isRtl ? "حول المنصة والسيادة" : "About Platform & Sovereignty",
      faqs: [
        {
          question: isRtl ? "ما هي منصة بلا قيود (Unbound)؟" : "What is Unbound?",
          answer: isRtl 
            ? "بلا قيود هي منصة تواصل اجتماعي سيادية تركز على حرية التعبير، الخصوصية، والتواصل العميق دون قيود الخوارزميات التقليدية." 
            : "Unbound is a sovereign social platform focused on free expression, privacy, and deep connection without traditional algorithmic constraints.",
          icon: Flame
        },
        {
          question: isRtl ? "ماذا تعني السيادة الرقمية هنا؟" : "What does Digital Sovereignty mean here?",
          answer: isRtl 
            ? "تعني أن بياناتك ملك لك بالكامل. نحن لا نقوم ببيع بياناتك للمعلنين أو تتبع نشاطك لأغراض تجارية. أنت صاحب القرار في مساحتك الخاصة." 
            : "It means your data is entirely yours. We do not sell your data to advertisers or track your activity for commercial purposes. You are the decision-maker in your own space.",
          icon: ShieldCheck
        }
      ]
    },
    {
      title: isRtl ? "الخوارزمية والترتيب" : "Algorithm & Ranking",
      faqs: [
        {
          question: isRtl ? "كيف تعمل الخوارزمية السيادية؟" : "How does the Sovereign Algorithm work?",
          answer: isRtl 
            ? "خوارزميتنا شفافة وتعتمد على 'نقاط التأثير': الإعجاب يعطي المنشور (+10 نقاط)، التعليق (+15 نقطة)، والحفظ في الأرشيف (+20 نقطة). الأولوية للمحتوى النوعي الذي يلهم الناس لحفظه ومناقشته، مع مراعاة حداثة المنشور (عامل الزمن)." 
            : "Our algorithm is transparent based on 'Impact Points': Like (+10), Comment (+15), and Archive/Save (+20). Priority is given to quality content that inspires people to save and discuss it, while considering post recency.",
          icon: Zap
        },
        {
          question: isRtl ? "هل يمكن لمواطن غير موثق تصدر الصفحة؟" : "Can unverified citizens trend?",
          answer: isRtl 
            ? "نعم، بالتأكيد! رغم أن الموثقين يحصلون على دفعة تشجيعية، إلا أن قوة التفاعل (الحفظ والتعليق) لمواطن عادي يمكنها تجاوز أي رتبة أخرى إذا كان المحتوى قوياً ومؤثراً." 
            : "Yes! While verified users get an initial boost, the engagement power (Saves & Comments) of an unverified citizen can surpass any rank if the content is impactful.",
          icon: Hash
        }
      ]
    },
    {
      title: isRtl ? "التفاعل والمحتوى" : "Interaction & Content",
      faqs: [
        {
          question: isRtl ? "لماذا يوجد حد للأحرف في التعليقات؟" : "Why is there a character limit?",
          answer: isRtl 
            ? "لضمان رقي الحوار وإيجازه، حددنا التعليقات بـ 100 حرف والسيرة الذاتية بـ 150 حرفاً. نحن نشجع على الأفكار المركزة والعميقة بعيداً عن الحشو." 
            : "To ensure concise and elite dialogue, comments are limited to 100 chars and Bio to 150 chars. We encourage focused and deep thoughts.",
          icon: PenTool
        },
        {
          question: isRtl ? "ما هو الأرشيف السيادي؟" : "What is the Sovereign Archive?",
          answer: isRtl 
            ? "يمكنك حفظ أي منشور للعودة إليه لاحقاً عبر أيقونة 'Bookmark'. المنشورات المحفوظة تظهر في تبويب خاص بملفك الشخصي لا يراه غيرك، مما يمنحك سيادة كاملة على مكتبتك المعرفية." 
            : "You can save any post for later using the 'Bookmark' icon. Saved posts appear in a private tab on your profile that only you can see.",
          icon: Bookmark
        },
        {
          question: isRtl ? "من يمكنه تحميل الفيديوهات؟" : "Who can download videos?",
          answer: isRtl 
            ? "ميزة تحميل الفيديوهات هي امتياز سيادي مخصص حصرياً للمواطنين الموثقين (أصحاب الروزيتا) وللمسؤولين، لضمان حماية جهود المبدعين وتقدير النخبة." 
            : "Video downloading is a sovereign privilege exclusively for verified citizens and admins, ensuring creators' protection and elite appreciation.",
          icon: Video
        }
      ]
    },
    {
      title: isRtl ? "المجتمعات (اللمة)" : "Communities (Lamma)",
      faqs: [
        {
          question: isRtl ? "كيف أنشئ 'لمة' خاصة؟" : "How do I create a private 'Lamma'?",
          answer: isRtl 
            ? "يمكنك إنشاء لمة ودعوة متابعينا إليها من خلال صفحة 'اللمة'. هذه المساحات مشفرة تماماً وتتيح لك نقاشات حرة بعيداً عن أعين الغرباء." 
            : "You can create a Lamma and invite your followers through the 'Lamma' page. These spaces are fully encrypted and allow for free discussions away from strangers.",
          icon: MessageSquare
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white max-w-md mx-auto border-x border-zinc-900 pb-20 selection:bg-primary/30">
      <header className="p-6 border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-md z-50 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-zinc-900">
          <ArrowLeft className={isRtl ? "rotate-180" : ""} />
        </Button>
        <h1 className="text-xl font-black tracking-tight">{isRtl ? "مركز المساعدة" : "Help Center"}</h1>
      </header>

      <main className="p-6 space-y-8">
        <div className="text-center space-y-4 py-12 bg-zinc-950 rounded-[3rem] border border-zinc-900 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-all" />
          <div className="h-24 w-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto border border-primary/20 shadow-xl">
             <CircleHelp className="h-12 w-12 text-primary animate-pulse" />
          </div>
          <div className="space-y-2 px-6">
            <h2 className="text-2xl font-black">{isRtl ? "دليل المواطن السيادي" : "Sovereign Citizen Guide"}</h2>
            <p className="text-sm text-zinc-500 font-medium">{isRtl ? "كل ما تحتاج معرفته عن العيش والتواصل في بلا قيود." : "Everything you need to know about living and connecting in Unbound."}</p>
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
                <AccordionItem key={i} value={`item-${idx}-${i}`} className="border border-zinc-900 bg-zinc-950/50 rounded-2xl px-4 overflow-hidden group transition-all hover:border-zinc-800">
                  <AccordionTrigger className="hover:no-underline py-5">
                    <div className="flex items-center gap-4 text-left">
                       <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800 group-data-[state=open]:bg-primary/10 group-data-[state=open]:border-primary/20 transition-colors">
                          <faq.icon className="h-4 w-4 text-zinc-400 group-data-[state=open]:text-primary transition-colors" />
                       </div>
                       <span className="text-sm font-bold group-data-[state=open]:text-primary transition-colors">{faq.question}</span>
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

        <section className="p-8 bg-zinc-950 border border-zinc-900 rounded-[3rem] text-center space-y-6 relative overflow-hidden group">
           <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
           <p className="text-xs text-zinc-500 font-bold relative z-10">{isRtl ? "لم تجد إجابة لسؤالك؟" : "Didn't find your answer?"}</p>
           <Button className="w-full rounded-2xl bg-white text-black font-black h-14 hover:bg-zinc-200 shadow-xl relative z-10 active:scale-95 transition-transform">
              {isRtl ? "تواصل مع فريق الدعم" : "Contact Support Team"}
           </Button>
           <div className="flex justify-center gap-6 relative z-10">
              <Globe className="h-5 w-5 text-zinc-800 hover:text-white cursor-pointer" />
              <ShieldCheck className="h-5 w-5 text-zinc-800 hover:text-white cursor-pointer" />
              <Zap className="h-5 w-5 text-zinc-800 hover:text-white cursor-pointer" />
           </div>
        </section>

        <p className="text-center text-[8px] font-black text-zinc-800 uppercase tracking-[0.5em] pt-4">
           UNBOUND SUPPORT CORE • BUILD 1.0.4
        </p>
      </main>
    </div>
  );
}
