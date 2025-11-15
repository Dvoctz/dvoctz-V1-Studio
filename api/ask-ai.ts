// Import Vercel's types for the request and response objects.
import type { VercelRequest, VercelResponse } from '@vercel/node';
// FIX: Switched from CommonJS (require) to ES Modules (import) to resolve TypeScript errors.
import { GoogleGenAI } from '@google/genai';

// FIX: Switched from CommonJS (module.exports) to ES Modules (export default).
export default async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method !== 'POST') {
      response.setHeader('Allow', ['POST']);
      return response.status(405).json({ error: { message: 'Method Not Allowed' }});
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      const errorMessage = 'The AI assistant is not configured correctly on the server. The `API_KEY` environment variable is missing.';
      console.error("Authentication Error: " + errorMessage);
      return response.status(500).json({ error: { message: errorMessage } });
    }

    if (!request.body) {
      return response.status(400).json({ error: { message: 'Missing request body.' } });
    }
    
    const { question, rules } = request.body;

    if (!question || typeof question !== 'string' || !rules || typeof rules !== 'string') {
      return response.status(400).json({ error: { message: 'Request body must contain "question" and "rules" strings.' } });
    }
    
    // The Gemini API call remains the same.
    const ai = new GoogleGenAI({ apiKey });

    const genAIResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Here are the official rules:\n---\n${rules}\n---\nBased ONLY on the rules provided, please answer the following question: "${question}"`,
        config: {
            systemInstruction: "You are an expert on the rules of this sport. Your role is to answer questions based strictly and solely on the provided rules text. If the answer cannot be found in the text, you must state that the information is not available in the provided rules. Do not infer or invent information outside of the text.",
        }
    });

    const text = genAIResponse.text;
    return response.status(200).json({ answer: text });

  } catch (error) {
    console.error('Error in ask-ai handler:', error);
    const message = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return response.status(500).json({ error: { message: `An internal server error occurred: ${message}` } });
  }
};
