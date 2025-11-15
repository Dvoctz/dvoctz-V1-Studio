import { GoogleGenAI } from '@google/genai';

// This is a standard Node.js serverless function.
// Vercel will automatically pick it up when placed in the /api directory.
export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).end('Method Not Allowed');
  }

  const apiKey = process.env.VITE_API_KEY;
  if (!apiKey) {
    console.error("VITE_API_KEY is not set in the server environment.");
    return response.status(500).json({ error: { message: 'The AI assistant is not configured on the server. The API key is missing.' } });
  }

  try {
    const { question, rules } = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;

    if (!question || typeof question !== 'string' || !rules || typeof rules !== 'string') {
      return response.status(400).json({ error: { message: 'Request body must be a JSON object with "question" and "rules" strings.' } });
    }
    
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
    return response.status(500).json({ error: { message: 'An internal server error occurred while contacting the AI assistant.' } });
  }
}
