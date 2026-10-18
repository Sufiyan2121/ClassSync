"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/components/providers/AuthProvider";
import { useClassConfig } from "@/hooks/useClassConfig";
import { 
  GraduationCap, 
  Plus, 
  LogOut, 
  Check, 
  X, 
  KeyRound, 
  Copy,
  Users,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  Search,
  FolderOpen,
  Sparkles,
  Camera,
  Cake
} from "lucide-react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { UserData } from "@/types";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function StudentClassSwitcher() {
  const { userData, user, enrollInClass, leaveClass, switchClass } = useAuth();
  const { classes, classConfig, verifyCode } = useClassConfig();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Class info states
  const [classmates, setClassmates] = useState<UserData[]>([]);
  const [classmatesLoading, setClassmatesLoading] = useState(false);
  const [showClassmates, setShowClassmates] = useState(false);
  const [classmateSearch, setClassmateSearch] = useState("");
  const [subjectsCount, setSubjectsCount] = useState<number>(0);

  // Client mounting check for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open to prevent background scrolling on mobile & desktop
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Normalise enrolled classes list
  const enrolledList = Array.from(
    new Set(
      userData?.enrolledClasses && userData.enrolledClasses.length > 0
        ? userData.enrolledClasses
        : userData?.enrolledClassCode
        ? [userData.enrolledClassCode]
        : []
    )
  );

  const activeCode = userData?.enrolledClassCode || enrolledList[0] || "";

  const getClassName = (code: string) => {
    const found = classes.find((c) => c.code.toUpperCase() === code.toUpperCase());
    if (found) return found.name;
    if (classConfig.classCode.toUpperCase() === code.toUpperCase()) return classConfig.className;
    return "Classroom";
  };

  const activeName = getClassName(activeCode);

  // Fetch active class data (classmates and subjects)
  useEffect(() => {
    if (!activeCode) return;

    setClassmatesLoading(true);

    // 1. Fetch classmates in this class
    const usersQuery = query(collection(db, "users"));
    const unsubUsers = onSnapshot(usersQuery, (snap) => {
      const list: UserData[] = [];
      snap.forEach((d) => {
        const u = { uid: d.id, ...d.data() } as UserData;
        if (u.role === "STUDENT") {
          const hasCode = 
            u.enrolledClassCode?.toUpperCase() === activeCode.toUpperCase() ||
            (Array.isArray(u.enrolledClasses) && u.enrolledClasses.some(c => c.toUpperCase() === activeCode.toUpperCase()));
          if (hasCode) {
            list.push(u);
          }
        }
      });
      setClassmates(list);
      setClassmatesLoading(false);
    });

    // 2. Fetch total subjects count
    const subjectsQuery = query(collection(db, "subjects"));
    const unsubSubjects = onSnapshot(subjectsQuery, (snap) => {
      setSubjectsCount(snap.size);
    });

    return () => {
      unsubUsers();
      unsubSubjects();
    };
  }, [activeCode]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success(`Class code ${code} copied to clipboard!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleJoinNewClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinCodeInput.trim().toUpperCase();
    if (!clean) return;

    if (enrolledList.includes(clean)) {
      toast.error("You are already enrolled in this class!");
      return;
    }

    setIsJoining(true);
    try {
      const verification = verifyCode(clean);
      if (!verification.valid) {
        toast.error("Invalid class code. Please check with your teacher.");
        setIsJoining(false);
        return;
      }

      await enrollInClass(clean);
      toast.success(`Successfully joined ${verification.classItem?.name || clean}!`);
      setJoinCodeInput("");
      setShowJoinForm(false);
    } catch (err: any) {
      toast.error("Failed to join class: " + err.message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveClass = async (code: string) => {
    const name = getClassName(code);
    if (!window.confirm(`Are you sure you want to exit "${name}" (${code})?\nYou will need the class code to re-join.`)) {
      return;
    }

    try {
      await leaveClass(code);
      toast.success(`You exited class ${code}`);
      
      // If user has no more classes, redirect to join screen
      if (enrolledList.length <= 1) {
        setIsOpen(false);
        router.push("/join-class");
      }
    } catch (err: any) {
      toast.error("Failed to exit class: " + err.message);
    }
  };

  const handleSwitchClass = async (code: string) => {
    if (code === activeCode) return;
    try {
      await switchClass(code);
      toast.success(`Switched to ${getClassName(code)}!`);
    } catch (err: any) {
      toast.error("Failed to switch class: " + err.message);
    }
  };

  const filteredClassmates = classmates.filter(c => 
    c.displayName?.toLowerCase().includes(classmateSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(classmateSearch.toLowerCase())
  );

  if (!activeCode && enrolledList.length === 0) return null;

  return (
    <>
      {/* Header Button Showing Class Name */}
      <button
        onClick={() => setIsOpen(true)}
        className="group flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 bg-white dark:bg-[#121c16] hover:bg-stone-50 dark:hover:bg-[#1a2b20] text-stone-800 dark:text-stone-100 rounded-xl sm:rounded-2xl border border-stone-200/90 dark:border-[#1e3025] shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink min-w-0"
        title={`View ${activeName} information & options`}
      >
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
          <GraduationCap size={12} />
        </div>
        <div className="text-left flex items-center gap-1 min-w-0">
          <span className="text-[11px] sm:text-xs md:text-sm font-extrabold text-stone-900 dark:text-white tracking-tight max-w-[140px] xs:max-w-[180px] sm:max-w-[220px] truncate">
            {activeName}
          </span>
          <ChevronDown size={13} className="text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 transition-colors shrink-0" />
        </div>
      </button>

      {/* Class Information & Management Modal - Portaled to document.body to escape glassmorphism / stacking context traps */}
      {mounted && isOpen && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md overscroll-contain animate-in fade-in duration-200"
          style={{
            paddingTop: "max(1rem, env(safe-area-inset-top, 1rem))",
            paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOpen(false);
              setShowJoinForm(false);
              setShowClassmates(false);
            }
          }}
        >
          <div 
            className="bg-white dark:bg-[#0c1610] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-[#1e3025] max-h-[85dvh] sm:max-h-[88vh] flex flex-col my-auto relative animate-in zoom-in-95 duration-200"
          >
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-5 py-3.5 sm:px-6 sm:py-4 border-b border-stone-200/80 dark:border-[#1e3025] shrink-0 bg-stone-50/80 dark:bg-[#121c16]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <GraduationCap size={18} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-extrabold text-stone-900 dark:text-white leading-tight truncate">Classroom Information</h2>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium truncate">Class details, access code & enrolled batches</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowJoinForm(false);
                  setShowClassmates(false);
                }}
                className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-[#1e3025] rounded-full transition-colors shrink-0 cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1 space-y-4 sm:space-y-5">
              
              {/* FEATURED: Current Active Class Information Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white dark:from-[#122319] dark:via-[#0e1c14] dark:to-[#121c16] p-4 sm:p-5 border border-emerald-200/80 dark:border-[#1e392a] shadow-xs">
                
                {/* Top Status & Class Name */}
                <div className="flex items-start justify-between gap-2.5 mb-3">
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full uppercase tracking-wider mb-1.5 border border-emerald-200/80 dark:border-emerald-800/60">
                      <Sparkles size={10} /> Active Classroom
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white tracking-tight leading-snug break-words">
                      {activeName}
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/70 px-2.5 py-1 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse"></span>
                    Enrolled
                  </span>
                </div>

                {/* Class Code Box with 1-Click Copy */}
                <div className="bg-white/90 dark:bg-[#16231b] rounded-2xl p-3 border border-stone-200/80 dark:border-[#1e3025] flex items-center justify-between gap-2.5 shadow-xs mb-3.5 flex-wrap sm:flex-nowrap">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-stone-400 dark:text-stone-400 tracking-wider">Class Access Code</p>
                    <p className="font-mono text-base sm:text-lg font-black text-stone-900 dark:text-emerald-400 tracking-widest break-all">
                      {activeCode}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopyCode(activeCode)}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer w-full sm:w-auto"
                    title="Copy Class Code"
                  >
                    {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                  </button>
                </div>

                {/* Classroom Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mb-3.5">
                  <div className="bg-white/80 dark:bg-[#16231b] rounded-xl p-2.5 border border-stone-200/70 dark:border-[#1e3025]">
                    <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-[11px] font-medium mb-0.5">
                      <Users size={13} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">Classmates</span>
                    </div>
                    <p className="text-sm font-black text-stone-900 dark:text-white truncate">
                      {classmatesLoading ? "..." : `${classmates.length} Students`}
                    </p>
                  </div>

                  <div className="bg-white/80 dark:bg-[#16231b] rounded-xl p-2.5 border border-stone-200/70 dark:border-[#1e3025]">
                    <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-[11px] font-medium mb-0.5">
                      <BookOpen size={13} className="text-teal-700 dark:text-teal-400 shrink-0" />
                      <span className="truncate">Curriculum</span>
                    </div>
                    <p className="text-sm font-black text-stone-900 dark:text-white truncate">
                      {subjectsCount} Subjects Active
                    </p>
                  </div>
                </div>

                {/* Direct Action Links */}
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/student/resources"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all text-center"
                  >
                    <FolderOpen size={14} className="shrink-0" />
                    <span className="truncate">Subjects & Notes</span>
                  </Link>
                  <Link
                    href="/student/timetable"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all text-center"
                  >
                    <Calendar size={14} className="shrink-0" />
                    <span className="truncate">Time-Table</span>
                  </Link>
                  <Link
                    href="/student/events"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all text-center"
                  >
                    <Camera size={14} className="shrink-0" />
                    <span className="truncate">Events & Media</span>
                  </Link>
                  <Link
                    href="/student/birthdays"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-pink-700 hover:bg-pink-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all text-center"
                  >
                    <Cake size={14} className="shrink-0" />
                    <span className="truncate">Birthdays</span>
                  </Link>
                </div>

                {/* Toggle Classmates List */}
                <button
                  onClick={() => setShowClassmates(!showClassmates)}
                  className="w-full mt-3 flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 py-1 transition-colors cursor-pointer"
                >
                  <span>{showClassmates ? "Hide Classmates" : `View Enrolled Classmates (${classmates.length})`}</span>
                  {showClassmates ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>

              {/* Collapsible Classmates Section */}
              {showClassmates && (
                <div className="p-4 bg-stone-50 dark:bg-[#121c16] rounded-2xl border border-stone-200/80 dark:border-[#1e3025] space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                      <Users size={14} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                      <span>Classmates ({classmates.length})</span>
                    </h4>
                  </div>

                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type="text"
                      value={classmateSearch}
                      onChange={(e) => setClassmateSearch(e.target.value)}
                      placeholder="Search classmate..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] rounded-xl text-xs font-medium text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {filteredClassmates.length === 0 ? (
                      <p className="text-center py-4 text-xs text-stone-400">No classmates found</p>
                    ) : (
                      filteredClassmates.map((c) => {
                        const isMe = c.uid === user?.uid;
                        return (
                          <div
                            key={c.uid}
                            className="flex items-center justify-between p-2 bg-white dark:bg-[#16231b] rounded-xl border border-stone-100 dark:border-[#1e3025] text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {c.displayName?.charAt(0) || "S"}
                              </div>
                              <span className="font-semibold text-stone-800 dark:text-stone-200 truncate">
                                {c.displayName || "Student"}
                              </span>
                            </div>
                            {isMe && (
                              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                                You
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* My Enrolled Classes List (If enrolled in more than one) */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    My Classes ({enrolledList.length})
                  </h4>
                  {!showJoinForm && (
                    <button
                      onClick={() => setShowJoinForm(true)}
                      className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>Join Another</span>
                    </button>
                  )}
                </div>

                {/* Join Form */}
                {showJoinForm && (
                  <form onSubmit={handleJoinNewClass} className="p-4 bg-emerald-50/70 dark:bg-[#122319] rounded-2xl border border-emerald-200/90 dark:border-[#1e392a] space-y-3 animate-in fade-in duration-150">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                        <KeyRound size={15} className="text-emerald-700 dark:text-emerald-400" /> Enter Class Code
                      </h4>
                      <button 
                        type="button" 
                        onClick={() => setShowJoinForm(false)}
                        className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                        placeholder="e.g. MCA-DIV-B"
                        maxLength={15}
                        className="flex-1 px-3 py-2 bg-white dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] text-stone-900 dark:text-emerald-400 rounded-xl font-mono text-center font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                        autoFocus
                        required
                      />
                      <button
                        type="submit"
                        disabled={isJoining || !joinCodeInput.trim()}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                      >
                        {isJoining ? "Joining..." : "Join"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Class List Cards */}
                <div className="space-y-2">
                  {enrolledList.map((code) => {
                    const isActive = code === activeCode;
                    const name = getClassName(code);

                    return (
                      <div
                        key={code}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                          isActive
                            ? "bg-emerald-50/80 dark:bg-[#14261c] border-emerald-300/90 dark:border-emerald-800/70 shadow-2xs"
                            : "bg-stone-50 dark:bg-[#121c16] hover:bg-stone-100/70 dark:hover:bg-[#18261e] border-stone-200/80 dark:border-[#1e3025]"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white truncate">
                              {name}
                            </span>
                            <span className="font-mono text-[10px] font-extrabold text-stone-700 dark:text-stone-300 bg-white dark:bg-[#18261e] px-2 py-0.5 rounded-md border border-stone-200 dark:border-[#243a2c]">
                              {code}
                            </span>
                            {isActive && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                                <Check size={10} /> Active
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {!isActive && (
                            <button
                              onClick={() => handleSwitchClass(code)}
                              className="px-3 py-1 bg-stone-900 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                            >
                              Switch
                            </button>
                          )}
                          <button
                            onClick={() => handleLeaveClass(code)}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                            title={`Exit ${name} (${code})`}
                          >
                            <LogOut size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
