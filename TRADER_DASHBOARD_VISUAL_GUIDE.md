# Trader Dashboard - Visual Guide

**Quick reference for all new trader dashboard pages**

---

## 📝 Order Entry Page

```
┌─────────────────────────────────────────────────────────┐
│  📝 Order Entry                                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │  🟢 BUY         │  │  🔴 SELL         │            │
│  │  (Selected)     │  │                  │            │
│  └──────────────────┘  └──────────────────┘            │
│                                                          │
│  Portfolio: [My Trading Portfolio ▼        ]            │
│  Asset Type: [Stock ▼                      ]            │
│  Symbol: [AAPL________________________    ]            │
│  Quantity: [100___]  Price: [$150.00___]               │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │ ORDER SUMMARY                              │         │
│  │ Subtotal              $15,000.00          │         │
│  │ Commission                  $0.99          │         │
│  │ ───────────────────────────────────        │         │
│  │ Total                -$15,000.99          │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
│  [        BUY AAPL        ]                             │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │ 💡 Trading Tips                            │         │
│  │ • All orders executed instantly            │         │
│  │ • Commission is $0.99 per trade            │         │
│  │ • BUY orders create new positions          │         │
│  └────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

**Key Features:**
- Toggle between BUY (green) and SELL (red)
- Support for stocks, options, futures, forex, crypto
- Real-time order total calculation
- Success/error notifications
- Form validation

---

## 📊 Position Management Page

```
┌──────────────────────────────────────────────────────────────┐
│  📊 Position Management                                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │ Total   │  │ Market  │  │Unrealized│                     │
│  │  15     │  │ $75,000 │  │  +$2,450│                     │
│  └─────────┘  └─────────┘  └─────────┘                     │
│                                                               │
│  Portfolio: [All Portfolios ▼] Status: [Open Positions ▼]   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ SYMBOL │TYPE │QTY│AVG   │CURRENT│MKT VAL│P&L │GREEKS│   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ AAPL   │STOCK│100│$150.00│$165.00│$16,500│+15%│  -  │   │
│  │ [Edit] [Close]                                       │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ TSLA   │STOCK│ 50│$800.00│$750.00│$37,500│-6.3%│ -  │   │
│  │ [Edit] [Close]                                       │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ SPY    │OPTION│10│ $45.00│ $48.50│ $4,850│+7.8%│Δ0.6│   │
│  │ CALL $450              STRIKE $450       │Γ0.04│   │
│  │ [Edit] [Close]                                       │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Key Features:**
- View all positions with P&L
- Inline editing (quantity, current price)
- Close positions with confirmation
- Filter by portfolio and status
- Greeks display for options
- Color-coded P&L (green/red)

---

## 📜 Trade History Page

```
┌──────────────────────────────────────────────────────────────┐
│  📜 Trade History                              [📥 Export]   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │  Total  │  │  Volume │  │Commission│                     │
│  │   142   │  │ $485K   │  │ $140.58 │                     │
│  │ 75↑ 67↓ │  │         │  │         │                     │
│  └─────────┘  └─────────┘  └─────────┘                     │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │ FILTERS                                            │     │
│  │ Portfolio: [All ▼] Status: [All ▼]                │     │
│  │ Side: [Buy & Sell ▼] Symbol: [__________]         │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ DATE       │SYMBOL│SIDE│QTY│PRICE│TOTAL│COMM│STATUS │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ 03/03 10:30│AAPL  │BUY │100│$150 │$15K │$1  │EXECUTED│  │
│  │ 03/03 11:45│TSLA  │SELL│ 50│$750 │$37K │$1  │EXECUTED│  │
│  │ 03/03 14:20│SPY   │BUY │ 10│$450 │$4.5K│$1  │PENDING │  │
│  │                                         [Cancel]    │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Complete trade history
- Multiple filters (portfolio, status, side, symbol)
- Export to CSV or JSON
- Cancel pending trades
- Statistics summary
- Status badges (color-coded)

---

## 💼 Portfolio Management Page

```
┌──────────────────────────────────────────────────────────────┐
│  💼 Portfolio Management              [+ Create Portfolio]   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │ My Trading    │  │ Retirement    │  │ Options       │   │
│  │ Portfolio     │  │ Account       │  │ Strategy      │   │
│  │ [ACTIVE]      │  │               │  │               │   │
│  │               │  │               │  │               │   │
│  │ Total Value   │  │ Total Value   │  │ Total Value   │   │
│  │   $142,500    │  │   $85,300     │  │   $28,900     │   │
│  │               │  │               │  │               │   │
│  │ P&L: +$12,450 │  │ P&L: +$4,200  │  │ P&L: -$1,100  │   │
│  │     +9.6%     │  │     +5.2%     │  │     -3.7%     │   │
│  │               │  │               │  │               │   │
│  │ Risk: 45/100  │  │ Risk: 22/100  │  │ Risk: 68/100  │   │
│  │ σ 12.3%       │  │ σ 8.4%        │  │ σ 18.7%       │   │
│  │               │  │               │  │               │   │
│  │ [Edit][Delete]│  │ [Edit][Delete]│  │ [Edit][Delete]│   │
│  └───────────────┘  └───────────────┘  └───────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ My Trading Portfolio - Performance                   │   │
│  │                                                        │   │
│  │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐         │   │
│  │ │ Sharpe │ │Max Draw│ │VaR 95% │ │  Cash  │         │   │
│  │ │  1.85  │ │ -12.3% │ │ $5,200 │ │$12,000 │         │   │
│  │ └────────┘ └────────┘ └────────┘ └────────┘         │   │
│  │                                                        │   │
│  │ [30-Day Performance Chart]                            │   │
│  │ ────────────────────────────────────                 │   │
│  │        ╱╲      ╱╲                                     │   │
│  │       ╱  ╲    ╱  ╲╱╲                                 │   │
│  │      ╱    ╲  ╱      ╲                                 │   │
│  │     ╱      ╲╱        ╲                                │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Portfolio card grid
- Create/Edit/Delete portfolios
- Key metrics display (P&L, risk, volatility)
- Performance chart (30-day)
- Detail view on selection
- Active badge
- Empty state with CTA

---

## 🎨 UX Components

### Loading Spinner

```
    ⟳
  Loading...
```

### Toast Notifications

```
┌──────────────────────────────────┐
│ ✅ Order executed successfully!  │  [×]
└──────────────────────────────────┘
(Green background, auto-dismiss 5s)

┌──────────────────────────────────┐
│ ❌ Failed to close position      │  [×]
└──────────────────────────────────┘
(Red background, auto-dismiss 5s)
```

### Skeleton Loader

```
┌────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓░░░░░░░              │ (shimmer)
│ ▓▓▓▓▓▓░░░░░░░░░                │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░          │
└────────────────────────────────┘
```

### Error Boundary

```
┌─────────────────────────────────┐
│            ⚠️                   │
│  Something went wrong           │
│  An unexpected error occurred.  │
│  Please try refreshing.         │
│                                  │
│  [▼ Error Details]              │
│                                  │
│  [   Refresh Page   ]           │
└─────────────────────────────────┘
```

---

## Navigation Flow

```
Trader Dashboard
├── Overview (existing)
├── Order Entry          ← NEW
│   └── Place buy/sell orders
├── Positions            ← NEW
│   └── Manage open/closed positions
├── Trade History        ← NEW
│   └── View past trades
└── Portfolios           ← NEW
    └── Manage portfolios
```

---

## Color Coding

**Order Types:**
- 🟢 **BUY** - Green button, green highlights
- 🔴 **SELL** - Red button, red highlights

**P&L:**
- 🟢 **Positive** - Green text (e.g., +$1,234)
- 🔴 **Negative** - Red text (e.g., -$567)

**Status Badges:**
- 🟢 **EXECUTED** - Green badge
- 🟡 **PENDING** - Yellow badge
- ⚪ **CANCELLED** - Gray badge
- 🔴 **FAILED** - Red badge

**Asset Types:**
- 📊 **STOCK** - Default badge
- 📈 **OPTION** - Info badge (blue)
- 📉 **FUTURE** - Info badge
- 💱 **FOREX** - Info badge
- ₿ **CRYPTO** - Info badge

---

## Responsive Behavior

### Desktop (1200px+)
```
┌──────────┬──────────┬──────────┬──────────┐
│  Card 1  │  Card 2  │  Card 3  │  Card 4  │
└──────────┴──────────┴──────────┴──────────┘
```

### Tablet (768px - 1199px)
```
┌──────────┬──────────┐
│  Card 1  │  Card 2  │
├──────────┼──────────┤
│  Card 3  │  Card 4  │
└──────────┴──────────┘
```

### Mobile (< 768px)
```
┌──────────┐
│  Card 1  │
├──────────┤
│  Card 2  │
├──────────┤
│  Card 3  │
├──────────┤
│  Card 4  │
└──────────┘
```

**Tables:** Horizontal scroll on mobile
**Filters:** Stack vertically
**Buttons:** Full width on mobile

---

## Quick Start

1. **Start trading:**
   - Go to Order Entry
   - Select portfolio
   - Enter symbol, quantity, price
   - Click BUY or SELL

2. **Manage positions:**
   - Go to Positions
   - Click Edit to modify
   - Click Close to exit

3. **View history:**
   - Go to Trade History
   - Apply filters
   - Export data

4. **Manage portfolios:**
   - Go to Portfolios
   - Create new or edit existing
   - View performance

---

**All pages follow the clean white theme with consistent spacing, typography, and color palette.**
