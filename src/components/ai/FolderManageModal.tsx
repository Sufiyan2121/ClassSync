"use client";

import { useState, useEffect } from "react";
import { X, Folder, Palette, Check } from "lucide-react";
import { ChatFolder, createFolder, renameFolder } from "@/lib/ai/chatStorage";
import toast from "react-hot-toast";

interface FolderManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderToEdit?: ChatFolder | null;
  onSaved?: () => void;
}

const FOLDER_COLORS = [
  { id: "emerald", label: "Emerald", bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500" },
  { id: "teal", label: "Teal", bg: "bg-teal-500", text: "text-teal-400", border: "border-teal-500" },
  { id: "blue", label: "Blue", bg: "bg-sky-500", text: "text-sky-400", border: "border-sky-500" },
  { id: "purple", label: "Purple", bg: "bg-purple-500", text: "text-purple-400", border: "border-purple-500" },
  { id: "amber", label: "Amber", bg: "bg-amber-500", text: "text-amber-400", border: "border-amber-500" },
  { id: "rose", label: "Rose", bg: "bg-rose-500", text: "text-rose-400", border: "border-rose-500" },
];

export function FolderManageModal({ isOpen, onClose, folderToEdit, onSaved }: FolderManageModalProps) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("emerald");

  useEffect(() => {
    if (isOpen) {
      if (folderToEdit) {
        setName(folderToEdit.name);
        setSelectedColor(folderToEdit.color || "emerald");
      } else {
        setName("");
        setSelectedColor("emerald");
      }
    }
  }, [isOpen, folderToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      toast.error("Please enter a folder name.");
      return;
    }

    if (folderToEdit) {
      renameFolder(folderToEdit.id, cleanName, selectedColor);
      toast.success("Folder updated");
    } else {
      createFolder(cleanName, selectedColor);
      toast.success(`Folder "${cleanName}" created!`);
    }

    if (onSaved) onSaved();
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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Folder size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                {folderToEdit ? "Edit Folder" : "New Chat Folder"}
              </h3>
              <p className="text-[10px] text-stone-400">Organize your academic conversations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-[#16231b] transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-300">
              Folder Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MCA Studies, Exams, Assignments"
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#16231b] border border-[#243a2c] text-xs font-semibold text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-300">
              <Palette size={13} className="text-emerald-400" />
              <span>Folder Color</span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              {FOLDER_COLORS.map((col) => {
                const isSelected = selectedColor === col.id;
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setSelectedColor(col.id)}
                    className={`w-7 h-7 rounded-xl ${col.bg} flex items-center justify-center transition-transform cursor-pointer ${
                      isSelected ? "scale-110 ring-2 ring-white shadow-md" : "opacity-70 hover:opacity-100"
                    }`}
                    title={col.label}
                  >
                    {isSelected && <Check size={13} className="text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1e3025]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-stone-400 hover:text-white hover:bg-[#16231b] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950 transition cursor-pointer"
            >
              {folderToEdit ? "Save Changes" : "Create Folder"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
