import { Request, Response } from "express";
import { openai } from "../config/openai-config.js";

/** Helper: check if error is quota/rate related */
function isRetryableErr(err: any) {
  const status = err?.status || err?.response?.status;
  const code = err?.code || err?.response?.data?.code || err?.type;
  return status === 429 || code === "insufficient_quota" || code === "rate_limit";
}

/** Helper: call OpenAI with retries/backoff */
async function callOpenAIWithRetries(payload: any, maxRetries = 3) {
  let attempt = 0;
  while (true) {
    try {
      return await openai.chat.completions.create(payload);
    } catch (err: any) {
      attempt++;
      if (!isRetryableErr(err) || attempt > maxRetries) throw err;
      const delay = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 300);
      console.warn(`OpenAI rate/quotas hit. Retry ${attempt}/${maxRetries} after ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// Generate a new chat completion
export const generateChatCompletion = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    const response = await callOpenAIWithRetries({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
    });

    res.json({
      reply: response.choices[0].message?.content,
    });
  } catch (error: any) {
    console.error("Chat error:", {
      message: error?.message,
      status: error?.status || error?.response?.status,
      response: error?.response?.data,
    });

    if (isRetryableErr(error)) {
      const retryAfter =
        error?.response?.headers?.["retry-after"] ||
        error?.response?.headers?.get?.("retry-after") ||
        null;
      return res.status(429).json({
        message: "OpenAI rate limit / quota exceeded. Try again later.",
        retryAfter,
        error: error?.response?.data || error?.message,
      });
    }

    res.status(500).json({ error: "Something went wrong" });
  }
};

// Send all chats (placeholder – replace with DB logic later)
export const sendChatsToUser = async (req: Request, res: Response) => {
  res.json({
    chats: [
      { role: "user", content: "Hello!" },
      { role: "assistant", content: "Hi there, how can I help?" },
    ],
  });
};

// Delete all chats (placeholder – replace with DB logic later)
export const deleteChats = async (req: Request, res: Response) => {
  res.json({ message: "All chats deleted successfully." });
};
