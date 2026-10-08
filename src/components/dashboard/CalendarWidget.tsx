"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Post } from "@/types";

interface CalendarWidgetProps {
  posts: Post[];
}

export function CalendarWidget({ posts }: CalendarWidgetProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  // Determine colors based on post types
  const getDayColor = (day: Date) => {
    // Find posts happening on this day
    const dayPosts = posts.filter(post => {
      const date = post.dueDate ? post.dueDate.toDate() : post.createdAt.toDate();
      return isSameDay(date, day);
    });

    if (dayPosts.length === 0) return null;

    // Prioritize EXAM > ASSIGNMENT > ANNOUNCEMENT > RESOURCE
    if (dayPosts.some(p => p.type === "EXAM")) return "bg-red-500 text-white ring-2 ring-red-200 shadow-md";
    if (dayPosts.some(p => p.type === "ASSIGNMENT")) return "bg-amber-500 text-white ring-2 ring-amber-200 shadow-md";
    if (dayPosts.some(p => p.type === "ANNOUNCEMENT")) return "bg-blue-500 text-white ring-2 ring-blue-200 shadow-md";
    return "bg-emerald-500 text-white ring-2 ring-emerald-200 shadow-md";
  };

  const getDayIndicatorColor = (day: Date) => {
    const dayPosts = posts.filter(post => {
      const date = post.dueDate ? post.dueDate.toDate() : post.createdAt.toDate();
      return isSameDay(date, day);
    });

    if (dayPosts.length === 0) return null;
    
    if (dayPosts.some(p => p.type === "EXAM")) return "bg-red-500";
    if (dayPosts.some(p => p.type === "ASSIGNMENT")) return "bg-amber-500";
    if (dayPosts.some(p => p.type === "ANNOUNCEMENT")) return "bg-blue-500";
    return "bg-emerald-500";
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Add padding for first day of month
  const firstDayIndex = monthStart.getDay();
  const paddingDays = Array.from({ length: firstDayIndex }).map((_, i) => i);

  return (
    <div className="glass rounded-3xl shadow-sm border border-slate-200/50 p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <CalendarIcon className="text-blue-500" size={20} />
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {paddingDays.map(i => (
          <div key={`pad-${i}`} className="aspect-square rounded-xl opacity-0" />
        ))}
        {days.map(day => {
          const colorClass = getDayColor(day);
          const indicatorClass = getDayIndicatorColor(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isDayToday = isToday(day);

          return (
            <div 
              key={day.toISOString()} 
              className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-bold transition-all relative group
                ${!isCurrentMonth ? "text-slate-300" : "text-slate-700"}
                ${colorClass ? colorClass : "hover:bg-slate-100"}
                ${isDayToday && !colorClass ? "bg-slate-900 text-white shadow-md" : ""}
              `}
            >
              <span className="z-10 relative">{format(day, "d")}</span>
              
              {/* Tooltip on hover if there are events */}
              {indicatorClass && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs font-bold text-slate-500">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Exam</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> Assignment</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> Notice</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Resource</div>
      </div>
    </div>
  );
}
