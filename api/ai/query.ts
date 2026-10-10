import type { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, context } = req.body || {};

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
      return res.status(200).json(parsed);
    } catch (_parseErr) {
      return res.status(200).json({
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
}
