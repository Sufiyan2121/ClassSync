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
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xl rounded-2xl p-4 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-500">
      <button 
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-1 transition-colors"
        aria-label="Close"
      >
        <X size={16} />
      </button>
      
      <div className="flex items-start gap-3.5">
        <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
          <Download size={22} />
        </div>
        <div className="flex-1 pr-6">
          <h3 className="font-bold text-slate-900 text-sm md:text-base">Install ClassSync</h3>
          
          {isIOS ? (
            <div className="mt-1 text-xs text-slate-600 space-y-1.5">
              <p className="leading-snug text-slate-500">
                To install on your iPhone:
              </p>
              <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 text-[11px] leading-relaxed text-slate-700">
                1. Tap the <span className="font-bold inline-flex items-center gap-0.5 text-blue-600"><Share size={11} /> Share</span> button below.<br/>
                2. Select <span className="font-bold text-slate-900">"Add to Home Screen"</span>.<br/>
                3. Tap <span className="font-bold text-slate-900">"Add"</span> in the top-right.
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500 mt-0.5 mb-2.5 leading-tight">
                Install our app on your home screen for quick and easy access.
              </p>
              <button 
                onClick={handleInstall}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors"
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
