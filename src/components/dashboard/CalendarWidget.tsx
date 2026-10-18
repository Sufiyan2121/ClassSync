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
  const { todaysBirthdays, tomorrowsBirthdays, getBirthdaysForDate } = useBirthdays();

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

    const dayBirthdays = getBirthdaysForDate(day);

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
    <div className="glass rounded-2xl sm:rounded-3xl shadow-xs border border-slate-200/50 p-3 sm:p-5 overflow-hidden flex flex-col space-y-2.5 sm:space-y-3.5">
      
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base">
          <CalendarIcon className="text-blue-500" size={16} />
          <span>{format(currentMonth, "MMMM yyyy")}</span>
        </h3>

        <div className="flex items-center gap-1">
          <button 
            onClick={prevMonth} 
            className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
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
            className="px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
          >
            Today
          </button>
          <button 
            onClick={nextMonth} 
            className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Next Month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day Name Headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {dayNames.map(day => (
          <div key={day} className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                ${!isCurrentMonth ? "text-slate-300" : "text-slate-700"}
                ${!hasAnyEvent && !isDayToday && !isSelected ? "hover:bg-slate-100" : ""}
                ${hasAnyEvent && !isDayToday && !isSelected ? "bg-slate-50 ring-1 ring-slate-200/80 shadow-2xs" : ""}
                ${isSelected && !isDayToday ? "ring-2 ring-blue-500 bg-blue-50/80 text-blue-900" : ""}
                ${isDayToday ? "bg-slate-900 text-white shadow-md ring-2 ring-slate-900/20" : ""}
                ${hasBirthday && !isDayToday ? "bg-gradient-to-b from-pink-50/70 to-purple-50/70 ring-1 ring-pink-300/80" : ""}
              `}
            >
              <span className={`z-10 relative ${hasAnyEvent && !isDayToday && !isSelected ? "text-slate-900" : ""}`}>
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
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isDayToday ? "bg-white" : "bg-blue-500"} shadow-2xs`} />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* SPECIAL BIRTHDAY SECTION WITHIN CALENDAR */}
      {todaysBirthdays.length > 0 && (
        <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10 border border-pink-200/80 shadow-2xs animate-in fade-in duration-300">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-500 text-white flex items-center justify-center shrink-0 shadow-xs text-base">
                🎂
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-pink-700 flex items-center gap-1">
                  <Sparkles size={11} /> Birthday Celebration Today!
                </p>
                <p className="text-xs sm:text-sm font-black text-slate-900 truncate">
                  {todaysBirthdays.length === 1 
                    ? `It's ${todaysBirthdays[0].name}'s birthday today! 🎉` 
                    : `It's ${todaysBirthdays.map(b => b.name).join(" & ")}'s birthday today! 🎉`}
                </p>
              </div>
            </div>
            <Link
              href={birthdaysPath}
              className="text-[11px] font-bold text-pink-700 hover:text-pink-900 bg-white/90 hover:bg-white px-2.5 py-1.5 rounded-xl border border-pink-200 shadow-2xs shrink-0 transition-all"
            >
              Wish them
            </Link>
          </div>
        </div>
      )}

      {/* Selected Date Detail View (if selected date is different from today or has events) */}
      {selectedDate && !isToday(selectedDate) && selectedEvents && selectedEvents.count > 0 && (
        <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
              <CalendarIcon size={13} className="text-blue-600" />
              {format(selectedDate, "EEE, MMM d, yyyy")}
            </span>
            {isTomorrow(selectedDate) && (
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                Tomorrow
              </span>
            )}
          </div>

          {selectedEvents.hasBirthday && (
            <div className="text-slate-900 font-bold flex items-center gap-1.5 text-pink-700 mt-1">
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
      {todaysBirthdays.length === 0 && tomorrowsBirthdays.length > 0 && (
        <div className="p-2.5 sm:p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200/70 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base">🎈</span>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">Tomorrow&apos;s Birthday</span>
              <p className="text-xs font-bold text-slate-800 truncate">
                It&apos;s {tomorrowsBirthdays.map(b => b.name).join(" & ")}&apos;s birthday tomorrow! 🎂
              </p>
            </div>
          </div>
          <Link
            href={birthdaysPath}
            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 shrink-0"
          >
            View
          </Link>
        </div>
      )}

      {/* Legend & Birthdays Page Link */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-xs font-bold text-slate-500">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1"><span className="text-xs">🎂</span> Birthday</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> Exam</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Assignment</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Notice</div>
        </div>
        <Link 
          href={birthdaysPath}
          className="text-pink-600 hover:text-pink-700 flex items-center gap-1 transition-colors"
        >
          <span>All Birthdays</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
