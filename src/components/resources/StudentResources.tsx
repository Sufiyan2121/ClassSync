"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { Subject, Material } from "@/types";
import { Folder, FileText, ArrowLeft, Download } from "lucide-react";
import Link from "next/link";

export function StudentResources() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  useEffect(() => {
    // Fetch Subjects
    const q = query(collection(db, "subjects"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const subs: Subject[] = [];
      snap.forEach(d => subs.push({ id: d.id, ...d.data() } as Subject));
      setSubjects(subs);
      if (subs.length > 0 && !activeSubject) {
        setActiveSubject(subs[0].id);
      }
      setLoading(false);
    });

    // Fetch Materials
    const q2 = query(collection(db, "materials"), orderBy("createdAt", "desc"));
    const unsub2 = onSnapshot(q2, (snap) => {
      const mats: Material[] = [];
      snap.forEach(d => mats.push({ id: d.id, ...d.data() } as Material));
      setMaterials(mats);
    });

    return () => { unsub(); unsub2(); };
  }, [activeSubject]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 glass px-6 py-4 rounded-3xl shadow-sm border border-slate-200/50">
        <div className="flex items-center gap-4">
          <Link href="/student" className="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0">
            <ArrowLeft size={24} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Class Resources
            </h1>
            <p className="text-slate-500 text-sm font-medium">All your subjects and materials in one place</p>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="space-y-8">
          {[1, 2].map((i) => (
             <div key={i} className="animate-pulse glass rounded-3xl p-6 h-64 w-full"></div>
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center border border-slate-200/50 flex flex-col items-center justify-center">
          <Folder size={48} className="text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Subjects Yet</h3>
          <p className="text-slate-500">Your teachers haven't uploaded any resources yet.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {subjects.map(subject => {
            const subjectMaterials = materials.filter(m => m.subjectId === subject.id);
            
            return (
              <div key={subject.id} className="glass rounded-3xl p-6 md:p-8 border border-slate-200/50">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100 flex items-center gap-3">
                  <Folder size={24} className="text-blue-500"/> {subject.name}
                </h2>

                <div className="space-y-8">
                  {subjectMaterials.length === 0 ? (
                    <p className="text-slate-400 italic text-sm">No materials added for this subject yet.</p>
                  ) : (
                    (["SYLLABUS", "NOTES", "PRACTICAL", "PDF"] as const).map(category => {
                      const categoryMaterials = subjectMaterials.filter(m => m.category === category);
                      if (categoryMaterials.length === 0) return null;
                      
                      return (
                        <div key={category} className="space-y-4">
                          <h3 className="font-bold text-slate-400 uppercase tracking-wider text-sm border-b border-slate-100 pb-2">
                            {category}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {categoryMaterials.map(mat => (
                              <div key={mat.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="flex items-center gap-3">
                                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                    <FileText size={20} />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1" title={mat.fileName}>{mat.fileName}</h4>
                                  </div>
                                </div>
                                <a 
                                  href={mat.fileUrl} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-sm shrink-0"
                                >
                                  <Download size={14} /> Open
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
