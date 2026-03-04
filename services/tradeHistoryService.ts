import {
    collection,
    addDoc,
    query,
    where,
    limit,
    getDocs,
    orderBy,
    Timestamp
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { TradeRecord } from "../types";

const COLLECTION_NAME = "trades";

// Server-side logging helper
const serverLog = (level: 'info' | 'warn' | 'error', message: string, details?: any) => {
    if (level === 'error') console.error(message, details);
    else if (level === 'warn') console.warn(message, details);
    else console.log(message, details);

    fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, message, details: details ? String(details) : undefined })
    }).catch(() => { });
};

export const tradeHistoryService = {

    async saveTrade(trade: TradeRecord): Promise<void> {
        serverLog('info', `[TradeHistory] 💾 Saving trade to Firestore...`, `${trade.side} ${trade.pair} | Amount: ${trade.amount} | Price: $${trade.price}`);
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...trade,
                timestamp: Timestamp.now()
            });
            serverLog('info', `[TradeHistory] ✅ Trade saved! Doc ID: ${docRef.id}`);
        } catch (err: any) {
            serverLog('error', `[TradeHistory] ❌ Failed to save trade to Firestore!`, err?.message || err);
            // Don't throw — this is non-critical
        }
    },

    async getUserTrades(userId: string, maxItems = 20): Promise<TradeRecord[]> {
        serverLog('info', `[TradeHistory] 📋 Fetching trade history for user: ${userId}`);
        try {
            // Try with orderBy first (requires composite index)
            let trades: TradeRecord[] = [];
            try {
                const q = query(
                    collection(db, COLLECTION_NAME),
                    where("userId", "==", userId),
                    orderBy("timestamp", "desc"),
                    limit(maxItems)
                );
                const snapshot = await getDocs(q);
                trades = snapshot.docs.map(doc => this.mapDoc(doc));
                serverLog('info', `[TradeHistory] ✅ Found ${trades.length} trades (ordered query)`);
            } catch (indexErr: any) {
                // If composite index is missing, Firestore throws an error with a URL to create it
                serverLog('warn', `[TradeHistory] ⚠️ Ordered query failed (likely missing Firestore composite index). Falling back to simple query.`);
                serverLog('warn', `[TradeHistory] 💡 To fix: Check the error below for a URL to create the index automatically:`);
                serverLog('error', `[TradeHistory] Index error:`, indexErr?.message || indexErr);

                // Fallback: query without orderBy (works without composite index)
                const fallbackQ = query(
                    collection(db, COLLECTION_NAME),
                    where("userId", "==", userId),
                    limit(maxItems)
                );
                const snapshot = await getDocs(fallbackQ);
                trades = snapshot.docs.map(doc => this.mapDoc(doc));
                // Sort client-side
                trades.sort((a, b) => b.timestamp - a.timestamp);
                serverLog('info', `[TradeHistory] ✅ Found ${trades.length} trades (fallback query, client-sorted)`);
            }

            return trades;
        } catch (err: any) {
            serverLog('error', `[TradeHistory] ❌ FATAL: Could not fetch trades at all!`, err?.message || err);
            return [];
        }
    },

    mapDoc(doc: any): TradeRecord {
        const data = doc.data();
        let ts = Date.now();
        if (data.timestamp && typeof data.timestamp.toMillis === 'function') {
            ts = data.timestamp.toMillis();
        }
        return {
            id: doc.id,
            userId: data.userId,
            pair: data.pair,
            side: data.side,
            amount: data.amount,
            price: data.price,
            cost: data.cost,
            orderId: data.orderId,
            status: data.status,
            error: data.error,
            timestamp: ts
        } as TradeRecord;
    }
};
