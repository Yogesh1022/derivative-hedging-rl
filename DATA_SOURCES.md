# 📥 DATA SOURCES & DOWNLOAD INSTRUCTIONS

## Quick Start: Automated Download ⚡

```bash
# Install dependencies first
pip install yfinance pandas numpy requests tqdm

# Run the automated download script
python download_data.py
```

**This downloads everything automatically!** (Recommended)

---

## Manual Download Instructions (If Needed)

### 1️⃣ Yahoo Finance Data (via Python)

**What:** Historical stock prices, ETFs, VIX  
**Cost:** Free, no API key required  
**Library:** `yfinance`

**Direct Links:**
- SPY: https://finance.yahoo.com/quote/SPY/history
- AAPL: https://finance.yahoo.com/quote/AAPL/history
- QQQ: https://finance.yahoo.com/quote/QQQ/history
- ^VIX: https://finance.yahoo.com/quote/%5EVIX/history

**Python Code:**
```python
import yfinance as yf

# Download 10 years of SPY data
spy = yf.download("SPY", start="2015-01-01", end="2025-12-31")
spy.to_csv("data/raw/SPY_daily.csv")

# Download options chain
ticker = yf.Ticker("SPY")
options = ticker.option_chain("2026-03-20")  # Specific expiry
options.calls.to_csv("data/raw/SPY_calls.csv")
options.puts.to_csv("data/raw/SPY_puts.csv")
```

**Manual Download Steps:**
1. Go to https://finance.yahoo.com/quote/SPY/history
2. Set date range: Jan 1, 2015 - Dec 31, 2025
3. Click "Download" button
4. Save as `data/raw/SPY_daily.csv`
5. Repeat for AAPL, QQQ, IWM, GLD, ^VIX

---

### 2️⃣ CBOE VIX Historical Data

**What:** Daily VIX index since 1990  
**Cost:** Free  
**Direct Download Link:** https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv

**Download Steps:**
1. Click link above OR go to https://www.cboe.com/tradable_products/vix/vix_historical_data/
2. Click "Download Data" → "VIX Historical Data"
3. Save as `data/raw/VIX_History.csv`

**Alternative (via Python):**
```python
import pandas as pd

vix = pd.read_csv(
    "https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv",
    skiprows=1
)
vix.to_csv("data/raw/VIX_History.csv", index=False)
```

---

### 3️⃣ US Treasury Yields (Risk-Free Rate)

**What:** 10-Year Treasury Constant Maturity Rate  
**Cost:** Free  
**Source:** Federal Reserve Economic Data (FRED)  
**Direct Link:** https://fred.stlouisfed.org/series/DGS10

**Download Steps:**
1. Go to https://fred.stlouisfed.org/series/DGS10
2. Click "Download" button (top right)
3. Select format: CSV
4. Date range: Full history
5. Save as `data/raw/US_Treasury_10Y.csv`

**Direct CSV Link:**
```
https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10
```

**Python Code:**
```python
import pandas as pd

treasury = pd.read_csv("https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10")
treasury.to_csv("data/raw/US_Treasury_10Y.csv", index=False)
```

---

### 4️⃣ Kaggle Datasets (Optional — For Advanced Work)

#### A. Optiver Realized Volatility Prediction

**What:** Real order book data, volatility targets (~3GB)  
**Cost:** Free (Kaggle account required)  
**Link:** https://www.kaggle.com/competitions/optiver-realized-volatility-prediction/data

**Download Steps:**
1. Create Kaggle account (free): https://www.kaggle.com/
2. Go to competition page (link above)
3. Click "Data" tab → "Download All" button
4. Extract to `data/raw/optiver_volatility/`

**OR use Kaggle API:**
```bash
pip install kaggle

# Setup: Put kaggle.json in ~/.kaggle/
kaggle competitions download -c optiver-realized-volatility-prediction
unzip optiver-realized-volatility-prediction.zip -d data/raw/optiver_volatility/
```

#### B. S&P 500 Stock Data

**What:** Historical prices for all S&P 500 stocks (~50MB)  
**Link:** https://www.kaggle.com/datasets/camnugent/sandp500

**Download Steps:**
1. Go to https://www.kaggle.com/datasets/camnugent/sandp500
2. Click "Download" (top right)
3. Extract to `data/raw/sp500/`

**Kaggle API:**
```bash
kaggle datasets download -d camnugent/sandp500
unzip sandp500.zip -d data/raw/sp500/
```

#### C. Huge Stock Market Dataset (All US Stocks/ETFs)

**What:** Daily OHLCV for all US equities (~800MB)  
**Link:** https://www.kaggle.com/datasets/borismarjanovic/price-volume-data-for-all-us-stocks-etfs

**Download:**
```bash
kaggle datasets download -d borismarjanovic/price-volume-data-for-all-us-stocks-etfs
unzip price-volume-data-for-all-us-stocks-etfs.zip -d data/raw/us_stocks/
```

#### D. JPX Tokyo Stock Exchange Prediction

**What:** Stock returns, options data (~300MB)  
**Link:** https://www.kaggle.com/competitions/jpx-tokyo-stock-exchange-prediction/data

**Download:**
```bash
kaggle competitions download -c jpx-tokyo-stock-exchange-prediction
unzip jpx-tokyo-stock-exchange-prediction.zip -d data/raw/jpx/
```

---

### 5️⃣ Quandl / Nasdaq Data Link (Optional)

**What:** Alternative data source for financial time series  
**Cost:** Free tier available (API key required)  
**Sign up:** https://data.nasdaq.com/sign-up

**Install:**
```bash
pip install nasdaq-data-link
```

**Usage:**
```python
import nasdaqdatalink

# Set your API key (get from https://data.nasdaq.com/account/profile)
nasdaqdatalink.ApiConfig.api_key = "YOUR_API_KEY_HERE"

# Download VIX
vix = nasdaqdatalink.get("CBOE/VIX", start_date="2015-01-01")
vix.to_csv("data/raw/VIX_quandl.csv")

# Download Treasury yields
rates = nasdaqdatalink.get("FRED/DGS10", start_date="2015-01-01")
rates.to_csv("data/raw/treasury_quandl.csv")
```

---

## 🔧 Synthetic Data Generation (No Download Needed)

**This is the PRIMARY training data source** — used in academic research.

### Geometric Brownian Motion (GBM)

```python
import numpy as np

def generate_gbm_paths(S0, mu, sigma, T, dt, n_paths):
    """Generate stock price paths using GBM"""
    n_steps = int(T / dt)
    paths = np.zeros((n_paths, n_steps + 1))
    paths[:, 0] = S0
    
    for t in range(1, n_steps + 1):
        Z = np.random.standard_normal(n_paths)
        paths[:, t] = paths[:, t-1] * np.exp(
            (mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * Z
        )
    return paths

# Generate 50,000 training paths
np.random.seed(42)
paths = generate_gbm_paths(
    S0=100.0,      # Initial price
    mu=0.05,       # 5% drift
    sigma=0.20,    # 20% volatility
    T=60/252,      # 60 trading days
    dt=1/252,      # Daily steps
    n_paths=50000
)

# Save
np.save("data/synthetic/gbm_paths_50k.npy", paths)
print(f"Generated {paths.shape[0]} paths × {paths.shape[1]} days")
```

### Heston Stochastic Volatility

```python
def generate_heston_paths(S0, v0, mu, kappa, theta, xi, rho, T, dt, n_paths):
    """Generate paths using Heston model (stochastic volatility)"""
    n_steps = int(T / dt)
    prices = np.zeros((n_paths, n_steps + 1))
    variances = np.zeros((n_paths, n_steps + 1))
    prices[:, 0] = S0
    variances[:, 0] = v0
    
    for t in range(1, n_steps + 1):
        Z1 = np.random.standard_normal(n_paths)
        Z2 = rho * Z1 + np.sqrt(1 - rho**2) * np.random.standard_normal(n_paths)
        
        # Update variance
        variances[:, t] = np.maximum(
            variances[:, t-1] + kappa * (theta - variances[:, t-1]) * dt 
            + xi * np.sqrt(np.maximum(variances[:, t-1], 0) * dt) * Z2,
            0
        )
        
        # Update price
        prices[:, t] = prices[:, t-1] * np.exp(
            (mu - 0.5 * variances[:, t-1]) * dt 
            + np.sqrt(np.maximum(variances[:, t-1], 0) * dt) * Z1
        )
    
    return prices, variances

# Generate 20,000 Heston paths
paths, vols = generate_heston_paths(
    S0=100.0,      # Initial price
    v0=0.04,       # Initial variance (σ=20%)
    mu=0.05,       # Drift
    kappa=2.0,     # Mean reversion speed
    theta=0.04,    # Long-run variance
    xi=0.3,        # Vol of vol
    rho=-0.7,      # Correlation (typically negative)
    T=60/252,
    dt=1/252,
    n_paths=20000
)

np.save("data/synthetic/heston_paths_20k.npy", paths)
np.save("data/synthetic/heston_vols_20k.npy", vols)
```

---

## 📊 Data Files You Need (Checklist)

### ✅ Minimum Required (For Basic Training)

```
data/
├─ raw/
│  ├─ SPY_daily.csv              ← Yahoo Finance (free)
│  └─ VIX_daily.csv              ← Yahoo Finance (free)
│
└─ synthetic/
   └─ gbm_paths_10k.npy          ← Generate yourself (see code above)
```

**This is enough to train and test the RL agent!**

### 🎯 Recommended (For Better Results)

```
data/
├─ raw/
│  ├─ SPY_daily.csv
│  ├─ AAPL_daily.csv
│  ├─ QQQ_daily.csv
│  ├─ VIX_daily.csv
│  ├─ VIX_History.csv            ← CBOE (free)
│  ├─ US_Treasury_10Y.csv        ← FRED (free)
│  ├─ SPY_calls_chain.csv        ← Yahoo Finance options
│  └─ SPY_puts_chain.csv
│
└─ synthetic/
   ├─ gbm_paths_50k.npy
   └─ heston_paths_20k.npy
```

### 🚀 Advanced (For Research-Grade Work)

Add Kaggle datasets:
```
data/raw/
├─ optiver_volatility/           ← Kaggle (3GB)
├─ sp500/                        ← Kaggle (50MB)
└─ jpx/                          ← Kaggle (300MB)
```

---

## 🎯 Recommended Training Strategy

| Phase | Data Source | Size | Purpose |
|-------|-------------|------|---------|
| **1. Pre-training** | GBM synthetic | 50K paths | Learn basics, stable dynamics |
| **2. Intermediate** | Heston synthetic | 20K paths | Handle stochastic volatility |
| **3. Fine-tuning** | SPY historical | 2K windows | Adapt to real market |
| **4. Testing** | AAPL historical | 500 windows | Out-of-sample validation |

**Why synthetic first?**
- Unlimited data (no overfitting)
- Controlled experiments
- Standard approach in academic papers
- Real options data with full Greeks is expensive

---

## 🔗 Quick Reference Links

| Resource | Link |
|----------|------|
| **Yahoo Finance** | https://finance.yahoo.com |
| **CBOE VIX Data** | https://www.cboe.com/tradable_products/vix/vix_historical_data/ |
| **FRED (Treasury)** | https://fred.stlouisfed.org/series/DGS10 |
| **Kaggle Datasets** | https://www.kaggle.com/datasets |
| **Nasdaq Data Link** | https://data.nasdaq.com |
| **yfinance Docs** | https://github.com/ranaroussi/yfinance |

---

## ⚡ Fastest Way to Get Started

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run automated download
python download_data.py

# 3. Verify data
ls data/raw/
ls data/synthetic/

# 4. Start training
python src/training/train.py --algorithm SAC
```

**Done!** You now have all the data needed for the project.
