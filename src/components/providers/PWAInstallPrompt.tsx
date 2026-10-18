"use client";

import { useState, useEffect } from "react";
import { X, Download, Share } from "lucide-react";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // If we're already running as an installed standalone app, don't show
    const isStandalone =
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return;
    }

    // If dismissed this session or installed previously
    if (localStorage.getItem("pwa-installed") === "true") {
      return;
    }
    if (sessionStorage.getItem("pwa-prompt-dismissed") === "true") {
      return;
    }

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);

    if (isIosDevice) {
      setIsIOS(true);
      setShowPrompt(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem("pwa-installed", "true");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
      localStorage.setItem("pwa-installed", "true");
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-white/95 dark:bg-[#0c1610]/95 backdrop-blur-xl border border-stone-200/80 dark:border-[#1e3025] shadow-2xl rounded-2xl p-4 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-500">
      <button 
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 bg-stone-100 hover:bg-stone-200 dark:bg-[#16231b] dark:hover:bg-[#1f3325] rounded-full p-1 transition-colors cursor-pointer"
        aria-label="Close"
      >
        <X size={16} />
      </button>
      
      <div className="flex items-start gap-3.5">
        <div className="w-12 h-12 bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-950/20 shrink-0">
          <Download size={22} />
        </div>
        <div className="flex-1 pr-6">
          <h3 className="font-black text-stone-900 dark:text-white text-sm md:text-base tracking-tight">
            <span>Install Class</span>
            <span className="text-emerald-700 dark:text-emerald-400">Sync</span>
          </h3>
          
          {isIOS ? (
            <div className="mt-1 text-xs text-stone-600 dark:text-stone-300 space-y-1.5">
              <p className="leading-snug text-stone-500 dark:text-stone-400">
                To install on your iPhone:
              </p>
              <div className="bg-stone-50 dark:bg-[#121c16] rounded-lg p-2 border border-stone-200/60 dark:border-[#1e3025] text-[11px] leading-relaxed text-stone-700 dark:text-stone-300">
                1. Tap the <span className="font-bold inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400"><Share size={11} /> Share</span> button below.<br/>
                2. Select <span className="font-bold text-stone-900 dark:text-white">"Add to Home Screen"</span>.<br/>
                3. Tap <span className="font-bold text-stone-900 dark:text-white">"Add"</span> in the top-right.
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 mb-2.5 leading-tight">
                Install our app on your home screen for quick and easy access.
              </p>
              <button 
                onClick={handleInstall}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
              >
                Install App
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
