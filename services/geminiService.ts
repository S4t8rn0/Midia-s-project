import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || ''; // Ensure this is set in your environment
const ai = new GoogleGenAI({ apiKey });

export const generateContentSuggestion = async (prompt: string): Promise<string> => {
  if (!apiKey) return "API Key not configured. Please check your environment variables.";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a creative assistant for a church media team. Keep responses concise, inspiring, and professional.",
      }
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate content. Please try again.";
  }
};

export const generateTaskIdeas = async (topic: string): Promise<string[]> => {
    if (!apiKey) return ["Configure API Key to use AI features"];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate 3 actionable Kanban task titles for a church media team regarding: ${topic}. Return only the titles separated by newlines.`,
        });
        const text = response.text || "";
        return text.split('\n').filter(t => t.trim().length > 0);
    } catch (error) {
        console.error("Gemini API Error:", error);
        return ["Error generating ideas"];
    }
}
