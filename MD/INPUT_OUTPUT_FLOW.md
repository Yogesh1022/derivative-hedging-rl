# 🔄 PROJECT INPUT/OUTPUT FLOW DIAGRAM

## Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INPUT SOURCES                                │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
        ┌───────────────┐  ┌──────────────┐  ┌──────────────┐
        │  Market Data  │  │   Option     │  │  Synthetic   │
        │   (Yahoo)     │  │  Parameters  │  │    Data      │
        │               │  │              │  │   (GBM/      │
        │ • SPY prices  │  │ • Strike K   │  │   Heston)    │
        │ • VIX index   │  │ • Maturity T │  │              │
        │ • Treasury    │  │ • Type: Call │  │ • 50K paths  │
        │   rates       │  │ • Volatility │  │ • 60 days ea.│
        └───────────────┘  └──────────────┘  └──────────────┘
                    │              │              │
                    └──────────────┼──────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DATA PREPROCESSING                                │
│                                                                       │
│  • Normalize prices → S_t / S_0                                      │
│  • Compute realized volatility (rolling 20-day)                      │
│  • Calculate risk-free rate from Treasury yields                     │
│  • Feature engineering: returns, RSI, moving averages                │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   RL ENVIRONMENT SETUP                               │
│                                                                       │
│  State Space (9 dimensions):                                         │
│    [S_norm, σ, Δ, Γ, V, Θ, τ, hedge_pos, cum_PnL]                  │
│                                                                       │
│  Action Space:                                                       │
│    Continuous [-1, 1] → buy/sell underlying shares                   │
│                                                                       │
│  Reward Function:                                                    │
│    r = -|ΔPnL| - λ₁·TxnCost - λ₂·Drawdown                            │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    AGENT TRAINING                                    │
│                                                                       │
│  Phase 1: Pre-train on GBM (500K steps)                             │
│  Phase 2: Train on Heston (300K steps)                              │
│  Phase 3: Fine-tune on historical (200K steps)                       │
│                                                                       │
│  Algorithms: DQN, PPO, SAC                                           │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
        ┌───────────────┐  ┌──────────────┐  ┌──────────────┐
        │  DQN Model    │  │  PPO Model   │  │  SAC Model   │
        │  (Discrete)   │  │ (Continuous) │  │ (Continuous) │
        │   trained     │  │   trained    │  │   trained    │
        └───────────────┘  └──────────────┘  └──────────────┘
                    │              │              │
                    └──────────────┼──────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EVALUATION & TESTING                              │
│                                                                       │
│  • Run 1,000 test episodes on held-out data                          │
│  • Compare vs baselines (Delta, D-G, D-G-V hedging)                  │
│  • Compute metrics: hedge error, Sharpe, CVaR, max drawdown          │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         OUTPUTS                                      │
│                                                                       │
│  1. Trained Models (.zip files)                                      │
│     • models/sac/best_model.zip                                      │
│     • models/ppo/best_model.zip                                      │
│     • models/dqn/best_model.zip                                      │
│                                                                       │
│  2. Performance Metrics (JSON/CSV)                                   │
│     ┌─────────────────────────────────────────────────┐             │
│     │ Strategy    │ Hedge Err │ Sharpe │ CVaR │ TxnCost│             │
│     ├─────────────┼───────────┼────────┼──────┼────────┤             │
│     │ No Hedge    │   8.45    │  -0.52 │ 15.2 │   0.0  │             │
│     │ Delta       │   2.31    │   0.41 │  4.8 │  2.15  │             │
│     │ D-G Hedge   │   1.87    │   0.58 │  3.9 │  3.42  │             │
│     │ SAC Agent   │   1.23    │   0.89 │  2.1 │  1.87  │  ← Winner  │
│     └─────────────────────────────────────────────────┘             │
│                                                                       │
│  3. Hedging Decisions Time Series                                    │
│     • Daily buy/sell actions                                         │
│     • Hedge ratio vs time                                            │
│     • Comparison: RL actions vs delta                                │
│                                                                       │
│  4. Portfolio PnL                                                    │
│     • Cumulative PnL over episode                                    │
│     • Per-step PnL distribution                                      │
│     • Terminal PnL histogram (1000 episodes)                         │
│                                                                       │
│  5. Visualizations (PNG/PDF)                                         │
│     • Cumulative PnL curves                                          │
│     • Hedge ratio heatmap                                            │
│     • Action distribution plots                                      │
│     • Training reward curves                                         │
│                                                                       │
│  6. Interactive Dashboard (Streamlit)                                │
│     • Live episode simulation                                        │
│     • Strategy comparison tool                                       │
│     • Risk metrics visualizer                                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Input Specifications

### 1. Historical Market Data Files

| File | Columns | Rows | Date Range |
|------|---------|------|------------|
| `SPY_daily.csv` | Date, Open, High, Low, Close, Volume | ~2,500 | 2015-2025 |
| `AAPL_daily.csv` | Date, Open, High, Low, Close, Volume | ~2,500 | 2015-2025 |
| `VIX_daily.csv` | Date, Close | ~2,500 | 2015-2025 |
| `US_Treasury_10Y.csv` | Date, DGS10 | ~2,500 | 2015-2025 |

**Example CSV format:**
```csv
Date,Open,High,Low,Close,Adj Close,Volume
2024-01-03,475.25,478.50,474.10,477.71,477.71,83547600
2024-01-04,477.50,479.23,475.82,478.45,478.45,89234700
...
```

### 2. Options Chain Data

| File | Columns | Rows |
|------|---------|------|
| `SPY_calls_chain.csv` | strike, lastPrice, bid, ask, volume, openInterest, impliedVolatility, expiry | ~500 |
| `SPY_puts_chain.csv` | strike, lastPrice, bid, ask, volume, openInterest, impliedVolatility, expiry | ~500 |

**Example:**
```csv
strike,lastPrice,bid,ask,volume,openInterest,impliedVolatility,expiry
470.0,12.35,12.30,12.40,523,8934,0.1523,2026-03-20
475.0,9.85,9.80,9.90,1247,12456,0.1489,2026-03-20
...
```

### 3. Synthetic Path Data

| File | Format | Shape | Description |
|------|--------|-------|-------------|
| `gbm_paths_50k.npy` | NumPy array | (50000, 61) | 50K paths × 61 days |
| `heston_paths_20k.npy` | NumPy array | (20000, 61) | 20K paths × 61 days |
| `heston_vols_20k.npy` | NumPy array | (20000, 61) | Corresponding volatilities |

**Example values:**
```python
paths[0] = [100.0, 100.5, 99.8, 101.2, ..., 105.3]  # One price path
```

### 4. Configuration Parameters (YAML)

```yaml
market:
  S0: 100.0                      # Initial stock price
  risk_free_rate: 0.05           # 5% annual
  sigma: 0.20                    # 20% annual volatility

option:
  type: "call"
  strike: 100.0
  maturity_days: 60

environment:
  reward_lambda_txn: 0.01        # Transaction cost penalty
  reward_lambda_dd: 0.1          # Drawdown penalty

training:
  algorithm: "SAC"
  total_timesteps: 1000000
  learning_rate: 0.0003
```

---

## Detailed Output Specifications

### 1. Trained Model Files

```
models/
├─ sac/
│  ├─ best_model.zip           # Best SAC model (15-30 MB)
│  ├─ final_model.zip          # Final checkpoint
│  └─ replay_buffer.pkl        # Experience buffer
├─ ppo/
│  └─ best_model.zip
└─ dqn/
   └─ best_model.zip
```

**Model structure:**
- Actor network weights
- Critic network weights
- Optimizer states
- Normalization statistics

### 2. Performance Metrics

**File:** `results/metrics_comparison.json`

```json
{
  "no_hedge": {
    "hedge_error": 8.45,
    "portfolio_variance": 71.3,
    "total_txn_cost": 0.0,
    "max_drawdown": 25.7,
    "sharpe_ratio": -0.52,
    "cvar_95": 15.2,
    "terminal_pnl_mean": -12.5,
    "terminal_pnl_std": 18.3
  },
  "delta_hedge": {
    "hedge_error": 2.31,
    "portfolio_variance": 5.3,
    "total_txn_cost": 2.15,
    "max_drawdown": 6.8,
    "sharpe_ratio": 0.41,
    "cvar_95": 4.8,
    "terminal_pnl_mean": 1.2,
    "terminal_pnl_std": 3.5
  },
  "sac_agent": {
    "hedge_error": 1.23,
    "portfolio_variance": 1.5,
    "total_txn_cost": 1.87,
    "max_drawdown": 3.2,
    "sharpe_ratio": 0.89,
    "cvar_95": 2.1,
    "terminal_pnl_mean": 2.8,
    "terminal_pnl_std": 1.9
  }
}
```

### 3. Hedging Decisions Time Series

**File:** `results/hedging_actions_episode_123.csv`

```csv
step,stock_price,option_delta,agent_hedge,delta_hedge,step_pnl,cum_pnl,txn_cost
0,100.00,0.530,-0.530,-0.530,0.00,5.43,0.053
1,100.50,0.548,-0.545,-0.548,-0.265,5.17,0.015
2,99.80,0.512,-0.520,-0.512,0.383,5.55,0.010
3,101.20,0.575,-0.578,-0.575,-0.102,5.45,0.012
...
59,105.30,0.987,-0.990,-0.987,2.145,8.23,0.003
60,104.75,1.000,-1.000,-1.000,0.550,8.78,0.010
```

### 4. Episode-Level Outputs

**File:** `results/test_episodes.csv`

```csv
episode_id,terminal_pnl,max_drawdown,hedge_error,txn_cost,final_stock_price
1,2.45,1.23,1.12,1.85,105.30
2,-0.87,3.21,1.45,1.92,98.50
3,4.12,0.85,0.98,1.76,107.85
...
1000,1.95,2.10,1.34,1.88,102.45
```

### 5. Visualization Outputs

**Directory:** `results/figures/`

| File | Description | Dimensions |
|------|-------------|------------|
| `cumulative_pnl_comparison.png` | All strategies PnL curves | 1920×1080 |
| `hedge_ratio_timeseries.png` | RL vs delta hedge over time | 1920×1080 |
| `terminal_pnl_distribution.png` | Histogram of terminal PnL | 1200×800 |
| `action_heatmap.png` | Agent actions by (S, τ) state | 1600×1200 |
| `training_reward_curve.png` | Training progress with CI | 1920×1080 |
| `transaction_cost_comparison.png` | Bar chart of costs | 1200×800 |

### 6. Dashboard Output

**Launch:** `streamlit run app.py`

**URL:** `http://localhost:8501`

**Features:**
- Live episode simulation with step-by-step controls
- Strategy selector (SAC, PPO, DQN, Delta, D-G)
- Real-time metric updates
- Interactive plotly charts
- Parameter tuning sliders

---

## Example: Single Episode Flow

```
INPUT → [S₀=100, K=100, T=60 days, σ=0.20, r=0.05, Option=Call]
│
├─ Day 0: Sell call option, receive premium $5.43
│          State: [1.00, 0.20, 0.53, 0.02, 0.35, -0.05, 0.23, 0, 5.43]
│          Agent action: -0.530 (short 0.53 shares)
│          Cost: $0.053
│
├─ Day 1: Stock moves to $100.50
│          Hedge PnL: -0.53 × (100.50 - 100.00) = -$0.265
│          Option value change: -$0.250
│          Net PnL: -$0.265 - $0.250 - $0.015 = -$0.530
│          New State: [1.005, 0.21, 0.548, 0.019, 0.34, -0.049, 0.227, -0.530, 4.90]
│          Agent action: -0.545 (adjust hedge)
│
├─ Day 2: Stock moves to $99.80
│     ... (continues for 60 days)
│
└─ Day 60: Stock = $104.75, Option expires ITM
           Payoff: max(104.75 - 100, 0) = $4.75
           Total PnL: $8.78 (including all hedging)

OUTPUT → Final metrics for this episode:
         • Terminal PnL: $8.78
         • Hedge error: 1.12
         • Max drawdown: 1.23
         • Total txn cost: $1.85
```

---

## Key Output Metrics Explained

| Metric | Formula | Interpretation | Target |
|--------|---------|----------------|--------|
| **Hedge Error** | $\sigma(\Delta\text{PnL}_t)$ | Daily PnL volatility | Minimize (< 2.0) |
| **Portfolio Variance** | $\text{Var}(\text{Terminal PnL})$ | Terminal outcome spread | Minimize (< 10.0) |
| **Sharpe Ratio** | $\frac{\mu(\text{PnL})}{\sigma(\text{PnL})} \sqrt{252}$ | Risk-adjusted return | Maximize (> 0.5) |
| **CVaR₉₅** | $-E[\text{PnL} \mid \text{PnL} < \text{VaR}_{95}]$ | Tail risk | Minimize (< 5.0) |
| **Max Drawdown** | $\max_t (\text{peak}_t - \text{PnL}_t)$ | Worst loss from peak | Minimize (< 5.0) |
| **Txn Cost** | $\sum_t c \cdot |a_t| \cdot S_t$ | Total trading cost | Minimize |

---

## Summary: What You Get

✅ **Inputs needed:**
1. Historical stock prices (SPY, AAPL) — Download via Yahoo Finance
2. Synthetic paths (GBM/Heston) — Generate yourself
3. Option parameters (K, T, type) — Choose your scenario
4. RL config (hyperparameters) — Use defaults or tune

✅ **Outputs produced:**
1. **3 trained RL agents** (DQN, PPO, SAC) that can hedge options
2. **Performance comparison table** showing RL beats delta hedging
3. **Hedging strategy** (buy/sell decisions) for any price path
4. **Risk metrics** (hedge error, Sharpe, CVaR, drawdown)
5. **Visualizations** (PnL curves, action heatmaps, distributions)
6. **Interactive dashboard** to test different scenarios

**Bottom line:** Input = market data + option specs → Output = AI that hedges better than Black-Scholes!
