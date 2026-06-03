export type AiProviderId = "openai" | "gemini" | "groq";

export interface AiProviderInfo {
  id: AiProviderId;
  configured: boolean;
  model: string;
  label: string;
}

export interface AiStatus {
  configured: boolean;
  provider: AiProviderId | null;
  model: string | null;
  providers: AiProviderInfo[];
}

const PLACEHOLDER_PATTERNS = [
  /^sk-\.\.\.$/i,
  /^your[_-]?/i,
  /^xxx+$/i,
  /^placeholder$/i,
  /^changeme$/i,
];

function isRealKey(value: string | undefined): boolean {
  const key = value?.trim();
  if (!key || key.length < 8) return false;
  return !PLACEHOLDER_PATTERNS.some((p) => p.test(key));
}

function envProvider(): AiProviderId | "auto" {
  const raw = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (raw === "openai" || raw === "gemini" || raw === "groq") return raw;
  return "auto";
}

export function getProviderCatalog(): AiProviderInfo[] {
  return [
    {
      id: "openai",
      configured: isRealKey(process.env.OPENAI_API_KEY),
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      label: "OpenAI",
    },
    {
      id: "gemini",
      configured: isRealKey(process.env.GEMINI_API_KEY),
      model: process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash",
      label: "Google Gemini",
    },
    {
      id: "groq",
      configured: isRealKey(process.env.GROQ_API_KEY),
      model: process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
      label: "Groq",
    },
  ];
}

export function resolveActiveProvider(): { provider: AiProviderId; model: string } | null {
  const catalog = getProviderCatalog();
  const configured = catalog.filter((p) => p.configured);
  if (!configured.length) return null;

  const preference = envProvider();
  if (preference !== "auto") {
    const chosen = configured.find((p) => p.id === preference);
    if (chosen) return { provider: chosen.id, model: chosen.model };
  }

  const first = configured[0];
  return { provider: first.id, model: first.model };
}

export function getAiStatus(): AiStatus {
  const providers = getProviderCatalog();
  const active = resolveActiveProvider();
  return {
    configured: Boolean(active),
    provider: active?.provider ?? null,
    model: active?.model ?? null,
    providers,
  };
}

export function isAiConfigured(): boolean {
  return getAiStatus().configured;
}

async function chatOpenAI(
  apiKey: string,
  model: string,
  userPrompt: string,
  systemPrompt?: string
): Promise<string> {
  const messages: { role: string; content: string }[] = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: userPrompt });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error (${res.status}): ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

async function chatGemini(
  apiKey: string,
  model: string,
  userPrompt: string,
  systemPrompt?: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 800,
    },
  };

  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error (${res.status}): ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}

async function chatGroq(
  apiKey: string,
  model: string,
  userPrompt: string,
  systemPrompt?: string
): Promise<string> {
  const messages: { role: string; content: string }[] = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: userPrompt });

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error (${res.status}): ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

export async function chatCompletion(
  userPrompt: string,
  systemPrompt = "Respond with valid JSON only. No markdown fences."
): Promise<string> {
  const active = resolveActiveProvider();
  if (!active) {
    throw new Error(
      "No AI provider configured. Set OPENAI_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY in server environment."
    );
  }

  const { provider, model } = active;

  switch (provider) {
    case "openai":
      return chatOpenAI(process.env.OPENAI_API_KEY!.trim(), model, userPrompt, systemPrompt);
    case "gemini":
      return chatGemini(process.env.GEMINI_API_KEY!.trim(), model, userPrompt, systemPrompt);
    case "groq":
      return chatGroq(process.env.GROQ_API_KEY!.trim(), model, userPrompt, systemPrompt);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

export function parseJsonFromModel(text: string): Record<string, unknown> {
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
  }
  return JSON.parse(cleaned) as Record<string, unknown>;
}

export function providerLabel(id: AiProviderId): string {
  return getProviderCatalog().find((p) => p.id === id)?.label ?? id;
}
