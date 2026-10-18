"use client";

import { usePushNotifications } from "@/hooks/usePushNotifications";
import { BellOff, BellRing } from "lucide-react";
import toast from "react-hot-toast";

export function NotificationBell() {
  const { permission, isEnabled, requestPermission, toggleReminders } = usePushNotifications();

  if (permission === 'denied') {
    return (
      <button 
        onClick={() => toast.error('Please unblock notifications in your browser settings.')}
        className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl font-bold text-xs border border-red-200 dark:border-red-900/60 shadow-2xs hover:bg-red-100 dark:hover:bg-red-900/50 transition-all cursor-pointer"
        title="Notifications blocked in browser settings (Click for help)"
      >
        <BellOff size={14} className="text-red-500 shrink-0" />
        <span className="text-[10px] sm:text-xs font-bold text-red-600 dark:text-red-400">Blocked</span>
      </button>
    );
  }

  return (
    <button 
      onClick={permission === 'granted' ? toggleReminders : requestPermission}
      role="switch"
      aria-checked={isEnabled}
      className={`group flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer shadow-2xs select-none ${
        isEnabled
          ? "bg-emerald-50/90 dark:bg-emerald-950/60 text-emerald-850 dark:text-emerald-300 border-emerald-300/90 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/70"
          : "bg-white/90 dark:bg-[#121c16] text-stone-500 dark:text-stone-300 border-stone-200 dark:border-[#1e3025] hover:bg-stone-50 dark:hover:bg-[#16231b] hover:text-stone-700 dark:hover:text-white"
      }`}
      title={isEnabled ? "Notifications are ON (Click to turn OFF)" : "Notifications are OFF (Click to turn ON)"}
    >
      {isEnabled ? (
        <BellRing size={14} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
      ) : (
        <BellOff size={14} className="text-stone-400 shrink-0" />
      )}

      {/* Status Text Indicator */}
      <span className="text-[10px] sm:text-xs font-extrabold tracking-tight">
        <span className="hidden sm:inline text-stone-500 dark:text-stone-400 font-semibold mr-1">Alerts</span>
        <span className={isEnabled ? "text-emerald-800 dark:text-emerald-300 font-black tracking-wide" : "text-stone-500 dark:text-stone-400 font-bold tracking-wide"}>
          {isEnabled ? "ON" : "OFF"}
        </span>
      </span>

      {/* Visual Toggle Switch Slider */}
      <div 
        aria-hidden="true"
        className={`w-7 h-4 sm:w-8 sm:h-4.5 rounded-full p-0.5 flex items-center shrink-0 transition-colors duration-200 ease-in-out ${
          isEnabled ? "bg-emerald-600 shadow-inner" : "bg-stone-300 dark:bg-stone-700"
        }`}
      >
        <div 
          className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-white shadow-xs transform transition-transform duration-200 ease-in-out ${
            isEnabled ? "translate-x-3 sm:translate-x-3.5" : "translate-x-0"
          }`}
        />
      </div>
    </button>
  );
}
