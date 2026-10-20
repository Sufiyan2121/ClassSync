/**
 * Chat History and Session Manager
 * Stores conversation threads locally on device so users have a full ChatGPT-like history.
 */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  status?: "pending" | "done" | "error";
}

export interface ChatFolder {
  id: string;
  name: string;
  createdAt: number;
  color?: string; // "emerald" | "teal" | "blue" | "purple" | "amber" | "rose"
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  folderId?: string | null;
}

const CHAT_SESSIONS_KEY = "classsync_ai_chat_sessions";
const CHAT_FOLDERS_KEY = "classsync_ai_chat_folders";
const ACTIVE_SESSION_ID_KEY = "classsync_ai_active_session_id";

export function loadAllFolders(): ChatFolder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHAT_FOLDERS_KEY);
    if (!raw) return [];
    const list: ChatFolder[] = JSON.parse(raw);
    return Array.isArray(list) ? list.sort((a, b) => a.createdAt - b.createdAt) : [];
  } catch (e) {
    console.error("Failed to load chat folders:", e);
    return [];
  }
}

export function saveAllFolders(folders: ChatFolder[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHAT_FOLDERS_KEY, JSON.stringify(folders));
    window.dispatchEvent(new CustomEvent("classsync_chats_updated"));
  } catch (e) {
    console.error("Failed to save chat folders:", e);
  }
}

export function createFolder(name: string, color: string = "emerald"): ChatFolder {
  const newFolder: ChatFolder = {
    id: "folder_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now(),
    name: name.trim() || "New Folder",
    color,
    createdAt: Date.now(),
  };
  const folders = loadAllFolders();
  folders.push(newFolder);
  saveAllFolders(folders);
  return newFolder;
}

export function renameFolder(id: string, newName: string, newColor?: string): void {
  const folders = loadAllFolders();
  const folder = folders.find((f) => f.id === id);
  if (folder) {
    folder.name = newName.trim() || folder.name;
    if (newColor) folder.color = newColor;
    saveAllFolders(folders);
  }
}

export function deleteFolder(id: string): void {
  const folders = loadAllFolders().filter((f) => f.id !== id);
  saveAllFolders(folders);

  // Unlink any chats in this folder back to uncategorized
  const sessions = loadAllSessions().map((s) => {
    if (s.folderId === id) {
      return { ...s, folderId: null };
    }
    return s;
  });
  saveAllSessions(sessions);
}

export function moveSessionToFolder(sessionId: string, folderId: string | null): void {
  const sessions = loadAllSessions();
  const target = sessions.find((s) => s.id === sessionId);
  if (target) {
    target.folderId = folderId || null;
    target.updatedAt = Date.now();
    saveAllSessions(sessions);
  }
}

export function loadAllSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHAT_SESSIONS_KEY);
    if (!raw) return [];
    const list: ChatSession[] = JSON.parse(raw);
    return Array.isArray(list) ? list.sort((a, b) => b.updatedAt - a.updatedAt) : [];
  } catch (e) {
    console.error("Failed to load chat sessions:", e);
    return [];
  }
}

export function saveAllSessions(sessions: ChatSession[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
    window.dispatchEvent(new CustomEvent("classsync_chats_updated"));
  } catch (e) {
    console.error("Failed to save chat sessions:", e);
  }
}

export function getSession(id: string): ChatSession | null {
  const sessions = loadAllSessions();
  return sessions.find((s) => s.id === id) || null;
}

export function createNewSession(firstPrompt?: string, folderId?: string | null): ChatSession {
  const now = Date.now();
  let title = "New Conversation";
  if (firstPrompt) {
    const trimmed = firstPrompt.trim().replace(/\n/g, " ");
    title = trimmed.length > 32 ? trimmed.slice(0, 32) + "..." : trimmed;
  }

  const newSession: ChatSession = {
    id: "chat_" + Math.random().toString(36).substring(2, 9) + "_" + now,
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
    folderId: folderId || null,
  };

  const sessions = loadAllSessions();
  sessions.unshift(newSession);
  saveAllSessions(sessions);
  setActiveSessionId(newSession.id);
  return newSession;
}

export function saveSession(session: ChatSession): void {
  const sessions = loadAllSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  session.updatedAt = Date.now();

  // If title is default and we now have messages, auto-generate a better title
  if ((session.title === "New Conversation" || !session.title) && session.messages.length > 0) {
    const firstUserMsg = session.messages.find((m) => m.role === "user");
    if (firstUserMsg) {
      const clean = firstUserMsg.content.trim().replace(/\n/g, " ");
      session.title = clean.length > 32 ? clean.slice(0, 32) + "..." : clean;
    }
  }

  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.unshift(session);
  }
  saveAllSessions(sessions);
}

export function deleteSession(id: string): void {
  const sessions = loadAllSessions().filter((s) => s.id !== id);
  saveAllSessions(sessions);
  const activeId = getActiveSessionId();
  if (activeId === id) {
    const next = sessions[0]?.id || null;
    setActiveSessionId(next);
  }
}

export function renameSession(id: string, newTitle: string): void {
  const sessions = loadAllSessions();
  const target = sessions.find((s) => s.id === id);
  if (target) {
    target.title = newTitle.trim() || "Untitled Chat";
    target.updatedAt = Date.now();
    saveAllSessions(sessions);
  }
}

export function clearAllSessions(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CHAT_SESSIONS_KEY);
  localStorage.removeItem(ACTIVE_SESSION_ID_KEY);
  window.dispatchEvent(new CustomEvent("classsync_chats_updated"));
}

export function getActiveSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_SESSION_ID_KEY);
}

export function setActiveSessionId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) {
    localStorage.setItem(ACTIVE_SESSION_ID_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_SESSION_ID_KEY);
  }
}
