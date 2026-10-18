import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { PWAInstallPrompt } from "@/components/providers/PWAInstallPrompt";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ClassSync | Classroom Management",
  description: "A production-grade PWA for classroom management.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ClassSync",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport = {
  themeColor: "#dce7f3",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#dce7f3] dark:bg-[#090e17] text-slate-900 dark:text-slate-100 relative selection:bg-blue-100 selection:text-blue-900">
        {/* Distinct Glacier Mist mesh gradient background */}
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-200/50 via-blue-100/40 to-[#dce7f3] dark:from-blue-950/40 dark:via-slate-950 dark:to-slate-950 opacity-90"></div>
        <div className="fixed inset-0 z-[-1] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.025] mix-blend-overlay"></div>
        
        <ThemeProvider>
          <AuthProvider>
            {children}
            <PWAInstallPrompt />
            <Toaster 
              position="top-center"
              toastOptions={{
                style: {
                  background: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(16px)',
                  color: '#0f172a',
                  boxShadow: '0 12px 30px -5px rgba(15, 23, 42, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.8)',
                  borderRadius: '9999px',
                  padding: '12px 24px',
                  fontWeight: '500',
                }
              }} 
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
