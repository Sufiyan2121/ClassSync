"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Download, Plus, Trash2, X, Upload } from "lucide-react";
import { useTimetables } from "@/hooks/useTimetables";
import { useAuth } from "@/components/providers/AuthProvider";
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase/clientApp";
import toast from "react-hot-toast";

export default function AdminTimetable() {
  const { timetables, loading } = useTimetables();
  const { user } = useAuth();
  
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim() || !user) {
      toast.error("Please provide a title and an image URL.");
      return;
    }

    setIsUploading(true);
    try {
      let finalImageUrl = imageUrl.trim();

      // Automatically convert Google Drive links to direct image links
      const driveRegex = /drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/;
      const match = finalImageUrl.match(driveRegex);
      if (match && match[1]) {
        finalImageUrl = `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }

      // Create document in Firestore directly with the provided URL
      await addDoc(collection(db, "timetables"), {
        title: title.trim(),
        imageUrl: finalImageUrl,
        storagePath: null, // No longer using Firebase Storage
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });

      toast.success("Timetable added successfully!");
      setShowModal(false);
      setTitle("");
      setImageUrl("");
    } catch (error: any) {
      console.error("Error adding timetable:", error);
      toast.error(error.message || "Failed to add timetable.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, storagePath?: string) => {
    if (!window.confirm("Are you sure you want to delete this timetable?")) return;
    
    try {
      // 1. Delete from Firestore
      await deleteDoc(doc(db, "timetables", id));
      
      // 2. Delete from Storage ONLY if path exists (legacy support for any they managed to upload)
      if (storagePath) {
        try {
          const fileRef = ref(storage, storagePath);
          await deleteObject(fileRef);
        } catch(e) {
          console.warn("Could not delete from storage, but removed from database.");
        }
      }
      
      toast.success("Timetable deleted successfully!");
    } catch (error) {
      console.error("Error deleting timetable:", error);
      toast.error("Failed to delete timetable.");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen relative">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 glass px-6 py-4 rounded-3xl shadow-sm border border-slate-200/50">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0">
            <ArrowLeft size={24} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="text-purple-600" size={24} /> Manage Time-Tables
            </h1>
            <p className="text-slate-500 text-sm font-medium">Add or remove class schedules</p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-sm ml-auto sm:ml-0"
        >
          <Plus size={16} />
          <span>Add New</span>
        </button>
      </header>

      {loading ? (
        <div className="grid gap-6">
          <div className="animate-pulse bg-white/60 backdrop-blur-md h-64 rounded-3xl border border-slate-100"></div>
        </div>
      ) : timetables.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center shadow-sm border border-slate-200/50 flex flex-col items-center justify-center">
          <Calendar size={48} className="text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No timetables found</h3>
          <p className="text-slate-500">Click the "Add New" button to upload a schedule.</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {timetables.map((t) => (
            <div key={t.id} className="glass rounded-3xl overflow-hidden shadow-sm border border-slate-200/50 bg-white/40 group">
              <div className="flex justify-between items-center p-4 md:px-6 md:py-4 border-b border-slate-200/50 bg-white/60">
                <h3 className="font-bold text-lg text-slate-900">{t.title}</h3>
                <div className="flex items-center gap-2">
                  <a 
                    href={t.imageUrl} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
                  >
                    <Download size={18} />
                  </a>
                  <button 
                    onClick={() => handleDelete(t.id, (t as any).storagePath)}
                    className="p-2 bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="p-4 md:p-6 flex items-center justify-center">
                <img src={t.imageUrl} alt={t.title} className="w-full max-w-4xl object-contain rounded-xl shadow-sm border border-slate-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Add Time-Table</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpload} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Midterm Exam Schedule"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.png"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium text-slate-900"
                  required
                />
                <p className="text-xs text-slate-500 mt-2">
                  Since Firebase Storage requires a paid plan, simply upload your image to a free site like <a href="https://imgur.com/upload" target="_blank" rel="noreferrer" className="text-blue-500 underline">Imgur</a> or Google Drive and paste the direct image link here.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUploading || !imageUrl.trim() || !title.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 transition-all hover:bg-blue-600 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isUploading ? "Saving..." : "Save Time-Table"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
