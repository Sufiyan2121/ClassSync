"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useClassConfig } from "@/hooks/useClassConfig";
import { useAuth } from "@/components/providers/AuthProvider";
import { isDeveloperEmail } from "@/lib/developer";
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
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Crown,
  ShieldAlert,
  Sparkles
} from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { UserData, ClassItem, ClassJoinRequest } from "@/types";
import toast from "react-hot-toast";

export function ClassCodeManager() {
  const { 
    userData,
    approveStudentJoin,
    rejectStudentJoin,
    approveAdminRequest,
    rejectAdminRequest
  } = useAuth();

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
  const [activeTab, setActiveTab] = useState<"pending" | "students" | "classes" | "developer">("pending");

  const isDev = Boolean(userData?.isDeveloper || isDeveloperEmail(userData?.email));

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

  // Pending student join requests for selected class
  const [pendingRequests, setPendingRequests] = useState<ClassJoinRequest[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);

  // Pending admin requests for Developer review
  const [pendingAdminRequests, setPendingAdminRequests] = useState<UserData[]>([]);

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

  // 1. Real-time listener for enrolled students
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

  // 2. Real-time listener for student join requests for selected class
  useEffect(() => {
    if (!selectedClassCode) return;
    setPendingLoading(true);

    const q = query(
      collection(db, "join_requests"),
      where("classCode", "==", selectedClassCode),
      where("status", "==", "PENDING")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: ClassJoinRequest[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as ClassJoinRequest);
      });
      setPendingRequests(list);
      setPendingLoading(false);

      // If pending requests arrive, set default tab to pending
      if (list.length > 0 && activeTab === "students") {
        setActiveTab("pending");
      }
    });

    return () => unsub();
  }, [selectedClassCode]);

  // 3. Real-time listener for Developer: Pending Admin Requests
  useEffect(() => {
    if (!isDev) return;

    const q = query(
      collection(db, "users"),
      where("role", "==", "ADMIN"),
      where("adminApprovalStatus", "==", "PENDING")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: UserData[] = [];
      snap.forEach((d) => {
        const u = { uid: d.id, ...d.data() } as UserData;
        // Do not list the developer themselves
        if (!isDeveloperEmail(u.email)) {
          list.push(u);
        }
      });
      setPendingAdminRequests(list);
    });

    return () => unsub();
  }, [isDev]);

  const handleCopy = (codeToCopy?: string) => {
    const target = codeToCopy || classConfig.classCode;
    if (!target) return;
    navigator.clipboard.writeText(target);
    setCopied(true);
    toast.success(`Class code ${target} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApproveStudent = async (req: ClassJoinRequest) => {
    try {
      await approveStudentJoin(req.id, req.studentUid, selectedClassCode);
      toast.success(`Approved ${req.studentName} for ${selectedClassCode}!`);
    } catch (e: any) {
      toast.error("Failed to approve student: " + e.message);
    }
  };

  const handleRejectStudent = async (req: ClassJoinRequest) => {
    if (!confirm(`Decline join request from ${req.studentName}?`)) return;
    try {
      await rejectStudentJoin(req.id);
      toast.success(`Declined join request from ${req.studentName}.`);
    } catch (e: any) {
      toast.error("Failed to decline request: " + e.message);
    }
  };

  const handleApproveAdmin = async (targetUser: UserData) => {
    if (!targetUser.uid) return;
    try {
      await approveAdminRequest(targetUser.uid);
      toast.success(`Approved ${targetUser.displayName} as Admin!`);
    } catch (e: any) {
      toast.error("Failed to approve admin: " + e.message);
    }
  };

  const handleRejectAdmin = async (targetUser: UserData) => {
    if (!targetUser.uid) return;
    if (!confirm(`Reject Admin request for ${targetUser.displayName}?`)) return;
    try {
      await rejectAdminRequest(targetUser.uid);
      toast.success(`Rejected admin request for ${targetUser.displayName}.`);
    } catch (e: any) {
      toast.error("Failed to reject admin: " + e.message);
    }
  };

  const handleRemoveStudent = async (student: UserData) => {
    if (!window.confirm(`Are you sure you want to remove ${student.displayName} from class ${selectedClassCode}?\nThey will immediately lose access until they re-apply.`)) {
      return;
    }

    if (!student.uid) {
      toast.error("Invalid student ID.");
      return;
    }

    try {
      await removeStudentFromClass(student.uid, selectedClassCode);
      toast.success(`${student.displayName} removed from ${selectedClassCode}`);
    } catch (err: any) {
      toast.error("Failed to remove student: " + err.message);
    }
  };

  const handleCreateNewClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newCode.trim().toUpperCase();
    const cleanName = newName.trim();

    if (!cleanCode || !cleanName) return;

    if (classes.some(c => c.code.toUpperCase() === cleanCode)) {
      toast.error(`A class with code "${cleanCode}" already exists.`);
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

              {/* Alert Chip if Student Requests are Waiting */}
              {pendingRequests.length > 0 && (
                <span 
                  onClick={() => {
                    setActiveTab("pending");
                    setIsModalOpen(true);
                  }}
                  className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-black bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-0.5 rounded-full shadow-xs animate-pulse transition-all"
                >
                  <Clock size={12} />
                  <span>{pendingRequests.length} Student{pendingRequests.length > 1 ? "s" : ""} Awaiting Approval</span>
                </span>
              )}

              {/* Developer Admin Alert Chip */}
              {isDev && pendingAdminRequests.length > 0 && (
                <span 
                  onClick={() => {
                    setActiveTab("developer");
                    setIsModalOpen(true);
                  }}
                  className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-0.5 rounded-full shadow-xs transition-all"
                >
                  <Crown size={12} />
                  <span>{pendingAdminRequests.length} Admin Request{pendingAdminRequests.length > 1 ? "s" : ""}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium leading-tight">
              Share code with students. Each student must be verified and approved by you before joining this class.
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
              setActiveTab(pendingRequests.length > 0 ? "pending" : "students");
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer relative"
            title="Manage Code & Enrolled Students"
          >
            <Users size={14} />
            <span>Manage Roster ({enrolledStudents.length})</span>
            {pendingRequests.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-0.5 -right-0.5"></span>
            )}
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
                  <h2 className="text-lg font-bold text-stone-900 dark:text-white">Classroom & Access Manager</h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Review student approvals and class codes</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#1e3025] rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-stone-100 dark:border-[#1e3025] px-6 pt-2 shrink-0 bg-stone-50/50 dark:bg-[#0f1a13] overflow-x-auto scrollbar-hide">
              {/* Tab 1: Pending Approvals */}
              <button
                onClick={() => setActiveTab("pending")}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "pending"
                    ? "border-amber-500 text-amber-700 dark:text-amber-400"
                    : "border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                }`}
              >
                <Clock size={15} />
                <span>Pending Approvals</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border ${
                  pendingRequests.length > 0 
                    ? "bg-amber-100 dark:bg-amber-950/90 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700" 
                    : "bg-stone-100 dark:bg-[#16231b] text-stone-400 border-stone-200/60 dark:border-[#243a2c]"
                }`}>
                  {pendingRequests.length}
                </span>
              </button>

              {/* Tab 2: Enrolled Students */}
              <button
                onClick={() => setActiveTab("students")}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
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

              {/* Tab 3: Class Codes */}
              <button
                onClick={() => setActiveTab("classes")}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "classes"
                    ? "border-emerald-700 dark:border-emerald-500 text-emerald-900 dark:text-emerald-400"
                    : "border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                }`}
              >
                <KeyRound size={15} />
                <span>Class Codes ({classes.length})</span>
              </button>

              {/* Tab 4: Developer Admin Approvals */}
              {isDev && (
                <button
                  onClick={() => setActiveTab("developer")}
                  className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "developer"
                      ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                      : "border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
                  }`}
                >
                  <Crown size={15} className="text-amber-500" />
                  <span>Developer Approvals</span>
                  {pendingAdminRequests.length > 0 && (
                    <span className="bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                      {pendingAdminRequests.length}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {/* TAB 1: PENDING STUDENT APPROVALS */}
              {activeTab === "pending" && (
                <div className="space-y-4">
                  {/* Class selector */}
                  <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-500 dark:text-stone-400">Class:</span>
                      <select
                        value={selectedClassCode}
                        onChange={(e) => setSelectedClassCode(e.target.value)}
                        className="bg-stone-50 dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] text-stone-900 dark:text-white font-bold text-xs rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
                      >
                        {classes.map((c) => (
                          <option key={c.code} value={c.code} className="dark:bg-[#121c16] text-stone-900 dark:text-white">
                            {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <span className="text-xs text-stone-400 dark:text-stone-500 font-medium">
                      {pendingRequests.length} Waiting
                    </span>
                  </div>

                  {pendingLoading ? (
                    <div className="py-12 text-center text-xs text-stone-400 animate-pulse">Loading pending requests...</div>
                  ) : pendingRequests.length === 0 ? (
                    <div className="text-center py-12 px-4 border border-dashed border-stone-200 dark:border-[#1e3025] rounded-2xl bg-stone-50/50 dark:bg-[#0f1a13]">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 size={24} />
                      </div>
                      <h4 className="font-bold text-stone-900 dark:text-white text-sm">All Clear! No Pending Requests</h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
                        All student join requests for class <strong>{selectedClassCode}</strong> have been approved. New requests will appear here instantly.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-100 dark:divide-[#1e3025] border border-stone-200/80 dark:border-[#1e3025] rounded-2xl overflow-hidden bg-white dark:bg-[#121c16]">
                      {pendingRequests.map((req) => (
                        <div key={req.id} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-stone-50/80 dark:hover:bg-[#16231b] transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-emerald-600 to-teal-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                              {req.studentName?.charAt(0) || "S"}
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white truncate">
                                {req.studentName}
                              </h5>
                              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                                {req.studentEmail}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleRejectStudent(req)}
                              className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-[#243a2c] text-stone-600 dark:text-stone-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="Decline request"
                            >
                              <XCircle size={14} />
                              <span className="hidden sm:inline">Decline</span>
                            </button>
                            <button
                              onClick={() => handleApproveStudent(req)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                              title="Approve and admit student"
                            >
                              <CheckCircle2 size={14} />
                              <span>Approve</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ENROLLED STUDENTS */}
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
                        placeholder="Search student..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-stone-50 dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] rounded-xl text-xs font-medium text-stone-900 dark:text-white placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  {/* Student list */}
                  {studentsLoading ? (
                    <div className="py-12 text-center text-xs text-stone-400 animate-pulse">Loading enrolled students...</div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-12 px-4 border border-dashed border-stone-200 dark:border-[#1e3025] rounded-2xl bg-stone-50/50 dark:bg-[#0f1a13]">
                      <Users size={32} className="mx-auto text-stone-300 dark:text-stone-600 mb-2" />
                      <p className="text-xs font-bold text-stone-600 dark:text-stone-300">No students enrolled yet</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">Students can enter code "{selectedClassCode}" to request access.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-100 dark:divide-[#1e3025] border border-stone-200/80 dark:border-[#1e3025] rounded-2xl overflow-hidden bg-white dark:bg-[#121c16]">
                      {filteredStudents.map((student) => (
                        <div key={student.uid} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-stone-50/80 dark:hover:bg-[#16231b] transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                              {student.displayName?.charAt(0) || "S"}
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white truncate">
                                {student.displayName}
                              </h5>
                              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                                {student.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                              Active
                            </span>
                            <button
                              onClick={() => handleRemoveStudent(student)}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
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

              {/* TAB 3: CLASS CODES */}
              {activeTab === "classes" && (
                <div className="space-y-6">
                  {/* Create Class Button / Form */}
                  {!isCreatingNew ? (
                    <div className="flex justify-between items-center pb-2">
                      <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                        Manage active classes and create codes for new divisions or batches.
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
                                  className="w-full px-2.5 py-1.5 bg-white dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] rounded-lg text-xs font-medium text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                                  required
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setIsEditingClass(null)}
                                className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-[#243a2c] text-stone-600 dark:text-stone-300 text-xs font-medium"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={actionLoading}
                                className="px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold"
                              >
                                Save Changes
                              </button>
                            </div>
                          </form>
                        );
                      }

                      return (
                        <div
                          key={c.code}
                          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            isCurrentPrimary
                              ? "bg-emerald-50/80 dark:bg-[#122319] border-emerald-300 dark:border-[#2a4d36]"
                              : "bg-white dark:bg-[#121c16] border-stone-200/80 dark:border-[#1e3025]"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-mono text-sm font-black px-2.5 py-1 bg-white dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] rounded-lg text-stone-900 dark:text-emerald-400 tracking-wider">
                              {c.code}
                            </span>
                            <div className="min-w-0">
                              <h5 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white truncate">
                                {c.name}
                              </h5>
                              {isCurrentPrimary && (
                                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-extrabold uppercase">
                                  Default Primary Class
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleCopy(c.code)}
                              className="p-1.5 text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-stone-100 dark:hover:bg-[#16231b] rounded-lg transition-colors cursor-pointer"
                              title="Copy Code"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setIsEditingClass(c.code);
                                setEditCode(c.code);
                                setEditName(c.name);
                              }}
                              className="p-1.5 text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-stone-100 dark:hover:bg-[#16231b] rounded-lg transition-colors cursor-pointer"
                              title="Edit Class"
                            >
                              <Pencil size={14} />
                            </button>
                            {classes.length > 1 && (
                              <button
                                onClick={() => handleDeleteClass(c.code)}
                                className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                                title="Delete Class"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: DEVELOPER ADMIN APPROVALS */}
              {activeTab === "developer" && isDev && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-emerald-50/70 dark:bg-[#122319] border border-emerald-200 dark:border-[#2a4d36] rounded-2xl flex items-start gap-2.5">
                    <Crown size={20} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs text-stone-900 dark:text-white">Developer Authority Panel</h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        Only you (the platform developer) can grant Teacher / CR Admin privileges. Approving an account allows them to post broadcasts and manage class rosters.
                      </p>
                    </div>
                  </div>

                  {pendingAdminRequests.length === 0 ? (
                    <div className="text-center py-12 px-4 border border-dashed border-stone-200 dark:border-[#1e3025] rounded-2xl bg-stone-50/50 dark:bg-[#0f1a13]">
                      <ShieldCheck size={32} className="mx-auto text-emerald-600 dark:text-emerald-400 mb-2" />
                      <p className="text-xs font-bold text-stone-700 dark:text-stone-300">No Pending Admin Requests</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">When users request Teacher/CR privileges, they will appear here for your review.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-100 dark:divide-[#1e3025] border border-stone-200/80 dark:border-[#1e3025] rounded-2xl overflow-hidden bg-white dark:bg-[#121c16]">
                      {pendingAdminRequests.map((targetUser) => (
                        <div key={targetUser.uid} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-stone-50/80 dark:hover:bg-[#16231b] transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-emerald-600 to-teal-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                              {targetUser.displayName?.charAt(0) || "A"}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h5 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white truncate">
                                  {targetUser.displayName}
                                </h5>
                                <span className="text-[9px] font-extrabold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded-md">
                                  APPLIED ADMIN
                                </span>
                              </div>
                              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                                {targetUser.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleRejectAdmin(targetUser)}
                              className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-[#243a2c] text-stone-600 dark:text-stone-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="Reject Admin request"
                            >
                              <XCircle size={14} />
                              <span className="hidden sm:inline">Decline</span>
                            </button>
                            <button
                              onClick={() => handleApproveAdmin(targetUser)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                              title="Approve as Teacher/Admin"
                            >
                              <CheckCircle2 size={14} />
                              <span>Approve Admin</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
