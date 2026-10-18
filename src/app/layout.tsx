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
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#dfe8df" },
    { media: "(prefers-color-scheme: dark)", color: "#09130e" },
  ],
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
      <body className="min-h-full flex flex-col bg-[#dfe8df] dark:bg-[#09130e] text-stone-900 dark:text-stone-100 relative selection:bg-emerald-100 selection:text-emerald-900">
        {/* Distinct Forest Sage mesh gradient background */}
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-200/40 via-green-100/30 to-[#dfe8df] dark:from-emerald-950/40 dark:via-[#09130e] dark:to-[#09130e] opacity-90"></div>
        <div className="fixed inset-0 z-[-1] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.025] mix-blend-overlay"></div>
        
        <ThemeProvider>
          <AuthProvider>
            {children}
            <PWAInstallPrompt />
            <Toaster 
              position="top-center"
              toastOptions={{
                className: '!bg-white/95 dark:!bg-[#121c16] !text-stone-900 dark:!text-white !border !border-stone-200 dark:!border-[#1e3025] !shadow-xl !backdrop-blur-xl !rounded-full !px-5 !py-2.5 !font-medium !text-sm',
              }} 
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
