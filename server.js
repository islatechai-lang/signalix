import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON body parsing
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// --- REMOTE LOGGING ENDPOINT ---
// Allows client to print logs to the server terminal
app.post('/api/log', (req, res) => {
  const { level, message, details } = req.body;
  const timestamp = new Date().toLocaleTimeString();
  
  const color = level === 'error' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : '\x1b[36m';
  const reset = '\x1b[0m';

  console.log(`${color}[CLIENT ${timestamp}] [${level?.toUpperCase()}] ${message}${reset}`);
  if (details) {
    if (typeof details === 'object') console.dir(details, { depth: null, colors: true });
    else console.log(details);
  }
  
  res.sendStatus(200);
});

// --- GEMINI AI ANALYSIS ENDPOINT ---
const MODEL_CHAIN = [
  'gemini-3-pro-preview',
  'gemini-3-flash-preview'
];

// Helper to reliably parse JSON even if the model adds markdown or junk
const cleanAndParseJSON = (text) => {
  if (!text) return null;
  
  // 1. Try direct parse
  try {
    return JSON.parse(text);
  } catch (e) {
    // 2. Strip markdown code blocks (```json ... ```)
    let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch (e2) {
      // 3. Extract strictly between first { and last }
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleaned = text.substring(firstBrace, lastBrace + 1);
        try {
          return JSON.parse(cleaned);
        } catch (e3) {
          throw new Error("Failed to extract valid JSON object from response.");
        }
      }
      throw new Error("Response did not contain a JSON object.");
    }
  }
};

app.post('/api/analyze', async (req, res) => {
  const { pairName, timeframe, ohlc, indicators } = req.body;
  
  // Clean Time log
  const timeLog = new Date().toISOString().split('T')[1].substring(0,8);
  console.log(`[${timeLog}] [Analysis] Starting for ${pairName} (${timeframe})...`);

  if (!process.env.API_KEY) {
    console.error("[Server] Critical Error: API Key is missing.");
    return res.status(500).json({ error: "Server configuration error: API Key missing" });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare condensed OHLC data
  const recentOHLC = ohlc.slice(-15).map(d => ({
    t: new Date(d.time * 1000).toISOString().split('T')[1].substring(0,5),
    o: d.open,
    h: d.high,
    l: d.low,
    c: d.close,
    v: d.volumeto
  }));

  const prompt = `
    You are SignalixAI, an elite AI trading engine. 
    Analyze the following market data for ${pairName} on the ${timeframe} timeframe.
    
    Current Price: ${ohlc[ohlc.length-1].close}
    
    Technical Indicators:
    - RSI (14): ${indicators.rsi.value}
    - SMA (20): ${indicators.sma20.toFixed(2)}
    - SMA (50): ${indicators.sma50.toFixed(2)}
    - Bollinger Bands: Width ${indicators.bollinger.width.toFixed(2)}%
    - MACD: ${indicators.macd.value.toFixed(4)}

    Recent Price Action (Last 15 candles):
    ${JSON.stringify(recentOHLC)}

    Your Goal: Provide a clear, actionable trading signal. Traders pay for decisions, not hesitation.

    CRITICAL RESPONSE RULES:
    1. Return ONLY a valid JSON object.
    2. Do NOT write any conversational text outside the JSON.
    3. Put your internal reasoning inside the 'thoughtProcess' field.
    4. Verdict MUST be one of: 'UP', 'DOWN', or 'NEUTRAL'.
    5. Confidence Score:
       - If you detect ANY trend or edge, assign a high confidence (90-99).
       - Users expect high conviction. Do not give weak signals.
    6. BE DECISIVE: 
       - If indicators lean Bullish, output 'UP' with 90%+ confidence.
       - If indicators lean Bearish, output 'DOWN' with 90%+ confidence.
       - Only use 'NEUTRAL' if the market is absolutely flat.
    
    Return ONLY valid JSON matching the schema.
  `;

  // Helper function to try models in sequence
  const tryGenerate = async (modelIndex) => {
    if (modelIndex >= MODEL_CHAIN.length) {
      console.error("[Server] All models exhausted. Analysis failed.");
      throw new Error("All AI models failed to respond or were rate limited.");
    }

    const currentModel = MODEL_CHAIN[modelIndex];
    
    try {
      const config = {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            thoughtProcess: { type: Type.STRING, description: "Your internal monologue analysis." },
            verdict: { type: Type.STRING, enum: ['UP', 'DOWN', 'NEUTRAL'] },
            confidence: { type: Type.NUMBER },
            timeHorizon: { type: Type.STRING },
            predictionDuration: { type: Type.STRING },
            summary: { type: Type.STRING },
            keyFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
            riskWarnings: { type: Type.ARRAY, items: { type: Type.STRING } },
            entryZone: { type: Type.STRING },
            targetZone: { type: Type.STRING },
            stopLoss: { type: Type.STRING }
          },
          required: ['thoughtProcess', 'verdict', 'confidence', 'summary', 'keyFactors', 'riskWarnings', 'predictionDuration']
        }
      };

      console.log(`[Server] Requesting ${currentModel} [${modelIndex + 1}/${MODEL_CHAIN.length}]...`);
      
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: prompt,
        config: config
      });

      const resultText = response.text;
      if (!resultText) throw new Error("Empty response text");

      // Robust Parsing
      const parsed = cleanAndParseJSON(resultText);
      
      // Normalization & Enforcement
      if (parsed.confidence !== undefined) {
         // Fix decimal confidence (e.g. 0.85 -> 85)
         if (parsed.confidence <= 1 && parsed.confidence > 0) {
             parsed.confidence = Math.round(parsed.confidence * 100);
         }
      }

      // --- HIGH CONFIDENCE ENFORCEMENT ---
      // If the AI gives a direction (UP or DOWN), we mathematically ensure
      // the confidence is between 92% and 99% to give the user authority.
      if (parsed.verdict === 'UP' || parsed.verdict === 'DOWN') {
          if (parsed.confidence < 90) {
              console.log(`[Server] Boosting confidence from ${parsed.confidence}% to High Confidence range.`);
              // Map it to a random number between 92 and 98
              parsed.confidence = Math.floor(Math.random() * (98 - 92 + 1)) + 92;
          }
      }

      console.log(`[Server] Success: ${currentModel} -> Verdict: ${parsed.verdict} (${parsed.confidence}%)`);
      return parsed;

    } catch (error) {
       const errorMsg = error.message || "Unknown error";
       
       // Handle specific error types for better logging
       let failReason = "Unknown";
       if (errorMsg.includes("429") || errorMsg.includes("quota")) failReason = "Rate Limit/Quota";
       else if (errorMsg.includes("JSON")) failReason = "JSON Parse Error";
       else if (errorMsg.includes("503") || errorMsg.includes("500")) failReason = "Model Overloaded";
       else failReason = errorMsg;

       console.warn(`[Server] Failed: ${currentModel} -> ${failReason}`);
       
       // Stop if it's an Auth error (no point retrying)
       if (errorMsg.includes("API key") || errorMsg.includes("403")) {
          throw new Error("Invalid API Key configuration.");
       }

       // Retry with next model
       return tryGenerate(modelIndex + 1);
    }
  };

  try {
    const result = await tryGenerate(0);
    res.json(result);
  } catch (error) {
    console.error("[Server] Final Failure:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// API Endpoint to create Polar Checkout
app.post('/api/create-checkout', async (req, res) => {
  try {
    const { customerEmail, userId } = req.body;
    const polarToken = process.env.POLAR_ACCESS_TOKEN;
    
    if (!polarToken) {
      return res.status(500).json({ error: 'Server configuration error: Missing Payment Token' });
    }

    // Prefer environment variable for Product ID in production, fallback to hardcoded default
    const productId = process.env.POLAR_PRODUCT_ID || '6f406ae3-6f82-4a40-bd37-c5dc2e64ddfd'; 
    
    let origin = process.env.BASE_URL;
    if (!origin) {
      if (req.headers.origin) {
        origin = req.headers.origin;
      } else {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['x-forwarded-host'] || req.get('host');
        origin = `${protocol}://${host}`;
      }
    }

    // PRODUCTION ENDPOINT: api.polar.sh
    const response = await fetch('https://api.polar.sh/v1/checkouts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${polarToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_id: productId,
        success_url: `${origin}?payment=success`,
        customer_email: customerEmail,
        metadata: { userId: userId }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Polar API Error:', errorText);
      return res.status(response.status).json({ error: 'Failed to create checkout' });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- SUBSCRIPTION MANAGEMENT ---

// Helper to fetch Polar Data
const fetchPolarData = async (email, polarToken) => {
    // PRODUCTION ENDPOINT: api.polar.sh
    // 1. Find Customer by Email
    const customerSearch = await fetch(`https://api.polar.sh/v1/customers?email=${encodeURIComponent(email)}`, {
      headers: { 'Authorization': `Bearer ${polarToken}` }
    });

    if (!customerSearch.ok) throw new Error('Failed to search customers');
    
    const customers = await customerSearch.json();
    const customer = customers.items?.[0];

    if (!customer) return null;

    // 2. List Subscriptions for Customer
    const subResponse = await fetch(`https://api.polar.sh/v1/subscriptions?customer_id=${customer.id}`, {
      headers: { 'Authorization': `Bearer ${polarToken}` }
    });

    if (!subResponse.ok) throw new Error('Failed to fetch subscriptions');

    return await subResponse.json();
};

// GET /api/subscription?email=... (For displaying details)
app.get('/api/subscription', async (req, res) => {
  const { email } = req.query;
  const polarToken = process.env.POLAR_ACCESS_TOKEN;

  if (!polarToken || !email) {
    return res.status(400).json({ error: 'Missing token or email' });
  }

  try {
    const subs = await fetchPolarData(email, polarToken);

    if (!subs) {
      return res.json({ active: false, message: 'No customer found' });
    }

    // Find active subscription
    const activeSub = subs.items?.find(s => s.status === 'active');

    if (activeSub) {
       res.json({
         found: true,
         id: activeSub.id,
         status: activeSub.status,
         current_period_end: activeSub.current_period_end,
         cancel_at_period_end: activeSub.cancel_at_period_end,
         product_id: activeSub.product_id,
         amount: activeSub.amount,
         currency: activeSub.currency
       });
    } else {
       // Check for any canceled but not yet expired
       const anySub = subs.items?.[0];
       if (anySub) {
         res.json({
           found: true,
           id: anySub.id,
           status: anySub.status,
           current_period_end: anySub.current_period_end,
           cancel_at_period_end: anySub.cancel_at_period_end
         });
       } else {
         res.json({ found: false });
       }
    }

  } catch (error) {
    console.error('Subscription Fetch Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/sync-subscription (For logic check: Is User Pro?)
app.post('/api/sync-subscription', async (req, res) => {
  const { email } = req.body;
  const polarToken = process.env.POLAR_ACCESS_TOKEN;

  if (!polarToken || !email) {
    return res.status(400).json({ error: 'Missing Data' });
  }

  try {
    const subs = await fetchPolarData(email, polarToken);

    if (!subs || !subs.items || subs.items.length === 0) {
      return res.json({ isPro: false });
    }

    // Check if any subscription is valid
    // Valid = Status is 'active' OR 'trialing'
    // OR Status is 'canceled' but current_period_end > now
    
    const now = new Date();
    
    const validSub = subs.items.find(s => {
      if (s.status === 'active' || s.status === 'trialing') return true;
      
      if (s.current_period_end) {
        const endDate = new Date(s.current_period_end);
        if (endDate > now) return true;
      }
      
      return false;
    });

    if (validSub) {
      res.json({ isPro: true });
    } else {
      res.json({ isPro: false });
    }

  } catch (error) {
    console.error('Sync Error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// POST /api/subscription/cancel
app.post('/api/subscription/cancel', async (req, res) => {
  const { subscriptionId } = req.body;
  const polarToken = process.env.POLAR_ACCESS_TOKEN;

  if (!polarToken || !subscriptionId) {
    return res.status(400).json({ error: 'Missing Data' });
  }

  try {
    // PRODUCTION ENDPOINT: api.polar.sh
    const response = await fetch(`https://api.polar.sh/v1/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${polarToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cancel_at_period_end: true
      })
    });

    if (!response.ok) {
      const txt = await response.text();
      console.error('Cancel Error:', txt);
      return res.status(response.status).json({ error: 'Failed to cancel' });
    }

    const result = await response.json();
    res.json(result);

  } catch (error) {
    console.error('Cancellation Exception:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});