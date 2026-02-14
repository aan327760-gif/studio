"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRtl: boolean;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    appName: "LammaFeed",
    home: "Home",
    explore: "Explore",
    lamma: "Lamma",
    profile: "Profile",
    settings: "Settings",
    post: "Post",
    follow: "Follow",
    following: "Following",
    comments: "Comments",
    likes: "Likes",
    repost: "Repost",
    search: "Search...",
    createPost: "What's on your mind?",
    trending: "Trending",
    communities: "Communities",
    join: "Join",
    joined: "Joined",
    language: "Language",
    arabic: "العربية",
    english: "English",
    forYou: "For You",
    latest: "Latest",
  },
  ar: {
    appName: "لمة فيد",
    home: "الرئيسية",
    explore: "استكشف",
    lamma: "لمة",
    profile: "الملف الشخصي",
    settings: "الإعدادات",
    post: "نشر",
    follow: "متابعة",
    following: "يتابع",
    comments: "تعليقات",
    likes: "إعجابات",
    repost: "إعادة نشر",
    search: "بحث...",
    createPost: "ماذا يدور في ذهنك؟",
    trending: "شائع",
    communities: "المجتمعات",
    join: "انضمام",
    joined: "تم الانضمام",
    language: "اللغة",
    arabic: "العربية",
    english: "English",
    forYou: "لك",
    latest: "الأحدث",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as Language;
    if (savedLang) {
      setLanguage(savedLang);
    } else if (typeof window !== "undefined") {
      const browserLang = navigator.language.startsWith("ar") ? "ar" : "en";
      setLanguage(browserLang);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("lang", language);
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  const isRtl = language === "ar";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRtl, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
