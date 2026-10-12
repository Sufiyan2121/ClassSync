"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useClassConfig } from "@/hooks/useClassConfig";
import { 
  GraduationCap, 
  Plus, 
  LogOut, 
  Check, 
  X, 
  KeyRound, 
  ArrowRight, 
  ChevronDown,
  Layers 
} from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export function StudentClassSwitcher() {
  const { userData, enrollInClass, leaveClass, switchClass } = useAuth();
  const { classes, classConfig, verifyCode } = useClassConfig();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [isJoining, setIsJoining] = useState(false);

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

  if (!activeCode && enrolledList.length === 0) return null;

  return (
    <>
      {/* Clickable Header Badge */}
      <button
        onClick={() => setIsOpen(true)}
        className="group flex items-center gap-2 px-3 py-1.5 md:px-3.5 md:py-2 bg-white/80 hover:bg-white text-slate-800 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer"
        title="Manage your classes"
      >
        <div className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
          <GraduationCap size={14} />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs md:text-sm font-extrabold text-slate-900 tracking-wider">
              {activeCode}
            </span>
            <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-700 transition-colors" />
          </div>
        </div>
      </button>

      {/* Classes Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[85vh] flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Layers size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">My Classes</h2>
                  <p className="text-xs text-slate-500">Switch classes, join new ones, or exit</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowJoinForm(false);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              
              {/* Join another class button / form */}
              {!showJoinForm ? (
                <button
                  onClick={() => setShowJoinForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-50 hover:bg-blue-100/80 text-blue-700 font-bold text-xs rounded-2xl border border-blue-200/80 transition-all shadow-xs"
                >
                  <Plus size={16} />
                  <span>Join Another Class with Code</span>
                </button>
              ) : (
                <form onSubmit={handleJoinNewClass} className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-3">
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
                      className="px-4 py-2 bg-slate-900 hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-xs shrink-0"
                    >
                      {isJoining ? "Joining..." : "Join"}
                    </button>
                  </div>
                </form>
              )}

              {/* Enrolled Classes List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Enrolled Classes ({enrolledList.length})
                </h4>

                {enrolledList.map((code) => {
                  const isActive = code === activeCode;
                  const name = getClassName(code);

                  return (
                    <div
                      key={code}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        isActive
                          ? "bg-blue-50/80 border-blue-300 shadow-xs"
                          : "bg-slate-50 border-slate-200/80 hover:border-slate-300"
                      }`}
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-sm text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-xs">
                            {code}
                          </span>
                          <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {name}
                          </span>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                              <Check size={11} /> Current
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!isActive && (
                          <button
                            onClick={() => handleSwitchClass(code)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                          >
                            Switch
                          </button>
                        )}
                        <button
                          onClick={() => handleLeaveClass(code)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title={`Exit ${code}`}
                        >
                          <LogOut size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
