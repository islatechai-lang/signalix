import ccxt from 'ccxt';

/**
 * Execute a market trade on KuCoin Sandbox
 * Every single step is logged for debugging via Render server logs
 */
export async function executeTrade(apiKey, apiSecret, passphrase, pair, verdict) {
    console.log(`\n========================================`);
    console.log(`[TRADE] ⚡ NEW TRADE EXECUTION REQUEST`);
    console.log(`[TRADE] Exchange: KuCoin Sandbox`);
    console.log(`[TRADE] Pair: ${pair} | Verdict: ${verdict}`);
    console.log(`[TRADE] Timestamp: ${new Date().toISOString()}`);
    console.log(`========================================`);

    try {
        // STEP 1: Initialize exchange
        console.log(`[TRADE] Step 1/7: Initializing ccxt KuCoin Sandbox connection...`);
        const exchange = new ccxt.kucoin({
            apiKey: apiKey,
            secret: apiSecret,
            password: passphrase,
            enableRateLimit: true,
            urls: {
                api: {
                    public: 'https://openapi-sandbox.kucoin.com',
                    private: 'https://openapi-sandbox.kucoin.com',
                }
            }
        });
        console.log(`[TRADE] Step 1/7: ✅ Exchange initialized with sandbox URL`);

        // STEP 2: Load markets
        console.log(`[TRADE] Step 2/7: Loading available markets...`);
        await exchange.loadMarkets();
        const marketCount = Object.keys(exchange.markets).length;
        console.log(`[TRADE] Step 2/7: ✅ Loaded ${marketCount} markets`);

        // STEP 3: Validate pair
        console.log(`[TRADE] Step 3/7: Checking if ${pair} is available...`);
        if (!exchange.markets[pair]) {
            const availablePairs = Object.keys(exchange.markets).filter(p => p.includes('USDT')).slice(0, 20).join(', ');
            console.error(`[TRADE] Step 3/7: ❌ FAILED - ${pair} NOT available on KuCoin Sandbox`);
            console.error(`[TRADE] Available USDT pairs: ${availablePairs}`);
            throw new Error(`${pair} is not available on KuCoin Sandbox. Available: ${availablePairs}`);
        }
        console.log(`[TRADE] Step 3/7: ✅ ${pair} is available`);

        // STEP 4: Check balance
        console.log(`[TRADE] Step 4/7: Fetching account balance...`);
        const balance = await exchange.fetchBalance();
        const quoteAsset = pair.split('/')[1]; // e.g., USDT
        const baseAsset = pair.split('/')[0];  // e.g., BTC
        const availableQuote = balance?.free?.[quoteAsset] || 0;
        const availableBase = balance?.free?.[baseAsset] || 0;
        console.log(`[TRADE] Step 4/7: ✅ Balance → ${baseAsset}: ${availableBase} | ${quoteAsset}: ${availableQuote}`);

        // STEP 5: Get current price
        console.log(`[TRADE] Step 5/7: Fetching current price for ${pair}...`);
        const ticker = await exchange.fetchTicker(pair);
        const price = ticker.last;
        if (!price) {
            console.error(`[TRADE] Step 5/7: ❌ FAILED - Could not fetch price. Ticker data:`, JSON.stringify(ticker));
            throw new Error(`Could not fetch price for ${pair}`);
        }
        console.log(`[TRADE] Step 5/7: ✅ Current price: $${price}`);

        // STEP 6: Calculate order
        const side = verdict === 'UP' ? 'buy' : 'sell';
        let amount = 10 / price; // ~$10 worth
        const market = exchange.markets[pair];
        if (market?.precision?.amount !== undefined) {
            amount = exchange.amountToPrecision(pair, amount);
        }
        amount = parseFloat(amount);

        console.log(`[TRADE] Step 6/7: Calculated order → ${side.toUpperCase()} ${amount} ${baseAsset} @ $${price} (~$${(amount * price).toFixed(2)})`);

        // Balance check
        if (side === 'buy' && availableQuote < 10) {
            console.error(`[TRADE] Step 6/7: ❌ INSUFFICIENT BALANCE - Need ~$10 ${quoteAsset}, have ${availableQuote.toFixed(2)}`);
            throw new Error(`Insufficient ${quoteAsset} balance (${availableQuote.toFixed(2)}). Need ~$10.`);
        }
        if (side === 'sell' && availableBase < amount) {
            console.error(`[TRADE] Step 6/7: ❌ INSUFFICIENT BALANCE - Need ${amount} ${baseAsset}, have ${availableBase}`);
            throw new Error(`Insufficient ${baseAsset} balance (${availableBase}). Need ${amount}.`);
        }

        // STEP 7: Execute trade
        console.log(`[TRADE] Step 7/7: 🚀 SENDING MARKET ORDER TO KUCOIN SANDBOX...`);
        console.log(`[TRADE]   → Side: ${side.toUpperCase()}`);
        console.log(`[TRADE]   → Pair: ${pair}`);
        console.log(`[TRADE]   → Amount: ${amount} ${baseAsset}`);
        console.log(`[TRADE]   → Estimated Cost: ~$${(amount * price).toFixed(2)} ${quoteAsset}`);

        const order = await exchange.createMarketOrder(pair, side, amount);

        const result = {
            success: true,
            orderId: order.id,
            side: side.toUpperCase(),
            pair: pair,
            amount: parseFloat(order.amount || amount),
            price: parseFloat(order.average || order.price || price),
            cost: parseFloat(order.cost || (amount * price)),
            timestamp: Date.now(),
            rawOrder: {
                id: order.id,
                status: order.status,
                filled: order.filled,
                remaining: order.remaining,
                fee: order.fee
            }
        };

        console.log(`[TRADE] ========================================`);
        console.log(`[TRADE] ✅ TRADE EXECUTED SUCCESSFULLY!`);
        console.log(`[TRADE]   Order ID: ${result.orderId}`);
        console.log(`[TRADE]   Side: ${result.side}`);
        console.log(`[TRADE]   Amount: ${result.amount} ${baseAsset}`);
        console.log(`[TRADE]   Price: $${result.price}`);
        console.log(`[TRADE]   Total Cost: $${result.cost.toFixed(2)} ${quoteAsset}`);
        console.log(`[TRADE]   Order Status: ${order.status}`);
        console.log(`[TRADE]   Filled: ${order.filled} / Remaining: ${order.remaining}`);
        if (order.fee) console.log(`[TRADE]   Fee: ${JSON.stringify(order.fee)}`);
        console.log(`[TRADE] ========================================\n`);

        return result;
    } catch (error) {
        console.error(`[TRADE] ========================================`);
        console.error(`[TRADE] ❌ TRADE EXECUTION FAILED!`);
        console.error(`[TRADE]   Pair: ${pair}`);
        console.error(`[TRADE]   Verdict: ${verdict}`);
        console.error(`[TRADE]   Error: ${error.message}`);
        if (error.message.includes('apiKey') || error.message.includes('key')) console.error(`[TRADE]   💡 HINT: Your API key might be invalid. Regenerate at sandbox.kucoin.com`);
        if (error.message.includes('insufficient') || error.message.includes('balance')) console.error(`[TRADE]   💡 HINT: The sandbox account may need more funds. Check your balance.`);
        if (error.message.includes('not available')) console.error(`[TRADE]   💡 HINT: This pair doesn't exist on KuCoin Sandbox.`);
        console.error(`[TRADE] ========================================\n`);
        return { success: false, error: error.message };
    }
}

/**
 * Fetch recent orders from KuCoin Sandbox to VERIFY trades
 */
export async function fetchRecentOrders(apiKey, apiSecret, passphrase, pair) {
    console.log(`[TRADE-VERIFY] Fetching recent orders for ${pair || 'all pairs'}...`);
    try {
        const exchange = new ccxt.kucoin({
            apiKey, secret: apiSecret, password: passphrase, enableRateLimit: true,
            urls: {
                api: {
                    public: 'https://openapi-sandbox.kucoin.com',
                    private: 'https://openapi-sandbox.kucoin.com',
                }
            }
        });
        await exchange.loadMarkets();

        // Fetch balance
        const balance = await exchange.fetchBalance();
        const usdt = balance?.free?.USDT || 0;
        const btc = balance?.free?.BTC || 0;
        const eth = balance?.free?.ETH || 0;

        // Fetch recent orders
        let orders = [];
        try {
            if (pair && exchange.markets[pair]) {
                orders = await exchange.fetchOrders(pair, undefined, 10);
            } else {
                for (const p of ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']) {
                    if (exchange.markets[p]) {
                        try {
                            const pairOrders = await exchange.fetchOrders(p, undefined, 5);
                            orders = orders.concat(pairOrders);
                        } catch (e) {
                            // Some pairs may not have orders, skip
                        }
                    }
                }
            }
        } catch (e) {
            console.warn(`[TRADE-VERIFY] Could not fetch orders: ${e.message}`);
        }

        const result = {
            balance: { USDT: usdt, BTC: btc, ETH: eth },
            orders: orders.map(o => ({
                id: o.id,
                pair: o.symbol,
                side: o.side?.toUpperCase(),
                amount: o.amount,
                price: o.average || o.price,
                cost: o.cost,
                status: o.status,
                timestamp: o.timestamp,
                datetime: o.datetime
            }))
        };

        console.log(`[TRADE-VERIFY] ✅ Found ${result.orders.length} orders. Balance: ${usdt} USDT, ${btc} BTC, ${eth} ETH`);
        return result;
    } catch (error) {
        console.error(`[TRADE-VERIFY] ❌ Failed: ${error.message}`);
        return { balance: {}, orders: [], error: error.message };
    }
}
