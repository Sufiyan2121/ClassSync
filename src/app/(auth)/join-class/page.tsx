"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useClassConfig } from "@/hooks/useClassConfig";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { 
  KeyRound, 
  LogOut, 
  ArrowRight, 
  ShieldAlert, 
  Clock, 
  X, 
  CheckCircle2, 
  AlertCircle,
  GraduationCap,
  ShieldCheck,
  RotateCcw
} from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { ClassJoinRequest } from "@/types";
import toast from "react-hot-toast";

export default function JoinClassPage() {
  const { 
    user, 
    userData, 
    loading: authLoading, 
    logout, 
    requestJoinClass, 
    cancelJoinRequest,
    requestAdminRole 
  } = useAuth();
  const { classConfig, loading: configLoading, verifyCode, classes } = useClassConfig();
  const router = useRouter();

  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<ClassJoinRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);

  // 1. Intelligent routing guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }

    if (!authLoading && userData) {
      // If user is Admin, send to admin portal
      if (userData.role === "ADMIN") {
        router.replace("/admin");
        return;
      }
      
      // If student is already approved and enrolled in an active class, go to student dashboard
      const enrolled = userData.enrolledClasses || (userData.enrolledClassCode ? [userData.enrolledClassCode] : []);
      if (userData.enrolledClassCode && enrolled.includes(userData.enrolledClassCode)) {
        router.replace("/student");
      }
    }
  }, [user, userData, authLoading, router]);

  // 2. Real-time listener for this student's join requests
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "join_requests"),
      where("studentUid", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: ClassJoinRequest[] = [];
      snap.forEach((doc) => {
        list.push(doc.data() as ClassJoinRequest);
      });
      setPendingRequests(list);
      setRequestsLoading(false);

      // If any request got approved, check if student got enrolled
      const approvedReq = list.find((r) => r.status === "APPROVED");
      if (approvedReq) {
        toast.success(`Access to ${approvedReq.classCode} approved!`);
        router.replace("/student");
      }
    });

    return () => unsub();
  }, [user, router]);

  const activePending = pendingRequests.find((r) => r.status === "PENDING");
  const rejectedRequest = pendingRequests.find((r) => r.status === "REJECTED");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      toast.error("Please enter a class code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = verifyCode(cleanCode);

      if (!result.valid) {
        toast.error("Invalid class code. Please check with your teacher.");
        setIsSubmitting(false);
        return;
      }

      // Check if student already enrolled
      const enrolled = userData?.enrolledClasses || [];
      if (enrolled.includes(cleanCode)) {
        toast.success(`You are already enrolled in ${cleanCode}!`);
        router.replace("/student");
        return;
      }

      // Submit join request for Class Admin approval
      await requestJoinClass(cleanCode, result.classItem?.name || cleanCode);
      toast.success(`Join request sent to ${cleanCode} admin!`);
      setCode("");
    } catch (err: any) {
      console.error("Join error:", err);
      toast.error("Failed to request access: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async (classCode: string) => {
    if (!confirm(`Cancel join request for ${classCode}?`)) return;
    try {
      await cancelJoinRequest(classCode);
      toast.success("Request cancelled. You can now enter another class code.");
    } catch (e: any) {
      toast.error("Error cancelling request: " + e.message);
    }
  };

  const handleRequestAdmin = async () => {
    setIsAdminSubmitting(true);
    try {
      await requestAdminRole();
      toast.success("Admin request submitted to the developer!");
      setShowAdminModal(false);
      router.replace("/admin");
    } catch (e: any) {
      toast.error("Failed to submit admin request: " + e.message);
    } finally {
      setIsAdminSubmitting(false);
    }
  };

  if (authLoading || configLoading || requestsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#dfe8df] dark:bg-[#09130e]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 dark:border-emerald-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden bg-[#dfe8df] dark:bg-[#09130e] transition-colors">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 dark:bg-emerald-900/20 blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-400/20 dark:bg-teal-900/20 blur-[100px] animate-pulse" style={{ animationDelay: "2s" }}></div>

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="mb-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
          <BrandLogo size="md" align="center" tagline="Classroom Verification" />
        </div>

        {/* Main Card */}
        <div className="glass rounded-[2rem] p-6 sm:p-8 shadow-2xl border border-white/60 dark:border-[#1e3025] bg-white/60 dark:bg-[#121c16]/90 backdrop-blur-xl animate-in slide-in-from-bottom-6 fade-in duration-700">
          
          {/* User badge */}
          <div className="flex items-center justify-between p-3 bg-stone-50/80 dark:bg-[#18261e] rounded-2xl border border-stone-200/60 dark:border-[#243a2c] mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-600 text-white font-bold flex items-center justify-center shrink-0 shadow-sm">
                {userData?.displayName?.charAt(0) || "S"}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Signed in as</p>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-extrabold px-1.5 py-0.2 rounded-md">STUDENT</span>
                </div>
                <p className="text-sm font-bold text-stone-900 dark:text-white truncate">{userData?.displayName || "Student"}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{userData?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors shrink-0 ml-2 cursor-pointer"
              title="Switch account"
            >
              <LogOut size={16} />
            </button>
          </div>

          {/* VIEW A: Student Has an Active Pending Join Request */}
          {activePending ? (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="text-center py-2">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 flex items-center justify-center text-amber-700 dark:text-amber-400 shadow-sm relative">
                  <Clock size={32} className="animate-spin text-amber-600 dark:text-amber-400" style={{ animationDuration: "8s" }} />
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                  </span>
                </div>
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">Approval Pending</h2>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                  Your request has been submitted to the class administrator.
                </p>
              </div>

              {/* Class Info Card */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-[#192318] border border-amber-200/80 dark:border-[#2a3f2c]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Requested Class</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300">
                    Awaiting Teacher / CR
                  </span>
                </div>
                <p className="text-lg font-black text-stone-900 dark:text-white tracking-wide">{activePending.className || activePending.classCode}</p>
                <p className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">Code: {activePending.classCode}</p>

                <div className="mt-3 pt-3 border-t border-amber-200/60 dark:border-[#233525] text-xs text-stone-600 dark:text-stone-300 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>Student: <strong>{userData?.displayName}</strong></span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="truncate">Email: <strong>{userData?.email}</strong></span>
                  </p>
                </div>
              </div>

              <div className="bg-emerald-50/50 dark:bg-[#121c16] rounded-xl p-3 border border-emerald-200/50 dark:border-[#1e3025] flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Once your Class Teacher or CR approves your request, this page will <strong>automatically refresh</strong> and open your live classroom feed.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleCancelRequest(activePending.classCode)}
                className="w-full py-3 px-4 rounded-xl border border-stone-300 dark:border-[#243a2c] text-stone-600 dark:text-stone-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-900/50 hover:bg-red-50/50 dark:hover:bg-red-950/20 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <X size={15} />
                <span>Cancel Request & Enter Another Code</span>
              </button>
            </div>
          ) : (
            /* VIEW B: Enter Class Code to Submit Join Request */
            <div>
              {rejectedRequest && (
                <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-start gap-2.5">
                  <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-800 dark:text-rose-300 flex-1">
                    <p className="font-bold">Join Request Declined</p>
                    <p className="mt-0.5 text-stone-600 dark:text-stone-300">
                      Your request to join <strong>{rejectedRequest.classCode}</strong> was not approved. Please verify the code with your teacher.
                    </p>
                  </div>
                  <button
                    onClick={() => handleCancelRequest(rejectedRequest.classCode)}
                    className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <KeyRound size={20} className="text-emerald-700 dark:text-emerald-400" /> Enter Class Code
                </h2>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                  Enter your classroom code. Your join request will be forwarded to your class teacher/CR for verification.
                </p>
              </div>

              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                    Class Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. MCA2026"
                    maxLength={15}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3.5 bg-white dark:bg-[#16231b] border-2 border-stone-200 dark:border-[#243a2c] rounded-2xl font-mono text-center text-lg md:text-xl font-extrabold tracking-widest text-stone-900 dark:text-emerald-400 uppercase focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-stone-300 dark:placeholder:text-stone-600 placeholder:font-normal placeholder:tracking-normal"
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !code.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-2xl transition-all duration-200 shadow-md shadow-emerald-950/20 cursor-pointer disabled:cursor-not-allowed group"
                >
                  <span>{isSubmitting ? "Requesting Access..." : "Request to Join Class"}</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-stone-100 dark:border-[#1e3025] flex items-start gap-2.5 text-xs text-stone-400 dark:text-stone-500">
                <ShieldAlert size={16} className="shrink-0 mt-0.5 text-stone-400 dark:text-stone-500" />
                <p>
                  Class codes require verification by the class teacher to protect student privacy and test materials.
                </p>
              </div>
            </div>
          )}

          {/* Teacher / CR Admin Request Link */}
          <div className="mt-5 pt-4 border-t border-stone-200/50 dark:border-[#1e3025] text-center">
            <button
              type="button"
              onClick={() => setShowAdminModal(true)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <GraduationCap size={15} />
              <span>Are you a Teacher or CR? Request Admin Access</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Privilege Request Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0c1610] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-stone-200 dark:border-[#1e3025] animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mb-4">
              <GraduationCap size={26} />
            </div>

            <h3 className="text-xl font-extrabold text-stone-900 dark:text-white">Request Admin Access</h3>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
              Admin privileges allow educators and Class Representatives to broadcast announcements, create timetable schedules, and manage class subjects.
            </p>

            <div className="my-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-300">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldAlert size={15} /> Developer Verification Required
              </p>
              <p className="mt-1 text-stone-600 dark:text-stone-300">
                To prevent unauthorized broadcasts, your admin request will be reviewed and approved by the platform developer.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                disabled={isAdminSubmitting}
                className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-[#243a2c] text-stone-600 dark:text-stone-300 text-xs font-bold hover:bg-stone-50 dark:hover:bg-[#16231b] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestAdmin}
                disabled={isAdminSubmitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
              >
                {isAdminSubmitting ? "Submitting..." : "Submit Admin Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
