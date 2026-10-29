// Ilm Dost - Netlify serverless chatbot backend.
// The browser never receives GROQ_API_KEY. Set it in Netlify's environment variables.

const SYSTEM_PROMPT =
  "You are Ilm Dost, a friendly learning assistant. " +
  "Explain things clearly for school students. " +
  "Use the language the student asks for. " +
  "Keep answers short unless more detail is requested. " +
  "Admit uncertainty and do not invent sources.";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export default async function handler(request) {
  if (request.method !== "POST") {
    return json({ error: "Use POST to send a chat message." }, 405);
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return json({ error: "Ilm Dost is not configured yet. Add GROQ_API_KEY in Netlify settings." }, 503);
  }

  let data;
  try {
    const rawBody = await request.text();
    if (rawBody.length > 135000) {
      return json({ error: "Request is too large." }, 413);
    }
    data = JSON.parse(rawBody);
  } catch {
    return json({ error: "Please send a JSON object." }, 400);
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return json({ error: "Please send a JSON object." }, 400);
  }
  const message = data.message;
  if (typeof message !== "string" || !message.trim()) {
    return json({ error: "Please type a message." }, 400);
  }
  const cleanMessage = message.trim();
  if (cleanMessage.length > 1000) {
    return json({ error: "Please use 1,000 characters or fewer." }, 400);
  }

  const history = data.history === undefined ? [] : data.history;
  if (!Array.isArray(history) || history.length > 10) {
    return json({ error: "Invalid conversation history." }, 400);
  }

  const cleanHistory = [];
  for (let i = 0; i < history.length; i++) {
    const item = history[i];
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return json({ error: "Invalid history item." }, 400);
    }
    const expectedRole = i % 2 === 0 ? "user" : "assistant";
    if (
      item.role !== expectedRole ||
      typeof item.content !== "string" ||
      !item.content.trim() ||
      item.content.length > 12000
    ) {
      return json({ error: "Invalid history message." }, 400);
    }
    cleanHistory.push({ role: expectedRole, content: item.content });
  }
  if (cleanHistory.length % 2 !== 0) {
    return json({ error: "Incomplete conversation history." }, 400);
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...cleanHistory,
          { role: "user", content: cleanMessage },
        ],
        max_completion_tokens: 1024,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (response.status === 401 || response.status === 403) {
      return json({ error: "The Groq API key was rejected. Check GROQ_API_KEY in Netlify." }, 503);
    }
    if (response.status === 429) {
      return json({ error: "The AI usage limit was reached. Please try later." }, 429);
    }
    if (!response.ok) {
      console.error("Groq request failed", response.status);
      return json({ error: "Could not reach the AI service. Please try again." }, 502);
    }

    const result = await response.json();
    const reply = result?.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      return json({ error: "The AI returned no answer. Please try again." }, 502);
    }
    return json({ reply });
  } catch (error) {
    console.error("Groq network/timeout error", error?.name || "unknown");
    return json({ error: "Could not reach the AI service. Please try again." }, 502);
  }
}
