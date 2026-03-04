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

        // Fetch current price to determine order size
        // We aim to trade $100 (Testnet USDT) worth of the base asset
        const ticker = await exchange.fetchTicker(pair);
        const price = ticker.last;

        if (!price) {
            throw new Error("Could not fetch latest price for " + pair);
        }

        // Calculate amount to trade (approx $100 worth)
        const amount = 100 / price;

        console.log(`[TradeService] Execution strategy: Market ${side.toUpperCase()} for ${pair}. Amount: ${amount.toFixed(4)} (Approx $100)`);

        const order = await exchange.createMarketOrder(pair, side, amount);

        console.log(`[TradeService] Trade successful! Order ID: ${order.id}`);
        return { success: true, orderId: order.id, details: order };
    } catch (error) {
        console.error(`[TradeService] Trade execution failed:`, error.message);
        return { success: false, error: error.message };
    }
}
