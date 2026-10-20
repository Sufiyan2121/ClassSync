"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useBirthdays } from "@/hooks/useBirthdays";
import Link from "next/link";
import { 
  ArrowLeft, 
  Cake, 
  Sparkles, 
  Calendar as CalendarIcon, 
  Search, 
  PartyPopper,
  Copy,
  Check,
  Heart,
  Gift
} from "lucide-react";
import toast from "react-hot-toast";

export default function StudentBirthdaysPage() {
  const { userData } = useAuth();
  const { birthdays, loading, currentDate, todaysBirthdays, tomorrowsBirthdays, upcomingBirthdays } = useBirthdays();
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const currentYear = currentDate ? currentDate.getFullYear() : 2026;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleCopyWish = (name: string, id: string) => {
    const wish = `Happy Birthday ${name}! 🎉🎂 Wishing you a wonderful year ahead filled with happiness and success! 🥳🎈`;
    navigator.clipboard.writeText(wish);
    setCopiedId(id);
    toast.success(`Birthday wish for ${name} copied! You can paste and send it! 🎁`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const studentClass = userData?.enrolledClassCode;
  const enrolledList = userData?.enrolledClasses || (studentClass ? [studentClass] : []);

  // Robust class code matching: handles case-insensitivity, spaces, and punctuation (e.g. "MCA@2026" vs "MCA2026")
  const isClassMatch = (targetCode?: string | null) => {
    if (!targetCode || targetCode === "ALL") return true;
    if (!studentClass && enrolledList.length === 0) return true;

    const norm = (c: string) => c.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    const cleanTarget = norm(targetCode);

    if (studentClass && norm(studentClass) === cleanTarget) return true;
    if (enrolledList.some((c) => norm(c) === cleanTarget)) return true;

    return false;
  };

  const filteredToday = todaysBirthdays.filter((b) => isClassMatch(b.classCode));
  const filteredTomorrow = tomorrowsBirthdays.filter((b) => isClassMatch(b.classCode));

  // Filter to upcoming birthdays relevant to student
  const filteredUpcoming = upcomingBirthdays.filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = isClassMatch(b.classCode);
    return matchesSearch && matchesClass;
  });

  return (
    <div className="p-3 md:p-8 max-w-5xl mx-auto min-h-screen">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 glass px-4 py-3 md:px-6 md:py-4 rounded-3xl shadow-xs border border-stone-200/80 dark:border-[#1e3025] dark:bg-[#121c16]/90">
        <div className="flex items-center gap-3.5">
          <Link href="/student" className="p-2 hover:bg-stone-100 dark:hover:bg-[#16231b] text-stone-600 dark:text-stone-300 rounded-full transition-colors shrink-0">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🎂</span>
              <h1 className="text-xl md:text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight">
                Classroom Birthdays
              </h1>
            </div>
            <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm font-medium">
              Celebrate your classmates and never miss a birthday!
            </p>
          </div>
        </div>
      </header>

      {/* TODAY'S CELEBRATION SPOTLIGHT */}
      {filteredToday.length > 0 && (
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 p-5 sm:p-7 text-white shadow-xl shadow-pink-500/20 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner shrink-0">
                🎉
              </div>
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider bg-white/25 px-2.5 py-0.5 rounded-full mb-1.5">
                  <Sparkles size={12} /> Today&apos;s Special Celebration!
                </span>
                <h2 className="text-2xl sm:text-3xl font-black">
                  Happy Birthday, {filteredToday.map((b) => b.name).join(" & ")}! 🎂
                </h2>
                <p className="text-xs sm:text-sm text-pink-100 mt-1 font-medium">
                  Wish them an amazing birthday filled with joy, laughter, and success!
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {filteredToday.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleCopyWish(b.name, b.id)}
                  className="px-4 py-2.5 bg-white text-pink-600 hover:bg-pink-50 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedId === b.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copiedId === b.id ? "Wish Copied!" : `Copy Wish for ${b.name.split(" ")[0]}`}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TOMORROW'S REMINDER */}
      {filteredTomorrow.length > 0 && (
        <div className="mb-6 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 p-4 border border-indigo-200/80 dark:border-indigo-800/50 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl">🎈</span>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                Tomorrow&apos;s Birthday
              </span>
              <p className="text-sm font-extrabold text-stone-900 dark:text-white truncate mt-1">
                It&apos;s {filteredTomorrow.map((b) => b.name).join(" & ")}&apos;s birthday tomorrow! 🎂
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                Get ready to surprise and wish them on their special day!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="glass rounded-2xl p-4 border border-stone-200/70 dark:border-[#1e3025] dark:bg-[#121c16]/90 shadow-xs mb-6 flex items-center justify-between gap-3">
        <h3 className="font-extrabold text-stone-900 dark:text-white text-sm hidden sm:block">
          Upcoming Birthdays
        </h3>
        <div className="relative flex-1 sm:max-w-xs ml-auto">
          <Search size={14} className="absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search classmate..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] rounded-xl text-xs font-medium text-stone-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none placeholder:text-stone-400"
          />
        </div>
      </div>

      {/* Birthdays List */}
      {loading ? (
        <div className="py-16 text-center text-stone-400 text-xs animate-pulse">
          Loading birthdays...
        </div>
      ) : filteredUpcoming.length === 0 ? (
        <div className="text-center py-16 glass rounded-3xl border border-stone-200/70 dark:border-[#1e3025] dark:bg-[#121c16]/90">
          <Cake size={40} className="text-stone-300 dark:text-stone-600 mx-auto mb-2" />
          <p className="font-bold text-stone-700 dark:text-stone-200 text-sm">No birthdays found</p>
          <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
            {searchQuery ? "No matches for your search." : "Birthdays will appear here once recorded."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredUpcoming.map((b) => {
            const isToday = b.daysUntil === 0;
            const isTomorrow = b.daysUntil === 1;

            return (
              <div
                key={b.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isToday
                    ? "bg-gradient-to-r from-pink-50/90 to-purple-50/80 dark:from-pink-950/40 dark:to-purple-950/40 border-pink-300 dark:border-pink-800/60 shadow-xs"
                    : isTomorrow
                    ? "bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/50"
                    : "glass bg-white/70 dark:bg-[#121c16]/90 border-stone-200/70 dark:border-[#1e3025] hover:bg-white dark:hover:bg-[#16231b]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-base shrink-0 shadow-xs ${
                    isToday
                      ? "bg-gradient-to-tr from-pink-500 to-rose-500 text-white"
                      : isTomorrow
                      ? "bg-gradient-to-tr from-indigo-500 to-purple-500 text-white"
                      : "bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300"
                  }`}>
                    {isToday ? "🎂" : isTomorrow ? "🎈" : b.name.charAt(0)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-sm text-stone-900 dark:text-white truncate">
                        {b.name}
                      </h4>
                      {isToday && (
                        <span className="text-[9px] font-black text-white bg-pink-600 px-1.5 py-0.5 rounded-full animate-pulse">
                          TODAY!
                        </span>
                      )}
                      {isTomorrow && (
                        <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-full">
                          TOMORROW
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">
                      📅 {monthNames[b.month - 1]} {b.day}
                      {b.year ? ` • Turning ${currentYear - b.year}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                    {isToday ? (
                      <span className="text-pink-600 dark:text-pink-400 font-extrabold">Today!</span>
                    ) : isTomorrow ? (
                      <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">Tomorrow</span>
                    ) : (
                      `In ${b.daysUntil}d`
                    )}
                  </span>

                  <button
                    onClick={() => handleCopyWish(b.name, b.id)}
                    className="p-2 text-stone-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-xl transition-colors cursor-pointer"
                    title={`Copy birthday wish for ${b.name}`}
                  >
                    {copiedId === b.id ? <Check size={16} className="text-emerald-600 dark:text-emerald-400" /> : <Gift size={16} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
