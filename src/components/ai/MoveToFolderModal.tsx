"use client";

import { X, Folder, FolderPlus, Check } from "lucide-react";
import { ChatSession, ChatFolder, moveSessionToFolder } from "@/lib/ai/chatStorage";
import toast from "react-hot-toast";

interface MoveToFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ChatSession | null;
  folders: ChatFolder[];
  onOpenCreateFolder: () => void;
  onMoved?: () => void;
}

export function MoveToFolderModal({
  isOpen,
  onClose,
  session,
  folders,
  onOpenCreateFolder,
  onMoved,
}: MoveToFolderModalProps) {
  if (!isOpen || !session) return null;

  const handleSelectFolder = (folderId: string | null) => {
    moveSessionToFolder(session.id, folderId);
    toast.success(folderId ? "Chat moved to folder" : "Chat moved to Uncategorized");
    if (onMoved) onMoved();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-3xl bg-[#101a14] border border-[#1e3025] shadow-2xl p-5 text-stone-100 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1e3025]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Folder size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-white truncate">
                Move to Folder
              </h3>
              <p className="text-[10px] text-stone-400 truncate">
                "{session.title}"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-[#16231b] transition cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Folder List */}
        <div className="mt-3 space-y-1.5 max-h-60 overflow-y-auto">
          {/* Uncategorized Option */}
          <button
            type="button"
            onClick={() => handleSelectFolder(null)}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              !session.folderId 
                ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800/80" 
                : "text-stone-300 hover:bg-[#16231b] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">📄</span>
              <span>General (No Folder)</span>
            </div>
            {!session.folderId && <Check size={14} className="text-emerald-400" />}
          </button>

          {/* User Folders */}
          {folders.map((folder) => {
            const isSelected = session.folderId === folder.id;
            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => handleSelectFolder(folder.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isSelected 
                    ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800/80" 
                    : "text-stone-300 hover:bg-[#16231b] hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">📁</span>
                  <span className="truncate">{folder.name}</span>
                </div>
                {isSelected && <Check size={14} className="text-emerald-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Footer: Create Folder Button */}
        <div className="mt-4 pt-3 border-t border-[#1e3025] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCreateFolder();
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
          >
            <FolderPlus size={14} />
            <span>Create New Folder</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-stone-400 hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
