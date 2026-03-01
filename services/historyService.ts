import { 
  collection, 
  addDoc, 
  deleteDoc,
  doc,
  query, 
  where, 
  limit, 
  getDocs,
  orderBy,
  Timestamp 
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { HistoryItem, AIAnalysisResult, CryptoPair, TechnicalIndicators, AggregationResult, MarketSummary } from "../types";

const COLLECTION_NAME = "analysis_history";

// Helper to send logs to the server terminal
const serverLog = (level: 'info' | 'warn' | 'error', message: string, details?: any) => {
  if (level === 'error') console.error(message, details);
  else console.log(message, details);

  fetch('/api/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, message, details })
  }).catch(() => {}); 
};

// Robust sanitization to prevent "Unsupported Field Value: undefined" errors in Firestore
const sanitizeData = (data: any): any => {
  if (data === null) return null;
  if (data === undefined) return null;
  
  // Handle NaN (Firestore doesn't like NaN in some contexts, safer to use null)
  if (typeof data === 'number' && isNaN(data)) return null;
  
  if (typeof data !== 'object') return data;
  if (data instanceof Date) return data; 

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  const newObj: any = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      if (value !== undefined) {
        newObj[key] = sanitizeData(value);
      }
    }
  }
  return newObj;
};

export const historyService = {
  
  async saveAnalysis(
    userId: string, 
    pair: CryptoPair, 
    timeframe: string, 
    result: AIAnalysisResult,
    indicators: TechnicalIndicators,
    aggregation: AggregationResult,
    marketSummary: MarketSummary
  ) {
    serverLog('info', `[History] Attempting to save full analysis for user: ${userId}`);
    
    if (!userId) {
      serverLog('error', "[History] Error: No User ID provided.");
      return;
    }

    try {
      // 1. Sanitize all input data
      const cleanResult = sanitizeData(result);
      const cleanPair = sanitizeData(pair);
      const cleanIndicators = sanitizeData(indicators);
      const cleanAggregation = sanitizeData(aggregation);
      const cleanSummary = sanitizeData(marketSummary);
      
      const payload = {
        userId,
        pair: cleanPair,
        timeframe,
        result: cleanResult,
        indicators: cleanIndicators,
        aggregation: cleanAggregation,
        marketSummary: cleanSummary,
        timestamp: Timestamp.now()
      };

      // 2. Write to Firestore
      const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
      serverLog('info', `[History] SUCCESS: Document written with ID: ${docRef.id}`);
      
    } catch (error: any) {
      serverLog('error', "[History] SAVE FAILED.", { code: error.code, message: error.message });
    }
  },

  async getUserHistory(userId: string, maxItems = 20): Promise<HistoryItem[]> {
    serverLog('info', `[History] Fetching items for user: ${userId}`);
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("userId", "==", userId),
        orderBy("timestamp", "desc"), 
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      serverLog('info', `[History] Found ${querySnapshot.size} documents.`);

      const items = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        let ts = Date.now();
        if (data.timestamp && typeof data.timestamp.toMillis === 'function') {
           ts = data.timestamp.toMillis();
        } else if (data.timestamp instanceof Date) {
           ts = data.timestamp.getTime();
        }

        return {
          id: doc.id,
          userId: data.userId,
          pair: data.pair,
          timeframe: data.timeframe,
          result: data.result,
          indicators: data.indicators,
          aggregation: data.aggregation,
          marketSummary: data.marketSummary,
          timestamp: ts
        } as HistoryItem;
      });

      return items.slice(0, maxItems);

    } catch (error: any) {
      serverLog('error', `[History] FETCH FAILED: ${error.message}`);
      return [];
    }
  },

  async deleteAnalysis(docId: string) {
    serverLog('info', `[History] Deleting document: ${docId}`);
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, docId));
      return true;
    } catch (error: any) {
      serverLog('error', `[History] DELETE FAILED: ${error.message}`);
      throw error;
    }
  }
};