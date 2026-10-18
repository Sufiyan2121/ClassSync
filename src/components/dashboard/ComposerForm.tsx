"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { useAuth } from "@/components/providers/AuthProvider";
import { Post, PostType } from "@/types";
import toast from "react-hot-toast";
import { Send, Calendar as CalendarIcon, Type, AlignLeft, X, Save, Bell, FileText, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface ComposerFormProps {
  editingPost?: Post | null;
  onCancelEdit?: () => void;
}

export function ComposerForm({ editingPost, onCancelEdit }: ComposerFormProps) {
  const { userData, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<PostType>("ANNOUNCEMENT");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title);
      setDescription(editingPost.description);
      setType(editingPost.type);
      if (editingPost.dueDate) {
        // Format to YYYY-MM-DDThh:mm for datetime-local input
        setDueDate(format(editingPost.dueDate.toDate(), "yyyy-MM-dd'T'HH:mm"));
      } else {
        setDueDate("");
      }
    } else {
      setTitle("");
      setDescription("");
      setType("ANNOUNCEMENT");
      setDueDate("");
    }
  }, [editingPost]);

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
      if (dueDate) {
        firestoreDueDate = Timestamp.fromDate(new Date(dueDate));
      }

      if (editingPost) {
        await updateDoc(doc(db, "posts", editingPost.id), {
          title: title.trim(),
          description: description.trim(),
          type,
          dueDate: firestoreDueDate
        });
        toast.success("Post updated successfully!");
        if (onCancelEdit) onCancelEdit();
      } else {
        // Use the backend API to create the post AND send push notifications
        const payload = {
          title: title.trim(),
          description: description.trim(),
          type,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          createdBy: user.uid,
        };

        const response = await fetch("/api/admin/broadcast", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to broadcast");
        }

        if (result.notifications?.sent > 0) {
          toast.success(`Broadcasted! Sent ${result.notifications.sent} notifications.`);
        } else {
          toast.success("Post broadcasted successfully!");
        }

        setTitle("");
        setDescription("");
        setType("ANNOUNCEMENT");
        setDueDate("");
      }
    } catch (error: any) {
      console.error("Error creating/updating post:", error);
      toast.error(error.message || "Failed to broadcast.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-3xl shadow-sm border border-stone-200/70 dark:border-[#1e3025] dark:bg-[#121c16]/90 p-6 sm:p-8 mb-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500"></div>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-white tracking-tight">
          {editingPost ? "Edit Broadcast" : "Create Broadcast"}
        </h2>
        {editingPost && (
          <button 
            onClick={onCancelEdit}
            className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2.5">Broadcast Type</label>
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {([
              { id: "ANNOUNCEMENT" as PostType, label: "Announcement", icon: Bell },
              { id: "ASSIGNMENT" as PostType, label: "Assignment", icon: FileText },
              { id: "EXAM" as PostType, label: "Exam", icon: AlertCircle },
            ]).map(({ id, label, icon: Icon }) => {
              const isSelected = type === id;
              return (
                <label 
                  key={id} 
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1.5 sm:px-2 rounded-xl border-2 cursor-pointer transition-all min-w-0 select-none ${
                    isSelected 
                      ? "border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs ring-1 ring-emerald-600/20" 
                      : "border-stone-200/90 dark:border-[#1e3025] bg-white dark:bg-[#16231b] text-stone-600 dark:text-stone-300 hover:border-emerald-300 dark:hover:border-emerald-800/70 hover:bg-stone-50 dark:hover:bg-[#18261d] font-medium"
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={id}
                    checked={isSelected}
                    onChange={(e) => setType(e.target.value as PostType)}
                    className="sr-only"
                  />
                  <Icon size={15} className={`shrink-0 ${isSelected ? "text-emerald-700 dark:text-emerald-400" : "text-stone-400 dark:text-stone-500"}`} />
                  <span className="text-xs sm:text-xs md:text-sm font-semibold tracking-tight text-center truncate max-w-full leading-tight">
                    {label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="title" className="flex items-center gap-2 text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">
            <Type size={16} className="text-stone-400" /> Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Midterm Exam Schedule"
            className="w-full px-4 py-3 bg-white/90 dark:bg-[#16231b] backdrop-blur border border-stone-200/90 dark:border-[#243a2c] rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 shadow-xs outline-none"
            maxLength={100}
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="flex items-center gap-2 text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">
            <AlignLeft size={16} className="text-stone-400" /> Details
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write the specifics here..."
            rows={5}
            className="w-full px-4 py-3 bg-white/90 dark:bg-[#16231b] backdrop-blur border border-stone-200/90 dark:border-[#243a2c] rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 resize-y shadow-xs outline-none"
            required
          />
        </div>

        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <label htmlFor="dueDate" className="flex items-center gap-2 text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">
            <CalendarIcon size={16} className="text-amber-600 dark:text-amber-400" /> Expiry / Due Date
            {type === "ANNOUNCEMENT" && <span className="text-stone-400 font-normal text-xs ml-1">(Optional)</span>}
          </label>
          <input
            id="dueDate"
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-4 py-3 bg-white/90 dark:bg-[#16231b] backdrop-blur border border-stone-200/90 dark:border-[#243a2c] rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium text-stone-900 dark:text-white shadow-xs outline-none"
            required={type !== "ANNOUNCEMENT"}
          />
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 ml-1">The post will automatically disappear after this date.</p>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md shadow-emerald-950/20 transition-all hover:shadow-emerald-700/25 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${loading ? "opacity-70 cursor-not-allowed transform-none" : "cursor-pointer"}`}
          >
            {loading ? "Broadcasting..." : (
              <>
                {editingPost ? <Save size={18} /> : <Send size={18} />}
                {editingPost ? "Save Changes" : "Broadcast to Class"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
