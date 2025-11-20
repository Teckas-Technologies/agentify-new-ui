# HYPERLIQUID INTEGRATION ANALYSIS FOR AGENTIFY

## Executive Summary

Based on analysis of existing Lifi (bridge/swap) and Aave (lending/borrowing) integrations in Agentify, this document outlines **35+ actionable features** from Hyperliquid that can be integrated into the Agentify chat interface.

**Key Findings:**
- ✅ Hyperliquid API is **100% FREE** (no API key costs)
- ✅ Already using Hyperliquid for token/price data
- ✅ Strong alignment with existing patterns (Lifi for trading, Aave for DeFi)
- ✅ Comprehensive Python SDK available (matches your backend)
- ✅ Both Perpetuals and Spot trading available

---

## INTEGRATION ARCHITECTURE

### Current Stack Analysis

**Existing Integrations:**
1. **Lifi Hook** - Cross-chain bridging & swapping (EVM-based)
2. **Aave Hook** - Lending, borrowing, withdraw, repay (EVM-based, 11+ markets)

**Hyperliquid Differentiation:**
- **Non-EVM**: Uses REST API + WebSocket (not smart contracts)
- **Centralized DEX**: Order book model (not AMM)
- **Key Signing**: Requires wallet private key signing (not contract interactions)
- **Trading Focus**: Perpetual futures + spot trading (not just DeFi)

### Integration Pattern Mapping

| Component | Lifi/Aave Pattern | Hyperliquid Equivalent |
|-----------|-------------------|------------------------|
| **Backend** | Python API calls | Hyperliquid Python SDK |
| **Hook** | `useLifiHook()`, `useAaveHook()` | `useHyperliquidHook()` |
| **Validation** | Balance checks, reserve status | Margin checks, position limits |
| **Execution** | Contract transactions | API calls with signing |
| **Recording** | `createTransv2()` with TX hash | Same, with order/position ID |
| **Tool Response** | `{ type: "lifi", details }` | `{ type: "hyperliquid_perp", details }` |

---

## PRIORITY 1: CORE PERPETUALS TRADING (Must-Have)

### Feature 1.1: Open Perpetual Position
**User Command:** "Open 10x long ETH-PERP with $1000"

**Hyperliquid API:**
- `POST /exchange` with `order` action
- Python SDK: `exchange.order(coin, is_buy, sz, limit_px, order_type)`

**Implementation:**
```typescript
// useHyperliquidHook.ts
const openPerpPosition = async ({
  symbol,        // "ETH"
  size,          // "$1000" or "2 ETH"
  leverage,      // 10
  isLong,        // true
  orderType,     // "market" or "limit"
  limitPrice?,   // optional for limit orders
  stopLoss?,     // optional TP/SL
  takeProfit?
}) => {
  // 1. Validate margin requirements
  const marginNeeded = (size / leverage) * 1.1; // 10% buffer
  const balance = await getAccountBalance();

  if (balance < marginNeeded) {
    return { success: false, message: "Insufficient margin" };
  }

  // 2. Set leverage if different from current
  await setLeverage(symbol, leverage);

  // 3. Place order
  const result = await callBackendAPI('/hyperliquid/order', {
    coin: symbol,
    is_buy: isLong,
    sz: calculateSize(size, leverage),
    limit_px: orderType === "market" ? getCurrentPrice() : limitPrice,
    order_type: { limit: { tif: "Gtc" } },
    reduce_only: false
  });

  // 4. Record transaction
  await createTransv2(
    userId,
    "perpTradingAgent",
    "PERP_OPEN",
    `Opened ${leverage}x ${isLong ? 'Long' : 'Short'} ${symbol} position`,
    "Hyperliquid",
    new Date(),
    symbol,
    size,
    result.oid, // Order ID
    `https://app.hyperliquid.xyz/trade/${symbol}`,
    "SUCCESS"
  );

  return { success: true, orderId: result.oid, txHash: result.oid };
};
```

**Tool Response Format:**
```json
{
  "type": "hyperliquid_perp_open",
  "symbol": "ETH",
  "size": "1000",
  "leverage": 10,
  "isLong": true,
  "orderType": "market",
  "currentPrice": 3500,
  "estimatedEntry": 3500,
  "marginRequired": 110,
  "liquidationPrice": 3150
}
```

**User Flow:**
1. User: "Open 10x long ETH-PERP with $1000"
2. AI parses → Backend calls Hyperliquid API
3. Frontend receives tool_response
4. `useHyperliquidHook().openPerpPosition()` executes
5. Transaction recorded with agent "perpTradingAgent"
6. Success message: "✅ Opened 10x Long ETH position. Entry: $3,500 | Liq Price: $3,150"

**Transaction Type:** `"PERP_OPEN"`

---

### Feature 1.2: Close Perpetual Position
**User Command:** "Close my ETH-PERP position" or "Close 50% of ETH long"

**Hyperliquid API:**
- `POST /exchange` with `order` action and `reduce_only: true`
- Python SDK: `exchange.order(coin, is_buy, sz, limit_px, order_type, reduce_only=True)`

**Implementation:**
```typescript
const closePerpPosition = async ({
  symbol,
  percentage = 100, // Close 100% by default
  orderType = "market"
}) => {
  // 1. Get current position
  const positions = await getCurrentPositions();
  const position = positions.find(p => p.coin === symbol);

  if (!position) {
    return { success: false, message: "No open position found" };
  }

  // 2. Calculate size to close
  const sizeToClose = (position.szi * percentage) / 100;

  // 3. Place reduce-only order (opposite direction)
  const result = await callBackendAPI('/hyperliquid/order', {
    coin: symbol,
    is_buy: position.szi < 0, // If short, buy to close
    sz: Math.abs(sizeToClose),
    limit_px: getCurrentPrice(),
    order_type: { limit: { tif: "Ioc" } },
    reduce_only: true
  });

  // 4. Calculate PnL
  const pnl = calculatePnL(position, result.fill_price);

  // 5. Record transaction
  await createTransv2(
    userId,
    "perpTradingAgent",
    "PERP_CLOSE",
    `Closed ${percentage}% ${symbol} position. PnL: ${pnl > 0 ? '+' : ''}$${pnl.toFixed(2)}`,
    "Hyperliquid",
    new Date(),
    symbol,
    sizeToClose,
    result.oid,
    `https://app.hyperliquid.xyz/trade/${symbol}`,
    "SUCCESS"
  );

  return { success: true, pnl, orderId: result.oid };
};
```

**Transaction Type:** `"PERP_CLOSE"`

---

### Feature 1.3: Modify Position (Add/Reduce Size)
**User Command:** "Add $500 to my ETH long" or "Reduce my position by 50%"

**Hyperliquid API:**
- `POST /exchange` with `order` or `modifyOrder`

**Transaction Type:** `"PERP_MODIFY"`

---

### Feature 1.4: Set/Update Leverage
**User Command:** "Set leverage to 20x for ETH" or "Change to cross margin"

**Hyperliquid API:**
- `POST /exchange` with `updateLeverage` action
- Python SDK: `exchange.update_leverage(leverage, coin, is_cross)`

**Implementation:**
```typescript
const updateLeverage = async ({
  symbol,
  leverage,    // 1-50
  marginMode   // "cross" or "isolated"
}) => {
  const result = await callBackendAPI('/hyperliquid/leverage', {
    leverage,
    coin: symbol,
    is_cross: marginMode === "cross"
  });

  await createTransv2(
    userId,
    "perpTradingAgent",
    "LEVERAGE_UPDATE",
    `Updated ${symbol} leverage to ${leverage}x (${marginMode})`,
    "Hyperliquid",
    new Date(),
    symbol,
    leverage,
    result.status,
    `https://app.hyperliquid.xyz/trade/${symbol}`,
    "SUCCESS"
  );
};
```

**Transaction Type:** `"LEVERAGE_UPDATE"`

---

### Feature 1.5: Add/Remove Isolated Margin
**User Command:** "Add $100 margin to my ETH position"

**Hyperliquid API:**
- `POST /exchange` with `updateIsolatedMargin`
- Python SDK: `exchange.update_isolated_margin(amount, coin)`

**Transaction Type:** `"MARGIN_UPDATE"`

---

### Feature 1.6: View Current Positions
**User Command:** "Show my open positions" or "What's my ETH position?"

**Hyperliquid API:**
- `POST /info` with `clearinghouseState` action
- Python SDK: `info.user_state(address)`

**Implementation:**
```typescript
const getCurrentPositions = async () => {
  const state = await callBackendAPI('/hyperliquid/positions', {
    user: address
  });

  // Returns:
  // {
  //   assetPositions: [
  //     {
  //       position: {
  //         coin: "ETH",
  //         szi: "2.5",  // Size (positive = long, negative = short)
  //         leverage: { value: 10 },
  //         entryPx: "3500",
  //         positionValue: "8750",
  //         unrealizedPnl: "250",
  //         liquidationPx: "3150"
  //       }
  //     }
  //   ],
  //   marginSummary: {
  //     accountValue: "5000",
  //     totalMarginUsed: "875"
  //   }
  // }

  return state;
};
```

**UI Display:** Not a transaction, just informational response in chat

---

### Feature 1.7: View Open Orders
**User Command:** "Show my pending orders"

**Hyperliquid API:**
- `POST /info` with `openOrders` or `frontendOpenOrders`
- Python SDK: `info.open_orders(address)`

---

### Feature 1.8: Cancel Orders
**User Command:** "Cancel my ETH order" or "Cancel all orders"

**Hyperliquid API:**
- `POST /exchange` with `cancel` or `bulkCancel`
- Python SDK: `exchange.cancel(coin, oid)` or `exchange.bulk_cancel([...])`

**Implementation:**
```typescript
const cancelOrders = async ({
  symbol?,  // Cancel specific symbol's orders
  orderId?, // Cancel specific order
  cancelAll = false
}) => {
  let result;

  if (cancelAll) {
    const openOrders = await getOpenOrders();
    const cancelRequests = openOrders.map(o => ({
      coin: o.coin,
      oid: o.oid
    }));
    result = await callBackendAPI('/hyperliquid/bulk_cancel', {
      cancels: cancelRequests
    });
  } else if (orderId) {
    result = await callBackendAPI('/hyperliquid/cancel', {
      coin: symbol,
      oid: orderId
    });
  } else if (symbol) {
    const symbolOrders = (await getOpenOrders()).filter(o => o.coin === symbol);
    // Cancel all for this symbol
  }

  await createTransv2(
    userId,
    "perpTradingAgent",
    "ORDER_CANCEL",
    `Cancelled ${cancelAll ? 'all' : symbol} orders`,
    "Hyperliquid",
    new Date(),
    symbol || "ALL",
    0,
    result.status,
    `https://app.hyperliquid.xyz/`,
    "SUCCESS"
  );
};
```

**Transaction Type:** `"ORDER_CANCEL"`

---

### Feature 1.9: Place Limit Orders
**User Command:** "Place limit buy for 1 ETH at $3400"

**Hyperliquid API:**
- `POST /exchange` with `order` and `limit` type

**Transaction Type:** `"PERP_LIMIT_ORDER"`

---

### Feature 1.10: Place Stop Loss / Take Profit Orders
**User Command:** "Set stop loss at $3300 and take profit at $3700"

**Hyperliquid API:**
- `POST /exchange` with `order` and trigger conditions
- Python SDK: `exchange.order()` with TP/SL parameters

**Transaction Type:** `"PERP_TP_SL"`

---

## PRIORITY 2: SPOT TRADING (High Value)

### Feature 2.1: Spot Market Buy/Sell
**User Command:** "Buy 100 USDC worth of HYPE" or "Sell 50 PURR"

**Hyperliquid API:**
- `POST /exchange` with `order` on spot market
- Uses spot metadata from `spotMeta` endpoint

**Implementation:**
```typescript
const executeSpotTrade = async ({
  symbol,      // "HYPE"
  side,        // "buy" or "sell"
  amount,      // In token or USD
  orderType = "market"
}) => {
  // 1. Get spot metadata
  const spotMeta = await callBackendAPI('/hyperliquid/spot_meta');
  const token = spotMeta.tokens.find(t => t.name === symbol);

  if (!token) {
    return { success: false, message: "Token not found" };
  }

  // 2. Validate balance
  const spotState = await callBackendAPI('/hyperliquid/spot_state', {
    user: address
  });

  const balance = spotState.balances.find(b => b.token === symbol);

  if (side === "sell" && balance?.total < amount) {
    return { success: false, message: "Insufficient balance" };
  }

  // 3. Execute order
  const result = await callBackendAPI('/hyperliquid/spot_order', {
    coin: symbol,
    is_buy: side === "buy",
    sz: amount,
    limit_px: getCurrentSpotPrice(symbol),
    order_type: { limit: { tif: "Ioc" } }
  });

  // 4. Record transaction
  await createTransv2(
    userId,
    "spotTradingAgent",
    side === "buy" ? "SPOT_BUY" : "SPOT_SELL",
    `${side === "buy" ? 'Bought' : 'Sold'} ${amount} ${symbol}`,
    "Hyperliquid",
    new Date(),
    symbol,
    amount,
    result.oid,
    `https://app.hyperliquid.xyz/spot/${symbol}`,
    "SUCCESS"
  );

  triggerRefresh(); // Refresh spot balances

  return { success: true, orderId: result.oid };
};
```

**Transaction Types:** `"SPOT_BUY"`, `"SPOT_SELL"`

---

### Feature 2.2: View Spot Balances
**User Command:** "Show my spot balances" or "How much HYPE do I have?"

**Hyperliquid API:**
- `POST /info` with `spotClearinghouseState`
- Python SDK: `info.spot_user_state(address)`

**Response Format:**
```json
{
  "balances": [
    {
      "coin": "HYPE",
      "hold": "0",
      "total": "1500.42"
    },
    {
      "coin": "USDC",
      "hold": "0",
      "total": "5000"
    }
  ]
}
```

---

### Feature 2.3: Spot Limit Orders
**User Command:** "Place limit order to buy HYPE at $25"

**Hyperliquid API:**
- Same as Feature 2.1 but with `limit` order type

**Transaction Type:** `"SPOT_LIMIT_ORDER"`

---

## PRIORITY 3: ACCOUNT MANAGEMENT (Medium Priority)

### Feature 3.1: View Account Summary
**User Command:** "Show my Hyperliquid account" or "What's my portfolio value?"

**Hyperliquid API:**
- `POST /info` with `clearinghouseState` (perps)
- `POST /info` with `spotClearinghouseState` (spot)
- `POST /info` with `portfolio` (performance metrics)

**Implementation:**
```typescript
const getAccountSummary = async () => {
  const [perpState, spotState, portfolio] = await Promise.all([
    callBackendAPI('/hyperliquid/perp_state', { user: address }),
    callBackendAPI('/hyperliquid/spot_state', { user: address }),
    callBackendAPI('/hyperliquid/portfolio', { user: address })
  ]);

  return {
    // Perpetuals
    perpAccountValue: perpState.marginSummary.accountValue,
    perpUnrealizedPnl: perpState.marginSummary.totalNtlPos,
    perpPositions: perpState.assetPositions.length,

    // Spot
    spotBalances: spotState.balances,

    // Performance
    dayPnl: portfolio.day.pnl,
    weekPnl: portfolio.week.pnl,
    monthPnl: portfolio.month.pnl,
    allTimePnl: portfolio.allTime.pnl
  };
};
```

**Chat Response:**
```
📊 Hyperliquid Account Summary

💼 Perpetuals:
  • Account Value: $5,000
  • Unrealized PnL: +$250 (+5%)
  • Open Positions: 2

💰 Spot Balances:
  • USDC: 5,000
  • HYPE: 1,500.42

📈 Performance:
  • Today: +$120
  • This Week: +$350
  • This Month: +$890
  • All-Time: +$2,450
```

---

### Feature 3.2: Transfer USDC Between Perp/Spot
**User Command:** "Transfer $1000 from perp to spot"

**Hyperliquid API:**
- `POST /exchange` with `usdClassTransfer`
- Python SDK: `exchange.usd_class_transfer(amount, to_perp=False)`

**Implementation:**
```typescript
const transferUSDC = async ({
  amount,
  direction  // "perp_to_spot" or "spot_to_perp"
}) => {
  const result = await callBackendAPI('/hyperliquid/usd_transfer', {
    amount,
    to_perp: direction === "spot_to_perp"
  });

  await createTransv2(
    userId,
    "accountManagementAgent",
    "USD_TRANSFER",
    `Transferred $${amount} from ${direction.replace('_to_', ' to ')}`,
    "Hyperliquid",
    new Date(),
    "USDC",
    amount,
    result.status,
    `https://app.hyperliquid.xyz/`,
    "SUCCESS"
  );

  triggerRefresh();
};
```

**Transaction Type:** `"USD_TRANSFER"`

---

### Feature 3.3: Send USDC to Another Address
**User Command:** "Send 100 USDC to 0x123..."

**Hyperliquid API:**
- `POST /exchange` with `usdTransfer`
- Python SDK: `exchange.usd_transfer(amount, destination)`

**Transaction Type:** `"USD_SEND"`

---

### Feature 3.4: Send Spot Tokens to Another Address
**User Command:** "Send 50 HYPE to 0x456..."

**Hyperliquid API:**
- `POST /exchange` with `spotTransfer`
- Python SDK: `exchange.spot_transfer(amount, destination, token)`

**Transaction Type:** `"SPOT_SEND"`

---

### Feature 3.5: Withdraw to L1 (Arbitrum)
**User Command:** "Withdraw 500 USDC to Arbitrum"

**Hyperliquid API:**
- `POST /exchange` with `withdrawFromBridge`
- Python SDK: `exchange.withdraw_from_bridge(amount, destination)`
- **Processing Time:** ~5 minutes

**Implementation:**
```typescript
const withdrawToL1 = async ({ amount, destination }) => {
  // Warning message
  const confirmed = await confirm(
    `Withdrawal will take ~5 minutes to process. Continue?`
  );

  if (!confirmed) return { success: false };

  const result = await callBackendAPI('/hyperliquid/withdraw', {
    amount,
    destination
  });

  await createTransv2(
    userId,
    "accountManagementAgent",
    "WITHDRAW",
    `Initiated withdrawal of $${amount} USDC to Arbitrum`,
    "Hyperliquid",
    new Date(),
    "USDC",
    amount,
    result.status,
    `https://arbiscan.io/address/${destination}`,
    "PENDING"
  );

  // Poll for completion (optional)
  setTimeout(async () => {
    // Check status and update transaction
  }, 5 * 60 * 1000);
};
```

**Transaction Type:** `"WITHDRAW"`

---

## PRIORITY 4: ADVANCED TRADING (Lower Priority)

### Feature 4.1: TWAP Orders
**User Command:** "Place TWAP order for 10 ETH over 1 hour"

**Hyperliquid API:**
- `POST /exchange` with `twapOrder`
- Python SDK: Supports TWAP with randomization

**What is TWAP?**
Time-Weighted Average Price - Splits large order into smaller chunks over time to reduce market impact

**Transaction Type:** `"PERP_TWAP"`

---

### Feature 4.2: Bulk Orders
**User Command:** "Open 5 different positions" (advanced users)

**Hyperliquid API:**
- `POST /exchange` with `bulkOrder`
- Python SDK: `exchange.bulk_orders([...])`

**Transaction Type:** `"BULK_ORDER"`

---

### Feature 4.3: Schedule Cancel All (Dead Man's Switch)
**User Command:** "Cancel all my orders in 1 hour if I don't respond"

**Hyperliquid API:**
- `POST /exchange` with `scheduleCancelAllOrders`
- **Limit:** Max 10 triggers per day

**Transaction Type:** `"SCHEDULE_CANCEL"`

---

## PRIORITY 5: MARKET DATA & ANALYTICS (Read-Only Features)

### Feature 5.1: Real-Time Price Data
**User Command:** "What's the ETH price on Hyperliquid?" or "Show BTC funding rate"

**Hyperliquid API:**
- `POST /info` with `allMids` (all mid-prices)
- `POST /info` with `metaAndAssetCtxs` (detailed market data)

**Already Implemented?** User mentioned "already used hyperliquid apis for tokens & price fetching"

**Response Format:**
```json
{
  "coin": "ETH",
  "midPrice": "3500",
  "markPrice": "3501",
  "fundingRate": "0.01%",
  "openInterest": "$150M",
  "24hVolume": "$2.5B",
  "24hChange": "+2.5%"
}
```

---

### Feature 5.2: Order Book Data
**User Command:** "Show ETH order book" or "What's the spread for BTC?"

**Hyperliquid API:**
- `POST /info` with `l2Book`
- Up to 20 levels per side

**Response Example:**
```
📖 ETH Order Book

Asks (Sells):
3502.50 | 12.5 ETH
3502.00 | 8.3 ETH
3501.50 | 5.2 ETH
-----------------
3500 (Mid Price)
-----------------
3499.50 | 6.1 ETH
3499.00 | 10.2 ETH
3498.50 | 15.8 ETH
Bids (Buys)

Spread: $3.00 (0.09%)
```

---

### Feature 5.3: Historical Candles/Charts
**User Command:** "Show me ETH 4h chart" or "Get ETH daily candles for last week"

**Hyperliquid API:**
- `POST /info` with `candleSnapshot`
- Max 5000 candles per request
- Intervals: 1m, 3m, 5m, 15m, 1h, 4h, 1d, 1w, 1M

**Implementation:**
```typescript
const getCandles = async ({
  symbol,
  interval,  // "4h", "1d"
  limit = 100
}) => {
  const result = await callBackendAPI('/hyperliquid/candles', {
    coin: symbol,
    interval,
    startTime: Date.now() - (limit * intervalToMs(interval)),
    endTime: Date.now()
  });

  // Returns: [
  //   { t: timestamp, o: open, h: high, l: low, c: close, v: volume },
  //   ...
  // ]

  return result;
};
```

**UI Display:** Could render ASCII chart in chat or provide data table

---

### Feature 5.4: Trading History
**User Command:** "Show my last 10 trades" or "Show my ETH trade history"

**Hyperliquid API:**
- `POST /info` with `userFills`
- `POST /info` with `userFillsByTime` (time range)
- Up to 2000 recent fills

**Response Format:**
```json
{
  "fills": [
    {
      "coin": "ETH",
      "px": "3500",
      "sz": "2.5",
      "side": "B",  // Buy
      "time": 1704067200000,
      "fee": "8.75",
      "closedPnl": "125.50"
    }
  ]
}
```

**Chat Display:**
```
📊 Recent Trades

1. ETH | Buy 2.5 @ $3,500 | Fee: $8.75 | PnL: +$125.50
   ⏰ 2024-01-01 12:00:00

2. BTC | Sell 0.1 @ $42,000 | Fee: $4.20 | PnL: -$50.20
   ⏰ 2024-01-01 11:30:00

...
```

---

### Feature 5.5: Funding History
**User Command:** "Show my funding payments" or "How much funding did I pay this week?"

**Hyperliquid API:**
- `POST /info` with `userFundingHistory`

**Response Format:**
```json
{
  "fundingHistory": [
    {
      "time": 1704067200000,
      "coin": "ETH",
      "fundingRate": "0.01%",
      "payment": "-5.25"  // Negative = paid, Positive = received
    }
  ]
}
```

---

### Feature 5.6: Performance Analytics
**User Command:** "Show my trading stats" or "How am I doing this month?"

**Hyperliquid API:**
- `POST /info` with `portfolio`

**Response Format:**
```json
{
  "day": {
    "pnl": "125.50",
    "vlm": "50000",  // Volume traded
    "roi": "2.5%"
  },
  "week": { ... },
  "month": { ... },
  "allTime": { ... }
}
```

---

### Feature 5.7: Fee Tier Information
**User Command:** "What's my fee tier?" or "How much volume do I need for next tier?"

**Hyperliquid API:**
- `POST /info` with `userFees`

**Response Format:**
```json
{
  "tier": "Tier 1",
  "volumeTraded": "5500000",
  "nextTierVolume": "50000000",
  "makerFee": "0.012%",
  "takerFee": "0.040%",
  "hypeyDiscount": "20%"  // From HYPE staking
}
```

---

## PRIORITY 6: STAKING & GOVERNANCE (Optional)

### Feature 6.1: Stake HYPE Tokens
**User Command:** "Stake 1000 HYPE to validator X"

**Hyperliquid API:**
- `POST /exchange` with `tokenDelegate`
- 1-day lockup period

**Transaction Type:** `"HYPE_STAKE"`

---

### Feature 6.2: View Staking Rewards
**User Command:** "Show my HYPE staking rewards"

**Hyperliquid API:**
- `POST /info` with `delegatorRewards`
- `POST /info` with `delegatorHistory`

---

### Feature 6.3: View Delegations
**User Command:** "Which validators am I delegating to?"

**Hyperliquid API:**
- `POST /info` with `delegations`

---

## PRIORITY 7: SUB-ACCOUNTS (Advanced Users)

### Feature 7.1: Create Sub-Account
**User Command:** "Create a new sub-account for my bot"

**Hyperliquid API:**
- `POST /exchange` with `createSubAccount`
- Python SDK: `exchange.create_sub_account(name)`

**Transaction Type:** `"SUB_ACCOUNT_CREATE"`

---

### Feature 7.2: Transfer Funds to Sub-Account
**User Command:** "Transfer $1000 to my bot sub-account"

**Hyperliquid API:**
- `POST /exchange` with `subAccountTransfer`
- Python SDK: `exchange.sub_account_transfer(amount, destination, is_deposit)`

**Transaction Type:** `"SUB_ACCOUNT_TRANSFER"`

---

### Feature 7.3: View Sub-Accounts
**User Command:** "List my sub-accounts"

**Hyperliquid API:**
- `POST /info` with `subAccounts`

---

## PRIORITY 8: API WALLET (FOR TRADING BOTS)

### Feature 8.1: Create API Wallet (Agent)
**User Command:** "Create an API wallet for automated trading"

**Hyperliquid API:**
- `POST /exchange` with `approveAgent`
- Python SDK: `exchange.approve_agent(name)`
- **Returns:** New agent's private key

**Security Warning:** Must securely store the returned private key

**Transaction Type:** `"API_WALLET_CREATE"`

---

## PRIORITY 9: REFERRALS

### Feature 9.1: Set Referrer
**User Command:** "Use referral code ABC123"

**Hyperliquid API:**
- `POST /exchange` with `setReferrer`
- Python SDK: `exchange.set_referrer(code)`

**Transaction Type:** `"REFERRAL_SET"`

---

### Feature 9.2: View Referral Stats
**User Command:** "Show my referral earnings"

**Hyperliquid API:**
- `POST /info` with `referral`

---

## PRIORITY 10: REAL-TIME UPDATES (WEBSOCKET)

### Feature 10.1: Real-Time Position Updates
**User Command:** "Monitor my positions in real-time"

**Hyperliquid API:**
- WebSocket subscription to `userEvents`
- Receives: fills, fundings, liquidations, cancellations

**Implementation:**
```typescript
const subscribeToUserEvents = (address: string) => {
  const ws = new WebSocket('wss://api.hyperliquid.xyz/ws');

  ws.on('open', () => {
    ws.send(JSON.stringify({
      method: 'subscribe',
      subscription: {
        type: 'userEvents',
        user: address
      }
    }));
  });

  ws.on('message', (data) => {
    const event = JSON.parse(data);

    if (event.channel === 'userEvents') {
      // Handle fills, fundings, liquidations
      if (event.data.fills) {
        // Show notification: "✅ ETH position filled at $3,500"
      }

      if (event.data.liquidation) {
        // Show alert: "⚠️ Position liquidated!"
      }
    }
  });
};
```

---

### Feature 10.2: Live Price Streaming
**User Command:** "Stream live ETH price"

**Hyperliquid API:**
- WebSocket subscription to `allMids` or `trades`

**Implementation:**
```typescript
const subscribeToPrices = (coins: string[]) => {
  ws.send(JSON.stringify({
    method: 'subscribe',
    subscription: {
      type: 'trades',
      coin: 'ETH'
    }
  }));

  ws.on('message', (data) => {
    const event = JSON.parse(data);
    if (event.channel === 'trades') {
      // Update price display in chat
      updatePriceDisplay(event.data);
    }
  });
};
```

---

## TECHNICAL IMPLEMENTATION GUIDE

### Step 1: Backend Setup (Python)

**Install Hyperliquid SDK:**
```bash
pip install hyperliquid-python-sdk
```

**Create Hyperliquid Service:**
```python
# backend/services/hyperliquid_service.py

from hyperliquid.info import Info
from hyperliquid.exchange import Exchange
from eth_account import Account
import os

class HyperliquidService:
    def __init__(self, mainnet=True):
        self.api_url = "https://api.hyperliquid.xyz" if mainnet else "https://api.hyperliquid-testnet.xyz"
        self.info = Info(self.api_url, skip_ws=True)

    def get_exchange(self, private_key: str):
        """Create exchange instance for trading (requires private key)"""
        account = Account.from_key(private_key)
        return Exchange(account, self.info)

    # INFO METHODS (No auth required)

    def get_all_mids(self):
        """Get all mid-prices"""
        return self.info.all_mids()

    def get_user_state(self, address: str):
        """Get perpetuals account state"""
        return self.info.user_state(address)

    def get_spot_user_state(self, address: str):
        """Get spot balances"""
        return self.info.spot_user_state(address)

    def get_open_orders(self, address: str):
        """Get active orders"""
        return self.info.open_orders(address)

    def get_user_fills(self, address: str):
        """Get recent trades"""
        return self.info.user_fills(address)

    def get_portfolio(self, address: str):
        """Get performance metrics"""
        return self.info.portfolio(address)

    # EXCHANGE METHODS (Requires auth)

    def open_perp_position(self, private_key: str, coin: str, is_buy: bool,
                           sz: float, limit_px: float, leverage: int):
        """Open perpetual position"""
        exchange = self.get_exchange(private_key)

        # Set leverage first
        exchange.update_leverage(leverage, coin, is_cross=True)

        # Place order
        result = exchange.order(
            coin=coin,
            is_buy=is_buy,
            sz=sz,
            limit_px=limit_px,
            order_type={"limit": {"tif": "Gtc"}},
            reduce_only=False
        )

        return result

    def close_perp_position(self, private_key: str, coin: str, sz: float):
        """Close perpetual position"""
        exchange = self.get_exchange(private_key)

        # Get current position to determine direction
        user_state = self.get_user_state(exchange.wallet.address)
        position = next((p for p in user_state['assetPositions']
                        if p['position']['coin'] == coin), None)

        if not position:
            return {"error": "No position found"}

        is_long = float(position['position']['szi']) > 0

        # Place reduce-only order in opposite direction
        result = exchange.order(
            coin=coin,
            is_buy=not is_long,  # Opposite of current position
            sz=abs(sz),
            limit_px=self.info.all_mids()[coin],  # Market price
            order_type={"limit": {"tif": "Ioc"}},
            reduce_only=True
        )

        return result

    def execute_spot_trade(self, private_key: str, coin: str, is_buy: bool,
                           sz: float, limit_px: float):
        """Execute spot trade"""
        exchange = self.get_exchange(private_key)

        result = exchange.order(
            coin=coin,
            is_buy=is_buy,
            sz=sz,
            limit_px=limit_px,
            order_type={"limit": {"tif": "Ioc"}}
        )

        return result

    def transfer_usd(self, private_key: str, amount: float, to_perp: bool):
        """Transfer USDC between perp and spot"""
        exchange = self.get_exchange(private_key)

        # Note: usd_class_transfer might not exist in SDK
        # You may need to construct raw API call
        result = exchange.usd_class_transfer(amount, to_perp)

        return result
```

**Add API Endpoints:**
```python
# backend/routes/hyperliquid.py

from flask import Blueprint, request, jsonify
from services.hyperliquid_service import HyperliquidService

hyperliquid_bp = Blueprint('hyperliquid', __name__)
hl_service = HyperliquidService(mainnet=True)

@hyperliquid_bp.route('/perp_state', methods=['POST'])
def get_perp_state():
    data = request.json
    address = data['user']

    state = hl_service.get_user_state(address)
    return jsonify(state)

@hyperliquid_bp.route('/spot_state', methods=['POST'])
def get_spot_state():
    data = request.json
    address = data['user']

    state = hl_service.get_spot_user_state(address)
    return jsonify(state)

@hyperliquid_bp.route('/order', methods=['POST'])
def place_order():
    data = request.json
    private_key = data['private_key']  # Security: Use secure storage

    result = hl_service.open_perp_position(
        private_key,
        data['coin'],
        data['is_buy'],
        data['sz'],
        data['limit_px'],
        data['leverage']
    )

    return jsonify(result)

@hyperliquid_bp.route('/portfolio', methods=['POST'])
def get_portfolio():
    data = request.json
    address = data['user']

    portfolio = hl_service.get_portfolio(address)
    return jsonify(portfolio)

# Add more endpoints as needed
```

**Register Blueprint:**
```python
# backend/app.py

from routes.hyperliquid import hyperliquid_bp

app.register_blueprint(hyperliquid_bp, url_prefix='/api/hyperliquid')
```

---

### Step 2: Frontend Hook (TypeScript/React)

**Create useHyperliquidHook.ts:**
```typescript
// src/hooks/useHyperliquidHook.ts

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import axios from 'axios';

interface OpenPerpPositionParams {
  symbol: string;
  size: number;
  leverage: number;
  isLong: boolean;
  orderType?: 'market' | 'limit';
  limitPrice?: number;
}

interface ClosePerpPositionParams {
  symbol: string;
  percentage?: number;
}

interface SpotTradeParams {
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  orderType?: 'market' | 'limit';
  limitPrice?: number;
}

export const useHyperliquidHook = () => {
  const { address, isConnected } = useAccount();
  const { wallets } = useWallets();
  const { user } = usePrivy();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Helper: Get private key from wallet (for signing)
  const getPrivateKey = async (): Promise<string> => {
    // Security: In production, use secure key management
    // Option 1: User exports private key (not recommended)
    // Option 2: Use wallet provider's signing methods
    // Option 3: Use API wallet created via approveAgent

    const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
    if (!embeddedWallet) {
      throw new Error('No embedded wallet found');
    }

    // This is a placeholder - actual implementation depends on your setup
    // You might need to store API wallet keys securely
    const privateKey = localStorage.getItem(`hl_api_key_${address}`);

    if (!privateKey) {
      throw new Error('Hyperliquid API wallet not set up. Please create one first.');
    }

    return privateKey;
  };

  // Helper: Call backend API
  const callAPI = async (endpoint: string, data: any) => {
    try {
      const response = await axios.post(
        `${API_BASE}/api/hyperliquid/${endpoint}`,
        data
      );
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || err.message);
    }
  };

  // ===== PERPETUALS TRADING =====

  const openPerpPosition = async ({
    symbol,
    size,
    leverage,
    isLong,
    orderType = 'market',
    limitPrice
  }: OpenPerpPositionParams) => {
    try {
      setLoading(true);
      setError(null);

      if (!isConnected || !address) {
        throw new Error('Wallet not connected');
      }

      // 1. Get current price if market order
      let orderPrice = limitPrice;
      if (orderType === 'market') {
        const mids = await callAPI('all_mids', {});
        orderPrice = parseFloat(mids[symbol]);
      }

      // 2. Validate margin requirements
      const perpState = await callAPI('perp_state', { user: address });
      const accountValue = parseFloat(perpState.marginSummary.accountValue);
      const marginRequired = (size / leverage) * 1.1; // 10% buffer

      if (accountValue < marginRequired) {
        throw new Error(
          `Insufficient margin. Required: $${marginRequired.toFixed(2)}, Available: $${accountValue.toFixed(2)}`
        );
      }

      // 3. Get private key for signing
      const privateKey = await getPrivateKey();

      // 4. Execute order
      const result = await callAPI('order', {
        private_key: privateKey,
        coin: symbol,
        is_buy: isLong,
        sz: size / orderPrice!, // Convert USD to token amount
        limit_px: orderPrice,
        leverage,
        reduce_only: false
      });

      if (result.status === 'ok') {
        return {
          success: true,
          orderId: result.response.data.statuses[0].resting?.oid,
          txHash: result.response.data.statuses[0].resting?.oid, // Use OID as TX hash
          message: `Opened ${leverage}x ${isLong ? 'Long' : 'Short'} ${symbol} position`
        };
      } else {
        throw new Error(result.response?.data?.statuses[0]?.error || 'Order failed');
      }

    } catch (err: any) {
      setError(err.message);
      return {
        success: false,
        message: err.message
      };
    } finally {
      setLoading(false);
    }
  };

  const closePerpPosition = async ({
    symbol,
    percentage = 100
  }: ClosePerpPositionParams) => {
    try {
      setLoading(true);
      setError(null);

      if (!isConnected || !address) {
        throw new Error('Wallet not connected');
      }

      // 1. Get current position
      const perpState = await callAPI('perp_state', { user: address });
      const position = perpState.assetPositions.find(
        (p: any) => p.position.coin === symbol
      );

      if (!position) {
        throw new Error(`No open ${symbol} position found`);
      }

      const currentSize = parseFloat(position.position.szi);
      const isLong = currentSize > 0;
      const sizeToClose = (Math.abs(currentSize) * percentage) / 100;

      // 2. Get current price
      const mids = await callAPI('all_mids', {});
      const currentPrice = parseFloat(mids[symbol]);

      // 3. Get private key
      const privateKey = await getPrivateKey();

      // 4. Place reduce-only order (opposite direction)
      const result = await callAPI('order', {
        private_key: privateKey,
        coin: symbol,
        is_buy: !isLong, // Opposite of current position
        sz: sizeToClose,
        limit_px: currentPrice,
        reduce_only: true
      });

      if (result.status === 'ok') {
        const fill = result.response.data.statuses[0].filled;
        const pnl = fill ? parseFloat(fill.totalSz) * parseFloat(fill.avgPx) * (isLong ? 1 : -1) : 0;

        return {
          success: true,
          orderId: result.response.data.statuses[0].filled?.oid,
          pnl,
          message: `Closed ${percentage}% of ${symbol} position. PnL: ${pnl > 0 ? '+' : ''}$${pnl.toFixed(2)}`
        };
      } else {
        throw new Error('Close order failed');
      }

    } catch (err: any) {
      setError(err.message);
      return {
        success: false,
        message: err.message
      };
    } finally {
      setLoading(false);
    }
  };

  // ===== SPOT TRADING =====

  const executeSpotTrade = async ({
    symbol,
    side,
    amount,
    orderType = 'market',
    limitPrice
  }: SpotTradeParams) => {
    try {
      setLoading(true);
      setError(null);

      if (!isConnected || !address) {
        throw new Error('Wallet not connected');
      }

      // 1. Get spot metadata
      const spotMeta = await callAPI('spot_meta', {});
      const token = spotMeta.tokens.find((t: any) => t.name === symbol);

      if (!token) {
        throw new Error(`Token ${symbol} not found on Hyperliquid`);
      }

      // 2. Validate balance
      const spotState = await callAPI('spot_state', { user: address });

      if (side === 'sell') {
        const balance = spotState.balances.find(
          (b: any) => b.coin === symbol
        );

        if (!balance || parseFloat(balance.total) < amount) {
          throw new Error(`Insufficient ${symbol} balance`);
        }
      }

      // 3. Get price
      let orderPrice = limitPrice;
      if (orderType === 'market') {
        const mids = await callAPI('all_mids', {});
        orderPrice = parseFloat(mids[symbol]);
      }

      // 4. Get private key
      const privateKey = await getPrivateKey();

      // 5. Execute order
      const result = await callAPI('spot_order', {
        private_key: privateKey,
        coin: symbol,
        is_buy: side === 'buy',
        sz: amount,
        limit_px: orderPrice
      });

      if (result.status === 'ok') {
        return {
          success: true,
          orderId: result.response.data.statuses[0].filled?.oid,
          message: `${side === 'buy' ? 'Bought' : 'Sold'} ${amount} ${symbol}`
        };
      } else {
        throw new Error('Spot trade failed');
      }

    } catch (err: any) {
      setError(err.message);
      return {
        success: false,
        message: err.message
      };
    } finally {
      setLoading(false);
    }
  };

  // ===== ACCOUNT INFO =====

  const getAccountSummary = async () => {
    try {
      setLoading(true);

      if (!address) {
        throw new Error('Wallet not connected');
      }

      const [perpState, spotState, portfolio] = await Promise.all([
        callAPI('perp_state', { user: address }),
        callAPI('spot_state', { user: address }),
        callAPI('portfolio', { user: address })
      ]);

      return {
        perpAccountValue: perpState.marginSummary.accountValue,
        perpUnrealizedPnl: perpState.marginSummary.totalNtlPos,
        perpPositions: perpState.assetPositions,
        spotBalances: spotState.balances,
        performance: portfolio
      };

    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPositions = async () => {
    try {
      if (!address) throw new Error('Wallet not connected');

      const perpState = await callAPI('perp_state', { user: address });
      return perpState.assetPositions;

    } catch (err: any) {
      setError(err.message);
      return [];
    }
  };

  const getSpotBalances = async () => {
    try {
      if (!address) throw new Error('Wallet not connected');

      const spotState = await callAPI('spot_state', { user: address });
      return spotState.balances;

    } catch (err: any) {
      setError(err.message);
      return [];
    }
  };

  // ===== ACCOUNT MANAGEMENT =====

  const transferUSDC = async (amount: number, direction: 'perp_to_spot' | 'spot_to_perp') => {
    try {
      setLoading(true);

      const privateKey = await getPrivateKey();

      const result = await callAPI('usd_transfer', {
        private_key: privateKey,
        amount,
        to_perp: direction === 'spot_to_perp'
      });

      return {
        success: true,
        message: `Transferred $${amount} from ${direction.replace('_to_', ' to ')}`
      };

    } catch (err: any) {
      setError(err.message);
      return {
        success: false,
        message: err.message
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,

    // Perpetuals
    openPerpPosition,
    closePerpPosition,

    // Spot
    executeSpotTrade,

    // Account Info
    getAccountSummary,
    getCurrentPositions,
    getSpotBalances,

    // Account Management
    transferUSDC
  };
};
```

---

### Step 3: Integrate with Chat Interface

**Update ChatInterface.tsx (around line 916):**

```typescript
// Add Hyperliquid import
import { useHyperliquidHook } from '../hooks/useHyperliquidHook';

// Inside component
const {
  openPerpPosition,
  closePerpPosition,
  executeSpotTrade,
  getAccountSummary
} = useHyperliquidHook();

// Inside handleSendMessage, after tool_response parsing:

// === HYPERLIQUID PERPETUALS ===
if (toolMessage?.type === "hyperliquid_perp_open") {
  const { symbol, size, leverage, isLong, orderType, limitPrice } = toolMessage;

  setMessages(prev => [...prev, {
    text: `Opening ${leverage}x ${isLong ? 'Long' : 'Short'} ${symbol} position...`,
    sender: "ai",
    timestamp: new Date().toISOString()
  }]);

  const result = await openPerpPosition({
    symbol,
    size: parseFloat(size),
    leverage: parseInt(leverage),
    isLong,
    orderType,
    limitPrice: limitPrice ? parseFloat(limitPrice) : undefined
  });

  if (result.success) {
    // Record transaction
    await createTransv2(
      user?.id ?? '',
      "perpTradingAgent",
      "PERP_OPEN",
      result.message,
      "Hyperliquid",
      new Date(),
      symbol,
      size,
      result.txHash || "",
      `https://app.hyperliquid.xyz/trade/${symbol}`,
      "SUCCESS",
      "", // rpcUrl (not applicable)
      "USDC",
      18, // decimals
      symbol,
      "Perp Trading Agent"
    );

    setMessages(prev => [...prev, {
      text: `✅ ${result.message}`,
      sender: "ai",
      timestamp: new Date().toISOString()
    }]);

    // Notify backend
    await orchestratedAgentChat({
      agentName: "orchestratedAgent",
      userId: user?.id ?? "",
      message: result.message,
      threadId: chatId,
      walletAddress: address ?? "",
      isTransaction: true
    });
  } else {
    setMessages(prev => [...prev, {
      text: `❌ Failed to open position: ${result.message}`,
      sender: "ai",
      timestamp: new Date().toISOString()
    }]);
  }
}

// === HYPERLIQUID PERP CLOSE ===
if (toolMessage?.type === "hyperliquid_perp_close") {
  const { symbol, percentage } = toolMessage;

  const result = await closePerpPosition({
    symbol,
    percentage: percentage ? parseInt(percentage) : 100
  });

  if (result.success) {
    await createTransv2(
      user?.id ?? '',
      "perpTradingAgent",
      "PERP_CLOSE",
      result.message,
      "Hyperliquid",
      new Date(),
      symbol,
      0, // size calculated in hook
      result.orderId || "",
      `https://app.hyperliquid.xyz/trade/${symbol}`,
      "SUCCESS",
      "",
      "USDC",
      18,
      symbol,
      "Perp Trading Agent"
    );

    setMessages(prev => [...prev, {
      text: `✅ ${result.message}`,
      sender: "ai",
      timestamp: new Date().toISOString()
    }]);

    await orchestratedAgentChat({
      agentName: "orchestratedAgent",
      userId: user?.id ?? "",
      message: result.message,
      threadId: chatId,
      walletAddress: address ?? "",
      isTransaction: true
    });
  } else {
    setMessages(prev => [...prev, {
      text: `❌ ${result.message}`,
      sender: "ai",
      timestamp: new Date().toISOString()
    }]);
  }
}

// === HYPERLIQUID SPOT TRADE ===
if (toolMessage?.type === "hyperliquid_spot") {
  const { symbol, side, amount, orderType, limitPrice } = toolMessage;

  const result = await executeSpotTrade({
    symbol,
    side,
    amount: parseFloat(amount),
    orderType,
    limitPrice: limitPrice ? parseFloat(limitPrice) : undefined
  });

  if (result.success) {
    await createTransv2(
      user?.id ?? '',
      "spotTradingAgent",
      side === "buy" ? "SPOT_BUY" : "SPOT_SELL",
      result.message,
      "Hyperliquid",
      new Date(),
      symbol,
      amount,
      result.orderId || "",
      `https://app.hyperliquid.xyz/spot/${symbol}`,
      "SUCCESS",
      "",
      "USDC",
      18,
      symbol,
      "Spot Trading Agent"
    );

    setMessages(prev => [...prev, {
      text: `✅ ${result.message}`,
      sender: "ai",
      timestamp: new Date().toISOString()
    }]);

    await orchestratedAgentChat({
      agentName: "orchestratedAgent",
      userId: user?.id ?? "",
      message: result.message,
      threadId: chatId,
      walletAddress: address ?? "",
      isTransaction: true
    });
  } else {
    setMessages(prev => [...prev, {
      text: `❌ ${result.message}`,
      sender: "ai",
      timestamp: new Date().toISOString()
    }]);
  }
}

// === HYPERLIQUID ACCOUNT SUMMARY ===
if (toolMessage?.type === "hyperliquid_account") {
  const summary = await getAccountSummary();

  if (summary) {
    const summaryText = `
📊 **Hyperliquid Account Summary**

💼 **Perpetuals:**
  • Account Value: $${parseFloat(summary.perpAccountValue).toFixed(2)}
  • Unrealized PnL: ${parseFloat(summary.perpUnrealizedPnl) > 0 ? '+' : ''}$${parseFloat(summary.perpUnrealizedPnl).toFixed(2)}
  • Open Positions: ${summary.perpPositions.length}

💰 **Spot Balances:**
${summary.spotBalances.map((b: any) => `  • ${b.coin}: ${parseFloat(b.total).toFixed(4)}`).join('\n')}

📈 **Performance:**
  • Today: ${parseFloat(summary.performance.day.pnl) > 0 ? '+' : ''}$${parseFloat(summary.performance.day.pnl).toFixed(2)}
  • This Week: ${parseFloat(summary.performance.week.pnl) > 0 ? '+' : ''}$${parseFloat(summary.performance.week.pnl).toFixed(2)}
  • This Month: ${parseFloat(summary.performance.month.pnl) > 0 ? '+' : ''}$${parseFloat(summary.performance.month.pnl).toFixed(2)}
  • All-Time: ${parseFloat(summary.performance.allTime.pnl) > 0 ? '+' : ''}$${parseFloat(summary.performance.allTime.pnl).toFixed(2)}
    `;

    setMessages(prev => [...prev, {
      text: summaryText,
      sender: "ai",
      timestamp: new Date().toISOString()
    }]);
  }
}
```

---

### Step 4: Update TypeScript Types

**Add to src/types/types.ts:**

```typescript
// Add new transaction types
export type TransactionType =
  | "SWAP"
  | "BRIDGE"
  | "LEND"
  | "BORROW"
  | "REPAY"
  | "WITHDRAW"
  | "PERP_OPEN"
  | "PERP_CLOSE"
  | "PERP_MODIFY"
  | "PERP_LIMIT_ORDER"
  | "PERP_TP_SL"
  | "PERP_TWAP"
  | "SPOT_BUY"
  | "SPOT_SELL"
  | "SPOT_LIMIT_ORDER"
  | "LEVERAGE_UPDATE"
  | "MARGIN_UPDATE"
  | "USD_TRANSFER"
  | "USD_SEND"
  | "SPOT_SEND"
  | "WITHDRAW"
  | "ORDER_CANCEL"
  | "SCHEDULE_CANCEL"
  | "BULK_ORDER"
  | "HYPE_STAKE"
  | "SUB_ACCOUNT_CREATE"
  | "SUB_ACCOUNT_TRANSFER"
  | "API_WALLET_CREATE"
  | "REFERRAL_SET";

// Hyperliquid-specific interfaces
export interface HyperliquidPosition {
  coin: string;
  szi: string; // Size (signed)
  leverage: { value: number };
  entryPx: string;
  positionValue: string;
  unrealizedPnl: string;
  liquidationPx: string;
  marginUsed: string;
}

export interface HyperliquidSpotBalance {
  coin: string;
  hold: string;
  total: string;
}

export interface HyperliquidAccountState {
  assetPositions: Array<{
    position: HyperliquidPosition;
    type: string;
  }>;
  marginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
  };
  crossMarginSummary: {
    accountValue: string;
    totalMarginUsed: string;
  };
}

export interface HyperliquidPerformance {
  day: { pnl: string; vlm: string; roi: string };
  week: { pnl: string; vlm: string; roi: string };
  month: { pnl: string; vlm: string; roi: string };
  allTime: { pnl: string; vlm: string; roi: string };
}
```

---

### Step 5: Backend AI Integration (Python)

**Update your AI agent to recognize Hyperliquid commands:**

```python
# backend/agents/orchestrated_agent.py

HYPERLIQUID_PROMPTS = """
You can help users trade perpetual futures and spot tokens on Hyperliquid.

Supported commands:
1. Open perpetual position: "Open 10x long ETH with $1000"
2. Close position: "Close my ETH position" or "Close 50% of BTC long"
3. Spot trading: "Buy 100 USDC worth of HYPE" or "Sell 50 PURR"
4. Account info: "Show my Hyperliquid account" or "What are my positions?"
5. Transfer funds: "Transfer $1000 from perp to spot"

When a user requests a Hyperliquid operation, return a tool_response with:
- type: "hyperliquid_perp_open", "hyperliquid_perp_close", "hyperliquid_spot", "hyperliquid_account"
- Include all necessary parameters

Examples:

User: "Open 10x long ETH with $1000"
Response:
{
  "type": "hyperliquid_perp_open",
  "symbol": "ETH",
  "size": "1000",
  "leverage": 10,
  "isLong": true,
  "orderType": "market"
}

User: "Buy 100 USDC worth of HYPE"
Response:
{
  "type": "hyperliquid_spot",
  "symbol": "HYPE",
  "side": "buy",
  "amount": "100",
  "orderType": "market"
}

User: "Show my Hyperliquid positions"
Response:
{
  "type": "hyperliquid_account"
}
"""

# Add to your agent's system prompt
```

---

## FEATURE PRIORITIZATION SUMMARY

### Must-Have (MVP)
1. ✅ Open/Close Perpetual Positions (Features 1.1, 1.2)
2. ✅ View Positions & Account Summary (Features 1.6, 3.1)
3. ✅ Spot Buy/Sell (Feature 2.1)
4. ✅ View Spot Balances (Feature 2.2)

**Estimated Dev Time:** 1-2 weeks

---

### High Priority (Phase 2)
5. Set/Update Leverage (Feature 1.4)
6. Place Limit Orders (Features 1.9, 2.3)
7. Cancel Orders (Feature 1.8)
8. Transfer USDC Between Perp/Spot (Feature 3.2)
9. Trading History (Feature 5.4)
10. Real-Time Price Data (Feature 5.1)

**Estimated Dev Time:** 1 week

---

### Medium Priority (Phase 3)
11. Modify Position Size (Feature 1.3)
12. Add/Remove Isolated Margin (Feature 1.5)
13. Stop Loss / Take Profit (Feature 1.10)
14. Send USDC/Tokens to Address (Features 3.3, 3.4)
15. Withdraw to L1 (Feature 3.5)
16. Order Book Data (Feature 5.2)
17. Performance Analytics (Feature 5.6)

**Estimated Dev Time:** 1-2 weeks

---

### Lower Priority (Phase 4)
18. TWAP Orders (Feature 4.1)
19. Bulk Orders (Feature 4.2)
20. Schedule Cancel (Feature 4.3)
21. Historical Candles (Feature 5.3)
22. Funding History (Feature 5.5)
23. Fee Tier Info (Feature 5.7)
24. Real-Time WebSocket Updates (Features 10.1, 10.2)

**Estimated Dev Time:** 2 weeks

---

### Optional (Future)
25. Staking & Governance (Features 6.1-6.3)
26. Sub-Accounts (Features 7.1-7.3)
27. API Wallet Management (Feature 8.1)
28. Referrals (Features 9.1-9.2)

**Estimated Dev Time:** 1-2 weeks

---

## SECURITY CONSIDERATIONS

### 1. Private Key Management

**Problem:** Hyperliquid requires private key signing for all transactions

**Solutions:**

**Option A: API Wallet (Recommended)**
```typescript
// User creates a dedicated API wallet via Hyperliquid
// This wallet has limited permissions and separate funds
const createAPIWallet = async () => {
  const { agentKey } = await exchange.approve_agent();

  // Store securely
  await secureStorage.set(`hl_api_key_${address}`, agentKey);
};
```

**Option B: Message Signing**
```typescript
// Ask user to sign a message authorizing the operation
// Backend uses this signature to authorize the trade
const signAuthorization = async (tradeDetails) => {
  const signature = await walletClient.signMessage({
    message: JSON.stringify(tradeDetails)
  });

  return signature;
};
```

**Option C: Just-In-Time Export**
```typescript
// User exports private key only when needed (not recommended)
const exportPrivateKey = async () => {
  const key = prompt("Enter your private key for this transaction:");
  return key;
};
```

---

### 2. Transaction Validation

**Always validate before execution:**
```typescript
const validatePerpOrder = async (params) => {
  // Check margin requirements
  const marginNeeded = (params.size / params.leverage) * 1.1;
  const balance = await getAccountBalance();

  if (balance < marginNeeded) {
    throw new Error('Insufficient margin');
  }

  // Check position limits
  const maxSize = await getMaxPositionSize(params.symbol);
  if (params.size > maxSize) {
    throw new Error('Exceeds maximum position size');
  }

  // Check leverage limits
  const maxLeverage = await getMaxLeverage(params.symbol);
  if (params.leverage > maxLeverage) {
    throw new Error(`Max leverage for ${params.symbol} is ${maxLeverage}x`);
  }

  return true;
};
```

---

### 3. Rate Limiting

**Hyperliquid API Limits:** 100 requests/minute per IP

**Implementation:**
```typescript
import { RateLimiter } from 'limiter';

const limiter = new RateLimiter({
  tokensPerInterval: 100,
  interval: 'minute'
});

const callAPIWithRateLimit = async (endpoint, data) => {
  await limiter.removeTokens(1);
  return callAPI(endpoint, data);
};
```

---

### 4. Error Handling

**User-friendly error messages:**
```typescript
const HYPERLIQUID_ERROR_MAP = [
  {
    pattern: /insufficient.*margin/i,
    message: (match) =>
      "You don't have enough margin for this trade. Please deposit more funds or reduce position size."
  },
  {
    pattern: /position.*limit/i,
    message: () =>
      "This position size exceeds the maximum allowed. Try a smaller size."
  },
  {
    pattern: /leverage.*too.*high/i,
    message: (match) =>
      "The leverage you selected is too high for this asset. Maximum leverage is X."
  },
  {
    pattern: /insufficient.*balance/i,
    message: () =>
      "Insufficient token balance for this trade."
  }
];

const handleHyperliquidError = (error: string): string => {
  for (const handler of HYPERLIQUID_ERROR_MAP) {
    const match = error.match(handler.pattern);
    if (match) return handler.message(match);
  }

  return `Trade failed: ${error}`;
};
```

---

## COMPARISON WITH EXISTING INTEGRATIONS

| Aspect | Lifi | Aave | Hyperliquid |
|--------|------|------|-------------|
| **Primary Use** | Bridge/Swap | Lending/Borrowing | Perp & Spot Trading |
| **Complexity** | Low | Medium | Medium-High |
| **Chain** | EVM (Multi-chain) | EVM (Multi-chain) | Non-EVM (Hyperliquid L1) |
| **Integration** | SDK + Contracts | Contract Helpers | REST API + WebSocket |
| **Auth** | Wallet signing | Wallet signing | Private key signing |
| **Transaction** | On-chain TX hash | On-chain TX hash | Order ID / Position ID |
| **Validation** | Balance check | Balance + Health Factor | Margin + Position Limits |
| **Real-time** | No | No | Yes (WebSocket) |
| **Gas Fees** | Yes | Yes | No (minor exceptions) |
| **API Cost** | Free | Free | Free |

---

## ADVANTAGES OF HYPERLIQUID INTEGRATION

1. **Free API Access** ✅ No API key costs, no subscription fees
2. **High Leverage** 🚀 Up to 50x leverage on perpetuals
3. **Low Fees** 💰 Starting at 0.045% taker, 0.015% maker (improves with volume)
4. **No Gas Fees** ⛽ Most operations are gas-free
5. **Real-Time Data** 📡 WebSocket support for live updates
6. **Order Book DEX** 📊 Better execution than AMM for large orders
7. **Comprehensive SDK** 🛠 Official Python SDK (matches your backend)
8. **Spot + Perps** 🎯 Both spot and futures in one platform
9. **Performance Tracking** 📈 Built-in PnL and performance analytics
10. **Sub-Accounts** 👥 Support for multiple trading strategies

---

## USER EXPERIENCE FLOW EXAMPLES

### Example 1: Simple Long Position

**User Input:**
```
User: "I think ETH will go up. Open a 10x long with $500"
```

**AI Response:**
```
AI: "I'll open a 10x long ETH position with $500 for you."

[Executes trade]

AI: "✅ Opened 10x Long ETH position
• Entry Price: $3,500
• Position Size: 1.43 ETH ($5,000 notional)
• Margin Used: $500
• Liquidation Price: $3,150
• Take Profit Target: Set alert at $3,800?
```

---

### Example 2: Position Management

**User Input:**
```
User: "Show my positions"
```

**AI Response:**
```
AI: "Here are your open Hyperliquid positions:

📊 **Active Positions**

1. **ETH-PERP**
   • Direction: Long 10x
   • Entry: $3,500
   • Current: $3,580 (+2.29%)
   • Size: 1.43 ETH ($5,120 notional)
   • Unrealized PnL: +$120 (+24%)
   • Liquidation: $3,150

2. **BTC-PERP**
   • Direction: Short 5x
   • Entry: $42,000
   • Current: $41,800 (-0.48%)
   • Size: 0.05 BTC ($2,090 notional)
   • Unrealized PnL: +$10 (+2.4%)
   • Liquidation: $44,100

**Total Account Value:** $5,130
**Total Unrealized PnL:** +$130 (+2.6%)

Would you like to close any positions?"
```

---

### Example 3: Risk Management

**User Input:**
```
User: "Close 50% of my ETH long"
```

**AI Response:**
```
AI: "Closing 50% of your ETH long position..."

[Executes partial close]

AI: "✅ Closed 50% of ETH Long position
• Size Closed: 0.715 ETH ($2,560 notional)
• Exit Price: $3,580
• Realized PnL: +$60 (+12%)
• Remaining Position: 0.715 ETH at 10x leverage

Your remaining ETH position:
• Current PnL: +$60
• Liquidation Price: $3,150
```

---

### Example 4: Spot Trading

**User Input:**
```
User: "Buy 100 USDC worth of HYPE token"
```

**AI Response:**
```
AI: "I'll buy HYPE tokens with 100 USDC on Hyperliquid Spot."

[Executes spot trade]

AI: "✅ Bought 4.17 HYPE tokens
• Price: $24.00 per HYPE
• Total Cost: $100 USDC
• Fee: $0.07

Your new HYPE balance: 4.17 HYPE
```

---

### Example 5: Account Overview

**User Input:**
```
User: "How am I doing on Hyperliquid?"
```

**AI Response:**
```
AI: "Here's your Hyperliquid account overview:

📊 **Account Summary**

💼 **Perpetuals Trading:**
  • Account Value: $5,130
  • Margin Used: $950 (18.5%)
  • Available Margin: $4,180
  • Unrealized PnL: +$130 (+2.6%)
  • Open Positions: 2

💰 **Spot Balances:**
  • USDC: 900.00
  • HYPE: 4.17 ($100)
  • PURR: 50.00 ($125)

📈 **Performance (All-Time):**
  • Total PnL: +$450
  • Win Rate: 65%
  • Volume Traded: $125,000
  • Fee Tier: Tier 1 (0.040% taker)

🎯 **Next Milestone:**
  • Trade $3.5M more volume for Tier 2 (0.038% taker)

Overall, you're up $450 all-time with a 65% win rate. Keep it up!"
```

---

## TESTING STRATEGY

### 1. Use Testnet First

**Testnet URLs:**
- REST: `https://api.hyperliquid-testnet.xyz`
- WebSocket: `wss://api.hyperliquid-testnet.xyz/ws`

**Configuration:**
```typescript
const HYPERLIQUID_CONFIG = {
  mainnet: {
    rest: 'https://api.hyperliquid.xyz',
    ws: 'wss://api.hyperliquid.xyz/ws',
    explorer: 'https://app.hyperliquid.xyz'
  },
  testnet: {
    rest: 'https://api.hyperliquid-testnet.xyz',
    ws: 'wss://api.hyperliquid-testnet.xyz/ws',
    explorer: 'https://app.hyperliquid-testnet.xyz'
  }
};

const useTestnet = process.env.REACT_APP_ENV !== 'production';
const API_BASE = useTestnet ? HYPERLIQUID_CONFIG.testnet : HYPERLIQUID_CONFIG.mainnet;
```

---

### 2. Test Cases

**Critical Tests:**
1. ✅ Open small position (0.1x leverage, $10 size)
2. ✅ Close position (full close)
3. ✅ Close partial position (50%)
4. ✅ Spot buy small amount ($5)
5. ✅ Spot sell small amount
6. ✅ View positions (with active position)
7. ✅ View positions (empty)
8. ✅ View account summary
9. ✅ Transfer USDC perp→spot
10. ✅ Transfer USDC spot→perp

**Edge Cases:**
11. ❌ Try to open position with insufficient margin
12. ❌ Try to close non-existent position
13. ❌ Try to sell more than spot balance
14. ❌ Try to use 100x leverage (should fail)
15. ⚠️ Network error handling
16. ⚠️ Rate limit handling

---

### 3. Error Scenarios

Test all error paths:
```typescript
const testErrorScenarios = async () => {
  // 1. Insufficient margin
  await openPerpPosition({
    symbol: 'ETH',
    size: 10000,
    leverage: 50,
    isLong: true
  });
  // Expected: "Insufficient margin" error

  // 2. Invalid symbol
  await openPerpPosition({
    symbol: 'INVALID',
    size: 100,
    leverage: 10,
    isLong: true
  });
  // Expected: "Asset not found" error

  // 3. Leverage too high
  await openPerpPosition({
    symbol: 'ETH',
    size: 100,
    leverage: 100,
    isLong: true
  });
  // Expected: "Max leverage exceeded" error

  // 4. Close non-existent position
  await closePerpPosition({ symbol: 'BTC' });
  // Expected: "No open position found" error

  // 5. Insufficient spot balance
  await executeSpotTrade({
    symbol: 'HYPE',
    side: 'sell',
    amount: 999999
  });
  // Expected: "Insufficient balance" error
};
```

---

## DEPLOYMENT CHECKLIST

### Backend
- [ ] Install `hyperliquid-python-sdk`
- [ ] Create `hyperliquid_service.py`
- [ ] Add API routes in `hyperliquid.py`
- [ ] Register blueprint in `app.py`
- [ ] Add Hyperliquid prompts to AI agent
- [ ] Test API endpoints manually
- [ ] Set up testnet configuration
- [ ] Configure rate limiting
- [ ] Add error handling

### Frontend
- [ ] Create `useHyperliquidHook.ts`
- [ ] Add Hyperliquid imports to ChatInterface
- [ ] Implement tool response handlers
- [ ] Add transaction types to types.ts
- [ ] Update transaction recording calls
- [ ] Test all user flows
- [ ] Add loading states
- [ ] Add error messages
- [ ] Test on testnet

### Security
- [ ] Implement secure private key storage
- [ ] Add API wallet creation flow
- [ ] Add transaction confirmations
- [ ] Add risk warnings (liquidation, leverage)
- [ ] Implement rate limiting
- [ ] Add input validation
- [ ] Test with small amounts first

### UI/UX
- [ ] Design position display cards
- [ ] Add PnL color coding (green/red)
- [ ] Add real-time price updates
- [ ] Add liquidation price warnings
- [ ] Add trade confirmations
- [ ] Add success/failure toasts
- [ ] Add loading spinners
- [ ] Test mobile responsiveness

### Documentation
- [ ] Write user guide
- [ ] Document all commands
- [ ] Create FAQ section
- [ ] Add risk disclaimers
- [ ] Document testnet vs mainnet

---

## COST ANALYSIS

### Development Costs
**Estimated Development Time:**
- MVP (Priority 1): 1-2 weeks
- Full Features (Priority 1-3): 4-6 weeks

**Developer Hours:**
- Backend: 40-60 hours
- Frontend: 60-80 hours
- Testing: 20-30 hours
- Documentation: 10-15 hours

**Total:** 130-185 hours

---

### Operational Costs

**API Costs:** $0 (100% FREE) ✅

**Infrastructure:**
- Server costs: Existing (no additional cost)
- WebSocket connections: Free (Hyperliquid provides)

**Trading Costs (Passed to Users):**
- Perpetuals: 0.045% taker / 0.015% maker (base tier)
- Spot: 0.070% taker / 0.040% maker (base tier)
- Improves with volume

**Example:**
- User trades $1000: Fee = $0.45 (taker) or $0.15 (maker)
- Much lower than traditional CEXs

---

## MONETIZATION OPPORTUNITIES

### 1. Volume-Based Fee Sharing
- Hyperliquid may offer fee sharing for platforms
- Negotiate partnership as you grow volume

### 2. Premium Features
- Real-time WebSocket alerts: Premium tier
- Advanced analytics: Premium tier
- Copy trading: Premium tier

### 3. Referral Program
- Use Hyperliquid referral codes
- Earn rebates on user trading fees

---

## COMPETITIVE ADVANTAGES

**Why Users Will Use Hyperliquid in Agentify:**

1. **Conversational Trading** 💬
   - "Open 10x long ETH" vs. navigating complex UI
   - Natural language risk management
   - AI-powered trade suggestions

2. **Integrated Portfolio View** 📊
   - See Lifi swaps, Aave lending, AND Hyperliquid trading
   - Unified transaction history
   - Cross-protocol analytics

3. **Risk Management** 🛡️
   - AI warns about high leverage
   - Auto-calculates liquidation prices
   - Suggests appropriate position sizes

4. **Mobile-First** 📱
   - Chat interface easier than exchange UI
   - Quick trades on the go
   - Voice commands (future)

5. **Learning Curve** 📚
   - AI explains perpetuals to beginners
   - Guided trading for new users
   - Built-in risk education

---

## ROADMAP

### Phase 1: MVP (Weeks 1-2)
- ✅ Basic perpetuals (open/close)
- ✅ Spot trading (buy/sell)
- ✅ Account summary
- ✅ Position viewing

### Phase 2: Enhanced Trading (Weeks 3-4)
- ✅ Leverage management
- ✅ Limit orders
- ✅ Order cancellation
- ✅ Trading history
- ✅ Real-time prices

### Phase 3: Advanced Features (Weeks 5-6)
- ✅ Stop loss / take profit
- ✅ Position sizing tools
- ✅ Margin management
- ✅ Order book data
- ✅ Performance analytics

### Phase 4: Pro Features (Weeks 7-8)
- ✅ TWAP orders
- ✅ WebSocket real-time updates
- ✅ Sub-accounts
- ✅ API wallets
- ✅ Copy trading (future)

### Phase 5: Mobile & Voice (Future)
- 🔮 Voice commands
- 🔮 Mobile app
- 🔮 Push notifications
- 🔮 Telegram bot

---

## CONCLUSION

**Hyperliquid integration offers tremendous value for Agentify:**

1. **35+ Features** spanning perpetuals, spot, account management, and analytics
2. **100% FREE API** with generous rate limits
3. **Strong Alignment** with existing Lifi/Aave patterns
4. **Competitive Edge** through conversational trading interface
5. **Monetization Potential** via premium features and referrals

**Recommended Action Plan:**

1. **Start with MVP** (Priority 1 features)
   - Open/close perp positions
   - Spot trading
   - Account viewing

2. **Test on Testnet** extensively

3. **Soft Launch** with limited users

4. **Iterate** based on feedback

5. **Expand** to Priority 2-4 features

**Expected Impact:**
- **User Engagement**: +50% (new trading use case)
- **Transaction Volume**: +200% (high-leverage trading)
- **User Retention**: +30% (sticky trading features)
- **Revenue Potential**: Fee sharing + premium tiers

**Total Development Time:** 4-8 weeks for full implementation

**Risk Level:** Low (free API, well-documented, testnet available)

**ROI:** Very High (no API costs, high user value)

---

## APPENDIX: ADDITIONAL RESOURCES

### Official Documentation
- Main Docs: https://hyperliquid.gitbook.io/hyperliquid-docs
- API Reference: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api
- Python SDK: https://github.com/hyperliquid-dex/hyperliquid-python-sdk
- JavaScript SDK: https://github.com/nomeida/hyperliquid

### Community Resources
- Discord: https://discord.gg/hyperliquid
- Twitter: @HyperliquidX
- Telegram: t.me/hyperliquid

### Developer Tools
- Testnet Faucet: Available in Discord
- API Playground: https://app.hyperliquid-testnet.xyz/API
- Explorer: https://app.hyperliquid.xyz

### Example Projects
- Trading Bots: github.com/hyperliquid-dex/hyperliquid-python-sdk/examples
- Market Making: Community examples on Discord
- Analytics: Various community-built tools

---

**End of Analysis**

This comprehensive document provides everything needed to integrate Hyperliquid into Agentify, following the proven patterns from Lifi and Aave integrations.
