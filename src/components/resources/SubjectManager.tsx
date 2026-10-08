"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { useAuth } from "@/components/providers/AuthProvider";
import { Subject, Material, MaterialCategory } from "@/types";
import toast from "react-hot-toast";
import { Folder, Link as LinkIcon, FileText, Trash2, ChevronDown, Plus, X } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function AdminResources() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  // Form states
  const [newSubjectName, setNewSubjectName] = useState("");
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
      if (subs.length > 0 && !activeSubject) {
        setActiveSubject(subs[0].id);
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

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim() || !user) return;
    try {
      await addDoc(collection(db, "subjects"), {
        name: newSubjectName.trim(),
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
      setNewSubjectName("");
      toast.success("Subject added!");
    } catch (err: any) {
      toast.error(err.message);
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
      // Basic URL validation
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
            <p className="text-slate-500 text-sm font-medium">Organize syllabus, notes, and PDFs</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Col: Subjects list */}
        <div className="lg:col-span-1 glass rounded-3xl p-6 h-fit border border-slate-200/50">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Folder size={18} className="text-blue-500"/> Subjects
          </h2>
          
          <form onSubmit={handleCreateSubject} className="mb-6 flex gap-2">
            <input 
              type="text" 
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
              placeholder="New Subject..." 
              className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button type="submit" className="bg-slate-900 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors">
              <Plus size={18} />
            </button>
          </form>

          <div className="space-y-2">
            {subjects.map(sub => (
              <button
                key={sub.id}
                onClick={() => setActiveSubject(sub.id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeSubject === sub.id ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}
              >
                {sub.name}
              </button>
            ))}
            {subjects.length === 0 && <p className="text-sm text-slate-400 italic">No subjects yet.</p>}
          </div>
        </div>

        {/* Right Col: Materials Upload & Preview */}
        <div className="lg:col-span-3">
          {activeSubjectData ? (
            <div className="glass rounded-3xl p-6 md:p-8 border border-slate-200/50 min-h-[500px]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-slate-100 gap-4">
                <h2 className="text-2xl font-bold text-slate-900">
                  {activeSubjectData.name} Resources
                </h2>
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
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <div className="flex gap-2">
                        <input 
                          type="url" 
                          placeholder="Paste Google Drive/Web link..."
                          value={linkInput[cat] || ""}
                          onChange={(e) => setLinkInput(prev => ({ ...prev, [cat]: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button 
                          onClick={() => handleAddLink(cat)}
                          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors shrink-0"
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
