import type { Request, Response } from 'express';

export default function handler(_req: Request, res: Response) {
  return res.status(200).json({
    status: 'ok',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
}
