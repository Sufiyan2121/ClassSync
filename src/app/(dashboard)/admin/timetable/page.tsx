import Link from "next/link";
import { ArrowLeft, Calendar, Download } from "lucide-react";

export default function AdminTimetable() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 glass px-6 py-4 rounded-3xl shadow-sm border border-slate-200/50">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0">
            <ArrowLeft size={24} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="text-purple-600" size={24} /> Class Time-Table
            </h1>
            <p className="text-slate-500 text-sm font-medium">Weekly schedule reference</p>
          </div>
        </div>
        <a href="/timetable.png" download="Class_TimeTable.png" className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-sm ml-auto sm:ml-0">
          <Download size={16} />
          <span>Download</span>
        </a>
      </header>

      <div className="glass rounded-3xl p-2 md:p-6 shadow-xl border border-slate-200/50 flex items-center justify-center overflow-hidden bg-white/40">
        <img src="/timetable.png" alt="Class Timetable" className="w-full max-w-4xl object-contain rounded-2xl shadow-sm border border-slate-100" />
      </div>
    </div>
  );
}
