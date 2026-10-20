/**
 * BYOK (Bring Your Own Key) Storage Manager
 * Safely persists the user's private AI API key and model preferences in client-side localStorage.
 * Keys never leave the browser and are never saved to shared cloud databases.
 */

export type AiProvider = "gemini" | "openai";

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
  temperature?: number;
  availableModels?: string[];
}

const STORAGE_KEY = "classsync_byok_ai_config";
const MODELS_CACHE_KEY = "classsync_byok_models_cache";

export const DEFAULT_AI_CONFIG: AiConfig = {
  provider: "gemini",
  apiKey: "",
  model: "gemini-2.0-flash",
  temperature: 0.7,
  availableModels: [
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
  ],
};

export function getAiConfig(): AiConfig {
  if (typeof window === "undefined") return DEFAULT_AI_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AI_CONFIG;
    const parsed = JSON.parse(raw);
    const cachedModels = getCachedModels();
    return {
      provider: parsed.provider || "gemini",
      apiKey: parsed.apiKey || "",
      model: parsed.model || "gemini-2.0-flash",
      temperature: typeof parsed.temperature === "number" ? parsed.temperature : 0.7,
      availableModels: cachedModels.length > 0 ? cachedModels : DEFAULT_AI_CONFIG.availableModels,
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
    if (config.availableModels && Array.isArray(config.availableModels)) {
      setCachedModels(config.availableModels);
    }
    // Dispatch custom event so all open tabs and components react immediately
    window.dispatchEvent(new CustomEvent("classsync_byok_changed", { detail: updated }));
    return updated;
  } catch (e) {
    console.error("Failed to save BYOK config:", e);
    return DEFAULT_AI_CONFIG;
  }
}

export function getCachedModels(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MODELS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setCachedModels(models: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MODELS_CACHE_KEY, JSON.stringify(models));
  } catch {}
}

export function clearAiConfig(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(MODELS_CACHE_KEY);
    window.dispatchEvent(new CustomEvent("classsync_byok_changed", { detail: DEFAULT_AI_CONFIG }));
  } catch (e) {
    console.error("Failed to clear BYOK config:", e);
  }
}

export function hasApiKey(): boolean {
  const config = getAiConfig();
  return Boolean(config.apiKey && config.apiKey.trim().length > 10);
}
