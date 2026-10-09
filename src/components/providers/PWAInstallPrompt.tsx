"use client";

import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      
      // Check if they already dismissed it this session
      const hasDismissed = sessionStorage.getItem("pwa-prompt-dismissed");
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // If app is already installed, this will be true
    window.addEventListener("appinstalled", () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    
    // We've used the prompt, and can't use it again, discard it
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-white/90 backdrop-blur-xl border border-slate-200/60 shadow-2xl rounded-2xl p-4 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-500">
      <button 
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-1 transition-colors"
      >
        <X size={16} />
      </button>
      
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
          <Download size={24} />
        </div>
        <div className="flex-1 pr-6">
          <h3 className="font-bold text-slate-900 text-base">Install ClassSync</h3>
          <p className="text-sm text-slate-500 mt-0.5 mb-3 leading-tight">
            Install our app on your home screen for quick and easy access.
          </p>
          <div className="flex gap-2">
            <button 
              onClick={handleInstall}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl text-sm transition-colors"
            >
              Install App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
