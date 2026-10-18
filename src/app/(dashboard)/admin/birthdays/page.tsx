"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useBirthdays } from "@/hooks/useBirthdays";
import { useClassConfig } from "@/hooks/useClassConfig";
import { Birthday } from "@/types";
import Link from "next/link";
import { createPortal } from "react-dom";
import { 
  ArrowLeft, 
  Cake, 
  Plus, 
  Search, 
  Trash2, 
  Pencil, 
  Send, 
  Sparkles, 
  Calendar as CalendarIcon, 
  Users, 
  Bell, 
  Check, 
  X,
  Gift,
  PartyPopper,
  Filter
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function AdminBirthdaysPage() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const { 
    birthdays, 
    loading: birthdaysLoading, 
    currentDate,
    addBirthday, 
    updateBirthday, 
    deleteBirthday, 
    todaysBirthdays, 
    tomorrowsBirthdays, 
    upcomingBirthdays 
  } = useBirthdays();
  const { classes, classConfig } = useClassConfig();

  const currentYear = currentDate ? currentDate.getFullYear() : 2026;
  const thisMonthNumber = currentDate ? currentDate.getMonth() + 1 : 1;

  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBirthday, setEditingBirthday] = useState<Birthday | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [classCode, setClassCode] = useState("ALL");
  const [rollNo, setRollNo] = useState("");
  const [notes, setNotes] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"upcoming" | "all">("upcoming");

  // Notification action state
  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && userData?.role === "STUDENT") {
      router.push("/student/birthdays");
    }
  }, [userData, authLoading, router]);

  // Lock body scroll on modal open
  useEffect(() => {
    if (isModalOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isModalOpen]);

  const openAddModal = () => {
    setEditingBirthday(null);
    setName("");
    setBirthDate("");
    setClassCode(classConfig.classCode || "ALL");
    setRollNo("");
    setNotes("");
    setIsModalOpen(true);
  };

  const openEditModal = (b: Birthday) => {
    setEditingBirthday(b);
    setName(b.name);
    setBirthDate(b.birthDate);
    setClassCode(b.classCode || "ALL");
    setRollNo(b.rollNo || "");
    setNotes(b.notes || "");
    setIsModalOpen(true);
  };

  const handleSaveBirthday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !birthDate) {
      toast.error("Please enter a name and birth date.");
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingBirthday) {
        await updateBirthday(editingBirthday.id, {
          name,
          birthDate,
          classCode,
          rollNo,
          notes,
        });
        toast.success(`Birthday for "${name}" updated!`);
      } else {
        await addBirthday({
          name,
          birthDate,
          classCode,
          rollNo,
          notes,
        });
        toast.success(`Birthday for "${name}" added! 🎉`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error("Failed to save: " + err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (b: Birthday) => {
    if (!window.confirm(`Are you sure you want to remove ${b.name}'s birthday?`)) return;
    try {
      await deleteBirthday(b.id);
      toast.success(`Removed ${b.name}'s birthday`);
    } catch (err: any) {
      toast.error("Failed to delete: " + err.message);
    }
  };

  const handleSendNotification = async (b?: Birthday, mode: "TODAY" | "TOMORROW" | "ALL" = "ALL") => {
    setNotifying(true);
    try {
      const res = await fetch("/api/admin/birthdays/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthdayId: b?.id,
          mode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to broadcast");

      if (data.notificationsSent > 0) {
        toast.success(`Sent birthday alert to ${data.notificationsSent} student device(s)! 🚀`, {
          duration: 4000,
        });
      } else {
        toast(data.message || "Notification generated (no active student devices with push tokens enabled).", {
          icon: "ℹ️",
        });
      }
    } catch (err: any) {
      toast.error("Notification failed: " + err.message);
    } finally {
      setNotifying(false);
    }
  };

  // Filter birthdays
  const filteredUpcoming = upcomingBirthdays.filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClassFilter === "ALL" || b.classCode === selectedClassFilter || b.classCode === "ALL";
    return matchesSearch && matchesClass;
  });

  const filteredAll = birthdays.filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClassFilter === "ALL" || b.classCode === selectedClassFilter || b.classCode === "ALL";
    return matchesSearch && matchesClass;
  });

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  if (authLoading || birthdaysLoading) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen">
        <div className="animate-pulse space-y-6">
          <div className="h-20 bg-white/60 rounded-3xl"></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="h-24 bg-white/60 rounded-2xl"></div>
            <div className="h-24 bg-white/60 rounded-2xl"></div>
            <div className="h-24 bg-white/60 rounded-2xl"></div>
            <div className="h-24 bg-white/60 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-8 max-w-5xl mx-auto min-h-screen">
      
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 glass px-4 py-3 md:px-6 md:py-4 rounded-3xl shadow-xs border border-stone-200/80 dark:border-[#1e3025] dark:bg-[#121c16]/90">
        <div className="flex items-center gap-3.5">
          <Link href="/admin" className="p-2 hover:bg-stone-100 dark:hover:bg-[#16231b] text-stone-600 dark:text-stone-300 rounded-full transition-colors shrink-0">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🎂</span>
              <h1 className="text-xl md:text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight">
                Birthdays Manager
              </h1>
            </div>
            <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm font-medium">
              Record birthdays & automate 1-day prior and birthday notifications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleSendNotification()}
            disabled={notifying}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            title="Trigger check & send birthday alerts"
          >
            <Bell size={14} className={notifying ? "animate-spin" : ""} />
            <span>{notifying ? "Sending Alerts..." : "Trigger Alerts Now"}</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-stone-900 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Birthday</span>
          </button>
        </div>
      </header>

      {/* TODAY'S SPOTLIGHT CELEBRATION (If someone's birthday is today!) */}
      {todaysBirthdays.length > 0 && (
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 p-5 sm:p-6 text-white shadow-xl shadow-pink-500/20 relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner shrink-0">
                🎉
              </div>
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider bg-white/25 px-2.5 py-0.5 rounded-full mb-1">
                  <Sparkles size={12} /> Today&apos;s Birthday Celebration!
                </span>
                <h2 className="text-xl sm:text-2xl font-black">
                  {todaysBirthdays.map((b) => b.name).join(" & ")}
                </h2>
                <p className="text-xs sm:text-sm text-pink-100 mt-0.5 font-medium">
                  {todaysBirthdays.length === 1
                    ? `It's ${todaysBirthdays[0].name}'s birthday today! Notifications have been scheduled.`
                    : `Multiple birthdays today! Wish them a very Happy Birthday!`}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleSendNotification(undefined, "TODAY")}
              disabled={notifying}
              className="px-4 py-2 bg-white text-pink-600 hover:bg-pink-50 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer shrink-0"
            >
              🎉 Broadcast Birthday Wish
            </button>
          </div>
        </div>
      )}

      {/* TOMORROW'S HEADS UP (If someone has a birthday tomorrow!) */}
      {tomorrowsBirthdays.length > 0 && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-indigo-50/90 to-purple-50/80 dark:from-indigo-950/40 dark:to-purple-950/40 p-4 border border-indigo-200/80 dark:border-indigo-800/50 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl">🎈</span>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                1-Day Prior Alert
              </span>
              <p className="text-sm font-extrabold text-stone-900 dark:text-white truncate mt-1">
                It&apos;s {tomorrowsBirthdays.map((b) => b.name).join(" & ")}&apos;s birthday tomorrow!
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                The software will automatically remind students so everyone can wish them on time.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleSendNotification(undefined, "TOMORROW")}
            disabled={notifying}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
          >
            Send 1-Day Prior Alert
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="glass rounded-2xl p-4 border border-stone-200/70 dark:border-[#1e3025] dark:bg-[#121c16]/90 shadow-xs">
          <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs font-semibold mb-1">
            <Cake size={15} className="text-pink-500" />
            <span>Today</span>
          </div>
          <p className="text-2xl font-black text-stone-900 dark:text-white">{todaysBirthdays.length}</p>
        </div>

        <div className="glass rounded-2xl p-4 border border-stone-200/70 dark:border-[#1e3025] dark:bg-[#121c16]/90 shadow-xs">
          <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs font-semibold mb-1">
            <PartyPopper size={15} className="text-indigo-500" />
            <span>Tomorrow</span>
          </div>
          <p className="text-2xl font-black text-stone-900 dark:text-white">{tomorrowsBirthdays.length}</p>
        </div>

        <div className="glass rounded-2xl p-4 border border-stone-200/70 dark:border-[#1e3025] dark:bg-[#121c16]/90 shadow-xs">
          <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs font-semibold mb-1">
            <CalendarIcon size={15} className="text-purple-500" />
            <span>This Month</span>
          </div>
          <p className="text-2xl font-black text-stone-900 dark:text-white">
            {birthdays.filter(b => b.month === thisMonthNumber).length}
          </p>
        </div>

        <div className="glass rounded-2xl p-4 border border-stone-200/70 dark:border-[#1e3025] dark:bg-[#121c16]/90 shadow-xs">
          <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs font-semibold mb-1">
            <Users size={15} className="text-emerald-700 dark:text-emerald-400" />
            <span>Total Recorded</span>
          </div>
          <p className="text-2xl font-black text-stone-900 dark:text-white">{birthdays.length}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass rounded-2xl p-4 border border-stone-200/70 dark:border-[#1e3025] dark:bg-[#121c16]/90 shadow-xs mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        
        {/* Tabs: Upcoming vs All */}
        <div className="flex bg-stone-100 dark:bg-[#16231b] border border-transparent dark:border-[#1e3025] p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "upcoming"
                ? "bg-white dark:bg-[#121c16] text-stone-900 dark:text-white shadow-2xs"
                : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
            }`}
          >
            Upcoming Next
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "all"
                ? "bg-white dark:bg-[#121c16] text-stone-900 dark:text-white shadow-2xs"
                : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
            }`}
          >
            All by Month
          </button>
        </div>

        <div className="flex flex-1 items-center gap-2.5 max-w-md ml-auto">
          {/* Class Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="bg-stone-50 dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] text-stone-800 dark:text-white text-xs font-bold rounded-xl px-2.5 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
            >
              <option value="ALL">All Classes</option>
              {classes.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student name..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] rounded-xl text-xs font-medium text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none placeholder:text-stone-400"
            />
          </div>
        </div>
      </div>

      {/* Birthdays List */}
      {activeTab === "upcoming" ? (
        <div className="space-y-3">
          {filteredUpcoming.length === 0 ? (
            <div className="text-center py-16 glass rounded-3xl border border-stone-200/70 dark:border-[#1e3025] dark:bg-[#121c16]/90">
              <Cake size={40} className="text-stone-300 dark:text-stone-600 mx-auto mb-2" />
              <p className="font-bold text-stone-700 dark:text-stone-200 text-sm">No birthdays found</p>
              <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                {searchQuery ? "No matches for your search." : "Click \"Add Birthday\" above to record your first student birthday."}
              </p>
            </div>
          ) : (
            filteredUpcoming.map((b) => {
              const isTodayBirthday = b.daysUntil === 0;
              const isTomorrowBirthday = b.daysUntil === 1;

              return (
                <div
                  key={b.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isTodayBirthday
                      ? "bg-gradient-to-r from-pink-50/90 to-purple-50/80 dark:from-pink-950/40 dark:to-purple-950/40 border-pink-300 dark:border-pink-800/60 shadow-xs"
                      : isTomorrowBirthday
                      ? "bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/50"
                      : "glass bg-white/70 dark:bg-[#121c16]/90 border-stone-200/70 dark:border-[#1e3025] hover:bg-white dark:hover:bg-[#16231b]"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-base shrink-0 shadow-xs ${
                      isTodayBirthday
                        ? "bg-gradient-to-tr from-pink-500 to-rose-500 text-white"
                        : isTomorrowBirthday
                        ? "bg-gradient-to-tr from-indigo-500 to-purple-500 text-white"
                        : "bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300"
                    }`}>
                      {isTodayBirthday ? "🎂" : isTomorrowBirthday ? "🎈" : b.name.charAt(0)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-white truncate">
                          {b.name}
                        </h3>
                        {b.rollNo && (
                          <span className="text-[10px] font-mono font-bold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-[#16231b] px-2 py-0.5 rounded-md border border-stone-200/60 dark:border-[#1e3025]">
                            Roll #{b.rollNo}
                          </span>
                        )}
                        <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
                          {b.classCode || "ALL"}
                        </span>
                        {isTodayBirthday && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-white bg-pink-600 px-2 py-0.5 rounded-full animate-pulse">
                            🎉 TODAY!
                          </span>
                        )}
                        {isTomorrowBirthday && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                            ⏰ TOMORROW
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-1 flex-wrap">
                        <span className="font-semibold text-stone-700 dark:text-stone-300">
                          📅 {monthNames[b.month - 1]} {b.day}
                        </span>
                        {b.year && (
                          <span className="text-stone-400 dark:text-stone-500">
                            (Turning {currentYear - b.year})
                          </span>
                        )}
                        {b.notes && (
                          <span className="text-stone-400 dark:text-stone-500 italic truncate max-w-xs">
                            — &quot;{b.notes}&quot;
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-stone-100 dark:border-[#1e3025]">
                    <span className="text-xs font-bold text-stone-600 dark:text-stone-400">
                      {isTodayBirthday ? (
                        <span className="text-pink-600 dark:text-pink-400 font-extrabold">Celebrating Today!</span>
                      ) : isTomorrowBirthday ? (
                        <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">Tomorrow</span>
                      ) : (
                        `In ${b.daysUntil} days`
                      )}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSendNotification(b, isTodayBirthday ? "TODAY" : "TOMORROW")}
                        className="p-2 text-stone-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-xl transition-colors cursor-pointer"
                        title="Send notification now"
                      >
                        <Send size={15} />
                      </button>
                      <button
                        onClick={() => openEditModal(b)}
                        className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#16231b] rounded-xl transition-colors cursor-pointer"
                        title="Edit Birthday"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(b)}
                        className="p-2 text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                        title="Delete Birthday"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Tab 2: All Birthdays Grouped by Month */
        <div className="space-y-6">
          {monthNames.map((monthName, idx) => {
            const mIndex = idx + 1;
            const inThisMonth = filteredAll.filter(b => b.month === mIndex);
            if (inThisMonth.length === 0) return null;

            return (
              <div key={monthName} className="glass rounded-3xl p-5 border border-stone-200/70 dark:border-[#1e3025] dark:bg-[#121c16]/90 shadow-xs">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-[#1e3025] pb-3 mb-3">
                  <h3 className="font-black text-stone-900 dark:text-white text-base flex items-center gap-2">
                    <span>🗓️</span> {monthName} ({inThisMonth.length})
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {inThisMonth.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 bg-white/80 dark:bg-[#16231b] rounded-2xl border border-stone-200/70 dark:border-[#1e3025] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-sm text-stone-900 dark:text-white truncate">
                            {b.name}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 px-1.5 py-0.5 rounded">
                            {b.classCode}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 dark:text-stone-400 font-semibold mt-0.5">
                          {monthName} {b.day} {b.year ? `(${b.year})` : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditModal(b)}
                          className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#121c16] rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(b)}
                          className="p-1.5 text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Birthday Modal (Portaled for safe cross-platform viewing) */}
      {mounted && isModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md overscroll-contain animate-in fade-in duration-200"
          style={{
            paddingTop: "max(1rem, env(safe-area-inset-top, 1rem))",
            paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="bg-white dark:bg-[#0c1610] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-stone-100 dark:border-[#1e3025] max-h-[85dvh] sm:max-h-[88vh] flex flex-col my-auto relative animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-stone-100 dark:border-[#1e3025] shrink-0 bg-stone-50/70 dark:bg-[#121c16]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-xs text-lg">
                  🎂
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-stone-900 dark:text-white">
                    {editingBirthday ? "Edit Birthday" : "Record New Birthday"}
                  </h2>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                    Software will send alerts 1 day prior and on their birthday
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#16231b] rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveBirthday} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Student / Person Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-pink-500 text-stone-900 dark:text-white placeholder:text-stone-400"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Birth Date *</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-pink-500 text-stone-900 dark:text-white"
                    required
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">Select birth date & year</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Class / Division</label>
                  <select
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-pink-500 text-stone-900 dark:text-white cursor-pointer"
                  >
                    <option value="ALL">All Classes (General)</option>
                    {classes.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-stone-400 mt-0.5 block">Target students who receive the alert</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Roll / PRN Number (Optional)</label>
                  <input
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    placeholder="e.g. 42"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-pink-500 text-stone-900 dark:text-white placeholder:text-stone-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Custom Note / Wish (Optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Class Representative"
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-pink-500 text-stone-900 dark:text-white placeholder:text-stone-400"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {formSubmitting ? "Saving Birthday..." : editingBirthday ? "Update Birthday" : "Record Birthday 🎉"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
