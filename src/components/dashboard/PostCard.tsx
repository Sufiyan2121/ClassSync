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
      case "ASSIGNMENT": return <BookOpen size={22} className="text-orange-500" />;
      case "EXAM": return <AlertCircle size={22} className="text-red-500" />;
      case "ANNOUNCEMENT": return <Bell size={22} className="text-blue-500" />;
    }
  };

  const getBadgeColor = () => {
    switch (post.type) {
      case "ASSIGNMENT": return "bg-orange-50/80 text-orange-600 ring-1 ring-orange-500/20";
      case "EXAM": return "bg-red-50/80 text-red-600 ring-1 ring-red-500/20";
      case "ANNOUNCEMENT": return "bg-blue-50/80 text-blue-600 ring-1 ring-blue-500/20";
    }
  };

  const getIconBgColor = () => {
    switch (post.type) {
      case "ASSIGNMENT": return "bg-orange-50";
      case "EXAM": return "bg-red-50";
      case "ANNOUNCEMENT": return "bg-blue-50";
    }
  };

  return (
    <div className={`group relative bg-white/70 backdrop-blur-md rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-6 ${isUrgent ? 'ring-2 ring-orange-400/50 shadow-orange-100' : 'border border-slate-200 hover:border-blue-200'}`}>
      
      {/* Decorative gradient blur behind the card */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:from-blue-50/50 group-hover:to-indigo-50/50 rounded-2xl z-[-1] opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>

      <div className="flex justify-between items-start gap-2 sm:gap-3 mb-4">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <div className={`p-3 rounded-xl shadow-sm border border-white ${getIconBgColor()} group-hover:scale-110 transition-transform duration-300 shrink-0`}>
            {getIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-tight group-hover:text-blue-700 transition-colors truncate">{post.title}</h3>
            <span className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
              <Clock size={14} className="text-slate-400 shrink-0" />
              <span className="truncate">
                {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
              </span>
            </span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-1 bg-slate-50/80 rounded-lg p-0.5 border border-slate-100">
              {onEdit && (
                <button onClick={() => onEdit(post)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-md transition-all shadow-sm" title="Edit Post">
                  <Edit2 size={14} />
                </button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(post.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-md transition-all shadow-sm" title="Delete Post">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
          <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-1 sm:px-3 sm:py-1.5 rounded-full uppercase tracking-widest shadow-sm whitespace-nowrap ${getBadgeColor()}`}>
            {post.type}
          </span>
        </div>
      </div>

      <p className="text-slate-600 text-[15px] whitespace-pre-wrap mt-5 leading-relaxed">
        {post.description}
      </p>

      {post.dueDate && (
        <div className={`mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm rounded-b-xl ${isUrgent ? 'text-orange-600 font-bold bg-orange-50/30 -mx-6 px-6 -mb-6 pb-6' : 'text-slate-500 font-medium bg-slate-50/50 -mx-6 px-6 -mb-6 pb-6'}`}>
          <span className="flex items-center gap-2">
            <Calendar size={18} className={isUrgent ? "text-orange-500" : "text-slate-400"} />
            Due: {format(post.dueDate.toDate(), "MMM d, h:mm a")}
          </span>
          {isUrgent && (
            <span className="flex items-center gap-1.5 bg-orange-100 px-3 py-1 rounded-full text-orange-700 animate-pulse text-xs uppercase tracking-wider shrink-0">
              <AlertCircle size={14} />
              Action Required
            </span>
          )}
        </div>
      )}
    </div>
  );
}
