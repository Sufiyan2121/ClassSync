/**
 * Google Gemini & LLM Client for ClassSync BYOK
 * Directly talks to Google Gemini API from the client's browser with streaming support.
 * Features automatic model discovery (via ModelService.ListModels) and multi-model fallbacks
 * so it never fails due to version or regional model naming differences.
 */

import { ChatMessage } from "./chatStorage";

export interface StreamOptions {
  apiKey: string;
  model?: string;
  systemInstruction?: string;
  messages: ChatMessage[];
  onChunk: (chunk: string, accumulated: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

// Preferred candidate models in order of quality, speed, and recency
const CANDIDATE_MODELS = [
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

// In-memory cache for the detected working model per session
let cachedWorkingModel: { model: string; apiVersion: string } | null = null;

/**
 * Calls Google's ModelService.ListModels to see which models the user's specific key has access to.
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
        const contentModels = rawModels
          .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
          .map((m) => m.name.replace(/^models\//, ""));

        if (contentModels.length > 0) {
          return { models: contentModels, apiVersion: ver };
        }
      }
    } catch (e) {
      console.warn(`ListModels failed on ${ver}:`, e);
    }
  }

  return { models: [], apiVersion: "v1beta" };
}

/**
 * Resolves the optimal available model for this specific key.
 */
export async function resolveWorkingModel(
  apiKey: string,
  preferredModel?: string
): Promise<{ model: string; apiVersion: string; allAvailable: string[] }> {
  if (cachedWorkingModel && (!preferredModel || preferredModel === cachedWorkingModel.model)) {
    return { ...cachedWorkingModel, allAvailable: [cachedWorkingModel.model] };
  }

  const { models: available, apiVersion } = await getAvailableModels(apiKey);

  if (available.length > 0) {
    // If preferred model is explicitly available
    if (preferredModel && available.includes(preferredModel)) {
      cachedWorkingModel = { model: preferredModel, apiVersion };
      return { model: preferredModel, apiVersion, allAvailable: available };
    }

    // Check candidate priority
    for (const cand of CANDIDATE_MODELS) {
      if (available.includes(cand)) {
        cachedWorkingModel = { model: cand, apiVersion };
        return { model: cand, apiVersion, allAvailable: available };
      }
    }

    // Pick the first available model that supports generateContent
    cachedWorkingModel = { model: available[0], apiVersion };
    return { model: available[0], apiVersion, allAvailable: available };
  }

  // Fallback if ListModels is restricted by CORS or network
  const defaultModel = preferredModel || CANDIDATE_MODELS[0];
  return { model: defaultModel, apiVersion: "v1beta", allAvailable: [] };
}

/**
 * Validates a Gemini API Key live and auto-detects the working model.
 */
export async function testGeminiApiKey(
  apiKey: string
): Promise<{ success: boolean; message: string; detectedModel?: string }> {
  if (!apiKey || apiKey.trim().length < 10) {
    return { success: false, message: "Please enter a valid Google Gemini API key." };
  }

  const cleanKey = apiKey.trim();

  try {
    const { model, apiVersion, allAvailable } = await resolveWorkingModel(cleanKey);

    // Send a 1-token test prompt to confirm generateContent works
    const testUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${cleanKey}`;
    const res = await fetch(testUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "hi" }] }],
        generationConfig: { maxOutputTokens: 2 },
      }),
    });

    if (res.ok) {
      cachedWorkingModel = { model, apiVersion };
      return {
        success: true,
        message: `Connected successfully! Using ${model}.`,
        detectedModel: model,
      };
    }

    // If initial model failed, iterate through remaining available models
    for (const altModel of (allAvailable.length > 0 ? allAvailable : CANDIDATE_MODELS)) {
      if (altModel === model) continue;
      const altUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${altModel}:generateContent?key=${cleanKey}`;
      const altRes = await fetch(altUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "hi" }] }],
          generationConfig: { maxOutputTokens: 2 },
        }),
      });

      if (altRes.ok) {
        cachedWorkingModel = { model: altModel, apiVersion };
        return {
          success: true,
          message: `Connected successfully! Using ${altModel}.`,
          detectedModel: altModel,
        };
      }
    }

    const errData = await res.json().catch(() => ({}));
    const errMsg = errData?.error?.message || `API error (${res.status}): ${res.statusText}`;
    return { success: false, message: errMsg };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Failed to reach Google Gemini API. Please check your internet connection.",
    };
  }
}

/**
 * Streams an AI response from Google Gemini with self-healing model fallback.
 */
export async function streamGeminiContent({
  apiKey,
  model,
  systemInstruction,
  messages,
  onChunk,
  onComplete,
  onError,
}: StreamOptions): Promise<void> {
  const cleanKey = apiKey.trim();

  // 1. Resolve the optimal working model
  const resolved = await resolveWorkingModel(cleanKey, model);
  const modelsToTry = [
    resolved.model,
    ...(resolved.allAvailable.length > 0 ? resolved.allAvailable : CANDIDATE_MODELS),
  ].filter((v, i, arr) => arr.indexOf(v) === i); // deduplicate

  // Convert ChatMessage[] to Gemini payload format
  const contents = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

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
      const endpoint = `https://generativelanguage.googleapis.com/${resolved.apiVersion}/models/${currentModel}:streamGenerateContent?alt=sse&key=${cleanKey}`;

      let response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // If streamGenerateContent 404s, try non-streaming generateContent on the same model
      if (!response.ok && response.status === 404) {
        const nonStreamEndpoint = `https://generativelanguage.googleapis.com/${resolved.apiVersion}/models/${currentModel}:generateContent?key=${cleanKey}`;
        const nonStreamRes = await fetch(nonStreamEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (nonStreamRes.ok) {
          const json = await nonStreamRes.json();
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          cachedWorkingModel = { model: currentModel, apiVersion: resolved.apiVersion };
          onChunk(text, text);
          onComplete(text);
          return;
        }

        // If that also failed with 404, move to next model candidate
        continue;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const msg = errData?.error?.message || `Gemini returned status ${response.status}`;
        throw new Error(msg);
      }

      if (!response.body) {
        throw new Error("ReadableStream not supported by this browser.");
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
                if (part?.text) {
                  accumulated += part.text;
                  onChunk(part.text, accumulated);
                }
              }
            }
          } catch {
            // Ignore partial JSON chunks
          }
        }
      }

      // Flush trailing buffer
      if (buffer.trim().startsWith("data:")) {
        try {
          const parsed = JSON.parse(buffer.trim().slice(5).trim());
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            accumulated += text;
            onChunk(text, accumulated);
          }
        } catch {}
      }

      cachedWorkingModel = { model: currentModel, apiVersion: resolved.apiVersion };
      onComplete(accumulated);
      return; // Succeeded!
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(err?.message || "Generation error");
      console.warn(`Model ${currentModel} failed:`, lastError.message);
      // If error is not a 404 (e.g. rate limit or bad request), don't loop endlessly
      if (lastError.message.includes("API key not valid") || lastError.message.includes("quota")) {
        break;
      }
    }
  }

  // If all candidate models failed
  onError(lastError || new Error("Failed to generate response. Please verify your Gemini API key in settings."));
}
