"use client";

import { useState, useEffect } from "react";
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
    createClass, 
    deleteClass,
    removeStudentFromClass 
  } = useClassConfig();

  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"students" | "classes">("students");

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

    setActionLoading(true);
    try {
      await updateClassConfig(cleanCode, cleanName);
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
      <div className="mb-6 glass rounded-2xl p-4 md:p-5 border border-slate-200/60 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-white/70">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <KeyRound size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class Code:</span>
              <span className="font-mono text-base md:text-lg font-black text-slate-900 bg-white px-3 py-0.5 rounded-lg border border-slate-200/80 shadow-xs tracking-widest">
                {classConfig.classCode}
              </span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-100/60 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                {classConfig.className || "Active Class"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium leading-tight">
              Share this code with your students to grant them access to announcements, timetables, and subjects.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => handleCopy()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-xs hover:shadow-sm transition-all"
            title="Copy Code"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? "Copied!" : "Copy Code"}</span>
          </button>
          <button
            onClick={() => {
              setSelectedClassCode(classConfig.classCode);
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all"
            title="Manage Code & Enrolled Students"
          >
            <Users size={14} />
            <span>Manage Code ({enrolledStudents.length} Students)</span>
          </button>
        </div>
      </div>

      {/* Full Management Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <KeyRound size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Classroom Management</h2>
                  <p className="text-xs text-slate-500">Manage enrolled students and class codes</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 px-6 pt-2 shrink-0 bg-slate-50/50">
              <button
                onClick={() => setActiveTab("students")}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                  activeTab === "students"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Users size={15} />
                <span>Enrolled Students</span>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                  {enrolledStudents.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("classes")}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                  activeTab === "classes"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
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
                      <span className="text-xs font-bold text-slate-500">Class:</span>
                      <select
                        value={selectedClassCode}
                        onChange={(e) => setSelectedClassCode(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {classes.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="relative flex-1 sm:max-w-xs">
                      <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search student by name or email..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Student List */}
                  {studentsLoading ? (
                    <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
                      Loading enrolled students...
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-12 px-4 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                      <Users size={36} className="text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-700 text-sm">No students found</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
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
                          className="flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-200/60 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs">
                              {student.displayName?.charAt(0) || "S"}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                                {student.displayName || "Student"}
                              </h4>
                              <p className="text-[11px] text-slate-500 truncate">{student.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <span className="hidden sm:inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Enrolled
                            </span>
                            <button
                              onClick={() => handleRemoveStudent(student)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
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
                      <p className="text-xs text-slate-500 font-medium">
                        Manage your active classes and create additional codes for different divisions or batches.
                      </p>
                      <button
                        onClick={() => setIsCreatingNew(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0"
                      >
                        <Plus size={14} />
                        <span>Add Class</span>
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateNewClass} className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                          <GraduationCap size={16} /> Create New Class
                        </h4>
                        <button type="button" onClick={() => setIsCreatingNew(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Class Code</label>
                          <input
                            type="text"
                            value={newCode}
                            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                            placeholder="e.g. MCA-DIV-B"
                            maxLength={15}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-center font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Class Name</label>
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. MCA 1st Year - Div B"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
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
                            className="p-4 bg-white rounded-2xl border-2 border-blue-500 shadow-sm space-y-3"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Code</label>
                                <input
                                  type="text"
                                  value={editCode}
                                  onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                                  className="w-full px-2.5 py-1.5 border rounded-lg font-mono text-center font-bold text-xs uppercase"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Name</label>
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full px-2.5 py-1.5 border rounded-lg font-medium text-xs"
                                  required
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setIsEditingClass(null)}
                                className="flex-1 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="flex-1 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg"
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
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/60 hover:border-slate-300 transition-all"
                        >
                          <div className="min-w-0 pr-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-sm text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                                {c.code}
                              </span>
                              <span className="font-bold text-xs text-slate-800 truncate">
                                {c.name}
                              </span>
                              {isCurrentPrimary && (
                                <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                  Primary
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleCopy(c.code)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                              title="Edit Class"
                            >
                              <Pencil size={15} />
                            </button>
                            {classes.length > 1 && (
                              <button
                                onClick={() => handleDeleteClass(c.code)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        </div>
      )}
    </>
  );
}
