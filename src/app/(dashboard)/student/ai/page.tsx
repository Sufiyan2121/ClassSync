"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { usePosts } from "@/hooks/usePosts";
import { useBirthdays } from "@/hooks/useBirthdays";
import { useTimetables } from "@/hooks/useTimetables";
import { useClassConfig } from "@/hooks/useClassConfig";
import { Subject, Material } from "@/types";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";

import { 
  Sparkles, 
  Send, 
  Plus, 
  Key, 
  Trash2, 
  Menu, 
  X, 
  ArrowLeft, 
  Calendar, 
  BookOpen, 
  Cake, 
  Clock, 
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  Pencil
} from "lucide-react";

import { 
  ChatSession, 
  ChatMessage, 
  loadAllSessions, 
  saveSession, 
  deleteSession, 
  renameSession, 
  createNewSession, 
  getActiveSessionId, 
  setActiveSessionId 
} from "@/lib/ai/chatStorage";
import { getAiConfig, hasApiKey } from "@/lib/ai/byokStorage";
import { streamGeminiContent } from "@/lib/ai/geminiClient";
import { buildSystemInstruction } from "@/lib/ai/buildAppContext";
import { ByokSettingsModal } from "@/components/ai/ByokSettingsModal";
import { ChatMessageItem } from "@/components/ai/ChatMessageItem";
import Link from "next/link";
import toast from "react-hot-toast";

function StudentAiChatContent() {
  const { userData, loading: authLoading } = useAuth();
  const { posts } = usePosts();
  const { birthdays } = useBirthdays();
  const { timetables } = useTimetables();
  const { classConfig } = useClassConfig();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isByokModalOpen, setIsByokModalOpen] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialHandledRef = useRef(false);

  // Check auth
  useEffect(() => {
    if (!authLoading && !userData) {
      router.replace("/login");
    }
  }, [userData, authLoading, router]);

  // Load real-time subjects and materials
  useEffect(() => {
    const unsubS = onSnapshot(collection(db, "subjects"), (snap) => {
      const list: Subject[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Subject));
      setSubjects(list);
    });
    const unsubM = onSnapshot(collection(db, "materials"), (snap) => {
      const list: Material[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Material));
      setMaterials(list);
    });
    return () => {
      unsubS();
      unsubM();
    };
  }, []);

  // Check BYOK Key status
  const updateKeyStatus = () => {
    setHasKey(hasApiKey());
  };

  useEffect(() => {
    updateKeyStatus();
    const handleKeyChange = () => updateKeyStatus();
    window.addEventListener("classsync_byok_changed", handleKeyChange);
    return () => window.removeEventListener("classsync_byok_changed", handleKeyChange);
  }, []);

  // Load chat sessions from storage
  const refreshSessions = () => {
    const list = loadAllSessions();
    setSessions(list);
    const activeId = getActiveSessionId();
    const current = list.find(s => s.id === activeId) || list[0] || null;
    setActiveSession(current);
  };

  useEffect(() => {
    refreshSessions();
    const handleChatsUpdated = () => refreshSessions();
    window.addEventListener("classsync_chats_updated", handleChatsUpdated);
    return () => window.removeEventListener("classsync_chats_updated", handleChatsUpdated);
  }, []);

  // Handle URL query parameter `?q=...` from the search bar
  useEffect(() => {
    const queryParam = searchParams.get("q");
    if (queryParam && !initialHandledRef.current) {
      initialHandledRef.current = true;
      const newSess = createNewSession(queryParam);
      setSessions(loadAllSessions());
      setActiveSession(newSess);
      // Auto-send query
      setTimeout(() => {
        handleSendMessage(queryParam, newSess);
      }, 250);
    }
  }, [searchParams]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, streamingText, isGenerating]);

  // Create new conversation
  const handleNewChat = () => {
    const newSess = createNewSession();
    refreshSessions();
    setActiveSession(newSess);
    setIsSidebarOpen(false);
    setInputText("");
    inputRef.current?.focus();
  };

  // Switch active conversation
  const handleSelectSession = (sess: ChatSession) => {
    setActiveSessionId(sess.id);
    setActiveSession(sess);
    setIsSidebarOpen(false);
  };

  // Delete conversation
  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Delete this conversation?")) {
      deleteSession(id);
      refreshSessions();
      toast.success("Chat deleted");
    }
  };

  // Start renaming
  const handleStartRename = (e: React.MouseEvent, sess: ChatSession) => {
    e.stopPropagation();
    setRenamingId(sess.id);
    setRenameValue(sess.title);
  };

  // Save renamed conversation
  const handleSaveRename = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    renameSession(id, renameValue);
    setRenamingId(null);
    refreshSessions();
  };

  // Send message
  const handleSendMessage = async (textToSend?: string, sessionOverride?: ChatSession) => {
    const prompt = (textToSend || inputText).trim();
    if (!prompt || isGenerating) return;

    if (!hasApiKey()) {
      setIsByokModalOpen(true);
      toast("Please connect your free Gemini API key to begin chatting.", { icon: "🔑" });
      return;
    }

    let targetSession = sessionOverride || activeSession;
    if (!targetSession) {
      targetSession = createNewSession(prompt);
      setActiveSession(targetSession);
      setSessions(loadAllSessions());
    }

    const userMsg: ChatMessage = {
      id: "msg_" + Math.random().toString(36).substring(2, 9),
      role: "user",
      content: prompt,
      timestamp: Date.now(),
    };

    const updatedMessages = [...targetSession.messages, userMsg];
    targetSession.messages = updatedMessages;
    saveSession(targetSession);
    setActiveSession({ ...targetSession });
    setInputText("");

    // Prepare system instruction with verified class context
    const systemInstruction = buildSystemInstruction({
      user: userData,
      classCode: userData?.enrolledClassCode,
      className: classConfig.className || userData?.enrolledClassCode,
      posts,
      birthdays,
      subjects,
      materials,
      timetables,
    });

    const aiConfig = getAiConfig();
    setIsGenerating(true);
    setStreamingText("");

    const assistantMsgId = "msg_" + Math.random().toString(36).substring(2, 9);

    await streamGeminiContent({
      apiKey: aiConfig.apiKey,
      model: aiConfig.model || "gemini-2.0-flash",
      systemInstruction,
      messages: updatedMessages,
      onChunk: (_chunk, accumulated) => {
        setStreamingText(accumulated);
      },
      onComplete: (fullText) => {
        const assistantMsg: ChatMessage = {
          id: assistantMsgId,
          role: "assistant",
          content: fullText || "I couldn't process a response. Please try asking again.",
          timestamp: Date.now(),
          status: "done",
        };
        targetSession!.messages.push(assistantMsg);
        saveSession(targetSession!);
        setActiveSession({ ...targetSession! });
        setIsGenerating(false);
        setStreamingText("");
        setSessions(loadAllSessions());
      },
      onError: (err) => {
        const errMsg: ChatMessage = {
          id: assistantMsgId,
          role: "assistant",
          content: `⚠️ Error: ${err.message}\n\nPlease check your Gemini API key settings or try again.`,
          timestamp: Date.now(),
          status: "error",
        };
        targetSession!.messages.push(errMsg);
        saveSession(targetSession!);
        setActiveSession({ ...targetSession! });
        setIsGenerating(false);
        setStreamingText("");
        toast.error("AI response failed: " + err.message);
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#09130e] text-stone-100 overflow-hidden font-sans">
      
      {/* ── LEFT SIDEBAR (ChatGPT Style) ── */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 sm:w-80 bg-[#0d1712] border-r border-[#1e3025] flex flex-col justify-between transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
        isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      }`}>
        
        {/* Top Branding & New Chat */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Link 
              href="/student" 
              className="flex items-center gap-2 group text-stone-300 hover:text-white transition"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-950">
                <Sparkles size={17} />
              </div>
              <div className="leading-tight">
                <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                  ClassSync AI
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold block">Academic Companion</span>
              </div>
            </Link>
            
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 text-stone-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Plus size={16} className="group-hover:rotate-90 transition-transform duration-200" />
              <span>New Conversation</span>
            </div>
            <span className="text-[10px] font-mono opacity-80 bg-white/20 px-1.5 py-0.5 rounded-md">⌘J</span>
          </button>
        </div>

        {/* Middle: Sessions List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <p className="px-2 pb-1.5 text-[10px] font-black uppercase tracking-wider text-stone-500">
            Past Conversations ({sessions.length})
          </p>

          {sessions.length === 0 ? (
            <div className="py-12 text-center text-stone-500 px-4">
              <MessageSquare size={24} className="mx-auto mb-2 opacity-40 text-emerald-500" />
              <p className="text-xs font-semibold">No chats yet</p>
              <p className="text-[10px] text-stone-600 mt-0.5">Start by asking anything about your class timetable or homework!</p>
            </div>
          ) : (
            sessions.map((sess) => {
              const isActive = activeSession?.id === sess.id;
              const isEditing = renamingId === sess.id;

              return (
                <div
                  key={sess.id}
                  onClick={() => handleSelectSession(sess)}
                  className={`group relative flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive 
                      ? "bg-[#16231b] text-white border border-emerald-500/40 shadow-xs" 
                      : "text-stone-400 hover:bg-[#121c16] hover:text-stone-200"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare size={13} className={isActive ? "text-emerald-400 shrink-0" : "text-stone-500 shrink-0"} />
                    {isEditing ? (
                      <form onSubmit={(e) => handleSaveRename(e, sess.id)} className="flex-1">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={(e) => handleSaveRename(e, sess.id)}
                          autoFocus
                          className="w-full bg-[#1e3025] px-1.5 py-0.5 text-xs rounded text-white focus:outline-none"
                        />
                      </form>
                    ) : (
                      <span className="truncate">{sess.title}</span>
                    )}
                  </div>

                  {/* Actions: Rename / Delete */}
                  <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleStartRename(e, sess)}
                      className="p-1 rounded text-stone-400 hover:text-stone-200 transition"
                      title="Rename"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSession(e, sess.id)}
                      className="p-1 rounded text-stone-400 hover:text-rose-400 transition"
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Sidebar: BYOK Status & Back Button */}
        <div className="p-3 border-t border-[#1e3025] space-y-2 bg-[#09130e]">
          
          {/* Key Status Pill */}
          <button
            onClick={() => setIsByokModalOpen(true)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#121c16] hover:bg-[#18261d] border border-[#1e3025] text-xs font-semibold transition cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Key size={14} className={hasKey ? "text-emerald-400" : "text-amber-400"} />
              <div className="text-left leading-tight truncate">
                <span className="block text-white truncate">BYOK API Key</span>
                <span className="text-[10px] text-stone-400">
                  {hasKey ? "Google Gemini Active" : "Click to connect"}
                </span>
              </div>
            </div>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
              hasKey 
                ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800" 
                : "bg-amber-950/80 text-amber-300 border border-amber-800"
            }`}>
              {hasKey ? "Connected" : "Setup"}
            </span>
          </button>

          {/* Return to Dashboard */}
          <Link
            href="/student"
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-[#121c16] text-xs font-bold transition"
          >
            <ArrowLeft size={13} />
            <span>Back to Dashboard</span>
          </Link>
        </div>

      </aside>

      {/* ── BACKDROP FOR MOBILE SIDEBAR ── */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* ── MAIN CHAT AREA ── */}
      <main className="flex-1 flex flex-col h-full bg-[#09130e] overflow-hidden relative">
        
        {/* Top Navbar */}
        <header className="h-14 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-[#1e3025] bg-[#09130e]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-[#121c16] border border-[#1e3025] text-stone-300 hover:text-white cursor-pointer"
            >
              <Menu size={16} />
            </button>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-extrabold text-white truncate max-w-xs sm:max-w-md">
                {activeSession?.title || "New Conversation"}
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-stone-400">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Gemini Flash AI
                </span>
                <span>•</span>
                <span>{userData?.enrolledClassCode || "Class"} Context Live</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsByokModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121c16] hover:bg-[#18261e] border border-[#1e3025] text-xs font-semibold text-stone-300 hover:text-white transition cursor-pointer"
            >
              <Key size={13} className={hasKey ? "text-emerald-400" : "text-amber-400"} />
              <span className="hidden sm:inline">{hasKey ? "Key Active" : "Setup Key"}</span>
            </button>
            <button
              onClick={handleNewChat}
              className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition cursor-pointer"
              title="New Chat"
            >
              <Plus size={16} />
            </button>
          </div>
        </header>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">
          
          {/* Missing API Key Alert Banner */}
          {!hasKey && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 to-stone-900 border border-amber-800/60 flex items-start justify-between gap-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-amber-300">
                    Connect your free Google Gemini API Key
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                    ClassSync uses a Bring-Your-Own-Key model so you get unlimited, private AI responses with zero subscription fees.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsByokModalOpen(true)}
                className="shrink-0 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-extrabold transition cursor-pointer"
              >
                Connect Free Key
              </button>
            </div>
          )}

          {/* Empty Conversation Welcome State */}
          {(!activeSession || activeSession.messages.length === 0) && (
            <div className="py-8 sm:py-16 text-center max-w-xl mx-auto space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-950/60 ring-8 ring-[#121c16]">
                <Sparkles size={32} />
              </div>
              
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  How can I help you today?
                </h3>
                <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-sm mx-auto">
                  Ask anything about your timetable, upcoming assignments, exam schedules, or study notes.
                </p>
              </div>

              {/* 4 Interactive Starter Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left pt-2">
                
                <button
                  onClick={() => handleSendMessage("What lectures and schedule do I have today?")}
                  className="p-3.5 rounded-2xl bg-[#121c16] hover:bg-[#18261e] border border-[#1e3025] hover:border-emerald-600/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={14} className="text-amber-400" />
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300">Today's Routine</span>
                  </div>
                  <p className="text-[11px] text-stone-400 line-clamp-1">What lectures and schedule do I have today?</p>
                </button>

                <button
                  onClick={() => handleSendMessage("What assignments and exams are due this week?")}
                  className="p-3.5 rounded-2xl bg-[#121c16] hover:bg-[#18261e] border border-[#1e3025] hover:border-emerald-600/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-rose-400" />
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300">Upcoming Deadlines</span>
                  </div>
                  <p className="text-[11px] text-stone-400 line-clamp-1">What assignments and exams are due this week?</p>
                </button>

                <button
                  onClick={() => handleSendMessage("Whose birthday is coming up next in our class?")}
                  className="p-3.5 rounded-2xl bg-[#121c16] hover:bg-[#18261e] border border-[#1e3025] hover:border-emerald-600/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Cake size={14} className="text-rose-400" />
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300">Class Birthdays</span>
                  </div>
                  <p className="text-[11px] text-stone-400 line-clamp-1">Whose birthday is coming up next?</p>
                </button>

                <button
                  onClick={() => handleSendMessage("Explain the key difference between Docker containers and virtual machines")}
                  className="p-3.5 rounded-2xl bg-[#121c16] hover:bg-[#18261e] border border-[#1e3025] hover:border-emerald-600/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen size={14} className="text-teal-400" />
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300">Study Helper</span>
                  </div>
                  <p className="text-[11px] text-stone-400 line-clamp-1">Explain Docker containers vs virtual machines</p>
                </button>

              </div>
            </div>
          )}

          {/* Render Active Messages */}
          {activeSession?.messages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              userName={userData?.displayName}
              userPhoto={userData?.photoURL}
            />
          ))}

          {/* Active Streaming Message Preview */}
          {isGenerating && streamingText && (
            <ChatMessageItem
              message={{
                id: "streaming_temp",
                role: "assistant",
                content: streamingText,
                timestamp: Date.now(),
              }}
              isStreaming={true}
            />
          )}

          {/* Typing dots indicator before first token arrives */}
          {isGenerating && !streamingText && (
            <div className="flex items-center gap-3 p-3.5 px-4 rounded-2xl bg-[#101a14] border border-emerald-500/25 w-fit text-stone-300 text-xs shadow-md shadow-emerald-950/30 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-6 h-6 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sparkles size={13} className="animate-spin" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-stone-300 font-medium text-xs">ClassSync AI is thinking</span>
                <span className="flex items-center gap-1 pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Box Area */}
        <div className="p-3 sm:p-5 border-t border-[#1e3025] bg-[#09130e]/95 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto space-y-2">
            
            {/* Quick Suggestion Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <button
                type="button"
                onClick={() => handleSendMessage("What lectures do I have today?")}
                className="shrink-0 px-2.5 py-1 rounded-full bg-[#121c16] hover:bg-[#18261e] border border-[#1e3025] text-stone-300 hover:text-white text-[11px] font-semibold transition"
              >
                📅 Today's Routine
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage("List all pending assignments with their deadlines")}
                className="shrink-0 px-2.5 py-1 rounded-full bg-[#121c16] hover:bg-[#18261e] border border-[#1e3025] text-stone-300 hover:text-white text-[11px] font-semibold transition"
              >
                📝 Due Assignments
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage("Are there any upcoming exams scheduled?")}
                className="shrink-0 px-2.5 py-1 rounded-full bg-[#121c16] hover:bg-[#18261e] border border-[#1e3025] text-stone-300 hover:text-white text-[11px] font-semibold transition"
              >
                ⏰ Upcoming Exams
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage("Whose birthday is this month?")}
                className="shrink-0 px-2.5 py-1 rounded-full bg-[#121c16] hover:bg-[#18261e] border border-[#1e3025] text-stone-300 hover:text-white text-[11px] font-semibold transition"
              >
                🎂 Birthdays
              </button>
            </div>

            {/* Prompt Input Form */}
            <div className="relative flex items-end gap-2 p-2 rounded-2xl sm:rounded-3xl bg-[#121c16] border border-[#1e3025] focus-within:border-emerald-500/80 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all shadow-lg">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask about timetable, homework, syllabus, or study topics..."
                className="w-full max-h-36 min-h-[40px] resize-none bg-transparent px-3 py-2 text-xs sm:text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none"
                style={{
                  height: "auto",
                  minHeight: "40px",
                }}
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isGenerating}
                className="shrink-0 w-9 h-9 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-emerald-950 cursor-pointer"
              >
                <Send size={15} />
              </button>
            </div>

            <p className="text-[10px] text-center text-stone-500 font-medium">
              ClassSync AI answers using your verified class schedule and your private BYOK Gemini key.
            </p>

          </div>
        </div>

      </main>

      {/* BYOK Settings Modal */}
      <ByokSettingsModal
        isOpen={isByokModalOpen}
        onClose={() => setIsByokModalOpen(false)}
        onSaved={updateKeyStatus}
      />

    </div>
  );
}

export default function StudentAiPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-[#09130e] text-emerald-400">
        <Sparkles size={28} className="animate-spin" />
      </div>
    }>
      <StudentAiChatContent />
    </Suspense>
  );
}
