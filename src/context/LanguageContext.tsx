
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
    appName: "Al-Qaumiyun",
    home: "Home",
    explore: "Explore",
    profile: "Profile",
    settings: "Settings",
    post: "Post",
    follow: "Follow",
    following: "Following",
    comments: "Comments",
    likes: "Likes",
    repost: "Repost",
    search: "Search...",
    createPost: "Share a sovereign thought...",
    trending: "Trending",
    communities: "Societies",
    join: "Join",
    joined: "Joined",
    language: "Language",
    arabic: "العربية",
    english: "English",
    forYou: "Sovereign Feed",
    latest: "Latest Pulse",
  },
  ar: {
    appName: "القوميون",
    home: "الرئيسية",
    explore: "استكشف",
    profile: "الملف الشخصي",
    settings: "الإعدادات",
    post: "نشر",
    follow: "متابعة",
    following: "يتابع",
    comments: "تعليقات",
    likes: "إعجابات",
    repost: "إعادة نشر",
    search: "بحث...",
    createPost: "شارك فكراً سيادياً...",
    trending: "النبض القومي",
    communities: "المجتمعات",
    join: "انضمام",
    joined: "تم الانضمام",
    language: "اللغة",
    arabic: "العربية",
    english: "English",
    forYou: "الخلاصة السيادية",
    latest: "أحدث نبض",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("ar");

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
