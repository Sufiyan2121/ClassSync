"use client";

import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell, BellOff, BellRing } from "lucide-react";
import toast from "react-hot-toast";

export function NotificationBell() {
  const { permission, isEnabled, requestPermission, toggleReminders } = usePushNotifications();

  if (permission === 'denied') {
    return (
      <button 
        onClick={() => toast.error('Please unblock notifications in your browser settings.')}
        className="flex items-center gap-2 bg-red-50 text-red-500 px-3 py-2 rounded-xl font-bold text-sm border border-red-100 shadow-sm hover:bg-red-100 transition-all"
        title="Notifications blocked by browser"
      >
        <BellOff size={16} />
      </button>
    );
  }

  return (
    <button 
      onClick={permission === 'granted' ? toggleReminders : requestPermission}
      className={`flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl font-bold text-xs sm:text-sm border shadow-2xs transition-all cursor-pointer ${
        isEnabled
          ? "bg-blue-50/80 text-blue-600 border-blue-200 hover:bg-blue-100"
          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
      }`}
      title={isEnabled ? "Reminders ON (Click to turn off)" : "Reminders OFF (Click to turn on)"}
    >
      {isEnabled ? <BellRing size={15} /> : <BellOff size={15} />}
      <span className="hidden sm:inline">{isEnabled ? "Alerts On" : "Alerts Off"}</span>
    </button>
  );
}
