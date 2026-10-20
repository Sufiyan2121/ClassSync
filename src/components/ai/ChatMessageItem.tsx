"use client";

import { useState } from "react";
import { ChatMessage } from "@/lib/ai/chatStorage";
import { Sparkles, User, Copy, Check, Terminal, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

interface ChatMessageItemProps {
  message: ChatMessage;
  userPhoto?: string;
  userName?: string;
  isStreaming?: boolean;
}

export function ChatMessageItem({ message, userPhoto, userName, isStreaming }: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 sm:gap-4 py-4 px-3 sm:px-5 rounded-2xl sm:rounded-3xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
      isUser 
        ? "bg-stone-50/80 dark:bg-[#121c16]/80 border border-stone-200/60 dark:border-[#1e3025] shadow-xs" 
        : "bg-white/90 dark:bg-[#101a14]/95 border border-emerald-500/20 shadow-md shadow-emerald-950/20"
    }`}>
      {/* Avatar */}
      <div className="shrink-0 pt-0.5">
        {isUser ? (
          userPhoto ? (
            <img 
              src={userPhoto} 
              alt={userName || "User"} 
              className="w-8 h-8 rounded-xl object-cover ring-1 ring-stone-200 dark:ring-stone-700 shadow-xs" 
            />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-stone-200 dark:bg-[#1a2c20] text-stone-700 dark:text-stone-300 flex items-center justify-center font-bold text-xs shadow-xs">
              {userName ? userName.charAt(0).toUpperCase() : <User size={15} />}
            </div>
          )
        ) : (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-900/30">
            <Sparkles size={16} />
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-extrabold text-stone-900 dark:text-stone-200">
            {isUser ? (userName || "You") : "ClassSync AI"}
          </span>
          {!isUser && message.content && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-lg transition cursor-pointer"
              title="Copy message"
            >
              {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          )}
        </div>

        {/* Content Body with Markdown formatting */}
        <div className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed font-normal whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
          {formatMessageContent(message.content)}
          {isStreaming && (
            <span className="inline-flex items-center gap-1 ml-1.5 align-baseline select-none">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Lightweight, zero-dependency Markdown formatter for code blocks, bullet points, headers, bold, and tables.
 */
function formatMessageContent(content: string) {
  if (!content) return "";

  // Split on code fences ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      elements.push(
        <span key={`text-${lastIndex}`}>
          {renderFormattedText(content.slice(lastIndex, match.index))}
        </span>
      );
    }

    const language = match[1] || "code";
    const code = match[2];
    elements.push(
      <div key={`code-${match.index}`} className="my-2.5 rounded-xl overflow-hidden border border-stone-200 dark:border-[#1e3025] bg-stone-900 text-stone-100">
        <div className="flex items-center justify-between px-3 py-1.5 bg-stone-950/80 border-b border-stone-800 text-[10px] font-mono text-stone-400">
          <div className="flex items-center gap-1.5">
            <Terminal size={12} />
            <span>{language}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(code);
              toast.success("Code copied!");
            }}
            className="hover:text-white transition cursor-pointer"
          >
            Copy
          </button>
        </div>
        <pre className="p-3 text-[11px] sm:text-xs font-mono overflow-x-auto text-emerald-300">
          <code>{code}</code>
        </pre>
      </div>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    elements.push(
      <span key={`text-${lastIndex}`}>
        {renderFormattedText(content.slice(lastIndex))}
      </span>
    );
  }

  return elements;
}

/**
 * Formats inline bold (**text**), bullet points (* or -), and headers (#, ##).
 */
function renderFormattedText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    // Header 3 or 2
    if (line.startsWith("### ")) {
      return (
        <h4 key={idx} className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-white mt-3 mb-1">
          {formatInline(line.slice(4))}
        </h4>
      );
    }
    if (line.startsWith("## ")) {
      return (
        <h3 key={idx} className="font-extrabold text-base sm:text-lg text-stone-900 dark:text-white mt-3.5 mb-1.5">
          {formatInline(line.slice(3))}
        </h3>
      );
    }
    if (line.startsWith("# ")) {
      return (
        <h2 key={idx} className="font-black text-lg sm:text-xl text-stone-900 dark:text-white mt-4 mb-2">
          {formatInline(line.slice(2))}
        </h2>
      );
    }

    // Bullet point
    if (line.trim().startsWith("• ") || line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const clean = line.trim().slice(2);
      return (
        <div key={idx} className="flex items-start gap-2 ml-1 my-0.5">
          <span className="text-emerald-500 font-bold shrink-0">•</span>
          <span>{formatInline(clean)}</span>
        </div>
      );
    }

    return (
      <span key={idx}>
        {formatInline(line)}
        {idx < lines.length - 1 && <br />}
      </span>
    );
  });
}

function formatInline(str: string) {
  // Bold formatting **bold**
  const parts = str.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-stone-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
