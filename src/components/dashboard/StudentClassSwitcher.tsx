"use client";

import { useState, useEffect } from "react";
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
  ExternalLink,
  Sparkles
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
        className="group flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all cursor-pointer"
        title={`View ${activeName} information & options`}
      >
        <div className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <GraduationCap size={13} />
        </div>
        <div className="text-left flex items-center gap-1.5">
          <span className="text-xs md:text-sm font-extrabold text-slate-900 tracking-tight max-w-[130px] sm:max-w-[200px] truncate">
            {activeName}
          </span>
          <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
        </div>
      </button>

      {/* Class Information & Management Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 shrink-0 bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 leading-tight">Classroom Information</h2>
                  <p className="text-[11px] text-slate-500 font-medium">Class details, access code & enrolled batches</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowJoinForm(false);
                  setShowClassmates(false);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
              
              {/* FEATURED: Current Active Class Information Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-white p-5 border border-blue-200/80 shadow-xs">
                
                {/* Top Status & Class Name */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full uppercase tracking-wider mb-1.5 border border-blue-200/60">
                      <Sparkles size={10} /> Active Classroom
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
                      {activeName}
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Enrolled
                  </span>
                </div>

                {/* Class Code Box with 1-Click Copy */}
                <div className="bg-white/90 rounded-2xl p-3 border border-slate-200/80 flex items-center justify-between gap-3 shadow-xs mb-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Class Access Code</p>
                    <p className="font-mono text-base sm:text-lg font-black text-slate-900 tracking-widest truncate">
                      {activeCode}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopyCode(activeCode)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
                    title="Copy Class Code"
                  >
                    {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                  </button>
                </div>

                {/* Classroom Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  <div className="bg-white/70 rounded-xl p-2.5 border border-slate-200/60">
                    <div className="flex items-center gap-2 text-slate-500 text-[11px] font-medium mb-1">
                      <Users size={13} className="text-blue-600" />
                      <span>Classmates</span>
                    </div>
                    <p className="text-sm font-black text-slate-900">
                      {classmatesLoading ? "..." : `${classmates.length} Students`}
                    </p>
                  </div>

                  <div className="bg-white/70 rounded-xl p-2.5 border border-slate-200/60">
                    <div className="flex items-center gap-2 text-slate-500 text-[11px] font-medium mb-1">
                      <BookOpen size={13} className="text-indigo-600" />
                      <span>Curriculum</span>
                    </div>
                    <p className="text-sm font-black text-slate-900">
                      {subjectsCount} Subjects Active
                    </p>
                  </div>
                </div>

                {/* Direct Action Links */}
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/student/resources"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all text-center"
                  >
                    <FolderOpen size={14} />
                    <span>Subjects & Notes</span>
                  </Link>
                  <Link
                    href="/student/timetable"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all text-center"
                  >
                    <Calendar size={14} />
                    <span>Time-Table</span>
                  </Link>
                </div>

                {/* Toggle Classmates List */}
                <button
                  onClick={() => setShowClassmates(!showClassmates)}
                  className="w-full mt-3 flex items-center justify-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-800 py-1 transition-colors"
                >
                  <span>{showClassmates ? "Hide Classmates" : `View Enrolled Classmates (${classmates.length})`}</span>
                  {showClassmates ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>

              {/* Collapsible Classmates Section */}
              {showClassmates && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Users size={14} className="text-blue-600" />
                      <span>Classmates ({classmates.length})</span>
                    </h4>
                  </div>

                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={classmateSearch}
                      onChange={(e) => setClassmateSearch(e.target.value)}
                      placeholder="Search classmate..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {filteredClassmates.length === 0 ? (
                      <p className="text-center py-4 text-xs text-slate-400">No classmates found</p>
                    ) : (
                      filteredClassmates.map((c) => {
                        const isMe = c.uid === user?.uid;
                        return (
                          <div
                            key={c.uid}
                            className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {c.displayName?.charAt(0) || "S"}
                              </div>
                              <span className="font-semibold text-slate-800 truncate">
                                {c.displayName || "Student"}
                              </span>
                            </div>
                            {isMe && (
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
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
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    My Classes ({enrolledList.length})
                  </h4>
                  {!showJoinForm && (
                    <button
                      onClick={() => setShowJoinForm(true)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus size={13} />
                      <span>Join Another</span>
                    </button>
                  )}
                </div>

                {/* Join Form */}
                {showJoinForm && (
                  <form onSubmit={handleJoinNewClass} className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-3 animate-in fade-in duration-150">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                        <KeyRound size={15} /> Enter Class Code
                      </h4>
                      <button 
                        type="button" 
                        onClick={() => setShowJoinForm(false)}
                        className="text-slate-400 hover:text-slate-600"
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
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-center font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                        required
                      />
                      <button
                        type="submit"
                        disabled={isJoining || !joinCodeInput.trim()}
                        className="px-4 py-2 bg-slate-900 hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
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
                            ? "bg-blue-50/70 border-blue-200 shadow-2xs"
                            : "bg-slate-50 hover:bg-slate-100/70 border-slate-200/80"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                              {name}
                            </span>
                            <span className="font-mono text-[10px] font-extrabold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              {code}
                            </span>
                            {isActive && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                <Check size={10} /> Active
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {!isActive && (
                            <button
                              onClick={() => handleSwitchClass(code)}
                              className="px-3 py-1 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                            >
                              Switch
                            </button>
                          )}
                          <button
                            onClick={() => handleLeaveClass(code)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
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
        </div>
      )}
    </>
  );
}
