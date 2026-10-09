"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, Download } from "lucide-react";
import { useTimetables } from "@/hooks/useTimetables";

export default function StudentTimetable() {
  const { timetables, loading } = useTimetables();

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 glass px-6 py-4 rounded-3xl shadow-sm border border-slate-200/50">
        <div className="flex items-center gap-4">
          <Link href="/student" className="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0">
            <ArrowLeft size={24} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="text-purple-600" size={24} /> Class Time-Tables
            </h1>
            <p className="text-slate-500 text-sm font-medium">Your schedules and planners at a glance</p>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="grid gap-6">
          <div className="animate-pulse bg-white/60 backdrop-blur-md h-64 rounded-3xl border border-slate-100"></div>
        </div>
      ) : timetables.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center shadow-sm border border-slate-200/50 flex flex-col items-center justify-center">
          <Calendar size={48} className="text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No timetables available</h3>
          <p className="text-slate-500">Your administrators have not uploaded any timetables yet.</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {timetables.map((t) => (
            <div key={t.id} className="glass rounded-3xl overflow-hidden shadow-sm border border-slate-200/50 bg-white/40">
              <div className="flex justify-between items-center p-4 md:px-6 md:py-4 border-b border-slate-200/50 bg-white/60">
                <h3 className="font-bold text-lg text-slate-900">{t.title}</h3>
                <a 
                  href={t.imageUrl} 
                  download={`${t.title}.jpg`}
                  className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl font-bold text-xs hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Download</span>
                </a>
              </div>
              <div className="p-4 md:p-6 flex items-center justify-center">
                <img src={t.imageUrl} alt={t.title} className="w-full max-w-4xl object-contain rounded-xl shadow-sm border border-slate-100" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
