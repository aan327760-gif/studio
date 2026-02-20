
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
  Database,
  EyeOff
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export default function HelpAndPrivacyPage() {
  const { isRtl } = useLanguage();
  const router = useRouter();

  const helpSections = [
    {
      title: isRtl ? "سياسة الخصوصية السيادية" : "Sovereign Privacy Policy",
      faqs: [
        {
          question: isRtl ? "من يملك بياناتي؟" : "Who owns my data?",
          answer: isRtl 
            ? "أنت المالك الوحيد لبياناتك ومقالاتك. نحن لا نقوم ببيع بيانات المواطنين لأي جهات إعلانية أو طرف ثالث تحت أي ظرف." 
            : "You are the sole owner of your data. We never sell citizen data.",
          icon: Lock
        },
        {
          question: isRtl ? "ما الذي نقوم بتخزينه؟" : "What do we store?",
          answer: isRtl 
            ? "نخزن فقط الحد الأدنى اللازم لتشغيل حسابك: بريدك الإلكتروني، اسمك، وطنك، ومقالاتك. بياناتك مشفرة ومحمية سيادياً." 
            : "We store the bare minimum: email, name, nation, and articles.",
          icon: Database
        },
        {
          question: isRtl ? "هل هناك تتبع خارجي؟" : "Any external tracking?",
          answer: isRtl 
            ? "لا نستخدم ملفات تعريف الارتباط للتتبع (Tracking Cookies) أو أي أدوات تتبع خارجية. خصوصيتك هي أولوية قصوى." 
            : "No tracking cookies or external tracking tools are used.",
          icon: EyeOff
        }
      ]
    },
    {
      title: isRtl ? "دليل المواطن الكاتب" : "Citizen Writer Guide",
      faqs: [
        {
          question: isRtl ? "كيف أحصل على المزيد من النقاط؟" : "How to get more points?",
          answer: isRtl 
            ? "تحصل على +2 نقطة عن كل لايك، و +5 نقاط عن كل تعليق يضعه الآخرون على مقالك. التميز في الكتابة هو طريقك للرصيد." 
            : "Get +2 for every like and +5 for every comment on your articles.",
          icon: Flame
        },
        {
          question: isRtl ? "ما هو ميعاد تحديث الرتب؟" : "When are ranks updated?",
          answer: isRtl 
            ? "يتم تحديث رتبتك (مبتدئ، نشط، متميز) فورياً وتلقائياً بمجرد وصول رصيد نقاطك للحد المطلوب." 
            : "Ranks are updated instantly based on your total points.",
          icon: ShieldCheck
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white max-w-md mx-auto border-x border-zinc-900 pb-20">
      <header className="p-6 border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-md z-50 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className={cn("h-5 w-5", isRtl ? "rotate-180" : "")} />
        </Button>
        <h1 className="text-xl font-black tracking-tight">{isRtl ? "الخصوصية والمساعدة" : "Help & Privacy"}</h1>
      </header>

      <main className="p-6 space-y-8">
        <div className="text-center space-y-4 py-12 bg-zinc-950 rounded-[2.5rem] border border-zinc-900 shadow-2xl relative overflow-hidden">
          <div className="h-20 w-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20">
             <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2 px-6">
            <h2 className="text-2xl font-black">{isRtl ? "حصن الخصوصية" : "Privacy Fortress"}</h2>
            <p className="text-xs text-zinc-500 font-medium">{isRtl ? "أمانك الفكري وبياناتك الشخصية في عهدتنا." : "Your intellectual safety is our duty."}</p>
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
                <AccordionItem key={i} value={`item-${idx}-${i}`} className="border border-zinc-900 bg-zinc-950/50 rounded-2xl px-4 overflow-hidden shadow-sm">
                  <AccordionTrigger className="hover:no-underline py-5">
                    <div className="flex items-center gap-4 text-right">
                       <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800 shrink-0">
                          <faq.icon className="h-4 w-4 text-primary" />
                       </div>
                       <span className="text-sm font-bold text-zinc-200">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-400 text-xs leading-relaxed pb-5 font-medium border-t border-zinc-900 pt-4 px-2">
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
