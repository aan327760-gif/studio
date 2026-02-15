
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { UploadProvider } from "@/context/UploadContext";
import { GlobalUploadBar } from "@/components/layout/GlobalUploadBar";
import { NotificationHandler } from "@/components/NotificationHandler";

export const metadata: Metadata = {
  title: "Unbound - Sovereign OS",
  description: "Independent sovereign digital space.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Unbound",
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
    <html lang="ar">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-black selection:bg-primary/30 overflow-x-hidden">
        <FirebaseClientProvider>
          <LanguageProvider>
            <UploadProvider>
              <GlobalUploadBar />
              <NotificationHandler /> {/* محرك التنبيهات الخارجية */}
              {children}
              <Toaster />
            </UploadProvider>
          </LanguageProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
