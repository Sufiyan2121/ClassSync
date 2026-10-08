"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { useAuth } from "@/components/providers/AuthProvider";
import { PostType } from "@/types";
import toast from "react-hot-toast";
import { Send, Calendar as CalendarIcon, Type, AlignLeft } from "lucide-react";

export function ComposerForm() {
  const { userData, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<PostType>("ANNOUNCEMENT");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || userData.role !== "ADMIN" || !user) return;

    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required.");
      return;
    }

    setLoading(true);
    try {
      let firestoreDueDate: Timestamp | null = null;
      if ((type === "ASSIGNMENT" || type === "EXAM") && dueDate) {
        firestoreDueDate = Timestamp.fromDate(new Date(dueDate));
      }

      await addDoc(collection(db, "posts"), {
        title: title.trim(),
        description: description.trim(),
        type,
        dueDate: firestoreDueDate,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        status: "ACTIVE"
      });

      toast.success("Post broadcasted successfully!");
      setTitle("");
      setDescription("");
      setType("ANNOUNCEMENT");
      setDueDate("");
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error(error.message || "Failed to broadcast.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-3xl shadow-sm border border-slate-200/50 p-6 sm:p-8 mb-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
      
      <h2 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">Create Broadcast</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3">Broadcast Type</label>
          <div className="grid grid-cols-2 gap-3">
            {(["ANNOUNCEMENT", "ASSIGNMENT", "EXAM", "RESOURCE"] as PostType[]).map((t) => (
              <label 
                key={t} 
                className={`flex items-center justify-center py-3 px-2 rounded-xl border-2 cursor-pointer transition-all ${
                  type === t 
                    ? "border-blue-600 bg-blue-50 text-blue-700 font-bold" 
                    : "border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50 font-medium"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={t}
                  checked={type === t}
                  onChange={(e) => setType(e.target.value as PostType)}
                  className="sr-only"
                />
                <span className="text-sm capitalize">
                  {t.toLowerCase()}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="title" className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
            <Type size={16} className="text-slate-400" /> Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Midterm Exam Schedule"
            className="w-full px-4 py-3 bg-white/80 backdrop-blur border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium text-slate-900 placeholder:text-slate-400 shadow-sm"
            maxLength={100}
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
            <AlignLeft size={16} className="text-slate-400" /> Details
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write the specifics here..."
            rows={5}
            className="w-full px-4 py-3 bg-white/80 backdrop-blur border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400 resize-y shadow-sm"
            required
          />
        </div>

        {(type === "ASSIGNMENT" || type === "EXAM") && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <label htmlFor="dueDate" className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <CalendarIcon size={16} className="text-orange-500" /> Due Date / Exam Date
            </label>
            <input
              id="dueDate"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 bg-white/80 backdrop-blur border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium text-slate-900 shadow-sm"
              required
            />
          </div>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all hover:bg-blue-600 hover:shadow-blue-600/30 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${loading ? "opacity-70 cursor-not-allowed transform-none" : ""}`}
          >
            {loading ? "Broadcasting..." : (
              <>
                <Send size={18} />
                Broadcast to Class
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
