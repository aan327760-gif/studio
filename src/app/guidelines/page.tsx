
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Flag, Scale, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function CommunityGuidelinesPage() {
  const { isRtl } = useLanguage();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white max-w-md mx-auto border-x border-zinc-900 pb-20">
      <header className="p-6 border-b border-zinc-900 sticky top-0 bg-black/80 backdrop-blur-md z-50 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full"><ArrowLeft className={isRtl ? "rotate-180" : ""} /></Button>
        <h1 className="text-xl font-black">{isRtl ? "ميثاق المجتمع" : "Charter"}</h1>
      </header>
      <main className="p-8 space-y-12">
        <section className="space-y-6">
          <div className="flex items-center gap-4">
             <Flag className="h-6 w-6 text-primary" />
             <h2 className="text-lg font-black">{isRtl ? "1. قدسية الوطن" : "1. Sanctity"}</h2>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">{isRtl ? "يُمنع الإساءة للأوطان والشعوب." : "Respect all nations and people."}</p>
        </section>
        <section className="space-y-6">
          <div className="flex items-center gap-4">
             <Scale className="h-6 w-6 text-primary" />
             <h2 className="text-lg font-black">{isRtl ? "2. الحقيقة" : "2. Truth"}</h2>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">{isRtl ? "النشر بلسان المواطن الذي عاش الخبر." : "News told by those who live it."}</p>
        </section>
      </main>
    </div>
  );
}
