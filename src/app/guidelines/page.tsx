
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Scale, 
  Gavel, 
  AlertOctagon, 
  EyeOff, 
  UserX, 
  FileText, 
  Globe,
  Lock,
  MessageSquare,
  Star,
  CheckCircle2,
  PenTool,
  ShieldAlert
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function CommunityGuidelinesPage() {
  const { isRtl } = useLanguage();
  const router = useRouter();

  const sections = [
    {
      id: "preamble",
      icon: FileText,
      title: isRtl ? "1. الديباجة والفلسفة السيادية" : "1. Preamble & Sovereign Philosophy",
      content: isRtl 
        ? "تؤمن منصة 'بلا قيود' (Unbound) أن السيادة الرقمية تبدأ من الفرد. يهدف هذا الميثاق إلى وضع إطار تنظيمي يضمن ممارسة الحرية دون المساس بكرامة الآخرين أو استقرار المجتمع. إن انضمامك للمنصة يعد تعهداً قانونياً وأخلاقياً بالالتزام بهذه البنود."
        : "Unbound believes that digital sovereignty begins with the individual. This charter aims to establish a regulatory framework that ensures freedom without compromising the dignity of others or social stability."
    },
    {
      id: "verification",
      icon: CheckCircle2,
      title: isRtl ? "2. رتبة المواطن الموثق" : "2. Sovereign Verification Status",
      content: isRtl 
        ? "تُمنح شارة 'الروزيتا' للمواطنين الذين يثبتون التزامهم بقيم المنصة ويقدمون محتوى نوعياً. التوثيق ليس مجرد شكل جمالي، بل هو تفويض سيادي يمنح صاحبه صلاحيات تقنية متقدمة، وأولوية في ترتيب الأفكار، وامتيازات حصرية في إدارة الوسائط."
        : "The Rosette badge is granted to citizens who prove commitment to platform values. Verification is a sovereign mandate granting advanced technical powers and priority in thought ranking."
    },
    {
      id: "concise",
      icon: PenTool,
      title: isRtl ? "3. بروتوكول الإيجاز والوقار" : "3. Concise Communication Protocol",
      content: isRtl 
        ? "للحفاظ على جودة المحتوى ومنع الحشو، تلتزم المنصة بحدود صارمة للأحرف:\n• التعليقات والردود: 100 حرف كحد أقصى.\n• السيرة الذاتية للمواطن: 150 حرفاً.\nنهدف من خلال ذلك إلى تشجيع لغة فكرية مكثفة وراقية تليق بمجتمعنا."
        : "To maintain content quality and prevent filler, the platform enforces strict character limits:\n• Comments & Replies: Max 100 characters.\n• Citizen Bio: Max 150 characters."
    },
    {
      id: "safety",
      icon: AlertOctagon,
      title: isRtl ? "4. السلامة والمحتوى المحظور" : "4. Safety & Prohibited Content",
      content: isRtl 
        ? "يُمنع منعاً باتاً نشر أو ترويج ما يلي: \n• التحريض على العنف أو الإرهاب بكافة أشكاله.\n• خطاب الكراهية القائم على العرق، الدين، أو الانتماء.\n• المحتوى الإباحي أو المخل بالآداب العامة.\n• نشر أخبار زائفة تهدف لزعزعة الأمن العام."
        : "Incitement to violence, hate speech, pornographic content, or spreading fake news is strictly prohibited."
    },
    {
      id: "media",
      icon: Star,
      title: isRtl ? "5. معايير القنوات الإعلامية (Pro)" : "5. Media Channel Standards (Pro)",
      content: isRtl 
        ? "القنوات الإعلامية الموثقة ملزمة بمعايير الشفافية والمصداقية. يجب ذكر المصادر عند نشر الأخبار العاجلة. الإخلال بهذه المعايير أو استغلال الأولوية لنشر التضليل يؤدي لسحب الرتبة فوراً."
        : "Verified Media Channels are bound by standards of transparency. Misusing visibility for misinformation leads to immediate rank revocation."
    },
    {
      id: "legal",
      icon: Scale,
      title: isRtl ? "6. الامتثال القانوني والإقليمي" : "6. Legal & Regional Compliance",
      content: isRtl 
        ? "تخضع المنصة وكافة النزاعات الناشئة عنها لولاية القضاء الجزائري. نحن نلتزم بالاتفاقية العربية لمكافحة جرائم تقنية المعلومات. أي محتوى ينتهك السيادة الوطنية للدول سيتم التعامل معه كخرق جسيم للميثاق."
        : "The platform and all disputes are subject to Algerian jurisdiction and the Arab Convention on Combating IT Crimes."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white max-w-md mx-auto border-x border-zinc-900 pb-20 selection:bg-primary/30">
      <header className="p-6 border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-zinc-900">
            <ArrowLeft className={isRtl ? "rotate-180" : ""} />
          </Button>
          <h1 className="text-xl font-black tracking-tight">{isRtl ? "إرشادات المجتمع" : "Community Guidelines"}</h1>
        </div>
      </header>

      <main className="p-8 space-y-12">
        <section className="text-center space-y-6 py-10 bg-zinc-950 rounded-[3rem] border border-zinc-900 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -z-10" />
           <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto border border-primary/20 shadow-2xl">
              <ShieldCheck className="h-10 w-10 text-primary animate-pulse" />
           </div>
           <div className="space-y-2 px-10">
              <h2 className="text-3xl font-black tracking-tighter uppercase">{isRtl ? "ميثاق بلا قيود" : "The Unbound Charter"}</h2>
              <p className="text-sm text-zinc-500 font-bold leading-relaxed max-w-md mx-auto">
                {isRtl 
                  ? "القواعد التي تحمي سيادتك وتضمن بقاء مجتمعنا حراً، آمناً، ومستقلاً." 
                  : "Rules that protect your sovereignty and ensure our community remains free, safe, and independent."}
              </p>
           </div>
        </section>

        <div className="grid gap-10">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-6 group">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/30 transition-all shadow-xl shrink-0">
                    <section.icon className="h-6 w-6 text-zinc-500 group-hover:text-primary transition-colors" />
                 </div>
                 <h3 className="text-lg font-black tracking-tight group-hover:text-primary transition-colors">{section.title}</h3>
              </div>
              <div className="p-8 bg-zinc-950/50 rounded-[2.5rem] border border-zinc-900 group-hover:border-zinc-800 transition-all">
                 <p className="text-sm text-zinc-400 font-medium leading-[1.8] whitespace-pre-line">
                    {section.content}
                 </p>
              </div>
            </div>
          ))}
        </div>

        <section className="py-16 text-center border-t border-zinc-900 space-y-10">
           <div className="flex justify-center items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">{isRtl ? "الإقرار بالموافقة" : "Acknowledgement"}</span>
           </div>
           <p className="text-sm text-zinc-500 font-bold max-w-lg mx-auto leading-relaxed">
              {isRtl 
                ? "باستخدامك لمنصة بلا قيود، أنت تقر بأنك قرأت وفهمت وتوافق على الالتزام بهذا الميثاق وكافة التبعات القانونية المترتبة على مخالفته." 
                : "By using Unbound, you acknowledge that you have read, understood, and agree to be bound by this charter."}
           </p>
           <div className="flex flex-col items-center gap-6">
              <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
              <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.6em]">
                 ADMINISTRATION OF UNBOUND • SOVEREIGN JURISDICTION
              </p>
           </div>
        </section>
      </main>
    </div>
  );
}
