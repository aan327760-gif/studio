
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Globe, 
  Shield, 
  Zap, 
  Scale, 
  User, 
  Landmark, 
  Target, 
  Cpu, 
  BookOpen 
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export default function AboutPage() {
  const { isRtl } = useLanguage();
  const router = useRouter();

  const coreValues = [
    {
      icon: Cpu,
      title: isRtl ? "السيادة الرقمية" : "Digital Sovereignty",
      desc: isRtl 
        ? "نؤمن بحق الأفراد والمجتمعات in امتلاك وإدارة بياناتهم بعيداً عن الهيمنة التقنية العابرة للحدود." 
        : "We believe in the right of individuals and communities to own and manage their data, free from cross-border technical dominance."
    },
    {
      icon: Target,
      title: isRtl ? "الحرية المسؤولة" : "Responsible Freedom",
      desc: isRtl 
        ? "توفير مساحة للتعبير الحر تلتزم بالمعايير الأخلاقية الرفيعة وتحترم كرامة الإنسان." 
        : "Providing a space for free expression that adheres to high ethical standards and respects human dignity."
    },
    {
      icon: Zap,
      title: isRtl ? "الابتكار المستقل" : "Independent Innovation",
      desc: isRtl 
        ? "تطوير حلول تقنية وطنية قادرة على المنابت عالمياً وبناء مستقبل رقمي واعد." 
        : "Developing national technical solutions capable of global competition and building a promising digital future."
    }
  ];

  const legalFramework = [
    {
      icon: User,
      title: isRtl ? "طبيعة المبادرة" : "Nature of the Initiative",
      desc: isRtl 
        ? "إن منصة 'بلا قيود' (Unbound) هي مبادرة تقنية مستقلة تماماً، نبعت من رؤية وطموح مواطن جزائري يسعى للمساهمة في تطوير المشهد الرقمي." 
        : "Unbound is an entirely independent technical initiative, born from the vision of an Algerian citizen seeking to contribute to the digital landscape."
    },
    {
      icon: Scale,
      title: isRtl ? "الامتثال التشريعي" : "Legislative Compliance",
      desc: isRtl 
        ? "تلتزم المنصة في كافة عملياتها بالقوانين واللوائح المعمول بها في الجمهورية الجزائرية الديمقراطية الشعبية، وتخضع لولايتها القضائية." 
        : "The platform adheres in all its operations to the laws and regulations in force in the People's Democratic Republic of Algeria, subject to its jurisdiction."
    },
    {
      icon: Landmark,
      title: isRtl ? "الإطار الإقليمي" : "Regional Framework",
      desc: isRtl 
        ? "تسترشد المنصة في ممارساتها بالمعايير الأخلاقية والقانونية المتوافقة مع ميثاق جامعة الدول العربية لضمان بيئة آمنة للمجتمعات العربية." 
        : "The platform is guided by ethical and legal standards aligned with the Charter of the Arab League to ensure a safe environment for Arab communities."
    },
    {
      icon: Shield,
      title: isRtl ? "الاستقلالية المؤسسية" : "Institutional Independence",
      desc: isRtl 
        ? "تؤكد المنصة عدم تبعيتها لأي جهة رسمية أو تنظيم حكومي، وهي مشروع خاص يهدف لخدمة الصالح العام بأسلوب حضاري." 
        : "The platform confirms its non-affiliation with any official body or government organization; it is a private project aimed at serving the public good."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white max-w-md mx-auto border-x border-zinc-900 pb-20 selection:bg-primary/30">
      <header className="p-6 border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-zinc-900 transition-all">
            <ArrowLeft className={isRtl ? "rotate-180" : ""} />
          </Button>
          <h1 className="text-xl font-black tracking-tight">{isRtl ? "عن بلا قيود" : "About Unbound"}</h1>
        </div>
        <div className="px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-500">
           Official Proclamation
        </div>
      </header>

      <main className="p-8 space-y-20">
        <section className="space-y-10 text-center relative overflow-hidden py-10">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10" />
           <div className="w-24 h-24 rounded-[2.5rem] bg-primary flex items-center justify-center mx-auto rotate-6 shadow-2xl shadow-primary/40 relative group transition-transform hover:rotate-0">
              <span className="text-white font-black text-5xl italic">U</span>
              <div className="absolute -bottom-2 -right-2 bg-black rounded-full p-2 border border-zinc-800">
                 <Globe className="h-4 w-4 text-primary animate-pulse" />
              </div>
           </div>
           <div className="space-y-4">
              <h2 className="text-4xl font-black tracking-tighter">UNBOUND OS</h2>
              <p className="text-primary text-[11px] font-black uppercase tracking-[0.5em]">{isRtl ? "نظام التواصل السيادي المستقل" : "Independent Sovereign Communication System"}</p>
              <div className="max-w-lg mx-auto pt-6">
                <p className="text-sm font-medium leading-relaxed text-zinc-400">
                  {isRtl 
                    ? "تمثل منصة 'بلا قيود' (Unbound) صرحاً رقمياً سيادياً صُمم ليكون مساحة حرة ومستقلة تماماً. نؤمن بأن التكنولوجيا يجب أن تكون في خدمة الإنسان دون قيود مركزية، مع الحفاظ على الهوية الوطنية والقيم الإقليمية." 
                    : "Unbound represents a sovereign digital bastion designed to be a completely free and independent space. We believe technology should serve humanity without central constraints, while preserving national identity and regional values."}
                </p>
              </div>
           </div>
        </section>

        <section className="space-y-8">
           <div className="flex items-center gap-3">
              <div className="h-1 bg-primary w-8 rounded-full" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">{isRtl ? "قيمنا الأساسية" : "Core Values"}</h3>
           </div>
           <div className="grid gap-4">
              {coreValues.map((val, i) => (
                <div key={i} className="p-6 bg-zinc-950 border border-zinc-900 rounded-[2.5rem] flex items-start gap-6 group hover:border-primary/20 transition-all">
                   <div className="h-14 w-14 bg-zinc-900 rounded-3xl flex items-center justify-center border border-zinc-800 group-hover:bg-primary/10 group-hover:border-primary/30 transition-all shrink-0">
                      <val.icon className="h-6 w-6 text-primary" />
                   </div>
                   <div className="space-y-2">
                      <h4 className="text-lg font-black">{val.title}</h4>
                      <p className="text-xs text-zinc-500 font-bold leading-relaxed">{val.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </section>

        <section className="space-y-8 bg-zinc-950/50 rounded-[3rem] p-8 border border-zinc-900 relative">
           <div className="absolute top-8 right-8 text-primary/10">
              <BookOpen className="h-32 w-32" />
           </div>
           <div className="space-y-12 relative z-10">
              <div className="space-y-4">
                <h3 className="text-2xl font-black tracking-tight">{isRtl ? "البيان المؤسسي والهوية" : "Institutional Statement & Identity"}</h3>
                <p className="text-xs text-zinc-500 font-bold leading-relaxed max-w-md">
                   {isRtl 
                     ? "نص أكاديمي يوضح الإطار القانوني والسيادي الذي تعمل من خلاله المنصة لضمان الشفافية والمصداقية." 
                     : "An academic text clarifying the legal and sovereign framework within which the platform operates to ensure transparency and credibility."}
                </p>
              </div>

              <div className="grid gap-10">
                {legalFramework.map((item, i) => (
                  <div key={i} className="flex gap-6 items-start">
                     <div className="h-10 w-10 bg-black rounded-2xl flex items-center justify-center border border-zinc-800 shadow-xl shrink-0">
                        <item.icon className="h-5 w-5 text-primary" />
                     </div>
                     <div className="space-y-2">
                        <h5 className="text-sm font-black text-zinc-200 uppercase tracking-wide">{item.title}</h5>
                        <p className="text-xs text-zinc-500 leading-relaxed font-medium">{item.desc}</p>
                     </div>
                  </div>
                ))}
              </div>
           </div>
        </section>

        <section className="py-10 text-center border-t border-zinc-900 space-y-10">
           <div className="pt-10">
              <p className="text-[8px] font-black text-zinc-800 uppercase tracking-[0.6em] mb-4">
                 ESTABLISHED 2024 • SOVEREIGN INDEPENDENT PROJECT
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-950 border border-zinc-900 rounded-full text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                 Version 1.0.4 • Build Sovereign
              </div>
           </div>
        </section>
      </main>
    </div>
  );
}
