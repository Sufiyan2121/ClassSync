"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useEventMedia } from "@/hooks/useEventMedia";
import { useClassConfig } from "@/hooks/useClassConfig";
import { EventMedia, EventMediaCategory } from "@/types";
import Link from "next/link";
import { createPortal } from "react-dom";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Trash2, 
  Pencil, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  Calendar, 
  FolderHeart,
  Video,
  Image as ImageIcon,
  Sparkles,
  Pin,
  FolderOpen
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminEventsMediaPage() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const { 
    events, 
    loading: eventsLoading, 
    addEventMedia, 
    updateEventMedia, 
    deleteEventMedia 
  } = useEventMedia();
  const { classes, classConfig } = useClassConfig();

  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventMedia | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [category, setCategory] = useState<EventMediaCategory>("FUNCTION");
  const [classCode, setClassCode] = useState("ALL");
  const [isMasterDrive, setIsMasterDrive] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<EventMediaCategory | "ALL">("ALL");
  const [selectedClassFilter, setSelectedClassFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && userData?.role === "STUDENT") {
      router.push("/student/events");
    }
  }, [userData, authLoading, router]);

  // Lock body scroll on modal open
  useEffect(() => {
    if (isModalOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isModalOpen]);

  const openAddModal = () => {
    setEditingEvent(null);
    setTitle("");
    setDriveUrl("");
    setDescription("");
    setEventDate("");
    setCategory("FUNCTION");
    setClassCode(classConfig.classCode || "ALL");
    setIsMasterDrive(false);
    setIsModalOpen(true);
  };

  const openEditModal = (item: EventMedia) => {
    setEditingEvent(item);
    setTitle(item.title);
    setDriveUrl(item.driveUrl);
    setDescription(item.description || "");
    setEventDate(item.eventDate || "");
    setCategory(item.category || "FUNCTION");
    setClassCode(item.classCode || "ALL");
    setIsMasterDrive(!!item.isMasterDrive);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !driveUrl.trim()) {
      toast.error("Please provide an event title and Google Drive link.");
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingEvent) {
        await updateEventMedia(editingEvent.id, {
          title,
          driveUrl,
          description,
          eventDate,
          category,
          classCode,
          isMasterDrive,
        });
        toast.success(`Event drive "${title}" updated!`);
      } else {
        await addEventMedia({
          title,
          driveUrl,
          description,
          eventDate,
          category,
          classCode,
          isMasterDrive,
        });
        toast.success(`Event drive "${title}" added! 📸`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error("Failed to save: " + err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (item: EventMedia) => {
    if (!window.confirm(`Are you sure you want to delete "${item.title}"?`)) return;
    try {
      await deleteEventMedia(item.id);
      toast.success(`Removed "${item.title}"`);
    } catch (err: any) {
      toast.error("Failed to delete: " + err.message);
    }
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Google Drive link copied to clipboard! 📋");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categories: { label: string; value: EventMediaCategory | "ALL" }[] = [
    { label: "All Events", value: "ALL" },
    { label: "Functions", value: "FUNCTION" },
    { label: "Fests", value: "FEST" },
    { label: "Sports", value: "SPORTS" },
    { label: "Farewells", value: "FAREWELL" },
    { label: "Trips / Picnics", value: "TRIP" },
    { label: "Seminars", value: "SEMINAR" },
    { label: "Celebrations", value: "CELEBRATION" },
    { label: "Other", value: "OTHER" },
  ];

  const getCategoryColor = (cat: EventMediaCategory) => {
    switch (cat) {
      case "FEST":
        return "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60";
      case "FUNCTION":
        return "bg-teal-100 dark:bg-teal-950/60 text-teal-850 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/60";
      case "SPORTS":
        return "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60";
      case "FAREWELL":
        return "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60";
      case "TRIP":
        return "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60";
      case "SEMINAR":
        return "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60";
      case "CELEBRATION":
        return "bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800/60";
      default:
        return "bg-stone-100 dark:bg-[#16231b] text-stone-700 dark:text-stone-300 border-stone-200 dark:border-[#1e3025]";
    }
  };

  // Filter events
  const filteredEvents = events.filter((e) => {
    const matchesSearch = 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "ALL" || e.category === selectedCategory;
    const matchesClass = selectedClassFilter === "ALL" || e.classCode === selectedClassFilter || e.classCode === "ALL";
    return matchesSearch && matchesCategory && matchesClass;
  });

  const masterDrive = events.find((e) => e.isMasterDrive);

  if (authLoading || eventsLoading) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen">
        <div className="animate-pulse space-y-6">
          <div className="h-20 bg-stone-200/60 dark:bg-[#121c16] rounded-3xl"></div>
          <div className="h-32 bg-stone-200/60 dark:bg-[#121c16] rounded-3xl"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-44 bg-stone-200/60 dark:bg-[#121c16] rounded-2xl"></div>
            <div className="h-44 bg-stone-200/60 dark:bg-[#121c16] rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-5xl mx-auto min-h-screen w-full overflow-x-hidden">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 mb-5 glass px-4 py-3 sm:px-6 sm:py-4 rounded-3xl shadow-xs border border-stone-200/80 dark:border-[#1e3025] dark:bg-[#121c16]/90">
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
          <Link href="/admin" className="p-2 hover:bg-stone-100 dark:hover:bg-[#16231b] text-stone-600 dark:text-stone-300 rounded-full transition-colors shrink-0">
            <ArrowLeft size={22} />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xl shrink-0">📸</span>
              <h1 className="text-lg sm:text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight truncate">
                Events & Media Gallery
              </h1>
            </div>
            <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm font-medium truncate">
              Share Google Drive folders for college functions, fests, sports & memories
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-stone-900 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer w-full sm:w-auto shrink-0"
        >
          <Plus size={15} />
          <span>Add Event Drive</span>
        </button>
      </header>

      {/* PINNED MASTER DRIVE BANNER (If designated) */}
      {masterDrive && (
        <div className="mb-5 rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-700 p-4 sm:p-6 text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl sm:text-3xl shadow-inner shrink-0">
                📁
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-white/25 px-2.5 py-0.5 rounded-full mb-1">
                  <Pin size={11} /> Master Class Drive
                </span>
                <h2 className="text-base sm:text-2xl font-black truncate">
                  {masterDrive.title}
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100 mt-0.5 font-medium line-clamp-1">
                  {masterDrive.description || "The primary Google Drive folder containing all class photos, videos, and function media."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={() => handleCopyLink(masterDrive.driveUrl, masterDrive.id)}
                className="flex-1 sm:flex-none px-3 sm:px-3.5 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer backdrop-blur-sm"
                title="Copy Link"
              >
                {copiedId === masterDrive.id ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedId === masterDrive.id ? "Copied" : "Copy Link"}</span>
              </button>

              <a
                href={masterDrive.driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-3.5 sm:px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Open Drive</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Category Pills & Search */}
      <div className="glass rounded-2xl p-4 border border-stone-200/70 dark:border-[#1e3025] dark:bg-[#121c16]/90 shadow-xs mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          
          {/* Class Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400">Class:</span>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="bg-stone-50 dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] text-stone-800 dark:text-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer"
            >
              <option value="ALL">All Classes</option>
              {classes.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event, function..."
              className="w-full pl-9 pr-3 py-1.5 bg-stone-50 dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] rounded-xl text-xs font-medium text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none placeholder:text-stone-400"
            />
          </div>
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.value
                  ? "bg-stone-900 text-white dark:bg-emerald-700 dark:text-white shadow-xs"
                  : "bg-stone-100 hover:bg-stone-200/80 dark:bg-[#16231b] dark:hover:bg-[#1e3025] text-stone-600 dark:text-stone-300 border border-transparent dark:border-[#1e3025]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event Drives Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-16 glass rounded-3xl border border-stone-200/70 dark:border-[#1e3025] dark:bg-[#121c16]/90">
          <FolderHeart size={44} className="text-stone-300 dark:text-stone-600 mx-auto mb-2" />
          <p className="font-bold text-stone-700 dark:text-stone-200 text-sm">No event media drives found</p>
          <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
            {searchQuery || selectedCategory !== "ALL"
              ? "No drives match your filters."
              : "Click \"Add Event Drive\" above to share your first Google Drive folder link."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          {filteredEvents.map((item) => (
            <div
              key={item.id}
              className="glass bg-white/85 hover:bg-white dark:bg-[#121c16]/90 dark:hover:bg-[#16231b] rounded-3xl p-4 sm:p-5 border border-stone-200/70 dark:border-[#1e3025] shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="min-w-0">
                {/* Card Top: Category Badge, Class Code, Pin */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>
                    <span className="text-[10px] font-bold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-[#16231b] px-2 py-0.5 rounded-full border border-stone-200/60 dark:border-[#1e3025]">
                      {item.classCode}
                    </span>
                    {item.isMasterDrive && (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                        📌 Pinned
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#16231b] rounded-lg transition-colors cursor-pointer"
                      title="Edit Event"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1.5 text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Delete Event"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-white leading-snug mb-1 truncate" title={item.title}>
                  {item.title}
                </h3>
                {item.eventDate && (
                  <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 font-semibold mb-2 flex items-center gap-1">
                    <Calendar size={12} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">{item.eventDate}</span>
                  </p>
                )}
                {item.description && (
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-2 mb-3 break-words">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-100 dark:border-[#1e3025] flex items-center justify-between gap-2">
                <button
                  onClick={() => handleCopyLink(item.driveUrl, item.id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white py-1.5 px-2 rounded-xl hover:bg-stone-100 dark:hover:bg-[#121c16] transition-colors cursor-pointer shrink-0"
                >
                  {copiedId === item.id ? <Check size={13} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedId === item.id ? "Copied" : "Copy"}</span>
                </button>

                <a
                  href={item.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0"
                >
                  <span>Open Drive</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Event Drive Modal (Portaled for safe cross-platform rendering) */}
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
          <div className="bg-white dark:bg-[#0c1610] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-stone-100 dark:border-[#1e3025] max-h-[85dvh] sm:max-h-[88vh] flex flex-col my-auto relative animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-stone-100 dark:border-[#1e3025] shrink-0 bg-stone-50/70 dark:bg-[#121c16]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-xs text-lg">
                  📸
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-stone-900 dark:text-white">
                    {editingEvent ? "Edit Event Drive" : "Add Event Google Drive"}
                  </h2>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                    Paste Google Drive folder link with photos & videos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#16231b] rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Event / Function Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Annual Cultural Fest 2026, Sports Day, Farewell"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-stone-900 dark:text-white placeholder:text-stone-400"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Google Drive Folder Link (URL) *
                </label>
                <input
                  type="url"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] rounded-xl text-xs font-medium font-mono outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-stone-900 dark:text-white placeholder:text-stone-400"
                  required
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Ensure the Drive folder link sharing is set to &quot;Anyone with the link can view&quot;.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EventMediaCategory)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-stone-900 dark:text-white cursor-pointer"
                  >
                    <option value="FUNCTION">Function</option>
                    <option value="FEST">College Fest</option>
                    <option value="SPORTS">Sports Event</option>
                    <option value="FAREWELL">Farewell</option>
                    <option value="TRIP">Trip / Picnic</option>
                    <option value="SEMINAR">Seminar / Workshop</option>
                    <option value="CELEBRATION">Celebration</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Class / Division</label>
                  <select
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-stone-900 dark:text-white cursor-pointer"
                  >
                    <option value="ALL">All Classes (General)</option>
                    {classes.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Event Date (Optional)</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Description / Highlights (Optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description of the event, venue, or organizers..."
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-[#16231b] border border-stone-200 dark:border-[#243a2c] rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-stone-900 dark:text-white placeholder:text-stone-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="masterDriveCheck"
                  checked={isMasterDrive}
                  onChange={(e) => setIsMasterDrive(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="masterDriveCheck" className="text-xs font-bold text-stone-700 dark:text-stone-300 cursor-pointer">
                  Pin as Master Class Drive (Highlighted at the top)
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {formSubmitting ? "Saving..." : editingEvent ? "Update Drive" : "Publish Event Drive 🚀"}
                </button>
              </div>
            </form>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
