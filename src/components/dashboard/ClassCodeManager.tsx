"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useClassConfig } from "@/hooks/useClassConfig";
import { 
  KeyRound, 
  Copy, 
  Check, 
  Pencil, 
  X, 
  Users, 
  UserX, 
  Plus, 
  Trash2, 
  Search, 
  GraduationCap, 
  ShieldCheck 
} from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { UserData, ClassItem } from "@/types";
import toast from "react-hot-toast";

export function ClassCodeManager() {
  const { 
    classConfig, 
    classes, 
    loading, 
    updateClassConfig, 
    modifyClass,
    createClass, 
    deleteClass,
    removeStudentFromClass 
  } = useClassConfig();

  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"students" | "classes">("students");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isModalOpen]);

  // Selected class in modal
  const [selectedClassCode, setSelectedClassCode] = useState(classConfig.classCode);
  const [enrolledStudents, setEnrolledStudents] = useState<UserData[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit / Create states
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [isEditingClass, setIsEditingClass] = useState<string | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Sync selectedClassCode when config loads
  useEffect(() => {
    if (classConfig.classCode && !selectedClassCode) {
      setSelectedClassCode(classConfig.classCode);
    }
  }, [classConfig.classCode, selectedClassCode]);

  // Real-time listener for enrolled students
  useEffect(() => {
    if (!selectedClassCode) return;

    setStudentsLoading(true);
    const usersQuery = query(collection(db, "users"));

    const unsub = onSnapshot(usersQuery, (snap) => {
      const list: UserData[] = [];
      snap.forEach((d) => {
        const u = { uid: d.id, ...d.data() } as UserData;
        if (u.role === "STUDENT") {
          const hasCode = 
            u.enrolledClassCode === selectedClassCode ||
            (Array.isArray(u.enrolledClasses) && u.enrolledClasses.includes(selectedClassCode));
          if (hasCode) {
            list.push(u);
          }
        }
      });
      setEnrolledStudents(list);
      setStudentsLoading(false);
    });

    return () => unsub();
  }, [selectedClassCode]);

  const handleCopy = (codeToCopy?: string) => {
    const target = codeToCopy || classConfig.classCode;
    if (!target) return;
    navigator.clipboard.writeText(target);
    setCopied(true);
    toast.success(`Class code ${target} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveStudent = async (student: UserData) => {
    if (!window.confirm(`Are you sure you want to remove ${student.displayName} from class ${selectedClassCode}?\nThey will immediately lose access until they re-enter the code.`)) {
      return;
    }

    if (!student.uid) {
      toast.error("Invalid student ID.");
      return;
    }

    try {
      await removeStudentFromClass(student.uid, selectedClassCode);
      toast.success(`${student.displayName} removed from class.`);
    } catch (err: any) {
      toast.error("Failed to remove student: " + err.message);
    }
  };

  const handleCreateNewClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newCode.trim().toUpperCase();
    const cleanName = newName.trim();

    if (!cleanCode || !cleanName) {
      toast.error("Please fill in both class code and name.");
      return;
    }

    if (classes.some(c => c.code.toUpperCase() === cleanCode)) {
      toast.error("A class with this code already exists.");
      return;
    }

    setActionLoading(true);
    try {
      await createClass(cleanCode, cleanName);
      toast.success(`Class "${cleanName}" (${cleanCode}) created!`);
      setSelectedClassCode(cleanCode);
      setIsCreatingNew(false);
      setNewCode("");
      setNewName("");
    } catch (err: any) {
      toast.error("Failed to create class: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEditClass = async (e: React.FormEvent, oldCode: string) => {
    e.preventDefault();
    const cleanCode = editCode.trim().toUpperCase();
    const cleanName = editName.trim();

    if (!cleanCode || !cleanName) return;

    // Check for collision with an existing class (excluding the one currently being edited)
    if (cleanCode !== oldCode.trim().toUpperCase() && classes.some(c => c.code.toUpperCase() === cleanCode)) {
      toast.error(`A class with code "${cleanCode}" already exists.`);
      return;
    }

    setActionLoading(true);
    try {
      await modifyClass(oldCode, cleanCode, cleanName);
      toast.success("Class updated!");
      setIsEditingClass(null);
      setSelectedClassCode(cleanCode);
    } catch (err: any) {
      toast.error("Update failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClass = async (code: string) => {
    if (!window.confirm(`Are you sure you want to delete class ${code}?`)) return;

    try {
      await deleteClass(code);
      toast.success(`Class ${code} deleted.`);
      if (selectedClassCode === code && classes.length > 1) {
        const next = classes.find(c => c.code !== code);
        if (next) setSelectedClassCode(next.code);
      }
    } catch (err: any) {
      toast.error("Delete failed: " + err.message);
    }
  };

  const filteredStudents = enrolledStudents.filter(s => 
    s.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="mb-6 glass rounded-2xl p-4 animate-pulse h-20 border border-slate-200/50"></div>
    );
  }

  return (
    <>
      {/* Top Banner on Admin Dashboard */}
      <div className="mb-6 glass rounded-2xl p-4 md:p-5 border border-stone-200/60 dark:border-[#1e3025] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-white/70 dark:from-[#122319] dark:via-[#0e1c14] dark:to-[#121c16]">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 shrink-0">
            <KeyRound size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Class Code:</span>
              <span className="font-mono text-base md:text-lg font-black text-stone-900 dark:text-emerald-400 bg-white dark:bg-[#16231b] px-3 py-0.5 rounded-lg border border-stone-200/80 dark:border-[#243a2c] shadow-xs tracking-widest">
                {classConfig.classCode}
              </span>
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/70 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60">
                {classConfig.className || "Active Class"}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium leading-tight">
              Share this code with your students to grant them access to announcements, timetables, and subjects.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => handleCopy()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#16231b] hover:bg-stone-50 dark:hover:bg-[#1f3325] text-stone-700 dark:text-stone-200 font-bold text-xs rounded-xl border border-stone-200 dark:border-[#243a2c] shadow-xs hover:shadow-sm transition-all cursor-pointer"
            title="Copy Code"
          >
            {copied ? <Check size={14} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? "Copied!" : "Copy Code"}</span>
          </button>
          <button
            onClick={() => {
              setSelectedClassCode(classConfig.classCode);
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
            title="Manage Code & Enrolled Students"
          >
            <Users size={14} />
            <span>Manage Code ({enrolledStudents.length} Students)</span>
          </button>
        </div>
      </div>

      {/* Full Management Modal - Portaled to document.body */}
      {mounted && isModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md overscroll-contain animate-in fade-in duration-200"
          style={{
            paddingTop: "max(1rem, env(safe-area-inset-top, 1rem))",
            paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="bg-white dark:bg-[#0c1610] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-[#1e3025] max-h-[85dvh] sm:max-h-[88vh] flex flex-col my-auto relative animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-stone-100 dark:border-[#1e3025] shrink-0 bg-stone-50/80 dark:bg-[#121c16]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-850 dark:text-emerald-300 rounded-xl">
                  <KeyRound size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900 dark:text-white">Classroom Management</h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Manage enrolled students and class codes</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#1e3025] rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-stone-100 dark:border-[#1e3025] px-6 pt-2 shrink-0 bg-stone-50/50 dark:bg-[#0f1a13]">
              <button
                onClick={() => setActiveTab("students")}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === "students"
                    ? "border-emerald-700 dark:border-emerald-500 text-emerald-900 dark:text-emerald-400"
                    : "border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                }`}
              >
                <Users size={15} />
                <span>Enrolled Students</span>
                <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-850 dark:text-emerald-300 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                  {enrolledStudents.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("classes")}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === "classes"
                    ? "border-emerald-700 dark:border-emerald-500 text-emerald-900 dark:text-emerald-400"
                    : "border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                }`}
              >
                <KeyRound size={15} />
                <span>Class Codes ({classes.length})</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {/* TAB 1: Enrolled Students */}
              {activeTab === "students" && (
                <div className="space-y-4">
                  
                  {/* Class Picker & Search */}
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-500 dark:text-stone-400">Class:</span>
                      <select
                        value={selectedClassCode}
                        onChange={(e) => setSelectedClassCode(e.target.value)}
                        className="bg-stone-50 dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] text-stone-900 dark:text-white font-bold text-xs rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
                      >
                        {classes.map((c) => (
                          <option key={c.code} value={c.code} className="dark:bg-[#121c16] text-stone-900 dark:text-white">
                            {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="relative flex-1 sm:max-w-xs">
                      <Search size={14} className="absolute left-3 top-3 text-stone-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search student by name or email..."
                        className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] rounded-xl text-xs font-medium text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none placeholder:text-stone-400 dark:placeholder:text-stone-500"
                      />
                    </div>
                  </div>

                  {/* Student List */}
                  {studentsLoading ? (
                    <div className="py-12 text-center text-stone-400 text-xs animate-pulse">
                      Loading enrolled students...
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-12 px-4 border-2 border-dashed border-stone-200/80 dark:border-[#1e3025] rounded-2xl bg-stone-50/50 dark:bg-[#121c16]/50">
                      <Users size={36} className="text-stone-300 dark:text-stone-600 mx-auto mb-2" />
                      <p className="font-bold text-stone-700 dark:text-stone-300 text-sm">No students found</p>
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 max-w-sm mx-auto">
                        {searchQuery 
                          ? "No student matches your search." 
                          : `Share the code "${selectedClassCode}" with your students so they can join this class.`}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {filteredStudents.map((student) => (
                        <div
                          key={student.uid}
                          className="flex items-center justify-between p-3.5 bg-stone-50/70 dark:bg-[#121c16] hover:bg-stone-50 dark:hover:bg-[#18261e] rounded-2xl border border-stone-200/60 dark:border-[#1e3025] transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs">
                              {student.displayName?.charAt(0) || "S"}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-stone-900 dark:text-white text-xs sm:text-sm truncate">
                                {student.displayName || "Student"}
                              </h4>
                              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">{student.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <span className="hidden sm:inline-block text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60">
                              Enrolled
                            </span>
                            <button
                              onClick={() => handleRemoveStudent(student)}
                              className="p-2 text-stone-400 hover:text-red-600 dark:hover:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                              title={`Remove ${student.displayName} from this class`}
                            >
                              <UserX size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Class Codes & Multi-Class */}
              {activeTab === "classes" && (
                <div className="space-y-6">
                  
                  {/* Create Class Button / Form */}
                  {!isCreatingNew ? (
                    <div className="flex justify-between items-center pb-2">
                      <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                        Manage your active classes and create additional codes for different divisions or batches.
                      </p>
                      <button
                        onClick={() => setIsCreatingNew(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Add Class</span>
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateNewClass} className="p-4 bg-emerald-50/70 dark:bg-[#122319] rounded-2xl border border-emerald-200/90 dark:border-[#1e392a] space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                          <GraduationCap size={16} className="text-emerald-700 dark:text-emerald-400" /> Create New Class
                        </h4>
                        <button type="button" onClick={() => setIsCreatingNew(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer">
                          <X size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1">Class Code</label>
                          <input
                            type="text"
                            value={newCode}
                            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                            placeholder="e.g. MCA-DIV-B"
                            maxLength={15}
                            className="w-full px-3 py-2 bg-white dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] rounded-xl font-mono text-center font-bold text-xs uppercase text-stone-900 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1">Class Name</label>
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. MCA 1st Year - Div B"
                            className="w-full px-3 py-2 bg-white dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-stone-900 dark:text-white"
                            required
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                      >
                        {actionLoading ? "Creating..." : "Save Class"}
                      </button>
                    </form>
                  )}

                  {/* Class list */}
                  <div className="space-y-3">
                    {classes.map((c) => {
                      const isEditingThis = isEditingClass === c.code;
                      const isCurrentPrimary = classConfig.classCode === c.code;

                      if (isEditingThis) {
                        return (
                          <form
                            key={c.code}
                            onSubmit={(e) => handleSaveEditClass(e, c.code)}
                            className="p-4 bg-white dark:bg-[#121c16] rounded-2xl border-2 border-emerald-600 shadow-sm space-y-3"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase">Code</label>
                                <input
                                  type="text"
                                  value={editCode}
                                  onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                                  className="w-full px-2.5 py-1.5 bg-white dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] rounded-lg font-mono text-center font-bold text-xs uppercase text-stone-900 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase">Name</label>
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] rounded-lg font-medium text-xs text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                                  required
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setIsEditingClass(null)}
                                className="flex-1 py-1.5 bg-stone-100 dark:bg-[#16231b] text-stone-600 dark:text-stone-300 text-xs font-bold rounded-lg hover:bg-stone-200 dark:hover:bg-[#1f3325] transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          </form>
                        );
                      }

                      return (
                        <div
                          key={c.code}
                          className="flex items-center justify-between p-4 bg-stone-50 dark:bg-[#121c16] rounded-2xl border border-stone-200/60 dark:border-[#1e3025] hover:border-stone-300 dark:hover:border-[#2b4433] transition-all"
                        >
                          <div className="min-w-0 pr-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-sm text-stone-900 dark:text-emerald-400 bg-white dark:bg-[#16231b] px-2.5 py-0.5 rounded-lg border border-stone-200 dark:border-[#243a2c]">
                                {c.code}
                              </span>
                              <span className="font-bold text-xs text-stone-800 dark:text-stone-200 truncate">
                                {c.name}
                              </span>
                              {isCurrentPrimary && (
                                <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                                  Primary
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleCopy(c.code)}
                              className="p-2 text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-[#1a2b20] rounded-lg transition-colors cursor-pointer"
                              title="Copy Code"
                            >
                              <Copy size={15} />
                            </button>
                            <button
                              onClick={() => {
                                setIsEditingClass(c.code);
                                setEditCode(c.code);
                                setEditName(c.name);
                              }}
                              className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-[#1e3025] rounded-lg transition-colors cursor-pointer"
                              title="Edit Class"
                            >
                              <Pencil size={15} />
                            </button>
                            {classes.length > 1 && (
                              <button
                                onClick={() => handleDeleteClass(c.code)}
                                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Delete Class"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
