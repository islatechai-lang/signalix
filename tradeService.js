import ccxt from 'ccxt';

export async function executeTrade(apiKey, apiSecret, pair, verdict) {
    try {
        console.log(`[TradeService] Initializing ccxt for Binance Testnet...`);
        const exchange = new ccxt.binance({
            apiKey: apiKey,
            secret: apiSecret,
            enableRateLimit: true,
        });

        // Enable Sandbox/Testnet mode
        exchange.setSandboxMode(true);

        const side = verdict === 'UP' ? 'buy' : 'sell';

        await exchange.loadMarkets();

        // Validate that the pair exists on Binance Testnet
        if (!exchange.markets[pair]) {
            throw new Error(`Pair ${pair} is not available on Binance Testnet. Only major pairs like BTC/USDT, ETH/USDT are supported.`);
        }

        // Pre-check balance
        const balance = await exchange.fetchBalance();
        const quoteAsset = pair.split('/')[1]; // e.g., USDT
        const baseAsset = pair.split('/')[0];  // e.g., SOL
        const availableQuote = balance?.free?.[quoteAsset] || 0;
        const availableBase = balance?.free?.[baseAsset] || 0;

        console.log(`[TradeService] Balance: ${availableQuote} ${quoteAsset}, ${availableBase} ${baseAsset}`);

        // Fetch current price to determine order size
        const ticker = await exchange.fetchTicker(pair);
        const price = ticker.last;

        if (!price) {
            throw new Error("Could not fetch latest price for " + pair);
        }

        // Calculate amount to trade (approx $10 worth for testnet safety)
        let amount = 10 / price;

        // Round to exchange precision
        const market = exchange.markets[pair];
        if (market && market.precision && market.precision.amount !== undefined) {
            amount = exchange.amountToPrecision(pair, amount);
        }
        amount = parseFloat(amount);

        // Pre-check: do we have enough to trade?
        if (side === 'buy' && availableQuote < 10) {
            throw new Error(`Insufficient ${quoteAsset} balance (${availableQuote.toFixed(2)}). Need at least ~$10 to execute.`);
        }
        if (side === 'sell' && availableBase < amount) {
            throw new Error(`Insufficient ${baseAsset} balance (${availableBase}). Need at least ${amount} ${baseAsset} to sell.`);
        }

        console.log(`[TradeService] Executing Market ${side.toUpperCase()} | ${pair} | Amount: ${amount} (~$10) | Price: $${price}`);

        const order = await exchange.createMarketOrder(pair, side, amount);

        console.log(`[TradeService] Trade successful! Order ID: ${order.id}`);

        return {
            success: true,
            orderId: order.id,
            side: side.toUpperCase(),
            pair: pair,
            amount: parseFloat(order.amount || amount),
            price: parseFloat(order.average || order.price || price),
            cost: parseFloat(order.cost || (amount * price)),
            timestamp: Date.now()
        };
    } catch (error) {
        console.error(`[TradeService] Trade execution failed:`, error.message);
        return { success: false, error: error.message };
    }
}
