
import { GoogleGenAI } from '@google/genai';

// This is a standard Node.js serverless function.
// Vercel will automatically pick it up when placed in the /api directory.
export default async function handler(request, response) {
  // Wrap the entire logic in a try-catch block for maximum robustness.
  // This prevents the function from crashing and ensures a proper JSON error is always returned.
  try {
    if (request.method !== 'POST') {
      response.setHeader('Allow', ['POST']);
      return response.status(405).end('Method Not Allowed');
    }

    // Check for the recommended GEMINI_API_KEY, but fall back to VITE_API_KEY for compatibility.
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_API_KEY;
    if (!apiKey) {
      const errorMessage = 'The AI assistant is not configured correctly on the server. An API key environment variable (`GEMINI_API_KEY` or `VITE_API_KEY`) is missing. Please add it in your hosting provider\'s settings.';
      console.error("Authentication Error: " + errorMessage);
      return response.status(500).json({ error: { message: errorMessage } });
    }

    // Vercel automatically parses JSON bodies. Add a check to ensure the body exists.
    if (!request.body) {
      return response.status(400).json({ error: { message: 'Missing request body.' } });
    }
    
    const { question, rules } = request.body;

    // Validate that the required properties exist and are of the correct type.
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
    // This will now catch any error, including those from the Gemini API call or unexpected runtime issues.
    console.error('Error in ask-ai handler:', error);
    const message = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return response.status(500).json({ error: { message: `An internal server error occurred: ${message}` } });
  }
}
