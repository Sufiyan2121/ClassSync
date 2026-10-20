/**
 * Google Gemini & LLM Client for ClassSync BYOK
 * Features dynamic ModelService.ListModels checking, multi-model hot-swapping,
 * and seamless fallback across all active Gemini models.
 */

import { ChatMessage } from "./chatStorage";
import { setCachedModels, getCachedModels } from "./byokStorage";

export interface StreamOptions {
  apiKey: string;
  model?: string;
  systemInstruction?: string;
  messages: ChatMessage[];
  onChunk: (chunk: string, accumulated: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
  onModelSwitched?: (modelName: string) => void;
}

// Built-in candidate priority list
export const DEFAULT_CANDIDATE_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-exp",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash",
  "gemini-1.5-flash-002",
  "gemini-1.5-flash-001",
  "gemini-1.5-flash-8b",
  "gemini-2.0-flash-lite",
  "gemini-1.5-pro",
  "gemini-1.5-pro-latest",
  "gemini-pro",
];

let inMemoryWorkingModel: { model: string; apiVersion: string } | null = null;

/**
 * Strips leaked thinking scratchpads, chain-of-thought blocks, or XML thought tags.
 */
export function cleanAiOutput(text: string): string {
  if (!text) return "";
  let out = text;
  // 1. Remove XML/HTML thought tags like <thought>...</thought>
  out = out.replace(/<(thought|thinking)>[\s\S]*?<\/(thought|thinking)>/gi, "");

  // 2. If response starts with bulleted/starred planning scratchpad (e.g. Gemma/open models)
  if (/^\s*[•\*\-]?\s*(User says|Context:|Role:|Tone:|Goal:|Status:)/i.test(out)) {
    const greetingMatch = out.match(/(?:\*Greeting:\*|Greeting:)\s*([^\n]+)/i);
    const greetingText = greetingMatch ? greetingMatch[1].replace(/^["']|["']$/g, "").trim() : "";

    const lines = out.split("\n");
    const nonScratchpadLines = lines.filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      return !/^[•\*\-]?\s*(User says|Context|User:|Class:|Current Time:|Status:|Role:|Tone:|Goal:|Greeting:|Personalization:|Quick Update|Mention the|Offer assistance|Accuracy\?|Bold for emphasis)/i.test(trimmed);
    });

    const cleanedRemaining = nonScratchpadLines.join("\n").trim();
    if (cleanedRemaining.length > 10) {
      out = cleanedRemaining;
    } else if (greetingText) {
      out = greetingText;
    }
  }

  return out.replace(/^\s+/, "");
}

/**
 * Calls Google's ModelService.ListModels to query all models available for this specific API key.
 */
export async function getAvailableModels(apiKey: string): Promise<{ models: string[]; apiVersion: string }> {
  const cleanKey = apiKey.trim();
  const versions = ["v1beta", "v1"];

  for (const ver of versions) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/${ver}/models?key=${cleanKey}`);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const rawModels: Array<{ name: string; supportedGenerationMethods?: string[] }> = data?.models || [];
        
        // Filter for text generation models
        const contentModels = rawModels
          .filter((m) => {
            const hasMethod = m.supportedGenerationMethods?.includes("generateContent");
            const isTextModel = !m.name.includes("embedding") && !m.name.includes("imagen") && !m.name.includes("aqa");
            return hasMethod ?? isTextModel;
          })
          .map((m) => m.name.replace(/^models\//, ""));

        if (contentModels.length > 0) {
          setCachedModels(contentModels);
          return { models: contentModels, apiVersion: ver };
        }
      }
    } catch (e) {
      console.warn(`ListModels failed on ${ver}:`, e);
    }
  }

  const cached = getCachedModels();
  return { 
    models: cached.length > 0 ? cached : DEFAULT_CANDIDATE_MODELS, 
    apiVersion: "v1beta" 
  };
}

/**
 * Validates a Gemini API Key live, discovers supported models, and picks the best one.
 */
export async function testGeminiApiKey(
  apiKey: string
): Promise<{ success: boolean; message: string; detectedModel?: string; availableModels?: string[] }> {
  if (!apiKey || apiKey.trim().length < 10) {
    return { success: false, message: "Please enter a valid Google Gemini API key." };
  }

  const cleanKey = apiKey.trim();

  try {
    const { models: available, apiVersion } = await getAvailableModels(cleanKey);
    const candidatePool = available.length > 0 ? available : DEFAULT_CANDIDATE_MODELS;

    // Sort pool by preference
    const sortedPool = [...candidatePool].sort((a, b) => {
      const idxA = DEFAULT_CANDIDATE_MODELS.indexOf(a);
      const idxB = DEFAULT_CANDIDATE_MODELS.indexOf(b);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });

    for (const testModel of sortedPool) {
      const testUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${testModel}:generateContent?key=${cleanKey}`;
      try {
        const res = await fetch(testUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "hi" }] }],
            generationConfig: { maxOutputTokens: 2 },
          }),
        });

        if (res.ok) {
          inMemoryWorkingModel = { model: testModel, apiVersion };
          return {
            success: true,
            message: `Connected successfully! Active model: ${testModel}`,
            detectedModel: testModel,
            availableModels: candidatePool,
          };
        }
      } catch {}
    }

    return { 
      success: false, 
      message: "API key received, but all tested models returned errors. Please verify API key permissions in Google AI Studio." 
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Failed to reach Google Gemini API. Please check your internet connection.",
    };
  }
}

/**
 * Streams or generates an AI response, dynamically switching models if one fails.
 */
export async function streamGeminiContent({
  apiKey,
  model,
  systemInstruction,
  messages,
  onChunk,
  onComplete,
  onError,
  onModelSwitched,
}: StreamOptions): Promise<void> {
  const cleanKey = apiKey.trim();

  // 1. Fetch available models for this key
  const { models: available, apiVersion } = await getAvailableModels(cleanKey);
  const pool = available.length > 0 ? available : DEFAULT_CANDIDATE_MODELS;

  // 2. Put preferred model first, then the rest
  const preferred = model || inMemoryWorkingModel?.model || pool[0];
  const modelsToTry = [preferred, ...pool].filter((v, i, arr) => arr.indexOf(v) === i);

  // Convert ChatMessage[] to Gemini contents
  const contents = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  // Clean, compatible generationConfig (DO NOT pass experimental thinkingConfig here to avoid 400 Bad Request)
  const payload: any = {
    contents,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  };

  if (systemInstruction) {
    payload.system_instruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  let lastError: Error | null = null;

  for (const currentModel of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${currentModel}:streamGenerateContent?alt=sse&key=${cleanKey}`;

      let response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // If streaming fails or 404s, try standard non-streaming generateContent on this model
      if (!response.ok) {
        const nonStreamEndpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${currentModel}:generateContent?key=${cleanKey}`;
        const nonStreamRes = await fetch(nonStreamEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (nonStreamRes.ok) {
          const json = await nonStreamRes.json();
          const rawParts = json?.candidates?.[0]?.content?.parts || [];
          const text = rawParts
            .filter((p: any) => !p.thought)
            .map((p: any) => p.text || "")
            .join("");
          const cleaned = cleanAiOutput(text);

          inMemoryWorkingModel = { model: currentModel, apiVersion };
          if (currentModel !== preferred && onModelSwitched) {
            onModelSwitched(currentModel);
          }
          onChunk(cleaned, cleaned);
          onComplete(cleaned);
          return;
        }

        // If non-streaming also returned error, move to next model
        const errJson = await nonStreamRes.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Model ${currentModel} returned ${nonStreamRes.status}`);
      }

      if (!response.body) {
        throw new Error("No readable stream body returned");
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;

          const jsonStr = trimmed.slice(5).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const candidates = parsed?.candidates || [];
            if (candidates.length > 0) {
              const parts = candidates[0]?.content?.parts || [];
              for (const part of parts) {
                if ((part as any).thought) continue;
                if (part?.text) {
                  accumulated += part.text;
                  const cleaned = cleanAiOutput(accumulated);
                  if (cleaned) {
                    onChunk(part.text, cleaned);
                  }
                }
              }
            }
          } catch {}
        }
      }

      // Trailing chunk check
      if (buffer.trim().startsWith("data:")) {
        try {
          const parsed = JSON.parse(buffer.trim().slice(5).trim());
          const parts = parsed?.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if ((part as any).thought) continue;
            if (part?.text) {
              accumulated += part.text;
              const cleaned = cleanAiOutput(accumulated);
              if (cleaned) {
                onChunk(part.text, cleaned);
              }
            }
          }
        } catch {}
      }

      const finalCleaned = cleanAiOutput(accumulated);
      inMemoryWorkingModel = { model: currentModel, apiVersion };
      if (currentModel !== preferred && onModelSwitched) {
        onModelSwitched(currentModel);
      }
      onComplete(finalCleaned);
      return; // Succeeded!
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(err?.message || "Generation error");
      console.warn(`Model ${currentModel} failed, trying next candidate:`, lastError.message);
      // If error is invalid API key itself, stop trying
      if (lastError.message.includes("API key not valid") || lastError.message.includes("API_KEY_INVALID")) {
        break;
      }
    }
  }

  onError(lastError || new Error("All available models failed. Please verify your Gemini API key."));
}
