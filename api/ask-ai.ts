import type { VercelRequest, VercelResponse } from '@vercel/node';

// This file is deprecated as the AI feature has been removed.
// It is kept as a placeholder to avoid build errors if referenced elsewhere,
// but it contains no logic or API keys.

export default async (request: VercelRequest, response: VercelResponse) => {
  return response.status(404).json({ message: "AI Assistant is disabled." });
};
