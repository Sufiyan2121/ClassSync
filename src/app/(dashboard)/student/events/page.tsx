"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useEventMedia } from "@/hooks/useEventMedia";
import { EventMediaCategory } from "@/types";
import Link from "next/link";
import { 
  ArrowLeft, 
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  Calendar, 
  FolderHeart,
  Video,
  Image as ImageIcon,
  Sparkles,
  Pin,
  FolderOpen
} from "lucide-react";
import toast from "react-hot-toast";

export default function StudentEventsMediaPage() {
  const { userData } = useAuth();
  const { events, loading } = useEventMedia();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<EventMediaCategory | "ALL">("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "FUNCTION":
        return "bg-teal-100 text-teal-850 border-teal-200/80";
      case "SPORTS":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "FAREWELL":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "TRIP":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "SEMINAR":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "CELEBRATION":
        return "bg-pink-100 text-pink-700 border-pink-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const studentClass = userData?.enrolledClassCode?.toUpperCase();

  // Filter events by student's class and search
  const filteredEvents = events.filter((e) => {
    const matchesSearch = 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "ALL" || e.category === selectedCategory;
    const matchesClass = !studentClass || e.classCode === "ALL" || e.classCode?.toUpperCase() === studentClass;
    return matchesSearch && matchesCategory && matchesClass;
  });

  const masterDrive = events.find((e) => e.isMasterDrive && (!studentClass || e.classCode === "ALL" || e.classCode?.toUpperCase() === studentClass));

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-5xl mx-auto min-h-screen w-full overflow-x-hidden">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 mb-5 glass px-4 py-3 sm:px-6 sm:py-4 rounded-3xl shadow-xs border border-slate-200/50">
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
          <Link href="/student" className="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0">
            <ArrowLeft size={22} className="text-slate-600" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xl shrink-0">📸</span>
              <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate">
                Events & Media Gallery
              </h1>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm font-medium truncate">
              Access Google Drive photo & video albums for all college events & functions
            </p>
          </div>
        </div>
      </header>

      {/* MASTER DRIVE HIGHLIGHT */}
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
      <div className="glass rounded-2xl p-3.5 sm:p-4 border border-stone-200/70 shadow-xs mb-5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <p className="text-xs font-bold text-stone-700">
            Browse Event Albums & Drives ({filteredEvents.length})
          </p>

          {/* Search bar */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event, function..."
              className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
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
                  ? "bg-stone-900 text-white shadow-xs"
                  : "bg-stone-100 hover:bg-stone-200/80 text-stone-600"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs animate-pulse">
          Loading event drives...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 glass rounded-3xl border border-slate-200/50">
          <FolderHeart size={44} className="text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-700 text-sm">No events or media drives found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {searchQuery || selectedCategory !== "ALL"
              ? "No drives match your search."
              : "Event photos and videos shared by your teacher will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          {filteredEvents.map((item) => (
            <div
              key={item.id}
              className="glass bg-white/85 hover:bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/70 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="min-w-0">
                {/* Category & Pin */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                  {item.isMasterDrive && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                      📌 Pinned
                    </span>
                  )}
                </div>

                {/* Title & Date */}
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug mb-1 truncate" title={item.title}>
                  {item.title}
                </h3>
                {item.eventDate && (
                  <p className="text-[11px] sm:text-xs text-slate-500 font-semibold mb-2 flex items-center gap-1">
                    <Calendar size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{item.eventDate}</span>
                  </p>
                )}
                {item.description && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-3 break-words">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleCopyLink(item.driveUrl, item.id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 py-1.5 px-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                >
                  {copiedId === item.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{copiedId === item.id ? "Copied" : "Copy"}</span>
                </button>

                <a
                  href={item.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0"
                >
                  <span>Open Drive</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
