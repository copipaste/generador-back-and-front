import { GoogleGenAI } from "@google/genai";

const key =  process.env.GEMINI_API_KEY 
if (!key) {
  throw new Error("Falta GEMINI_API_KEY (o NEXT_PUBLIC_GEMINI_API_KEY)");
}


export const gemini = new GoogleGenAI({ apiKey: key });

// rápido y económico; si quieres mejor reasoning usa "gemini-1.5-pro"
export const modelName = "gemini-2.5-flash";
