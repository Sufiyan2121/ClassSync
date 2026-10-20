"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, ChevronDown, Check, RefreshCw, Cpu, Layers } from "lucide-react";
import { getAiConfig, setAiConfig, getCachedModels } from "@/lib/ai/byokStorage";
import { getAvailableModels, DEFAULT_CANDIDATE_MODELS } from "@/lib/ai/geminiClient";
import toast from "react-hot-toast";

interface ModelSwitcherDropdownProps {
  onModelChanged?: (newModel: string) => void;
  className?: string;
}

export function ModelSwitcherDropdown({ onModelChanged, className = "" }: ModelSwitcherDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState("gemini-2.0-flash");
  const [availableModels, setAvailableModels] = useState<string[]>(DEFAULT_CANDIDATE_MODELS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const syncConfig = () => {
    const config = getAiConfig();
    setCurrentModel(config.model || "gemini-2.0-flash");
    const cached = getCachedModels();
    if (cached.length > 0) {
      setAvailableModels(cached);
    } else if (config.availableModels && config.availableModels.length > 0) {
      setAvailableModels(config.availableModels);
    }
  };

  useEffect(() => {
    syncConfig();
    const handleKeyChange = () => syncConfig();
    window.addEventListener("classsync_byok_changed", handleKeyChange);
    return () => window.removeEventListener("classsync_byok_changed", handleKeyChange);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectModel = (model: string) => {
    setCurrentModel(model);
    setAiConfig({ model });
    setIsOpen(false);
    toast.success(`Switched to ${model}`);
    if (onModelChanged) onModelChanged(model);
  };

  const handleRefreshModels = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const config = getAiConfig();
    if (!config.apiKey) {
      toast.error("Please connect an API key first to check available models.");
      return;
    }
    setIsRefreshing(true);
    try {
      const { models } = await getAvailableModels(config.apiKey);
      if (models.length > 0) {
        setAvailableModels(models);
        setAiConfig({ availableModels: models });
        toast.success(`Found ${models.length} active models for your key!`);
      } else {
        toast("Checked models: using standard verified pool.", { icon: "ℹ️" });
      }
    } catch {
      toast.error("Failed to refresh models.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatModelLabel = (m: string) => {
    if (m === "gemini-2.0-flash") return "Gemini 2.0 Flash (Fastest)";
    if (m === "gemini-2.0-flash-exp") return "Gemini 2.0 Flash Exp";
    if (m === "gemini-1.5-flash") return "Gemini 1.5 Flash";
    if (m === "gemini-1.5-flash-latest") return "Gemini 1.5 Flash Latest";
    if (m === "gemini-1.5-pro") return "Gemini 1.5 Pro (Reasoning)";
    if (m === "gemini-1.5-pro-latest") return "Gemini 1.5 Pro Latest";
    return m;
  };

  return (
    <div ref={dropdownRef} className={`relative z-20 ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#121c16] hover:bg-[#18261e] border border-[#1e3025] hover:border-emerald-600/50 text-xs font-semibold text-stone-200 transition-all cursor-pointer shadow-xs group"
        title="Switch AI Model"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[11px] font-bold text-emerald-400 truncate max-w-[140px] sm:max-w-none">
          {currentModel}
        </span>
        <ChevronDown size={12} className={`text-stone-400 group-hover:text-white transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 sm:w-72 rounded-2xl bg-[#101a14]/98 backdrop-blur-xl border border-[#1e3025] shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-150 text-stone-100">
          
          <div className="flex items-center justify-between px-2 py-1.5 mb-1 border-b border-[#1e3025] text-[10px] font-black uppercase tracking-wider text-stone-400">
            <span className="flex items-center gap-1">
              <Layers size={11} className="text-emerald-500" />
              Available Models ({availableModels.length})
            </span>
            <button
              type="button"
              onClick={handleRefreshModels}
              disabled={isRefreshing}
              className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold transition cursor-pointer disabled:opacity-50"
              title="Query Google ModelService for updated list"
            >
              <RefreshCw size={10} className={isRefreshing ? "animate-spin" : ""} />
              <span>{isRefreshing ? "Checking..." : "Refresh"}</span>
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1">
            {availableModels.map((mod) => {
              const isSelected = mod === currentModel;
              return (
                <div
                  key={mod}
                  onClick={() => handleSelectModel(mod)}
                  className={`flex items-center justify-between gap-2 p-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isSelected 
                      ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800/80" 
                      : "text-stone-300 hover:bg-[#16231b] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Cpu size={13} className={isSelected ? "text-emerald-400 shrink-0" : "text-stone-500 shrink-0"} />
                    <span className="truncate">{formatModelLabel(mod)}</span>
                  </div>
                  {isSelected && <Check size={14} className="text-emerald-400 shrink-0" />}
                </div>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-[#1e3025] px-1 text-[10px] text-stone-500">
            <span>Tip: If one model is busy, ClassSync auto-switches to the next available one.</span>
          </div>

        </div>
      )}
    </div>
  );
}
