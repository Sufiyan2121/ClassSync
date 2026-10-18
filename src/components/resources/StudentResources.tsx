"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { Subject, Material } from "@/types";
import { Folder, FileText, ArrowLeft, Download } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";

export function StudentResources() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && userData?.role === "STUDENT" && !userData?.enrolledClassCode) {
      router.push("/join-class");
    }
  }, [userData, authLoading, router]);

  useEffect(() => {
    // Fetch Subjects
    const q = query(collection(db, "subjects"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const subs: Subject[] = [];
      snap.forEach(d => subs.push({ id: d.id, ...d.data() } as Subject));
      setSubjects(subs);
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
  }, []);

  const filteredSubjects = subjects.filter((subject) => {
    if (selectedSubjectFilter !== "ALL" && subject.id !== selectedSubjectFilter) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const queryLower = searchQuery.toLowerCase();
    const subjectMatch = subject.name.toLowerCase().includes(queryLower);
    const materialMatch = materials.some(
      (m) => m.subjectId === subject.id && m.fileName.toLowerCase().includes(queryLower)
    );
    return subjectMatch || materialMatch;
  });

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-5xl mx-auto min-h-screen w-full overflow-x-hidden">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 glass px-4 py-3 sm:px-6 sm:py-4 rounded-3xl shadow-xs border border-stone-200/60">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link href="/student" className="p-2 hover:bg-stone-100 rounded-full transition-colors shrink-0">
            <ArrowLeft size={22} className="text-stone-600" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight truncate">
              Class Resources
            </h1>
            <p className="text-stone-500 text-xs sm:text-sm font-medium truncate">
              All your subjects, syllabus, notes & PDFs in one place
            </p>
          </div>
        </div>
      </header>

      {/* Filter and Search Bar for Quick Navigation on Mobile & Desktop */}
      {subjects.length > 0 && (
        <div className="glass rounded-2xl p-3 sm:p-4 border border-stone-200/60 shadow-xs mb-5 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <p className="text-xs font-bold text-stone-700">
              Browse Subjects ({subjects.length})
            </p>
            <div className="relative flex-1 sm:max-w-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, files, subjects..."
                className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>
          </div>

          {/* Quick Subject Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setSelectedSubjectFilter("ALL")}
              className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedSubjectFilter === "ALL"
                  ? "bg-stone-900 text-white shadow-xs"
                  : "bg-stone-100 hover:bg-stone-200/80 text-stone-600"
              }`}
            >
              All Subjects
            </button>
            {subjects.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectFilter(sub.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedSubjectFilter === sub.id
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-stone-100 hover:bg-stone-200/80 text-stone-600"
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse glass rounded-3xl p-6 h-48 w-full"></div>
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="glass rounded-3xl p-8 sm:p-12 text-center border border-stone-200/60 flex flex-col items-center justify-center">
          <Folder size={48} className="text-stone-300 mb-3" />
          <h3 className="text-lg sm:text-xl font-bold text-stone-900 mb-1">No Subjects Yet</h3>
          <p className="text-xs sm:text-sm text-stone-500">Your teachers haven&apos;t uploaded any resources yet.</p>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="glass rounded-3xl p-8 sm:p-12 text-center border border-stone-200/60 flex flex-col items-center justify-center">
          <Folder size={48} className="text-stone-300 mb-3" />
          <h3 className="text-lg sm:text-xl font-bold text-stone-900 mb-1">No matching resources</h3>
          <p className="text-xs sm:text-sm text-stone-500">Try adjusting your search query or subject filter.</p>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {filteredSubjects.map(subject => {
            const subjectMaterials = materials.filter(m => {
              const belongs = m.subjectId === subject.id;
              if (!belongs) return false;
              if (!searchQuery.trim()) return true;
              return m.fileName.toLowerCase().includes(searchQuery.toLowerCase());
            });
            
            return (
              <div key={subject.id} className="glass rounded-3xl p-4 sm:p-6 md:p-8 border border-stone-200/60 overflow-hidden">
                <div className="flex items-center justify-between pb-3 sm:pb-4 mb-4 sm:mb-6 border-b border-stone-100">
                  <h2 className="text-lg sm:text-2xl font-bold text-stone-900 flex items-center gap-2.5 min-w-0">
                    <Folder size={22} className="text-emerald-700 shrink-0"/> 
                    <span className="truncate">{subject.name}</span>
                  </h2>
                  <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full shrink-0 border border-emerald-200/80">
                    {subjectMaterials.length} {subjectMaterials.length === 1 ? "Item" : "Items"}
                  </span>
                </div>

                <div className="space-y-6">
                  {subjectMaterials.length === 0 ? (
                    <p className="text-stone-400 italic text-xs sm:text-sm py-2">
                      {searchQuery ? "No materials match your search." : "No materials added for this subject yet."}
                    </p>
                  ) : (
                    (["SYLLABUS", "NOTES", "PRACTICAL", "PDF"] as const).map(category => {
                      const categoryMaterials = subjectMaterials.filter(m => m.category === category);
                      if (categoryMaterials.length === 0) return null;
                      
                      return (
                        <div key={category} className="space-y-2.5">
                          <h3 className="font-bold text-stone-400 uppercase tracking-wider text-[11px] sm:text-xs border-b border-stone-200/60 pb-1.5">
                            {category}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                            {categoryMaterials.map(mat => (
                              <div 
                                key={mat.id} 
                                className="flex items-center justify-between p-3 sm:p-4 bg-white/90 rounded-2xl border border-stone-200/80 shadow-xs hover:shadow-md transition-all group gap-2.5"
                              >
                                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                                  <div className="p-2 sm:p-2.5 bg-emerald-50 text-emerald-700 rounded-xl shrink-0">
                                    <FileText size={18} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h4 
                                      className="font-bold text-stone-900 text-xs sm:text-sm truncate" 
                                      title={mat.fileName}
                                    >
                                      {mat.fileName}
                                    </h4>
                                    <span className="text-[10px] text-stone-400 font-medium block truncate">
                                      {category}
                                    </span>
                                  </div>
                                </div>
                                <a 
                                  href={mat.fileUrl} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="flex items-center gap-1 px-3 py-1.5 bg-stone-900 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-xs shrink-0 cursor-pointer"
                                >
                                  <Download size={13} />
                                  <span>Open</span>
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
