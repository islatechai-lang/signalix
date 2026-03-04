import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from "@google/genai";
import { Resend } from 'resend';
import crypto from 'crypto';
import { executeTrade } from './tradeService.js';

// Load environment variables from .env file
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON body parsing
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// --- ENCRYPTION LOGIC ---
const ALGORITHM = 'aes-256-cbc';

function encrypt(text) {
  const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;
  if (!ENCRYPTION_SECRET) throw new Error('Missing ENCRYPTION_SECRET in .env');
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_SECRET, 'hex');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedText) {
  const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;
  if (!ENCRYPTION_SECRET) throw new Error('Missing ENCRYPTION_SECRET in .env');
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const key = Buffer.from(ENCRYPTION_SECRET, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

app.post('/api/keys/encrypt', (req, res) => {
  const { apiKey, apiSecret, passphrase } = req.body;
  if (!apiKey || !apiSecret || !passphrase) {
    return res.status(400).json({ error: 'Missing apiKey, apiSecret, or passphrase' });
  }
  try {
    const encryptedApiKey = encrypt(apiKey);
    const encryptedApiSecret = encrypt(apiSecret);
    const encryptedPassphrase = encrypt(passphrase);
    console.log(`[Server:Keys] ✅ Keys encrypted successfully`);
    res.json({ encryptedApiKey, encryptedApiSecret, encryptedPassphrase });
  } catch (error) {
    console.error('[Encryption] Error:', error.message);
    res.status(500).json({ error: 'Failed to encrypt keys' });
  }
});

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
  'gemini-3.1-pro-preview',
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
  const timeLog = new Date().toISOString().split('T')[1].substring(0, 8);
  console.log(`[${timeLog}] [Analysis] Starting for ${pairName} (${timeframe})...`);

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

  if (!apiKey) {
    console.error("[Server] Critical Error: API Key is missing.");
    return res.status(500).json({ error: "Server configuration error: API Key missing" });
  }

  const ai = new GoogleGenAI({ apiKey });

  // Prepare condensed OHLC data
  const recentOHLC = ohlc.slice(-15).map(d => ({
    t: new Date(d.time * 1000).toISOString().split('T')[1].substring(0, 5),
    o: d.open,
    h: d.high,
    l: d.low,
    c: d.close,
    v: d.volumeto
  }));

  const { hedgeFund, sentiment } = req.body;

  const prompt = `
    You are an institutional-grade market analysis engine.
    
    Analyze the following multi-layer data for ${pairName} on the ${timeframe} timeframe.
    
    [CORE MARKET DATA]
    - Current Price: ${ohlc[ohlc.length - 1].close}
    - RSI (14): ${indicators.rsi.value}
    - SMA (20/50): ${indicators.sma20.toFixed(2)} / ${indicators.sma50.toFixed(2)}
    - Bollinger Width: ${indicators.bollinger.width.toFixed(2)}%
    - MACD: ${indicators.macd.value.toFixed(4)}
    - BTC Correlation: ${req.body.aggregation?.btcCorrelation || 'Neutral'} (Crucial for Altcoin context)
    
    [HEDGE FUND AUDIT]
    - Safety Score: ${hedgeFund?.score || 'N/A'}/100
    - Status: ${hedgeFund?.status || 'N/A'}
    - Key Checks: ${JSON.stringify(hedgeFund?.points || [])}
    
    [SENTIMENT INTELLIGENCE]
    - Articles Scanned: ${sentiment?.articlesScanned || 0}
    - Consensus: ${sentiment?.consensus || 'Neutral'}
    - Narratives: ${JSON.stringify(sentiment?.narratives || [])}
    
    [PRICE ACTION (30 CANDLES)]
    ${JSON.stringify(req.body.ohlc.slice(-30))}
    
    [MARKET STATS (24H)]
    - 24h High: ${req.body.ohlc.reduce((max, p) => p.high > max ? p.high : max, 0)}
    - 24h Low: ${req.body.ohlc.reduce((min, p) => min === 0 || p.low < min ? p.low : min, 0)}
    
    [GOAL]
    Provide a robust, high-accuracy analysis. Focus on institutional safety.
    You are an expert strategist. Look for patterns, trend exhaustion, and liquidity gaps.
    If the setup is clear and supported by hedge fund audit/sentiment, do not hesitate to call it.
    [COMMANDS]
    1. INSTITUTIONAL SAFETY: If the market is completely dead or flat, output 'NEUTRAL'.
    2. ACCURACY & DECISIVENESS: If technicals and sentiment show a 80%+ alignment (Moderate/Strong/Exceptional), be DECISIVE and provide a direction. Do not over-default to 'NEUTRAL' if a clear setup is forming.
    3. If 'NEUTRAL', set targets/stoploss to "INCONCLUSIVE".
    4. EMPHASIZE OPPORTUNITY: Use your 'thoughtProcess' to justify why a trade is worth the risk.
    
    Return ONLY a valid JSON object matching the requested schema.
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

      // Removed: Artificial confidence boosting to allow real-world Moderate/Strong signals.

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

// --- TRADE EXECUTION ENDPOINT ---
app.post('/api/trade/execute', async (req, res) => {
  const { pairName, verdict, exchangeKeys } = req.body;

  console.log(`\n[Server:Trade] ==========================================`);
  console.log(`[Server:Trade] 📥 Received trade execution request`);
  console.log(`[Server:Trade]   Exchange: KuCoin Sandbox`);
  console.log(`[Server:Trade]   Pair: ${pairName}`);
  console.log(`[Server:Trade]   Verdict: ${verdict}`);
  console.log(`[Server:Trade]   Has Keys: ${!!exchangeKeys}`);
  console.log(`[Server:Trade] ==========================================`);

  if (!pairName || !verdict || !exchangeKeys) {
    console.error(`[Server:Trade] ❌ Missing required fields! pairName=${!!pairName}, verdict=${!!verdict}, exchangeKeys=${!!exchangeKeys}`);
    return res.status(400).json({ error: 'Missing pairName, verdict, or exchangeKeys.' });
  }

  try {
    console.log(`[Server:Trade] 🔓 Decrypting API keys...`);
    const apiKey = decrypt(exchangeKeys.encryptedApiKey);
    const apiSecret = decrypt(exchangeKeys.encryptedApiSecret);
    const passphrase = decrypt(exchangeKeys.encryptedPassphrase);
    console.log(`[Server:Trade] ✅ Keys decrypted successfully (key starts with: ${apiKey.substring(0, 8)}...)`);

    console.log(`[Server:Trade] 🚀 Calling executeTrade()...`);
    const tradeResult = await executeTrade(apiKey, apiSecret, passphrase, pairName, verdict);

    console.log(`[Server:Trade] 📤 Sending response to frontend:`, JSON.stringify(tradeResult, null, 2));
    res.json(tradeResult);
  } catch (e) {
    console.error(`[Server:Trade] ❌ FATAL ERROR:`, e.message);
    console.error(`[Server:Trade] Stack:`, e.stack);
    res.status(500).json({ success: false, error: e.message });
  }
});

// --- TRADE VERIFICATION ENDPOINT ---
// Query KuCoin Sandbox directly to verify trades and check balance
app.post('/api/trade/verify', async (req, res) => {
  const { exchangeKeys, pair } = req.body;

  console.log(`[Server:Verify] 🔍 Trade verification request for: ${pair || 'all pairs'}`);

  if (!exchangeKeys) {
    return res.status(400).json({ error: 'Missing exchangeKeys.' });
  }

  try {
    const apiKey = decrypt(exchangeKeys.encryptedApiKey);
    const apiSecret = decrypt(exchangeKeys.encryptedApiSecret);
    const passphrase = decrypt(exchangeKeys.encryptedPassphrase);

    const { fetchRecentOrders } = await import('./tradeService.js');
    const result = await fetchRecentOrders(apiKey, apiSecret, passphrase, pair);

    console.log(`[Server:Verify] ✅ Verification complete. Orders found: ${result.orders?.length || 0}`);
    res.json(result);
  } catch (e) {
    console.error(`[Server:Verify] ❌ Verification failed:`, e.message);
    res.status(500).json({ error: e.message });
  }
});


// --- WHOP API HELPERS ---
const whopFetch = async (endpoint, method = 'GET', body = null) => {
  const token = process.env.WHOP_API_KEY;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`https://api.whop.com/api/v2${endpoint}`, options);
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Whop API Error (${method} ${endpoint}):`, errorText);
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.error && parsed.error.message) {
        throw new Error(parsed.error.message);
      }
    } catch (e) {
      if (e.message !== errorText && !errorText.startsWith('<')) {
        throw new Error(errorText);
      }
    }
    throw new Error('Whop API request failed');
  }
  return await res.json();
};

// API Endpoint to create Whop Checkout
app.post('/api/create-checkout', async (req, res) => {
  console.log(`[Server] POST /api/create-checkout received request body:`, req.body);
  try {
    const { customerEmail, userId } = req.body;
    const whopKey = process.env.WHOP_API_KEY;
    const companyId = process.env.WHOP_COMPANY_ID;

    if (!whopKey || !companyId) {
      console.error('[Server] ERROR: Missing Whop credentials in .env');
      return res.status(500).json({ error: 'Server configuration error: Missing Whop credentials' });
    }

    // 1. Get Plan ID
    let planId = process.env.WHOP_PLAN_ID;
    if (!planId) {
      console.log(`[Server] No WHOP_PLAN_ID in env, searching for products...`);
      let productsList = await whopFetch(`/products?company_id=${companyId}`);
      let product = productsList.data?.[0];

      if (!product) {
        console.log(`[Server] No product found, creating one...`);
        product = await whopFetch('/products', 'POST', {
          company_id: companyId,
          name: 'Signalix Pro Terminal',
          visibility: 'visible'
        });
      }

      const productId = product.id;
      let plansList = await whopFetch(`/plans?company_id=${companyId}&product_id=${productId}`);
      let plan = plansList.data?.[0];

      if (!plan) {
        console.log(`[Server] No plan found, creating one...`);
        plan = await whopFetch('/plans', 'POST', {
          company_id: companyId,
          product_id: productId,
          name: 'Pro Monthly Access',
          billing_period: 30,
          initial_price: 35,
          base_currency: 'USD',
          plan_type: 'subscription'
        });
      }
      planId = plan.id;
    }

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

    const successUrl = `${origin}?payment=success`;
    console.log(`[Server] Generating checkout URL for Plan: ${planId}, Success URL: ${successUrl}`);

    res.json({ planId });
  } catch (error) {
    console.error('Server Error (Create Checkout):', error);
    res.status(500).json({ error: error.message });
  }
});

// --- SUBSCRIPTION MANAGEMENT via Whop ---

// GET /api/subscription?email=... (For displaying details)
app.get('/api/subscription', async (req, res) => {
  const { email } = req.query;
  const companyId = process.env.WHOP_COMPANY_ID;

  if (!process.env.WHOP_API_KEY || !email) {
    return res.status(400).json({ error: 'Missing token or email' });
  }

  try {
    console.log(`[Server] Fetching Whop memberships for: ${email}`);
    // Check memberships for this email across the company
    const membersRes = await whopFetch(`/memberships?company_id=${companyId}&email=${encodeURIComponent(email)}`);
    const memberships = membersRes.data || [];
    console.log(`[Server] Found ${memberships.length} memberships for ${email}`);

    if (memberships.length === 0) {
      return res.json({ found: false, message: 'No customer found' });
    }

    // Find active or trialing
    const activeSub = memberships.find(m => m.valid === true);

    if (activeSub) {
      res.json({
        found: true,
        id: activeSub.id,
        status: activeSub.status,
        current_period_end: activeSub.expires_at || activeSub.renewal_period_end || null,
        cancel_at_period_end: activeSub.cancel_at_period_end,
        amount: activeSub.plan?.initial_price || 0,
        currency: activeSub.plan?.base_currency || 'USD'
      });
    } else {
      // Check for any canceled but valid till end
      const canceledButValid = memberships.find(m => m.status === 'canceled' && m.valid === true);

      if (canceledButValid) {
        res.json({
          found: true,
          id: canceledButValid.id,
          status: canceledButValid.status,
          current_period_end: canceledButValid.expires_at || canceledButValid.renewal_period_end || null,
          cancel_at_period_end: true
        });
      } else {
        const latestExp = memberships[0];
        res.json({
          found: true,
          id: latestExp.id,
          status: latestExp.status,
          current_period_end: latestExp.expires_at || latestExp.renewal_period_end || null
        });
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
  const companyId = process.env.WHOP_COMPANY_ID;

  if (!process.env.WHOP_API_KEY || !email) {
    return res.status(400).json({ error: 'Missing Data' });
  }

  try {
    console.log(`[Server] Syncing Whop Pro status for: ${email}`);
    const membersRes = await whopFetch(`/memberships?company_id=${companyId}&email=${encodeURIComponent(email)}`);
    const memberships = membersRes.data || [];

    console.log(`[Server] Memberships data size: ${memberships.length}`);
    if (memberships.length > 0) {
      console.log(`[Server] First membership status: ${memberships[0].status}, Valid until: ${memberships[0].valid_until}`);
    }

    if (memberships.length === 0) {
      return res.json({ isPro: false });
    }

    const validSub = memberships.find(m => m.valid === true);

    console.log(`[Server] Result for ${email}: isPro = ${!!validSub}`);
    res.json({ isPro: !!validSub });
  } catch (error) {
    console.error('Sync Error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// POST /api/subscription/cancel
app.post('/api/subscription/cancel', async (req, res) => {
  const { subscriptionId } = req.body;

  if (!process.env.WHOP_API_KEY || !subscriptionId) {
    return res.status(400).json({ error: 'Missing Data' });
  }

  try {
    const result = await whopFetch(`/memberships/${subscriptionId}/cancel`, 'POST');
    res.json(result);
  } catch (error) {
    console.error('Cancellation Exception:', error);
    // Try to pass the specific Whop error if available
    res.status(500).json({ error: error.message || 'Failed to cancel subscription' });
  }
});

// --- NOTIFICATION ENDPOINT ---
app.post('/api/notify-pro-click', async (req, res) => {
  const { user } = req.body;
  if (!user) return res.status(400).json({ error: 'Missing user data' });

  // Debug: Log environment variable presence
  console.log(`[Notification] Triggered for user: ${user.email}`);
  if (!process.env.RESEND_API_KEY) console.warn('[Notification] MISSING: RESEND_API_KEY');
  if (!process.env.NOTIFICATION_EMAIL) console.warn('[Notification] MISSING: NOTIFICATION_EMAIL');

  try {
    const { data, error } = await resend.emails.send({
      from: `Signalix Notifications <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: [process.env.NOTIFICATION_EMAIL || 'princederder44@gmail.com'],
      subject: '🚀 New Pro Interest: "Get Pro" Clicked',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #00f3ff;">New Pro Interest Detected</h2>
          <p>A user has clicked the <strong>"Get Pro"</strong> button on the dashboard.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p><strong>User Details:</strong></p>
          <ul>
            <li><strong>Name:</strong> ${user.name}</li>
            <li><strong>Email:</strong> ${user.email}</li>
            <li><strong>User ID:</strong> ${user.id}</li>
            <li><strong>Current Credits:</strong> ${user.credits}</li>
            <li><strong>Joined At:</strong> ${new Date(user.joinedAt).toLocaleString()}</li>
          </ul>
        </div>
      `
    });

    if (error) {
      console.error('[Notification] Resend Error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('[Notification] Success! Email ID:', data?.id);
    res.json({ success: true, id: data?.id });
  } catch (err) {
    console.error('[Notification] Exception:', err);
    res.status(500).json({ error: err.message });
  }
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});