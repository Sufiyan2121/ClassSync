"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Key, 
  ShieldCheck, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkles,
  Trash2,
  RefreshCw
} from "lucide-react";
import { getAiConfig, setAiConfig, clearAiConfig } from "@/lib/ai/byokStorage";
import { testGeminiApiKey } from "@/lib/ai/geminiClient";
import toast from "react-hot-toast";

interface ByokSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function ByokSettingsModal({ isOpen, onClose, onSaved }: ByokSettingsModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const config = getAiConfig();
      setApiKey(config.apiKey || "");
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key first.");
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testGeminiApiKey(apiKey.trim());
      setTestResult(res);
      if (res.success) {
        if (res.detectedModel) {
          setAiConfig({ apiKey: apiKey.trim(), model: res.detectedModel });
        }
        toast.success(res.message || "API Key is working perfectly!");
      } else {
        toast.error(res.message);
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e?.message || "Connection failed." });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast.error("API Key cannot be blank.");
      return;
    }
    const current = getAiConfig();
    setAiConfig({ 
      apiKey: apiKey.trim(),
      model: current.model || "gemini-2.0-flash",
    });
    toast.success("AI Key saved securely on your device!");
    if (onSaved) onSaved();
    onClose();
  };

  const handleClear = () => {
    if (window.confirm("Disconnect and remove your API key from this device?")) {
      clearAiConfig();
      setApiKey("");
      setTestResult(null);
      toast.success("API Key removed.");
      if (onSaved) onSaved();
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setApiKey(text.trim());
        toast.success("Pasted from clipboard!");
      }
    } catch {
      toast.error("Clipboard permission denied. Please paste manually.");
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#101a14] border border-stone-200/80 dark:border-[#1e3025] shadow-2xl p-6 sm:p-7 overflow-hidden text-stone-900 dark:text-stone-100 animate-in zoom-in-95 duration-200"
        style={{
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-stone-100 dark:border-[#1e3025]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-900/30">
              <Key size={20} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight text-stone-900 dark:text-white flex items-center gap-2">
                <span>Bring Your Own Key (BYOK)</span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Private
                </span>
              </h3>
              <p className="text-xs text-stone-400">Connect Google Gemini directly to your ClassSync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#16231b] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Free Tier Info Box */}
        <div className="mt-5 p-4 rounded-2xl bg-emerald-50/70 dark:bg-[#142319] border border-emerald-200/70 dark:border-[#1f3727] space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
            <Sparkles size={15} className="text-emerald-500 shrink-0" />
            <span>100% Free with Google AI Studio (Zero Credit Card)</span>
          </div>
          <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80 leading-relaxed">
            Google provides up to <strong>15 requests/min</strong> and <strong>1,500 free queries/day</strong> at zero cost. Your key is stored encrypted only in your browser storage and is never uploaded to any shared database.
          </p>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-200 underline underline-offset-2 pt-1"
          >
            <span>Get your free Gemini Key from Google AI Studio</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Input Form */}
        <div className="mt-5 space-y-3">
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
            Paste Gemini API Key
          </label>
          <div className="relative flex items-center">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestResult(null);
              }}
              placeholder="AIzaSy..."
              className="w-full pl-3.5 pr-24 py-3 rounded-2xl bg-stone-50 dark:bg-[#16231b] border border-stone-200/80 dark:border-[#243a2c] text-xs sm:text-sm font-mono text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
            <div className="absolute right-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition cursor-pointer"
                title={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              {!apiKey && (
                <button
                  type="button"
                  onClick={handlePaste}
                  className="px-2 py-1 rounded-lg bg-stone-200/80 dark:bg-[#1e3025] hover:bg-stone-300 dark:hover:bg-[#284032] text-[10px] font-bold text-stone-700 dark:text-stone-200 transition cursor-pointer"
                >
                  Paste
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Test Result Feedback */}
        {testResult && (
          <div className={`mt-4 p-3 rounded-2xl border flex items-start gap-2.5 text-xs animate-in fade-in duration-200 ${
            testResult.success
              ? "bg-emerald-50 dark:bg-[#122217] border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-[#231518] border-rose-300 dark:border-rose-900/80 text-rose-800 dark:text-rose-300"
          }`}>
            {testResult.success ? (
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              <p className="font-bold">{testResult.success ? "Connection Verified!" : "Connection Failed"}</p>
              <p className="text-[11px] opacity-90 mt-0.5">{testResult.message}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-4 border-t border-stone-100 dark:border-[#1e3025]">
          <div>
            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Disconnect Key</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting || !apiKey.trim()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-[#16231b] dark:hover:bg-[#1e3025] text-stone-800 dark:text-stone-200 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={13} className={isTesting ? "animate-spin text-emerald-500" : ""} />
              <span>{isTesting ? "Testing..." : "Test Connection"}</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
            >
              <ShieldCheck size={14} />
              <span>Save & Connect</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
