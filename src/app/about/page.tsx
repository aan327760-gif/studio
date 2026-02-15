
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, Shield, Zap, Scale, User, Landmark } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function AboutPage() {
  const { isRtl } = useLanguage();
  const router = useRouter();

  const legalFramework = [
    {
      icon: User,
      title: isRtl ? "الهوية والاستقلالية" : "Identity & Independence",
      desc: isRtl 
        ? "مبادرة تقنية مستقلة، نبعت من رؤية مواطن جزائري، ولا تتبع لأي جهة رسمية أو حكومية." 
        : "An independent technical initiative, born from the vision of an Algerian citizen, with no affiliation to any official or governmental entity."
    },
    {
      icon: Scale,
      title: isRtl ? "الامتثال القانوني" : "Legal Compliance",
      desc: isRtl 
        ? "تخضع المنصة في تشغيلها للقوانين واللوائح المعمول بها في الجمهورية الجزائرية الديمقراطية الشعبية." 
        : "The platform operates in compliance with the laws and regulations in force in the People's Democratic Republic of Algeria."
    },
    {
      icon: Landmark,
      title: isRtl ? "الإطار الإقليمي" : "Regional Framework",
      desc: isRtl 
        ? "تلتزم المنصة بالمعايير الأخلاقية والقانونية المتوافقة مع ميثاق جامعة الدول العربية." 
        : "The platform adheres to ethical and legal standards aligned with the Charter of the Arab League."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white max-w-md mx-auto border-x border-zinc-900 pb-20">
      <header className="p-6 border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-md z-50 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-zinc-900">
          <ArrowLeft className={isRtl ? "rotate-180" : ""} />
        </Button>
        <h1 className="text-xl font-black tracking-tight">{isRtl ? "البيان التعريفي" : "Official Proclamation"}</h1>
      </header>

      <main className="p-8 space-y-12">
        <div className="space-y-6 text-center">
           <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center mx-auto rotate-3 shadow-2xl shadow-primary/30">
              <span className="text-white font-black text-4xl italic">U</span>
           </div>
           <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tighter">UNBOUND OS</h2>
              <p className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">{isRtl ? "نظام التواصل السيادي المستقل" : "Independent Sovereign OS"}</p>
           </div>
        </div>

        <section className="space-y-6 text-center">
           <p className="text-sm font-medium leading-relaxed text-zinc-400">
              {isRtl 
                ? "تُعد منصة 'بلا قيود' (Unbound) صرحاً رقمياً سيادياً صُمم ليكون مساحة حرة ومستقلة تماماً. نؤمن بأن التكنولوجيا يجب أن تكون في خدمة الإنسان دون قيود مركزية غامضة." 
                : "Unbound is a sovereign digital bastion designed to be a completely free and independent space. We believe technology should serve humanity without obscure central constraints."}
           </p>
        </section>

        <div className="grid gap-6">
           {legalFramework.map((val, i) => (
             <div key={i} className="p-6 bg-zinc-950 border border-zinc-900 rounded-[2rem] space-y-3 group hover:border-primary/30 transition-all">
                <div className="h-12 w-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 group-hover:bg-primary/10 transition-colors">
                   <val.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-black">{val.title}</h3>
                <p className="text-xs text-zinc-500 font-bold leading-relaxed">{val.desc}</p>
             </div>
           ))}
        </div>

        <section className="py-10 text-center border-t border-zinc-900 space-y-6">
           <div className="space-y-2">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{isRtl ? "المواطنة الرقمية" : "Digital Citizenship"}</p>
              <p className="text-xs text-zinc-500 italic">
                 {isRtl 
                   ? "تم التطوير بجهود وطنية جزائرية لخدمة المجتمع العربي والعالمي." 
                   : "Developed through Algerian national efforts to serve the Arab and global community."}
              </p>
           </div>
           <div className="flex justify-center gap-6">
              <Globe className="h-5 w-5 text-zinc-800 hover:text-white cursor-pointer transition-colors" />
              <Shield className="h-5 w-5 text-zinc-800 hover:text-white cursor-pointer transition-colors" />
              <Zap className="h-5 w-5 text-zinc-800 hover:text-white cursor-pointer transition-colors" />
           </div>
        </section>

        <p className="text-center text-[8px] font-black text-zinc-800 uppercase tracking-[0.5em]">
           ESTABLISHED 2024 • SOVEREIGN INDEPENDENT PROJECT
        </p>
      </main>
    </div>
  );
}
