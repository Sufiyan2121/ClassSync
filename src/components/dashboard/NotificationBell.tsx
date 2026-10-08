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
      className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm border shadow-sm transition-all ${
        isEnabled
          ? "bg-blue-50/50 text-blue-600 border-blue-100 hover:bg-blue-100"
          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
      }`}
      title={isEnabled ? "Reminders ON (Click to turn off)" : "Reminders OFF (Click to turn on)"}
    >
      {isEnabled ? <BellRing size={16} /> : <BellOff size={16} />}
      <span className="hidden sm:inline">{isEnabled ? "Alerts On" : "Alerts Off"}</span>
    </button>
  );
}
