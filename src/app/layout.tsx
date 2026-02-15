import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { UploadProvider } from "@/context/UploadContext";
import { GlobalUploadBar } from "@/components/layout/GlobalUploadBar";
import { NotificationHandler } from "@/components/NotificationHandler";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
    <html lang="ar" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-black selection:bg-primary/30 overflow-x-hidden`}>
        <FirebaseClientProvider>
          <LanguageProvider>
            <UploadProvider>
              <GlobalUploadBar />
              <NotificationHandler />
              {children}
              <Toaster />
            </UploadProvider>
          </LanguageProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
