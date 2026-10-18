"use client";

import { Post } from "@/types";
import { format, formatDistanceToNow } from "date-fns";
import { Edit2, Trash2, Calendar, Clock, Bell, BookOpen, AlertCircle } from "lucide-react";

interface PostCardProps {
  post: Post;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
}

export function PostCard({ post, onEdit, onDelete }: PostCardProps) {
  const isUrgent = 
    (post.type === "ASSIGNMENT" || post.type === "EXAM") && 
    post.dueDate && 
    post.dueDate.toDate().getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

  const getIcon = () => {
    switch (post.type) {
      case "ASSIGNMENT": return <BookOpen size={22} className="text-amber-600 dark:text-amber-400" />;
      case "EXAM": return <AlertCircle size={22} className="text-rose-600 dark:text-rose-400" />;
      case "ANNOUNCEMENT": return <Bell size={22} className="text-emerald-700 dark:text-emerald-400" />;
    }
  };

  const getBadgeColor = () => {
    switch (post.type) {
      case "ASSIGNMENT": return "bg-amber-50/90 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/25 dark:ring-amber-800/40";
      case "EXAM": return "bg-rose-50/90 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 ring-1 ring-rose-500/25 dark:ring-rose-800/40";
      case "ANNOUNCEMENT": return "bg-emerald-50/90 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-600/25 dark:ring-emerald-800/40";
    }
  };

  const getIconBgColor = () => {
    switch (post.type) {
      case "ASSIGNMENT": return "bg-amber-50 dark:bg-amber-950/60 border-white dark:border-amber-800/40";
      case "EXAM": return "bg-rose-50 dark:bg-rose-950/60 border-white dark:border-rose-800/40";
      case "ANNOUNCEMENT": return "bg-emerald-50 dark:bg-emerald-950/60 border-white dark:border-emerald-800/40";
    }
  };

  return (
    <div className={`group relative bg-white/80 dark:bg-[#121c16]/90 backdrop-blur-md rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-4 sm:p-6 overflow-hidden ${isUrgent ? 'ring-2 ring-amber-400/50 shadow-amber-100 dark:shadow-none' : 'border border-stone-200/80 dark:border-[#1e3025] hover:border-emerald-300 dark:hover:border-emerald-700'}`}>
      
      {/* Decorative gradient blur behind the card */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:from-emerald-50/60 dark:group-hover:from-emerald-950/30 group-hover:to-teal-50/60 dark:group-hover:to-teal-950/30 rounded-2xl z-[-1] opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>

      <div className="flex justify-between items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <div className={`p-2.5 sm:p-3 rounded-xl shadow-sm border ${getIconBgColor()} group-hover:scale-110 transition-transform duration-300 shrink-0`}>
            {getIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-stone-900 dark:text-white text-sm sm:text-lg leading-tight group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors truncate">{post.title}</h3>
            <span className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 flex items-center gap-1.5 mt-1 font-medium">
              <Clock size={13} className="text-stone-400 shrink-0" />
              <span className="truncate">
                {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
              </span>
            </span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
          <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-1 sm:px-3 sm:py-1.5 rounded-full uppercase tracking-widest shadow-sm whitespace-nowrap ${getBadgeColor()}`}>
            {post.type}
          </span>
        </div>
      </div>

      <p className="text-stone-600 dark:text-stone-300 text-xs sm:text-[15px] whitespace-pre-wrap mt-3 sm:mt-5 leading-relaxed break-words [overflow-wrap:anywhere]">
        {post.description}
      </p>

      {post.dueDate && (
        <div className={`mt-4 sm:mt-6 pt-3 sm:pt-5 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 text-xs sm:text-sm rounded-b-xl ${isUrgent ? 'text-orange-600 dark:text-orange-400 font-bold bg-orange-50/30 dark:bg-orange-950/30 -mx-4 px-4 sm:-mx-6 sm:px-6 -mb-4 pb-4 sm:-mb-6 sm:pb-6' : 'text-stone-500 dark:text-stone-400 font-medium bg-stone-50/50 dark:bg-[#0c140f] -mx-4 px-4 sm:-mx-6 sm:px-6 -mb-4 pb-4 sm:-mb-6 sm:pb-6'}`}>
          <span className="flex items-center gap-2">
            <Calendar size={16} className={isUrgent ? "text-orange-500 dark:text-orange-400" : "text-stone-400"} />
            Due: {format(post.dueDate.toDate(), "MMM d, h:mm a")}
          </span>
          {isUrgent && (
            <span className="flex items-center gap-1.5 bg-orange-100 dark:bg-orange-950/60 px-2.5 py-0.5 rounded-full text-orange-700 dark:text-orange-300 animate-pulse text-[11px] uppercase tracking-wider shrink-0 border border-orange-200/60 dark:border-orange-800/40">
              <AlertCircle size={13} />
              Action Required
            </span>
          )}
        </div>
      )}

      {/* Admin Actions Footer */}
      {(onEdit || onDelete) && (
        <div className="mt-6 pt-5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-3">
          {onEdit && (
            <button onClick={() => onEdit(post)} className="flex items-center gap-2 px-4 py-2 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-[#1a2b20] hover:border-emerald-200 dark:hover:border-emerald-800 rounded-xl transition-all font-bold text-sm border border-stone-200 dark:border-stone-700 shadow-xs hover:shadow">
              <Edit2 size={16} />
              <span>Edit Post</span>
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(post.id)} className="flex items-center gap-2 px-4 py-2 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all font-bold text-sm border border-stone-200 dark:border-stone-700 shadow-sm hover:shadow">
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
