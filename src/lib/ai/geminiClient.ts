/**
 * Google Gemini & LLM Client for ClassSync BYOK
 * Directly talks to Google Gemini API from the client's browser with streaming support.
 * Zero server bills, zero node dependencies required.
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

const DEFAULT_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-1.5-flash";

/**
 * Validates a Gemini API Key live by sending a tiny 1-token test prompt.
 */
export async function testGeminiApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
  if (!apiKey || apiKey.trim().length < 10) {
    return { success: false, message: "Please enter a valid Google Gemini API key." };
  }

  const cleanKey = apiKey.trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${cleanKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "ping" }] }],
        generationConfig: { maxOutputTokens: 5 },
      }),
    });

    if (res.ok) {
      return { success: true, message: "Connected successfully! Gemini is ready." };
    }

    // Try fallback model if 2.5 is not yet enabled for this key
    if (res.status === 404) {
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${FALLBACK_MODEL}:generateContent?key=${cleanKey}`;
      const fallbackRes = await fetch(fallbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "ping" }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
      });
      if (fallbackRes.ok) {
        return { success: true, message: "Connected successfully (Gemini 1.5 Flash active)!" };
      }
    }

    const data = await res.json().catch(() => ({}));
    const errMsg = data?.error?.message || `API error (${res.status}): ${res.statusText}`;
    return { success: false, message: errMsg };
  } catch (err: any) {
    return { success: false, message: err?.message || "Failed to reach Google Gemini API. Please check internet connection." };
  }
}

/**
 * Streams an AI response from Google Gemini via Server-Sent Events (SSE).
 */
export async function streamGeminiContent({
  apiKey,
  model = DEFAULT_MODEL,
  systemInstruction,
  messages,
  onChunk,
  onComplete,
  onError,
}: StreamOptions): Promise<void> {
  const cleanKey = apiKey.trim();
  const targetModel = model || DEFAULT_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:streamGenerateContent?alt=sse&key=${cleanKey}`;

  // Convert ChatMessage[] to Gemini contents
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

  try {
    let response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Fallback to gemini-1.5-flash if 404
    if (!response.ok && response.status === 404 && targetModel !== FALLBACK_MODEL) {
      const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${FALLBACK_MODEL}:streamGenerateContent?alt=sse&key=${cleanKey}`;
      response = await fetch(fallbackEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error?.message || `Gemini API returned status ${response.status}`;
      throw new Error(msg);
    }

    if (!response.body) {
      throw new Error("ReadableStream not supported by this browser.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let accumulated = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // keep incomplete trailing chunk

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
          // ignore transient malformed lines in stream
        }
      }
    }

    // Flush any leftover buffer
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

    onComplete(accumulated);
  } catch (err: any) {
    console.error("Gemini stream error:", err);
    onError(err instanceof Error ? err : new Error(err?.message || "Unknown error during AI generation"));
  }
}
