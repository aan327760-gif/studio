
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
  Newspaper 
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export default function AboutPage() {
  const { isRtl } = useLanguage();
  const router = useRouter();

  const coreValues = [
    {
      icon: Globe,
      title: isRtl ? "السيادة الوطنية" : "National Sovereignty",
      desc: isRtl 
        ? "كل كاتب في جريدتنا هو سفير لقلمه ووطنه، ننقل نبض الشعوب كما هو دون تزييف." 
        : "Every writer is an ambassador for their nation, conveying the pulse of the people as it is."
    },
    {
      icon: Target,
      title: isRtl ? "الاستقلالية التامة" : "Absolute Independence",
      desc: isRtl 
        ? "نحن مؤسسة إعلامية مستقلة تماماً، لا نتبع لأي جهة سياسية أو تنظيم، سلطتنا الوحيدة هي الحقيقة." 
        : "An entirely independent media institution, not affiliated with any political entity."
    },
    {
      icon: Zap,
      title: isRtl ? "صحافة المواطن" : "Citizen Journalism",
      desc: isRtl 
        ? "نؤمن بأن الخبر أصدق عندما يرويه من عاشه، لذا نمنح المنبر لكل مواطن يمتلك الفكر والرؤية." 
        : "We believe news is truest when told by those who live it, giving a platform to every citizen."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white max-w-md mx-auto border-x border-zinc-900 pb-20">
      <header className="p-6 border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className={cn("h-5 w-5", isRtl ? "rotate-180" : "")} />
          </Button>
          <h1 className="text-xl font-black tracking-tight">{isRtl ? "من نحن" : "About Us"}</h1>
        </div>
        <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary">
           Official
        </div>
      </header>

      <main className="p-8 space-y-16">
        <section className="text-center space-y-8 relative py-10">
           <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto rotate-3 shadow-2xl shadow-primary/20">
              <span className="text-white font-black text-4xl italic">ق</span>
           </div>
           <div className="space-y-4">
              <h2 className="text-3xl font-black tracking-tighter uppercase">{isRtl ? "جريدة القوميون" : "Al-Qaumiyun"}</h2>
              <p className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">{isRtl ? "الجريدة العالمية المستقلة" : "Global Sovereign Newspaper"}</p>
              <p className="text-sm font-medium leading-relaxed text-zinc-400">
                {isRtl 
                  ? "تأسست 'القوميون' لتكون أول منبر إعلامي عالمي يدار بأقلام المواطنين أنفسهم. نحن لسنا مجرد موقع إخباري، بل نحن أرشيف حي لنضال وفكر وطموح الشعوب." 
                  : "Founded to be the first global media platform managed by the citizens themselves."}
              </p>
           </div>
        </section>

        <section className="space-y-8">
           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 text-center">{isRtl ? "ركائزنا الأساسية" : "Our Pillars"}</h3>
           <div className="grid gap-4">
              {coreValues.map((val, i) => (
                <div key={i} className="p-6 bg-zinc-950 border border-zinc-900 rounded-[2rem] space-y-4 group hover:border-primary/20 transition-all">
                   <div className="h-12 w-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 group-hover:bg-primary/10 transition-all">
                      <val.icon className="h-6 w-6 text-primary" />
                   </div>
                   <div className="space-y-1">
                      <h4 className="text-lg font-black">{val.title}</h4>
                      <p className="text-xs text-zinc-500 font-bold leading-relaxed">{val.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </section>

        <section className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 text-center space-y-4">
           <Newspaper className="h-10 w-10 text-primary mx-auto opacity-50" />
           <h3 className="text-xl font-black">{isRtl ? "رسالة القيادة" : "Leadership Message"}</h3>
           <p className="text-xs text-zinc-400 leading-relaxed font-medium">
             {isRtl 
               ? "إن قلمك هو سلاحك في معركة الوعي العالمية. اجعل من مقالاتك جسراً يعبر به وطنك نحو آفاق السيادة والحرية. نحن هنا لنحمي كلمتك وننشر فكرك." 
               : "Your pen is your weapon in the global battle of awareness. Make your articles a bridge for your nation."}
           </p>
        </section>
      </main>
    </div>
  );
}
