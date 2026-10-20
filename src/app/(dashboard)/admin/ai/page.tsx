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
  AlertTriangle,
  Pencil,
  Folder,
  FolderPlus,
  ChevronRight,
  FolderInput
} from "lucide-react";

import { 
  ChatSession, 
  ChatMessage, 
  ChatFolder,
  loadAllSessions, 
  saveSession, 
  deleteSession, 
  renameSession, 
  createNewSession, 
  getActiveSessionId, 
  setActiveSessionId,
  loadAllFolders,
  deleteFolder,
} from "@/lib/ai/chatStorage";
import { getAiConfig, setAiConfig, hasApiKey } from "@/lib/ai/byokStorage";
import { streamGeminiContent } from "@/lib/ai/geminiClient";
import { buildSystemInstruction } from "@/lib/ai/buildAppContext";
import { ByokSettingsModal } from "@/components/ai/ByokSettingsModal";
import { FolderManageModal } from "@/components/ai/FolderManageModal";
import { MoveToFolderModal } from "@/components/ai/MoveToFolderModal";
import { ChatMessageItem } from "@/components/ai/ChatMessageItem";
import { ModelSwitcherDropdown } from "@/components/ai/ModelSwitcherDropdown";
import Link from "next/link";
import toast from "react-hot-toast";

function AdminAiChatContent() {
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
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isByokModalOpen, setIsByokModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<ChatFolder | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [sessionToMove, setSessionToMove] = useState<ChatSession | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialHandledRef = useRef(false);

  // Check auth
  useEffect(() => {
    if (!authLoading) {
      if (!userData) {
        router.replace("/login?role=admin");
      } else if (userData.role === "STUDENT") {
        router.replace("/student/ai");
      }
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

  const updateKeyStatus = () => {
    setHasKey(hasApiKey());
  };

  useEffect(() => {
    updateKeyStatus();
    const handleKeyChange = () => updateKeyStatus();
    window.addEventListener("classsync_byok_changed", handleKeyChange);
    return () => window.removeEventListener("classsync_byok_changed", handleKeyChange);
  }, []);

  const refreshSessions = () => {
    const list = loadAllSessions();
    setSessions(list);
    const fList = loadAllFolders();
    setFolders(fList);
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

  // Handle URL query parameter `?q=...`
  useEffect(() => {
    const queryParam = searchParams.get("q");
    if (queryParam && !initialHandledRef.current) {
      initialHandledRef.current = true;
      const newSess = createNewSession(queryParam);
      setSessions(loadAllSessions());
      setActiveSession(newSess);
      setTimeout(() => {
        handleSendMessage(queryParam, newSess);
      }, 250);
    }
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, streamingText, isGenerating]);

  const handleNewChat = () => {
    const newSess = createNewSession();
    refreshSessions();
    setActiveSession(newSess);
    setIsSidebarOpen(false);
    setInputText("");
    inputRef.current?.focus();
  };

  const handleSelectSession = (sess: ChatSession) => {
    setActiveSessionId(sess.id);
    setActiveSession(sess);
    setIsSidebarOpen(false);
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Delete this conversation?")) {
      deleteSession(id);
      refreshSessions();
      toast.success("Chat deleted");
    }
  };

  const handleStartRename = (e: React.MouseEvent, sess: ChatSession) => {
    e.stopPropagation();
    setRenamingId(sess.id);
    setRenameValue(sess.title);
  };

  const handleSaveRename = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    renameSession(id, renameValue);
    setRenamingId(null);
    refreshSessions();
  };

  const handleEditFolder = (e: React.MouseEvent, folder: ChatFolder) => {
    e.stopPropagation();
    setFolderToEdit(folder);
    setIsFolderModalOpen(true);
  };

  const handleDeleteFolder = (e: React.MouseEvent, folder: ChatFolder) => {
    e.stopPropagation();
    if (window.confirm(`Delete folder "${folder.name}"? Chats in it will be moved to Uncategorized.`)) {
      deleteFolder(folder.id);
      refreshSessions();
      toast.success("Folder deleted");
    }
  };

  const handleCreateChatInFolder = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    const newSess = createNewSession(undefined, folderId);
    refreshSessions();
    setActiveSession(newSess);
    setIsSidebarOpen(false);
    setInputText("");
    inputRef.current?.focus();
  };

  const uncategorizedChats = sessions.filter(
    (s) => !s.folderId || !folders.some((f) => f.id === s.folderId)
  );

  const renderChatItem = (sess: ChatSession) => {
    const isActive = activeSession?.id === sess.id;
    const isEditing = renamingId === sess.id;

    return (
      <div
        key={sess.id}
        onClick={() => handleSelectSession(sess)}
        className={`group relative flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
          isActive 
            ? "bg-[#16231b] text-white border border-emerald-500/40 shadow-xs" 
            : "text-stone-400 hover:bg-[#121c16] hover:text-stone-200"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MessageSquare size={13} className={isActive ? "text-emerald-400 shrink-0" : "text-stone-500 shrink-0"} />
          {isEditing ? (
            <form onSubmit={(e) => handleSaveRename(e, sess.id)} className="flex-1 flex items-center gap-1">
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

        {/* Action Buttons: ALWAYS accessible on mobile & desktop */}
        {!isEditing && (
          <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSessionToMove(sess);
                setIsMoveModalOpen(true);
              }}
              className="p-1 rounded text-stone-400 hover:text-teal-300 hover:bg-[#1f3327] transition"
              title="Move to folder"
            >
              <FolderInput size={12} />
            </button>
            <button
              type="button"
              onClick={(e) => handleStartRename(e, sess)}
              className="p-1 rounded text-stone-400 hover:text-stone-200 hover:bg-[#1f3327] transition"
              title="Rename chat"
            >
              <Pencil size={11} />
            </button>
            <button
              type="button"
              onClick={(e) => handleDeleteSession(e, sess.id)}
              className="p-1 rounded text-stone-400 hover:text-rose-400 hover:bg-[#2b181c] transition"
              title="Delete chat"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>
    );
  };

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
      onModelSwitched: (newModel) => {
        setAiConfig({ model: newModel });
        toast(`Active model: ${newModel}`, { icon: "🔄" });
      },
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
      
      {/* ── LEFT SIDEBAR (ChatGPT Style with Folders) ── */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 sm:w-80 bg-[#0d1712] border-r border-[#1e3025] flex flex-col justify-between transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
        isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      }`}>
        
        {/* Top Branding & New Chat / New Folder */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Link 
              href="/admin" 
              className="flex items-center gap-2 group text-stone-300 hover:text-white transition"
            >
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-md shadow-emerald-950 shrink-0">
                <img src="/icons/icon-192x192.png" alt="ClassSync AI" className="w-full h-full rounded-[10px] object-cover ring-1 ring-white/30" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-90" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
              </div>
              <div className="leading-tight">
                <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                  ClassSync AI
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold block">Teacher & Admin Copilot</span>
              </div>
            </Link>
            
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 text-stone-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Action Row: New Chat + New Folder */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleNewChat}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition-all cursor-pointer group"
              title="New Conversation"
            >
              <Plus size={15} className="group-hover:rotate-90 transition-transform duration-200" />
              <span>New Chat</span>
            </button>

            <button
              onClick={() => {
                setFolderToEdit(null);
                setIsFolderModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#14231a] hover:bg-[#1a2e23] border border-[#1e3828] text-emerald-300 font-bold text-xs transition cursor-pointer"
              title="Create Chat Folder"
            >
              <FolderPlus size={14} className="text-emerald-400" />
              <span>Folder</span>
            </button>
          </div>
        </div>

        {/* Middle: Folders & Sessions List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          
          {/* Folders Section (if any exist) */}
          {folders.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-2 pb-0.5 text-[10px] font-black uppercase tracking-wider text-stone-500">
                <span className="flex items-center gap-1.5">
                  <Folder size={11} className="text-emerald-400" />
                  <span>Folders ({folders.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFolderToEdit(null);
                    setIsFolderModalOpen(true);
                  }}
                  className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold transition cursor-pointer"
                >
                  <Plus size={11} />
                  <span>New</span>
                </button>
              </div>

              {folders.map((folder) => {
                const folderChats = sessions.filter((s) => s.folderId === folder.id);
                const isCollapsed = Boolean(collapsedFolders[folder.id]);

                return (
                  <div key={folder.id} className="rounded-xl overflow-hidden bg-[#101a14]/60 border border-[#1e3025]/60 mb-1.5">
                    {/* Folder Header */}
                    <div 
                      onClick={() => setCollapsedFolders((prev) => ({ ...prev, [folder.id]: !prev[folder.id] }))}
                      className="flex items-center justify-between p-2 hover:bg-[#16231b] cursor-pointer transition select-none group"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <ChevronRight 
                          size={13} 
                          className={`text-stone-400 shrink-0 transition-transform duration-200 ${isCollapsed ? "" : "rotate-90"}`} 
                        />
                        <span className="text-sm shrink-0">📁</span>
                        <span className="text-xs font-bold text-stone-200 truncate">{folder.name}</span>
                        <span className="text-[10px] text-stone-500 font-mono shrink-0">({folderChats.length})</span>
                      </div>

                      {/* Folder Action Buttons */}
                      <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleCreateChatInFolder(e, folder.id)}
                          className="p-1 rounded text-stone-400 hover:text-emerald-400 hover:bg-[#1f3327] transition"
                          title="New chat in this folder"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleEditFolder(e, folder)}
                          className="p-1 rounded text-stone-400 hover:text-stone-200 hover:bg-[#1f3327] transition"
                          title="Rename folder"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteFolder(e, folder)}
                          className="p-1 rounded text-stone-400 hover:text-rose-400 hover:bg-[#2b181c] transition"
                          title="Delete folder"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Folder Chat List */}
                    {!isCollapsed && (
                      <div className="px-1.5 pb-1.5 pt-0.5 space-y-0.5 border-t border-[#1e3025]/40 bg-[#0c140f]/60">
                        {folderChats.length === 0 ? (
                          <div className="py-2 px-3 text-[11px] text-stone-500 italic flex items-center justify-between">
                            <span>No chats in folder</span>
                            <button
                              type="button"
                              onClick={(e) => handleCreateChatInFolder(e, folder.id)}
                              className="text-[10px] text-emerald-400 hover:underline font-semibold"
                            >
                              + Add Chat
                            </button>
                          </div>
                        ) : (
                          folderChats.map((sess) => renderChatItem(sess))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Uncategorized / General Chats */}
          <div className="space-y-1">
            <p className="px-2 pb-1 text-[10px] font-black uppercase tracking-wider text-stone-500">
              {folders.length > 0 ? `Uncategorized (${uncategorizedChats.length})` : `Past Conversations (${sessions.length})`}
            </p>

            {uncategorizedChats.length === 0 && folders.length > 0 ? (
              <div className="py-3 px-2 text-center text-stone-500 text-[11px] italic">
                All chats are organized in folders!
              </div>
            ) : uncategorizedChats.length === 0 && folders.length === 0 ? (
              <div className="py-12 text-center text-stone-500 px-4">
                <MessageSquare size={24} className="mx-auto mb-2 opacity-40 text-emerald-500" />
                <p className="text-xs font-semibold">No chats yet</p>
                <p className="text-[10px] text-stone-600 mt-0.5">Ask AI to draft announcements, assignments, or organize lecture topics!</p>
              </div>
            ) : (
              uncategorizedChats.map((sess) => renderChatItem(sess))
            )}
          </div>

        </div>

        {/* Bottom Sidebar: BYOK Status & Back Button */}
        <div className="p-3 border-t border-[#1e3025] space-y-2 bg-[#09130e]">
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

          <Link
            href="/admin"
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-[#121c16] text-xs font-bold transition"
          >
            <ArrowLeft size={13} />
            <span>Back to Admin Panel</span>
          </Link>
        </div>

      </aside>

      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* ── MAIN CHAT AREA ── */}
      <main className="flex-1 flex flex-col h-full bg-[#09130e] overflow-hidden relative">
        
        {/* Top Navbar */}
        <header className="h-14 shrink-0 flex items-center justify-between px-3 sm:px-6 border-b border-[#1e3025] bg-[#09130e]/80 backdrop-blur-md z-10 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-[#121c16] border border-[#1e3025] text-stone-300 hover:text-white cursor-pointer shrink-0"
              title="Open Sidebar"
            >
              <Menu size={16} />
            </button>
            
            {/* Prominent ClassSync AI Brand with Animated Logo at Top */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-md shadow-emerald-950/60 shrink-0">
                <img 
                  src="/icons/icon-192x192.png" 
                  alt="ClassSync AI" 
                  className="w-full h-full rounded-[10px] object-cover ring-1 ring-white/30" 
                />
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-90" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 border border-[#09130e]" />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xs sm:text-sm font-black text-white tracking-tight flex items-center gap-1 truncate">
                    <span>ClassSync AI</span>
                  </h1>
                  <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase">
                    Admin
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 truncate max-w-[130px] sm:max-w-[220px]">
                  {activeSession?.title || "New Conversation"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <ModelSwitcherDropdown />

            <button
              onClick={() => setIsByokModalOpen(true)}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#121c16] hover:bg-[#18261e] border border-[#1e3025] text-xs font-semibold text-stone-300 hover:text-white transition cursor-pointer shrink-0 flex items-center gap-1.5"
              title={hasKey ? "Gemini Key Active" : "Connect Gemini Key"}
            >
              <Key size={13} className={hasKey ? "text-emerald-400" : "text-amber-400"} />
              <span className="hidden md:inline">{hasKey ? "Key Active" : "Setup Key"}</span>
            </button>
            <button
              onClick={handleNewChat}
              className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition cursor-pointer shrink-0"
              title="New Chat"
            >
              <Plus size={16} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">
          
          {!hasKey && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 to-stone-900 border border-amber-800/60 flex items-start justify-between gap-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-amber-300">
                    Connect your free Google Gemini API Key
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                    Enjoy unlimited, private assistance for drafting tests, generating assignments, and organizing schedules.
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

          {(!activeSession || activeSession.messages.length === 0) && (
            <div className="py-8 sm:py-16 text-center max-w-xl mx-auto space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-950/60 ring-8 ring-[#121c16]">
                <Sparkles size={32} />
              </div>
              
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Welcome, Professor & Administrator
                </h3>
                <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-sm mx-auto">
                  Ask me to draft announcements, design assignment rubrics, check class birthdays, or schedule exams.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left pt-2">
                <button
                  onClick={() => handleSendMessage("Draft a clear and encouraging announcement for an upcoming mid-term exam")}
                  className="p-3.5 rounded-2xl bg-[#121c16] hover:bg-[#18261e] border border-[#1e3025] hover:border-emerald-600/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} className="text-rose-400" />
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300">Draft Exam Announcement</span>
                  </div>
                  <p className="text-[11px] text-stone-400 line-clamp-1">Draft announcement for upcoming mid-term exam</p>
                </button>

                <button
                  onClick={() => handleSendMessage("Create a 5-question practical programming assignment on Docker containers")}
                  className="p-3.5 rounded-2xl bg-[#121c16] hover:bg-[#18261e] border border-[#1e3025] hover:border-emerald-600/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen size={14} className="text-teal-400" />
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300">Generate Assignment</span>
                  </div>
                  <p className="text-[11px] text-stone-400 line-clamp-1">5-question practical assignment on Docker</p>
                </button>

                <button
                  onClick={() => handleSendMessage("Summarize today's class schedule and pending deadlines")}
                  className="p-3.5 rounded-2xl bg-[#121c16] hover:bg-[#18261e] border border-[#1e3025] hover:border-emerald-600/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={14} className="text-amber-400" />
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300">Review Daily Schedule</span>
                  </div>
                  <p className="text-[11px] text-stone-400 line-clamp-1">Check today's lectures and pending deadlines</p>
                </button>

                <button
                  onClick={() => handleSendMessage("Whose birthday is coming up this week in our class?")}
                  className="p-3.5 rounded-2xl bg-[#121c16] hover:bg-[#18261e] border border-[#1e3025] hover:border-emerald-600/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Cake size={14} className="text-rose-400" />
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300">Class Birthdays</span>
                  </div>
                  <p className="text-[11px] text-stone-400 line-clamp-1">Check upcoming birthdays to send wishes</p>
                </button>
              </div>
            </div>
          )}

          {activeSession?.messages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              userName={userData?.displayName || "Admin"}
              userPhoto={userData?.photoURL}
            />
          ))}

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

          {isGenerating && !streamingText && (
            <div className="flex items-center gap-3 p-3.5 px-4 rounded-2xl bg-[#101a14] border border-emerald-500/25 w-fit text-stone-300 text-xs shadow-md shadow-emerald-950/30 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-6 h-6 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sparkles size={13} className="animate-spin" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-stone-300 font-medium text-xs">ClassSync AI is analyzing</span>
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

        <div className="p-3 sm:p-5 border-t border-[#1e3025] bg-[#09130e]/95 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto space-y-2">
            
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <button
                type="button"
                onClick={() => handleSendMessage("Draft a reminder for pending assignments")}
                className="shrink-0 px-2.5 py-1 rounded-full bg-[#121c16] hover:bg-[#18261e] border border-[#1e3025] text-stone-300 hover:text-white text-[11px] font-semibold transition"
              >
                📢 Assignment Reminder
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage("What lectures are scheduled for today?")}
                className="shrink-0 px-2.5 py-1 rounded-full bg-[#121c16] hover:bg-[#18261e] border border-[#1e3025] text-stone-300 hover:text-white text-[11px] font-semibold transition"
              >
                📅 Today's Routine
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage("Create a study quiz for our syllabus")}
                className="shrink-0 px-2.5 py-1 rounded-full bg-[#121c16] hover:bg-[#18261e] border border-[#1e3025] text-stone-300 hover:text-white text-[11px] font-semibold transition"
              >
                📝 Quiz Questions
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage("Whose birthday is this month?")}
                className="shrink-0 px-2.5 py-1 rounded-full bg-[#121c16] hover:bg-[#18261e] border border-[#1e3025] text-stone-300 hover:text-white text-[11px] font-semibold transition"
              >
                🎂 Birthdays
              </button>
            </div>

            <div className="relative flex items-end gap-2 p-2 rounded-2xl sm:rounded-3xl bg-[#121c16] border border-[#1e3025] focus-within:border-emerald-500/80 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all shadow-lg">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask AI to draft announcements, assignments, or check routines..."
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

      {/* Folder Management Modal */}
      <FolderManageModal
        isOpen={isFolderModalOpen}
        onClose={() => {
          setIsFolderModalOpen(false);
          setFolderToEdit(null);
        }}
        folderToEdit={folderToEdit}
        onSaved={refreshSessions}
      />

      {/* Move to Folder Modal */}
      <MoveToFolderModal
        isOpen={isMoveModalOpen}
        onClose={() => {
          setIsMoveModalOpen(false);
          setSessionToMove(null);
        }}
        session={sessionToMove}
        folders={folders}
        onOpenCreateFolder={() => {
          setFolderToEdit(null);
          setIsFolderModalOpen(true);
        }}
        onMoved={refreshSessions}
      />

    </div>
  );
}

export default function AdminAiPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-[#09130e] text-emerald-400">
        <Sparkles size={28} className="animate-spin" />
      </div>
    }>
      <AdminAiChatContent />
    </Suspense>
  );
}
