// src/config/openai-config.ts
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config(); // Load .env before using process.env

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});
