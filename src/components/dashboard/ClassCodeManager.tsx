"use client";

import { useState } from "react";
import { useClassConfig } from "@/hooks/useClassConfig";
import { KeyRound, Copy, Check, Pencil, X, School, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export function ClassCodeManager() {
  const { classConfig, loading, updateClassConfig } = useClassConfig();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleCopy = () => {
    if (!classConfig.classCode) return;
    navigator.clipboard.writeText(classConfig.classCode);
    setCopied(true);
    toast.success("Class code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartEdit = () => {
    setNewCode(classConfig.classCode);
    setNewName(classConfig.className || "");
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newCode.trim().toUpperCase();
    if (!cleanCode) {
      toast.error("Class code cannot be empty.");
      return;
    }

    setIsSaving(true);
    try {
      await updateClassConfig(cleanCode, newName.trim());
      toast.success("Class code updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      toast.error("Failed to update class code: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mb-6 glass rounded-2xl p-4 animate-pulse h-20 border border-slate-200/50"></div>
    );
  }

  return (
    <>
      <div className="mb-6 glass rounded-2xl p-4 md:p-5 border border-slate-200/60 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-white/70">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <KeyRound size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Class Code:</span>
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
            onClick={handleCopy}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-xs hover:shadow-sm transition-all"
            title="Copy Code"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? "Copied!" : "Copy Code"}</span>
          </button>
          <button
            onClick={handleStartEdit}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all"
            title="Change Code"
          >
            <Pencil size={13} />
            <span>Manage Code</span>
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Manage Class Code</h2>
                  <p className="text-xs text-slate-500">Update code for this classroom</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Class Code (Students use this to join)
                </label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MCA2026"
                  maxLength={15}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center text-lg font-extrabold tracking-widest text-slate-900 uppercase focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Class / Batch Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. MCA 1st Year (2026-27)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !newCode.trim()}
                  className="flex-1 py-3 px-4 bg-slate-900 hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-slate-900/10"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
