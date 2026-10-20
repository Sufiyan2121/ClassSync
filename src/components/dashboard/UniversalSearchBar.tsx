"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  X, 
  Cake, 
  Radio, 
  BookOpen, 
  Calendar, 
  ArrowRight, 
  Sparkles,
  Clock,
  ChevronRight,
  FileText
} from "lucide-react";
import { Post, Birthday, Subject, Material, Timetable } from "@/types";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { useBirthdays } from "@/hooks/useBirthdays";
import { useTimetables } from "@/hooks/useTimetables";

interface UniversalSearchBarProps {
  posts?: Post[];
  basePath?: "/student" | "/admin";
  onFilterChange?: (query: string) => void;
  className?: string;
}

export function UniversalSearchBar({
  posts = [],
  basePath = "/student",
  onFilterChange,
  className = "",
}: UniversalSearchBarProps) {
  const [queryText, setQueryText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);
  
  const { birthdays } = useBirthdays();
  const { timetables } = useTimetables();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Detect OS for shortcut badge (⌘K vs Ctrl+K)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent));
    }
  }, []);

  // Global keyboard shortcut: Cmd+K or Ctrl+K to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load subjects and materials in real-time
  useEffect(() => {
    const unsubSubs = onSnapshot(collection(db, "subjects"), (snap) => {
      const list: Subject[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Subject));
      setSubjects(list);
    });

    const unsubMats = onSnapshot(collection(db, "materials"), (snap) => {
      const list: Material[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Material));
      setMaterials(list);
    });

    return () => {
      unsubSubs();
      unsubMats();
    };
  }, []);

  // Handle live search results
  const results = useMemo(() => {
    const trimmed = queryText.trim().toLowerCase();
    if (!trimmed) {
      return {
        birthdays: [],
        posts: [],
        resources: [],
        timetables: [],
        total: 0,
      };
    }

    // 1. Birthdays Matching
    const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const matchedBirthdays = birthdays.filter((b) => {
      const nameMatch = b.name.toLowerCase().includes(trimmed);
      const rollMatch = b.rollNo ? b.rollNo.toLowerCase().includes(trimmed) : false;
      const monthName = months[(b.month || 1) - 1] || "";
      const monthMatch = monthName.includes(trimmed);
      const isBdayKeyword = ["birthday", "bday", "birthdays", "wishes"].some(k => k.includes(trimmed) || trimmed.includes(k));
      return nameMatch || rollMatch || monthMatch || isBdayKeyword;
    }).slice(0, 4);

    // 2. Announcements & Posts Matching
    const matchedPosts = posts.filter((p) => {
      const titleMatch = p.title?.toLowerCase().includes(trimmed);
      const descMatch = p.description?.toLowerCase().includes(trimmed);
      const typeMatch = p.type?.toLowerCase().includes(trimmed);
      return titleMatch || descMatch || typeMatch;
    }).slice(0, 5);

    // 3. Subjects & Study Materials Matching
    const matchedResources: Array<{ subjectName: string; fileName?: string; link: string }> = [];
    subjects.forEach((s) => {
      if (s.name.toLowerCase().includes(trimmed)) {
        matchedResources.push({
          subjectName: s.name,
          link: `${basePath}/resources`,
        });
      }
    });
    materials.forEach((m) => {
      if (m.fileName.toLowerCase().includes(trimmed) || m.title?.toLowerCase().includes(trimmed)) {
        const sub = subjects.find(s => s.id === m.subjectId);
        matchedResources.push({
          subjectName: sub?.name || "Study Material",
          fileName: m.fileName,
          link: m.fileUrl || `${basePath}/resources`,
        });
      }
    });

    // 4. Timetables Matching
    const isTimetableKeyword = ["timetable", "schedule", "routine", "lectures", "periods"].some(k => k.includes(trimmed) || trimmed.includes(k));
    const matchedTimetables = timetables.filter((t) => {
      return t.title.toLowerCase().includes(trimmed) || isTimetableKeyword;
    }).slice(0, 3);

    const total = matchedBirthdays.length + matchedPosts.length + matchedResources.slice(0, 4).length + matchedTimetables.length;

    return {
      birthdays: matchedBirthdays,
      posts: matchedPosts,
      resources: matchedResources.slice(0, 4),
      timetables: matchedTimetables,
      total,
    };
  }, [queryText, birthdays, posts, subjects, materials, timetables, basePath]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQueryText(val);
    setIsOpen(true);
    if (onFilterChange) {
      onFilterChange(val);
    }
  };

  const handleClear = () => {
    setQueryText("");
    setIsOpen(false);
    if (onFilterChange) {
      onFilterChange("");
    }
    inputRef.current?.focus();
  };

  const handleSelectPost = (postId: string) => {
    setIsOpen(false);
    // Find post element and scroll smoothly to it
    const postElem = document.getElementById(`post-${postId}`);
    if (postElem) {
      postElem.scrollIntoView({ behavior: "smooth", block: "center" });
      postElem.classList.add("ring-2", "ring-emerald-500", "scale-[1.01]");
      setTimeout(() => {
        postElem.classList.remove("ring-2", "ring-emerald-500", "scale-[1.01]");
      }, 2000);
    }
  };

  const getBirthdayCountdown = (b: Birthday) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    let target = new Date(currentYear, b.month - 1, b.day);
    if (target < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
      target = new Date(currentYear + 1, b.month - 1, b.day);
    }
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today! 🎉";
    if (diff === 1) return "Tomorrow! 🎈";
    return `in ${diff} days`;
  };

  const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div ref={containerRef} className={`relative z-30 mb-3 sm:mb-4 ${className}`}>
      
      {/* The Search Bar Box */}
      <div 
        onClick={() => inputRef.current?.focus()}
        className={`group relative flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl sm:rounded-3xl bg-white/85 dark:bg-[#121c16] backdrop-blur-md border transition-all duration-200 shadow-2xs cursor-text ${
          isOpen && queryText.trim()
            ? "border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
            : "border-stone-200/80 dark:border-[#1e3025] hover:border-stone-300 dark:hover:border-[#2a4434]"
        }`}
      >
        <Search 
          size={18} 
          className="text-emerald-700 dark:text-emerald-400 shrink-0 transition-transform group-focus-within:scale-110" 
        />
        
        <input
          ref={inputRef}
          type="text"
          value={queryText}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Search announcements, timetable, notes, birthdays..."
          className="w-full bg-transparent text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none"
        />

        {queryText ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#1e3025] transition cursor-pointer"
            title="Clear search"
          >
            <X size={15} />
          </button>
        ) : (
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-[#18261e] border border-stone-200/60 dark:border-[#243a2c] text-[10px] font-mono font-bold text-stone-400 dark:text-stone-400 select-none">
            <span>{isMac ? "⌘" : "Ctrl"}</span>
            <span>K</span>
          </div>
        )}
      </div>

      {/* Floating Universal Results Dropdown */}
      {isOpen && queryText.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 sm:p-3 rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-[#101a14]/95 backdrop-blur-xl border border-stone-200/90 dark:border-[#1e3025] shadow-2xl overflow-hidden max-h-[75vh] sm:max-h-[460px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 z-50">
          
          {results.total === 0 ? (
            <div className="py-8 px-4 text-center">
              <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-[#18261e] text-stone-400 flex items-center justify-center mx-auto mb-2.5">
                <Search size={18} />
              </div>
              <p className="text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                No matching results found for "{queryText}"
              </p>
              <p className="text-[11px] text-stone-400 dark:text-stone-400 max-w-xs mx-auto">
                Try searching by subject name, assignment topic, professor, or a classmate's birthday.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              
              {/* Category 1: Birthdays */}
              {results.birthdays.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2 mb-1.5 text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    <Cake size={13} />
                    <span>Birthdays ({results.birthdays.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {results.birthdays.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => {
                          setIsOpen(false);
                          router.push(`${basePath}/birthdays`);
                        }}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-stone-50/80 hover:bg-rose-50/70 dark:bg-[#16231b] dark:hover:bg-[#1f2f24] border border-stone-200/60 dark:border-[#243a2c] hover:border-rose-300 dark:hover:border-rose-800/80 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 font-bold text-xs">
                            🎂
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-stone-900 dark:text-white group-hover:text-rose-700 dark:group-hover:text-rose-300 truncate">
                              {b.name}
                            </p>
                            <p className="text-[10px] text-stone-400">
                              {monthsShort[(b.month || 1) - 1]} {b.day} {b.rollNo ? `• Roll: ${b.rollNo}` : ""}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/60">
                          {getBirthdayCountdown(b)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category 2: Announcements & Posts */}
              {results.posts.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2 mb-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    <Radio size={13} />
                    <span>Live Announcements ({results.posts.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {results.posts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => handleSelectPost(post.id)}
                        className="flex items-start justify-between gap-2.5 p-2.5 rounded-xl bg-stone-50/80 hover:bg-emerald-50/70 dark:bg-[#16231b] dark:hover:bg-[#1a2c20] border border-stone-200/60 dark:border-[#243a2c] hover:border-emerald-300 dark:hover:border-emerald-800/80 transition-all cursor-pointer group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
                              {post.type}
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-stone-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 truncate">
                            {post.title}
                          </h5>
                          {post.description && (
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
                              {post.description}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center text-stone-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 pt-1">
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category 3: Study Resources & Subject Notes */}
              {results.resources.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2 mb-1.5 text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400">
                    <BookOpen size={13} />
                    <span>Study Notes & Subjects ({results.resources.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {results.resources.map((res, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setIsOpen(false);
                          if (res.fileName && res.link.startsWith("http")) {
                            window.open(res.link, "_blank");
                          } else {
                            router.push(`${basePath}/resources`);
                          }
                        }}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-stone-50/80 hover:bg-teal-50/70 dark:bg-[#16231b] dark:hover:bg-[#182c23] border border-stone-200/60 dark:border-[#243a2c] hover:border-teal-300 dark:hover:border-teal-800/80 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                            {res.fileName ? <FileText size={13} /> : <BookOpen size={13} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-stone-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 truncate">
                              {res.fileName || res.subjectName}
                            </p>
                            <p className="text-[10px] text-stone-400 truncate">
                              {res.fileName ? `Subject: ${res.subjectName}` : "Open subject notes & syllabus"}
                            </p>
                          </div>
                        </div>
                        <ArrowRight size={13} className="text-stone-400 group-hover:text-teal-600 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category 4: Timetable */}
              {results.timetables.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2 mb-1.5 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    <Calendar size={13} />
                    <span>Timetables & Schedules</span>
                  </div>
                  <div className="space-y-1.5">
                    {results.timetables.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setIsOpen(false);
                          router.push(`${basePath}/timetable`);
                        }}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-stone-50/80 hover:bg-amber-50/70 dark:bg-[#16231b] dark:hover:bg-[#28271a] border border-stone-200/60 dark:border-[#243a2c] hover:border-amber-300 dark:hover:border-amber-800/80 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                            <Clock size={13} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-stone-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 truncate">
                              {t.title}
                            </p>
                            <p className="text-[10px] text-stone-400">View timetable schedule & lectures</p>
                          </div>
                        </div>
                        <ArrowRight size={13} className="text-stone-400 group-hover:text-amber-600 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Footer of dropdown */}
          <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-[#1e3025] flex items-center justify-between text-[10px] text-stone-400 px-1">
            <span>Press <kbd className="px-1 py-0.5 rounded bg-stone-100 dark:bg-[#18261e] border border-stone-200/60 dark:border-[#243a2c] font-mono">Esc</kbd> to close</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">ClassSync Universal Search</span>
          </div>

        </div>
      )}

    </div>
  );
}
