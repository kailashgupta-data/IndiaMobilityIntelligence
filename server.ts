import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // AI Analytics Query Endpoint powered by Gemini 3.8 Flash
  app.post('/api/ai/query', async (req: Request, res: Response) => {
    try {
      const { question, context } = req.body;

      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: 'Question string is required' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: 'GEMINI_API_KEY is not set in environment' });
      }

      const ai = new GoogleGenAI();

      const systemPrompt = `You are the Lead Data Scientist & AI Solution Architect for "India Mobility Intelligence" — an executive analytics platform tracking intercity passenger movement and transportation revenue across Indian metropolitan cities (Bengaluru, Chennai, Hyderabad, Mumbai, Delhi, Pune, Kolkata, Jaipur) and four transport modes: Bus, Car, Train, Airplane.

Context Data Slice Provided by User Dashboard:
- Date Window: ${context?.dateRange || 'Current 12-Month Period'}
- Total Intercity Passengers: ${context?.totalPassengers?.toLocaleString() || 'N/A'}
- Operator Commercial Ticket Revenue: ₹${((context?.totalTicketRevenue || 0) / 10000000).toFixed(2)} Cr
- Private Road Travel Outlay (Separated Ledger): ₹${((context?.totalCarExpenditure || 0) / 10000000).toFixed(2)} Cr
- Top Volume Corridor: ${JSON.stringify(context?.topVolumeRoute || {})}
- Lead Revenue Mode: ${JSON.stringify(context?.topRevenueMode || {})}
- Mode Breakdown: ${JSON.stringify(context?.modes || [])}
- Directional Flow Samples: ${JSON.stringify(context?.directional || [])}
- Bottlenecks/Capacity Risks: ${JSON.stringify(context?.topRisks || [])}

Rules:
1. Ground answers strictly in the context data slice and state the date range.
2. Clearly distinguish simulated mock data/forecasts from observed metrics.
3. Keep the tone executive, analytical, objective, and concise.
4. Strictly maintain separation between commercial ticket revenue and private car out-of-pocket road expenditure.
5. Provide response in JSON format with keys:
   - "answer": Markdown formatted string with bold text and clean bullet points
   - "keyMetrics": array of { "label": string, "value": string }
   - "recommendations": array of 2-3 specific tactical operational actions
   - "suggestedFollowUps": array of 2 related questions
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `${systemPrompt}\n\nExecutive Question: "${question}"`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '';
      try {
        const parsed = JSON.parse(responseText);
        return res.json(parsed);
      } catch (_parseErr) {
        return res.json({
          answer: responseText,
          keyMetrics: [],
          recommendations: ['Monitor network capacity on high-density days.'],
          suggestedFollowUps: ['Which routes experienced the largest Diwali surge?'],
        });
      }
    } catch (err: any) {
      console.error('Error generating AI response:', err);
      return res.status(500).json({ error: err.message || 'Internal AI Error' });
    }
  });

  // Attach Vite middleware in development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`India Mobility Intelligence Server running on port ${PORT}`);
  });
}

startServer();
