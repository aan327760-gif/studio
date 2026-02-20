
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
  title: "القوميون - Al-Qaumiyun | الجريدة العالمية",
  description: "منصة إعلامية عالمية بأقلام المواطنين.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Qaumiyun",
  },
  applicationName: "Al-Qaumiyun",
  authors: [{ name: "Sovereign Editor" }],
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
