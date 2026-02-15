
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, Shield, Zap, Users } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function AboutPage() {
  const { isRtl } = useLanguage();
  const router = useRouter();

  const values = [
    { 
      icon: Shield, 
      title: isRtl ? "السيادة" : "Sovereignty", 
      desc: isRtl ? "بياناتك ملك لك بالكامل، نحن لا نبيعها ولا نراقبها." : "Your data is entirely yours; we don't sell or monitor it." 
    },
    { 
      icon: Zap, 
      title: isRtl ? "الحرية" : "Freedom", 
      desc: isRtl ? "تعبير بلا قيود خوارزمية، صوتك يصل لمن يهمهم الأمر." : "Expression without algorithmic constraints; your voice reaches those who matter." 
    },
    { 
      icon: Users, 
      title: isRtl ? "المجتمع" : "Community", 
      desc: isRtl ? "بناء روابط حقيقية وعميقة في بيئة آمنة ومحترمة." : "Build real and deep connections in a safe and respectful environment." 
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white max-w-md mx-auto border-x border-zinc-900 pb-20">
      <header className="p-6 border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-md z-50 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-zinc-900">
          <ArrowLeft className={isRtl ? "rotate-180" : ""} />
        </Button>
        <h1 className="text-xl font-black tracking-tight">{isRtl ? "عن بلا قيود" : "About Unbound"}</h1>
      </header>

      <main className="p-8 space-y-12">
        <div className="space-y-6 text-center">
           <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center mx-auto rotate-3 shadow-2xl shadow-primary/30">
              <span className="text-white font-black text-4xl italic">U</span>
           </div>
           <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tighter">UNBOUND OS</h2>
              <p className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">{isRtl ? "منصة التواصل السيادية" : "Sovereign Social OS"}</p>
           </div>
        </div>

        <section className="space-y-4">
           <p className="text-lg font-bold leading-relaxed text-zinc-300 text-center">
              {isRtl 
                ? "ولدت منصة 'بلا قيود' من الحاجة لمساحة رقمية تحترم كرامة الإنسان وحريته المطلقة في التعبير." 
                : "Unbound was born from the need for a digital space that respects human dignity and absolute freedom of expression."}
           </p>
        </section>

        <div className="grid gap-6">
           {values.map((val, i) => (
             <div key={i} className="p-6 bg-zinc-950 border border-zinc-900 rounded-[2rem] space-y-3 group hover:border-primary/30 transition-all">
                <div className="h-12 w-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 group-hover:bg-primary/10 transition-colors">
                   <val.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-black">{val.title}</h3>
                <p className="text-sm text-zinc-500 font-medium leading-relaxed">{val.desc}</p>
             </div>
           ))}
        </div>

        <section className="py-10 text-center border-t border-zinc-900">
           <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4">{isRtl ? "تواصل معنا" : "Connect With Us"}</p>
           <div className="flex justify-center gap-6">
              <Globe className="h-6 w-6 text-zinc-700 hover:text-white cursor-pointer transition-colors" />
              <Shield className="h-6 w-6 text-zinc-700 hover:text-white cursor-pointer transition-colors" />
              <Zap className="h-6 w-6 text-zinc-700 hover:text-white cursor-pointer transition-colors" />
           </div>
        </section>

        <p className="text-center text-[8px] font-black text-zinc-800 uppercase tracking-[0.5em]">
           ESTABLISHED 2024 • UNBOUND TECH
        </p>
      </main>
    </div>
  );
}
