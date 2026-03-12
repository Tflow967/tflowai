import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateAIResponse = async (prompt: string, history: { role: string, parts: { text: string }[] }[], userPseudo: string, userRole: string) => {
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      ...history,
      { role: "user", parts: [{ text: prompt }] }
    ],
    config: {
      systemInstruction: `Tu es Tflow IA, une intelligence artificielle moderne et futuriste.
      Le créateur de Tflow IA est Abdelmalek Bouneb.
      
      Règles de sécurité :
      - Refuse poliment de répondre aux sujets interdits, dangereux, illégaux ou inappropriés.
      - Si une question concerne un sujet interdit, réponds exactement : "Je suis désolée, mais je ne peux pas répondre à cette demande."
      
      Reconnaissance de l'utilisateur :
      - L'utilisateur actuel s'appelle ${userPseudo}.
      - Son rôle est ${userRole}.
      - Si l'utilisateur est Abdelmalek Bouneb et qu'il est VIP ou Créateur, reconnais-le comme ton créateur. Tu peux dire par exemple : "Bonjour Abdelmalek Bouneb, créateur de Tflow IA."
      
      Style :
      - Sois utile, poli et moderne.
      - Réponds en français.`,
    }
  });

  const response = await model;
  return response.text || "Je suis désolée, mais je ne peux pas répondre à cette demande.";
};
