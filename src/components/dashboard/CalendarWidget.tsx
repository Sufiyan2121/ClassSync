"use client";

import { useState, useEffect } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  isToday,
  isTomorrow
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Cake, Sparkles, PartyPopper } from "lucide-react";
import { Post } from "@/types";
import { useBirthdays } from "@/hooks/useBirthdays";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

interface CalendarWidgetProps {
  posts: Post[];
}

export function CalendarWidget({ posts }: CalendarWidgetProps) {
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { userData } = useAuth();
  const { todaysBirthdays, tomorrowsBirthdays, upcomingBirthdays, getBirthdaysForDate } = useBirthdays();

  const studentClass = userData?.enrolledClassCode;
  const enrolledList = userData?.enrolledClasses || (studentClass ? [studentClass] : []);

  // Robust class code matching (case, whitespace, symbols normalized)
  const isClassMatch = (targetCode?: string | null) => {
    if (!targetCode || targetCode === "ALL") return true;
    if (!studentClass && enrolledList.length === 0) return true;

    const norm = (c: string) => c.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    const cleanTarget = norm(targetCode);

    if (studentClass && norm(studentClass) === cleanTarget) return true;
    if (enrolledList.some((c) => norm(c) === cleanTarget)) return true;

    return false;
  };

  const filteredTodaysBirthdays = todaysBirthdays.filter((b) => isClassMatch(b.classCode));
  const filteredTomorrowsBirthdays = tomorrowsBirthdays.filter((b) => isClassMatch(b.classCode));
  const filteredUpcomingBirthdays = upcomingBirthdays.filter((b) => isClassMatch(b.classCode));
  const nextUpcomingBirthday = filteredUpcomingBirthdays[0] || null;

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  useEffect(() => {
    const now = new Date();
    setCurrentMonth(now);
    setSelectedDate(now);
  }, []);

  if (!currentMonth) {
    return <div className="animate-pulse bg-white/60 backdrop-blur-md h-72 rounded-3xl border border-slate-100"></div>;
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = monthStart;
  const endDate = monthEnd;

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const getDayEvents = (day: Date) => {
    const dayPosts = posts.filter(post => {
      const date = post.dueDate 
        ? post.dueDate.toDate() 
        : (post.createdAt ? post.createdAt.toDate() : new Date());
      return isSameDay(date, day);
    });

    const dayBirthdays = getBirthdaysForDate(day).filter((b) => isClassMatch(b.classCode));

    return {
      hasExam: dayPosts.some(p => p.type === "EXAM"),
      hasAssignment: dayPosts.some(p => p.type === "ASSIGNMENT"),
      hasAnnouncement: dayPosts.some(p => p.type === "ANNOUNCEMENT"),
      hasBirthday: dayBirthdays.length > 0,
      birthdays: dayBirthdays,
      count: dayPosts.length + dayBirthdays.length
    };
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const firstDayIndex = monthStart.getDay();
  const paddingDays = Array.from({ length: firstDayIndex }).map((_, i) => i);

  // Selected date events & birthdays
  const selectedEvents = selectedDate ? getDayEvents(selectedDate) : null;
  const birthdaysPath = userData?.role === "ADMIN" ? "/admin/birthdays" : "/student/birthdays";

  return (
    <div className="glass rounded-2xl sm:rounded-3xl shadow-xs border border-stone-200/50 dark:border-[#1e3025] p-3 sm:p-5 overflow-hidden flex flex-col space-y-2.5 sm:space-y-3.5">
      
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-stone-900 dark:text-white tracking-tight flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base">
          <CalendarIcon className="text-emerald-700 dark:text-emerald-400" size={16} />
          <span>{format(currentMonth, "MMMM yyyy")}</span>
        </h3>

        <div className="flex items-center gap-1">
          <button 
            onClick={prevMonth} 
            className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={() => {
              const now = new Date();
              setCurrentMonth(now);
              setSelectedDate(now);
            }}
            className="px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 border border-emerald-200/80 dark:border-emerald-800/60 rounded-lg transition-colors cursor-pointer"
          >
            Today
          </button>
          <button 
            onClick={nextMonth} 
            className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
            title="Next Month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day Name Headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {dayNames.map(day => (
          <div key={day} className="text-[9px] sm:text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Grid of Days */}
      <div className="grid grid-cols-7 gap-1">
        {paddingDays.map(i => (
          <div key={`pad-${i}`} className="aspect-square rounded-xl opacity-0" />
        ))}
        {days.map(day => {
          const events = getDayEvents(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isDayToday = isToday(day);
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const hasAnyEvent = events.count > 0;
          const hasBirthday = events.hasBirthday;

          return (
            <button
              type="button"
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs sm:text-sm font-bold transition-all relative group cursor-pointer
                ${!isCurrentMonth ? "text-stone-300 dark:text-stone-600" : "text-stone-700 dark:text-stone-200"}
                ${!hasAnyEvent && !isDayToday && !isSelected ? "hover:bg-stone-100 dark:hover:bg-stone-800/60" : ""}
                ${hasAnyEvent && !isDayToday && !isSelected ? "bg-stone-50/80 dark:bg-[#121c16] ring-1 ring-stone-200/80 dark:ring-emerald-950/60 shadow-2xs" : ""}
                ${isSelected && !isDayToday ? "ring-2 ring-emerald-600 bg-emerald-50/90 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-300 font-black" : ""}
                ${isDayToday ? "bg-stone-900 dark:bg-emerald-700 text-white shadow-md ring-2 ring-stone-900/20 dark:ring-emerald-500/40" : ""}
                ${hasBirthday && !isDayToday ? "bg-gradient-to-b from-pink-50/70 to-purple-50/70 dark:from-pink-950/40 dark:to-purple-950/40 ring-1 ring-pink-300/80 dark:ring-pink-800/50" : ""}
              `}
            >
              <span className={`z-10 relative ${hasAnyEvent && !isDayToday && !isSelected ? "text-stone-900 dark:text-white" : ""}`}>
                {format(day, "d")}
              </span>
              
              {/* Event indicators below the day number */}
              {hasAnyEvent && (
                <div className="absolute bottom-1 sm:bottom-1.5 flex items-center gap-0.5 sm:gap-1 z-10 w-full justify-center px-0.5">
                  {hasBirthday && (
                    <span className="text-[9px] sm:text-[10px] leading-none animate-bounce" title="Birthday!">🎂</span>
                  )}
                  {events.hasExam && (
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isDayToday ? "bg-white" : "bg-red-500"} shadow-2xs`} />
                  )}
                  {events.hasAssignment && (
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isDayToday ? "bg-white" : "bg-amber-500"} shadow-2xs`} />
                  )}
                  {events.hasAnnouncement && (
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isDayToday ? "bg-white" : "bg-emerald-600 dark:bg-emerald-400"} shadow-2xs`} />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* SPECIAL BIRTHDAY SECTION WITHIN CALENDAR */}
      {filteredTodaysBirthdays.length > 0 && (
        <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10 dark:from-pink-950/30 dark:via-purple-950/30 dark:to-amber-950/30 border border-pink-200/80 dark:border-pink-800/40 shadow-2xs animate-in fade-in duration-300">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-500 text-white flex items-center justify-center shrink-0 shadow-xs text-base">
                🎂
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-pink-700 dark:text-pink-400 flex items-center gap-1">
                  <Sparkles size={11} /> Birthday Celebration Today!
                </p>
                <p className="text-xs sm:text-sm font-black text-stone-900 dark:text-white truncate">
                  {filteredTodaysBirthdays.length === 1 
                    ? `It's ${filteredTodaysBirthdays[0].name}'s birthday today! 🎉` 
                    : `It's ${filteredTodaysBirthdays.map(b => b.name).join(" & ")}'s birthday today! 🎉`}
                </p>
              </div>
            </div>
            <Link
              href={birthdaysPath}
              className="text-[11px] font-bold text-pink-700 dark:text-pink-300 hover:text-pink-900 bg-white/90 dark:bg-stone-800 hover:bg-white dark:hover:bg-stone-700 px-2.5 py-1.5 rounded-xl border border-pink-200 dark:border-pink-800/50 shadow-2xs shrink-0 transition-all"
            >
              Wish them
            </Link>
          </div>
        </div>
      )}

      {/* Selected Date Detail View (if selected date is different from today or has events) */}
      {selectedDate && !isToday(selectedDate) && selectedEvents && selectedEvents.count > 0 && (
        <div className="p-2.5 sm:p-3 rounded-2xl bg-stone-50 dark:bg-[#121c16] border border-stone-200/70 dark:border-[#1e3025] text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-extrabold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <CalendarIcon size={13} className="text-emerald-700 dark:text-emerald-400" />
              {format(selectedDate, "EEE, MMM d, yyyy")}
            </span>
            {isTomorrow(selectedDate) && (
              <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200/70 dark:border-teal-800/50">
                Tomorrow
              </span>
            )}
          </div>

          {selectedEvents.hasBirthday && (
            <div className="text-pink-700 dark:text-pink-400 font-bold flex items-center gap-1.5 mt-1">
              <span>🎂</span>
              <span>
                {selectedEvents.birthdays.length === 1
                  ? `It's ${selectedEvents.birthdays[0].name}'s birthday!`
                  : `Birthdays: ${selectedEvents.birthdays.map(b => b.name).join(", ")}`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tomorrow Birthday Heads-Up (If no birthday today, but tomorrow has one) */}
      {filteredTodaysBirthdays.length === 0 && filteredTomorrowsBirthdays.length > 0 && (
        <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base">🎈</span>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Tomorrow&apos;s Birthday</span>
              <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">
                It&apos;s {filteredTomorrowsBirthdays.map(b => b.name).join(" & ")}&apos;s birthday tomorrow! 🎂
              </p>
            </div>
          </div>
          <Link
            href={birthdaysPath}
            className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 shrink-0"
          >
            View
          </Link>
        </div>
      )}

      {/* Upcoming Classroom Birthday Alert (If neither today nor tomorrow has birthday) */}
      {filteredTodaysBirthdays.length === 0 && filteredTomorrowsBirthdays.length === 0 && nextUpcomingBirthday && (
        <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-rose-50/80 via-pink-50/50 to-stone-50/40 dark:from-rose-950/25 dark:via-pink-950/15 dark:to-stone-900/30 border border-rose-200/70 dark:border-rose-800/40 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-base sm:text-lg">🎂</span>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1">
                Upcoming Class Birthday
              </span>
              <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">
                {nextUpcomingBirthday.name} &bull; {monthNames[nextUpcomingBirthday.month - 1]} {nextUpcomingBirthday.day} 
                <span className="text-rose-600 dark:text-rose-400 font-extrabold ml-1.5">
                  ({nextUpcomingBirthday.daysUntil === 1 ? "Tomorrow!" : `in ${nextUpcomingBirthday.daysUntil} days`})
                </span>
              </p>
            </div>
          </div>
          <Link
            href={birthdaysPath}
            className="text-[10px] font-bold text-rose-700 dark:text-rose-400 hover:text-rose-900 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 px-2.5 py-1.5 rounded-xl border border-rose-200/70 dark:border-rose-800/50 shadow-2xs shrink-0 transition-all"
          >
            View All
          </Link>
        </div>
      )}

      {/* Legend & Birthdays Page Link */}
      <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-xs font-bold text-stone-500 dark:text-stone-400">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1"><span className="text-xs">🎂</span> Birthday</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> Exam</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Assignment</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400"></div> Notice</div>
        </div>
        <Link 
          href={birthdaysPath}
          className="text-pink-600 dark:text-pink-400 hover:text-pink-700 flex items-center gap-1 transition-colors"
        >
          <span>All Birthdays</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
