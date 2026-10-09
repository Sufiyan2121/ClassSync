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
  // Example of adding another one:
  // {
  //   id: "exam-schedule",
  //   title: "Midterm Exam Schedule",
  //   type: "pdf",
  //   fileUrl: "/midterms.pdf",
  // }
];

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
              <Calendar className="text-purple-600" size={24} /> Class Time-Tables
            </h1>
            <p className="text-slate-500 text-sm font-medium">Schedules are managed directly in the codebase</p>
          </div>
        </div>
      </header>

      {TIMETABLES.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center shadow-sm border border-slate-200/50 flex flex-col items-center justify-center">
          <Calendar size={48} className="text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No timetables found</h3>
          <p className="text-slate-500">Add them to the TIMETABLES array in the code.</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {TIMETABLES.map((t) => (
            <div key={t.id} className="glass rounded-3xl overflow-hidden shadow-sm border border-slate-200/50 bg-white/40 group">
              <div className="flex justify-between items-center p-4 md:px-6 md:py-4 border-b border-slate-200/50 bg-white/60">
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  {t.type === "pdf" ? <FileText className="text-red-500" size={20} /> : <Calendar className="text-blue-500" size={20} />}
                  {t.title}
                </h3>
                <a
                  href={t.fileUrl}
                  download
                  className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-sm"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Download</span>
                </a>
              </div>
              <div className="p-4 md:p-6 flex items-center justify-center bg-slate-50/50">
                {t.type === "image" ? (
                  <img src={t.fileUrl} alt={t.title} className="w-full max-w-4xl object-contain rounded-xl shadow-sm border border-slate-200" />
                ) : (
                  <div className="py-12 text-center flex flex-col items-center">
                    <FileText size={64} className="text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">This is a PDF document.</p>
                    <a href={t.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-4 text-blue-600 hover:underline font-bold">
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
