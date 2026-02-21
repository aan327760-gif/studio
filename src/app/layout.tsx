
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { UploadProvider } from "@/context/UploadContext";
import { GlobalUploadBar } from "@/components/layout/GlobalUploadBar";
import { NotificationHandler } from "@/components/NotificationHandler";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: "القوميون - Al-Qaumiyun | الجريدة العالمية",
    template: "%s | القوميون"
  },
  description: "الحقيقة يرويها من عاشها. انضم الآن لأكبر منبر إعلامي شعبي مستقل، وساهم في بناء الأرشيف السيادي لأمتنا بأقلامنا الحرة.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Qaumiyun",
  },
  applicationName: "Al-Qaumiyun",
  authors: [{ name: "Sovereign Editor" }],
  openGraph: {
    title: "انضم للقوميين | منبر السيادة العالمية",
    description: "نحن لا ننشر الأخبار، نحن نصنع التاريخ بأقلامنا. انضم لجريدة القوميون العالمية الآن وكن صوتاً لوطنك وسيادتك.",
    url: "https://unbound-os.vercel.app",
    siteName: "القوميون",
    images: [
      {
        url: "https://picsum.photos/seed/qaumiyun-sovereign-og/1200/630",
        width: 1200,
        height: 630,
        alt: "القوميون - Al-Qaumiyun",
      },
    ],
    locale: "ar_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "جريدة القوميون - صوت الشعوب الحرة",
    description: "السيادة الوطنية تبدأ بقلمك. سجل الآن في الجريدة العالمية المستقلة.",
    images: ["https://picsum.photos/seed/qaumiyun-sovereign-og/1200/630"],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-black selection:bg-primary/30 overflow-x-hidden`}>
        <FirebaseClientProvider>
          <LanguageProvider>
            <UploadProvider>
              <GlobalUploadBar />
              <NotificationHandler />
              <div className="min-h-screen">
                {children}
              </div>
              <Toaster />
            </UploadProvider>
          </LanguageProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
