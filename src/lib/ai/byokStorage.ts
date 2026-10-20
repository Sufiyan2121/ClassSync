/**
 * BYOK (Bring Your Own Key) Storage Manager
 * Safely persists the user's private AI API key in client-side localStorage.
 * Keys never leave the browser and are never saved to shared cloud databases.
 */

export type AiProvider = "gemini" | "openai";

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
  temperature?: number;
}

const STORAGE_KEY = "classsync_byok_ai_config";

export const DEFAULT_AI_CONFIG: AiConfig = {
  provider: "gemini",
  apiKey: "",
  model: "gemini-2.0-flash",
  temperature: 0.7,
};

export function getAiConfig(): AiConfig {
  if (typeof window === "undefined") return DEFAULT_AI_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AI_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      provider: parsed.provider || "gemini",
      apiKey: parsed.apiKey || "",
      model: parsed.model || "gemini-2.0-flash",
      temperature: typeof parsed.temperature === "number" ? parsed.temperature : 0.7,
    };
  } catch (e) {
    console.error("Failed to read BYOK config:", e);
    return DEFAULT_AI_CONFIG;
  }
}

export function setAiConfig(config: Partial<AiConfig>): AiConfig {
  if (typeof window === "undefined") return DEFAULT_AI_CONFIG;
  try {
    const current = getAiConfig();
    const updated: AiConfig = {
      ...current,
      ...config,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Dispatch custom event so all open tabs and components react immediately
    window.dispatchEvent(new CustomEvent("classsync_byok_changed", { detail: updated }));
    return updated;
  } catch (e) {
    console.error("Failed to save BYOK config:", e);
    return DEFAULT_AI_CONFIG;
  }
}

export function clearAiConfig(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("classsync_byok_changed", { detail: DEFAULT_AI_CONFIG }));
  } catch (e) {
    console.error("Failed to clear BYOK config:", e);
  }
}

export function hasApiKey(): boolean {
  const config = getAiConfig();
  return Boolean(config.apiKey && config.apiKey.trim().length > 10);
}
