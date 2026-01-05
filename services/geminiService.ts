
import { GoogleGenAI } from "@google/genai";
import { Tool } from "../types";

// Always use a named parameter and process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getInventoryAdvice = async (tools: Tool[], prompt: string) => {
  try {
    const toolContext = tools.map(t => `${t.name} (${t.department}): ${t.availableQuantity}/${t.quantity} tersedia di ${t.location}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Anda adalah Asisten Inventaris SMK Hebat. Berikut adalah data alat kami:
        ${toolContext}

        Pertanyaan Pengguna: ${prompt}

        Berikan jawaban singkat, profesional, dan membantu dalam Bahasa Indonesia.
      `
    });

    // Access .text property directly
    return response.text || "Maaf, saya sedang tidak bisa memproses permintaan Anda.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Terjadi kesalahan saat menghubungi asisten AI.";
  }
};
