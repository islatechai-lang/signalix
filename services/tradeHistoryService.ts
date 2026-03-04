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

export const tradeHistoryService = {

    async saveTrade(trade: TradeRecord): Promise<void> {
        try {
            await addDoc(collection(db, COLLECTION_NAME), {
                ...trade,
                timestamp: Timestamp.now()
            });
            console.log('[TradeHistory] Trade saved to Firestore.');
        } catch (err) {
            console.warn('[TradeHistory] Failed to save trade:', err);
        }
    },

    async getUserTrades(userId: string, maxItems = 20): Promise<TradeRecord[]> {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where("userId", "==", userId),
                orderBy("timestamp", "desc"),
                limit(maxItems)
            );

            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => {
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
            });
        } catch (err) {
            console.warn('[TradeHistory] Failed to fetch trades:', err);
            return [];
        }
    }
};
