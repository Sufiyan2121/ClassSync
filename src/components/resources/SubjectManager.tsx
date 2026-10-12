"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  deleteDoc, 
  doc, 
  updateDoc, 
  where, 
  getDocs, 
  writeBatch 
} from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { useAuth } from "@/components/providers/AuthProvider";
import { Subject, Material, MaterialCategory } from "@/types";
import toast from "react-hot-toast";
import { 
  Folder, 
  Link as LinkIcon, 
  FileText, 
  Trash2, 
  Plus, 
  X, 
  Pencil, 
  Check, 
  ArrowLeft 
} from "lucide-react";
import Link from "next/link";

export function AdminResources() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  // Subject management states
  const [newSubjectName, setNewSubjectName] = useState("");
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState("");
  const [isSubjectActionLoading, setIsSubjectActionLoading] = useState(false);

  // Material states
  const [linkInput, setLinkInput] = useState<{ [key: string]: string }>({});
  const [nameInput, setNameInput] = useState<{ [key: string]: string }>({});
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    // Fetch Subjects
    const q = query(collection(db, "subjects"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const subs: Subject[] = [];
      snap.forEach(d => subs.push({ id: d.id, ...d.data() } as Subject));
      setSubjects(subs);
      
      // Keep activeSubject valid if current one was deleted or not set
      if (subs.length > 0) {
        if (!activeSubject || !subs.some(s => s.id === activeSubject)) {
          setActiveSubject(subs[0].id);
        }
      } else {
        setActiveSubject(null);
      }
      setLoading(false);
    });

    // Fetch Materials
    const q2 = query(collection(db, "materials"), orderBy("createdAt", "desc"));
    const unsub2 = onSnapshot(q2, (snap) => {
      const mats: Material[] = [];
      snap.forEach(d => mats.push({ id: d.id, ...d.data() } as Material));
      setMaterials(mats);
    });

    return () => { unsub(); unsub2(); };
  }, [activeSubject]);

  // Create new subject
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSubjectName.trim();
    if (!trimmed || !user) return;

    // Check for duplicates
    if (subjects.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("A subject with this name already exists.");
      return;
    }

    setIsSubjectActionLoading(true);
    try {
      const docRef = await addDoc(collection(db, "subjects"), {
        name: trimmed,
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
      setNewSubjectName("");
      setActiveSubject(docRef.id);
      toast.success("Subject added!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create subject");
    } finally {
      setIsSubjectActionLoading(false);
    }
  };

  // Start editing a subject
  const handleStartEdit = (e: React.MouseEvent, sub: Subject) => {
    e.stopPropagation();
    setEditingSubjectId(sub.id);
    setEditingSubjectName(sub.name);
  };

  // Cancel editing
  const handleCancelEdit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingSubjectId(null);
    setEditingSubjectName("");
  };

  // Save modified subject name
  const handleSaveEdit = async (e: React.FormEvent | React.MouseEvent, subjectId: string) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const trimmed = editingSubjectName.trim();
    if (!trimmed) {
      toast.error("Subject name cannot be empty.");
      return;
    }

    // Check duplicate among other subjects
    if (subjects.some(s => s.id !== subjectId && s.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Another subject already has this name.");
      return;
    }

    setIsSubjectActionLoading(true);
    try {
      await updateDoc(doc(db, "subjects", subjectId), {
        name: trimmed
      });
      toast.success("Subject renamed successfully!");
      setEditingSubjectId(null);
      setEditingSubjectName("");
    } catch (err: any) {
      toast.error("Failed to rename subject: " + err.message);
    } finally {
      setIsSubjectActionLoading(false);
    }
  };

  // Delete subject and its materials
  const handleDeleteSubject = async (e: React.MouseEvent, subjectId: string, subjectName: string) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${subjectName}"?\nAll syllabus, notes, and links inside this subject will be deleted.`)) {
      return;
    }

    setIsSubjectActionLoading(true);
    try {
      // 1. Delete all materials belonging to this subject
      const matsQ = query(collection(db, "materials"), where("subjectId", "==", subjectId));
      const matsSnap = await getDocs(matsQ);
      
      const batch = writeBatch(db);
      matsSnap.forEach((mDoc) => {
        batch.delete(mDoc.ref);
      });

      // 2. Delete the subject itself
      batch.delete(doc(db, "subjects", subjectId));
      await batch.commit();

      if (editingSubjectId === subjectId) {
        setEditingSubjectId(null);
        setEditingSubjectName("");
      }

      toast.success(`Deleted subject "${subjectName}"`);
    } catch (err: any) {
      console.error("Error deleting subject:", err);
      toast.error("Failed to delete subject: " + err.message);
    } finally {
      setIsSubjectActionLoading(false);
    }
  };

  const handleAddLink = async (category: MaterialCategory) => {
    const url = linkInput[category];
    const title = nameInput[category] || `${category} Link`;
    
    if (!url || !url.trim()) {
      toast.error("Please enter a valid link.");
      return;
    }
    
    if (!activeSubject || !user) return;

    try {
      const finalUrl = url.startsWith('http') ? url : `https://${url}`;

      await addDoc(collection(db, "materials"), {
        subjectId: activeSubject,
        title: title.trim(),
        category,
        fileUrl: finalUrl,
        fileName: title.trim(),
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });

      toast.success("Link saved successfully!");
      setLinkInput(prev => ({ ...prev, [category]: "" }));
      setNameInput(prev => ({ ...prev, [category]: "" }));
    } catch (err: any) {
      toast.error("Failed to save link: " + err.message);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm("Delete this material?")) return;
    try {
      await deleteDoc(doc(db, "materials", id));
      toast.success("Deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const activeSubjectData = subjects.find(s => s.id === activeSubject);
  const subjectMaterials = materials.filter(m => m.subjectId === activeSubject);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      <header className="flex justify-between items-center mb-8 glass px-6 py-4 rounded-3xl shadow-sm border border-slate-200/50">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Resources Manager
            </h1>
            <p className="text-slate-500 text-sm font-medium">Organize subjects, syllabus, notes, and PDFs</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Col: Subjects list */}
        <div className="lg:col-span-1 glass rounded-3xl p-6 h-fit border border-slate-200/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Folder size={18} className="text-blue-500"/> Subjects
            </h2>
            <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
              {subjects.length}
            </span>
          </div>
          
          {/* Add Subject Input */}
          <form onSubmit={handleCreateSubject} className="mb-6 flex gap-2">
            <input 
              type="text" 
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
              placeholder="New Subject..." 
              disabled={isSubjectActionLoading}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-900 placeholder:text-slate-400 bg-white"
            />
            <button 
              type="submit" 
              disabled={isSubjectActionLoading || !newSubjectName.trim()}
              className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors shrink-0 shadow-sm"
              title="Add Subject"
            >
              <Plus size={18} />
            </button>
          </form>

          {/* Subjects List with Edit & Delete */}
          <div className="space-y-2">
            {subjects.map(sub => {
              const isEditing = editingSubjectId === sub.id;
              const isActive = activeSubject === sub.id;

              if (isEditing) {
                return (
                  <form 
                    key={sub.id}
                    onSubmit={(e) => handleSaveEdit(e, sub.id)}
                    className="flex items-center gap-1.5 p-1.5 bg-white rounded-xl border-2 border-blue-500 shadow-md animate-in fade-in duration-150"
                  >
                    <input 
                      type="text"
                      value={editingSubjectName}
                      onChange={(e) => setEditingSubjectName(e.target.value)}
                      className="flex-1 min-w-0 px-2 py-1 text-sm bg-transparent outline-none font-semibold text-slate-900"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isSubjectActionLoading}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors shrink-0"
                      title="Save (Enter)"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancelEdit()}
                      className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                      title="Cancel (Esc)"
                    >
                      <X size={16} />
                    </button>
                  </form>
                );
              }

              return (
                <div
                  key={sub.id}
                  onClick={() => setActiveSubject(sub.id)}
                  className={`group w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700 shadow-sm border-blue-200' 
                      : 'text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-200/60'
                  }`}
                >
                  <span className="truncate pr-2 font-medium">
                    {sub.name}
                  </span>

                  <div className="flex items-center gap-0.5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleStartEdit(e, sub)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100/50 rounded-lg transition-colors"
                      title="Rename Subject"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSubject(e, sub.id, sub.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100/50 rounded-lg transition-colors"
                      title="Delete Subject"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}

            {subjects.length === 0 && (
              <p className="text-sm text-slate-400 italic text-center py-4">No subjects yet.</p>
            )}
          </div>
        </div>

        {/* Right Col: Materials Upload & Preview */}
        <div className="lg:col-span-3">
          {activeSubjectData ? (
            <div className="glass rounded-3xl p-6 md:p-8 border border-slate-200/50 min-h-[500px]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-slate-100 gap-4">
                
                {/* Subject Title & Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {editingSubjectId === activeSubjectData.id ? (
                    <form 
                      onSubmit={(e) => handleSaveEdit(e, activeSubjectData.id)}
                      className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-blue-400 shadow-sm"
                    >
                      <input 
                        type="text"
                        value={editingSubjectName}
                        onChange={(e) => setEditingSubjectName(e.target.value)}
                        className="text-lg md:text-xl font-bold text-slate-900 outline-none"
                        autoFocus
                      />
                      <button type="submit" className="text-emerald-600 hover:bg-emerald-50 p-1 rounded-md">
                        <Check size={18} />
                      </button>
                      <button type="button" onClick={() => handleCancelEdit()} className="text-slate-400 hover:bg-slate-100 p-1 rounded-md">
                        <X size={18} />
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-slate-900">
                        {activeSubjectData.name} Resources
                      </h2>
                      <button
                        onClick={(e) => handleStartEdit(e, activeSubjectData)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Rename Subject"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSubject(e, activeSubjectData.id, activeSubjectData.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Subject"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    previewMode 
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {previewMode ? 'Exit Preview' : 'Preview as Student'}
                </button>
              </div>

              {!previewMode && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {(["SYLLABUS", "NOTES", "PRACTICAL", "PDF"] as MaterialCategory[]).map(cat => (
                  <div key={cat} className="p-5 border border-slate-200 border-dashed rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors relative group">
                    <h3 className="font-bold text-slate-700 mb-2 capitalize flex items-center gap-2">
                      <LinkIcon size={16} className="text-blue-500" /> {cat.toLowerCase()}
                    </h3>
                    
                    <div className="space-y-3 mt-4">
                      <input 
                        type="text" 
                        placeholder={`${cat} title...`}
                        value={nameInput[cat] || ""}
                        onChange={(e) => setNameInput(prev => ({ ...prev, [cat]: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-900 bg-white"
                      />
                      <div className="flex gap-2">
                        <input 
                          type="url" 
                          placeholder="Paste Google Drive/Web link..."
                          value={linkInput[cat] || ""}
                          onChange={(e) => setLinkInput(prev => ({ ...prev, [cat]: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-900 bg-white"
                        />
                        <button 
                          onClick={() => handleAddLink(cat)}
                          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors shrink-0"
                          title="Save Link"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}

              <div>
                <h3 className="font-bold text-slate-900 mb-4 text-lg">
                  {previewMode ? 'Student View (How it looks)' : 'Manage Links'}
                </h3>
                <div className="space-y-3">
                  {subjectMaterials.length === 0 ? (
                    <p className="text-slate-500 text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No materials added for this subject yet.
                    </p>
                  ) : previewMode ? (
                    // Student View Rendering (Categorized)
                    <div className="space-y-6">
                      {(["SYLLABUS", "NOTES", "PRACTICAL", "PDF"] as const).map(category => {
                        const categoryMaterials = subjectMaterials.filter(m => m.category === category);
                        if (categoryMaterials.length === 0) return null;
                        
                        return (
                          <div key={category} className="space-y-3">
                            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-xs border-b border-slate-100 pb-1">
                              {category}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {categoryMaterials.map(mat => (
                                <div key={mat.id} className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                      <FileText size={18} />
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-slate-900 text-sm line-clamp-1" title={mat.fileName}>{mat.fileName}</h4>
                                    </div>
                                  </div>
                                  <a 
                                    href={mat.fileUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-sm shrink-0"
                                  >
                                    Open Link
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Admin Management Rendering
                    subjectMaterials.map(mat => (
                      <div key={mat.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <FileText size={20} />
                          </div>
                          <div>
                            <a href={mat.fileUrl} target="_blank" rel="noreferrer" className="font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                              {mat.fileName}
                            </a>
                            <span className="block text-xs font-bold text-slate-400 mt-0.5">{mat.category}</span>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteMaterial(mat.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete Link">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="glass rounded-3xl p-12 text-center border border-slate-200/50 flex flex-col items-center justify-center h-full min-h-[400px]">
              <Folder size={48} className="text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Subject Selected</h3>
              <p className="text-slate-500">Create or select a subject from the left sidebar to manage its resources.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
