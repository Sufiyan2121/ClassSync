"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";
import { ArrowLeft, Calendar, Download, FileText } from "lucide-react";

// Add your timetables and PDFs here
const TIMETABLES = [
  {
    id: "lecture-timetable",
    title: "Lecture Time-Table",
    type: "image", // can be "image" or "pdf"
    fileUrl: "/Lecture Time-Table.jpeg", // Must EXACTLY match the file name and extension
  },
  {
    id: "Exam Time-Table",
    title: "Mid-Sem Time-Table",
    type: "pdf", // can be "image" or "pdf"
    fileUrl: "/Mid sem.pdf", // Must EXACTLY match the file name and extension
  },
  // Example of adding another one:
  // {
  //   id: "exam-schedule",
  //   title: "Midterm Exam Schedule",
  //   type: "pdf",
  //   fileUrl: "/midterms.pdf",
  // }
];

export default function StudentTimetable() {
  const { userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && userData?.role === "STUDENT" && !userData?.enrolledClassCode) {
      router.push("/join-class");
    }
  }, [userData, loading, router]);
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8 glass px-5 py-3.5 sm:px-6 sm:py-4 rounded-3xl shadow-xs border border-stone-200/80 dark:border-[#1e3025] dark:bg-[#121c16]/90">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <Link href="/student" className="p-2 hover:bg-stone-100 dark:hover:bg-[#16231b] text-stone-600 dark:text-stone-300 rounded-full transition-colors shrink-0">
            <ArrowLeft size={22} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight">
                Class Time-Tables
              </h1>
              <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm font-medium">Your schedules and planners at a glance</p>
            </div>
          </div>
        </div>
      </header>

      {TIMETABLES.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center shadow-xs border border-stone-200/80 dark:border-[#1e3025] dark:bg-[#121c16]/90 flex flex-col items-center justify-center">
          <Calendar size={48} className="text-stone-300 dark:text-stone-600 mb-4" />
          <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">No timetables available</h3>
          <p className="text-stone-500 dark:text-stone-400">Your administrators have not provided any timetables yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:gap-8">
          {TIMETABLES.map((t) => (
            <div key={t.id} className="glass rounded-3xl overflow-hidden shadow-xs border border-stone-200/80 dark:border-[#1e3025] bg-white/70 dark:bg-[#121c16]/90 group">
              <div className="flex justify-between items-center p-4 md:px-6 md:py-4 border-b border-stone-200/70 dark:border-[#1e3025] bg-white/90 dark:bg-[#16231b]">
                <h3 className="font-bold text-base sm:text-lg text-stone-900 dark:text-white flex items-center gap-2">
                  {t.type === "pdf" ? <FileText className="text-rose-600 dark:text-rose-400" size={20} /> : <Calendar className="text-emerald-700 dark:text-emerald-400" size={20} />}
                  {t.title}
                </h3>
                <a 
                  href={t.fileUrl} 
                  download
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
                >
                  <Download size={15} />
                  <span className="hidden sm:inline">Download</span>
                </a>
              </div>
              <div className="p-4 md:p-6 flex items-center justify-center bg-stone-50/60 dark:bg-[#0c1610]/80">
                {t.type === "image" ? (
                  <img src={t.fileUrl} alt={t.title} className="w-full max-w-4xl object-contain rounded-xl shadow-xs border border-stone-200 dark:border-[#1e3025]" />
                ) : (
                  <div className="py-12 text-center flex flex-col items-center">
                    <FileText size={64} className="text-stone-300 dark:text-stone-600 mb-4" />
                    <p className="text-stone-500 dark:text-stone-400 font-medium text-sm">This is a PDF document.</p>
                    <a href={t.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-4 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline font-bold text-sm">
                      Click here to view PDF
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
