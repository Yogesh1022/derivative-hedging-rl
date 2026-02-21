# ✅ DATA DOWNLOAD CHECKLIST

Use this checklist to track what you've downloaded.

---

## 🚀 Quick Start (Easiest Method)

```bash
# Install dependencies
pip install yfinance pandas numpy requests tqdm

# Run automated download script
python download_data.py
```

**✅ This downloads everything automatically!** Then skip to verification section.

---

## 📥 Manual Download Checklist (If Needed)

### MINIMUM REQUIRED (Tier 1) — ~50 MB

These files are absolutely necessary to run the project:

- [ ] **SPY_daily.csv** (S&P 500 ETF prices)
  - Link: https://finance.yahoo.com/quote/SPY/history
  - Date range: 2015-01-01 to 2025-12-31
  - Save to: `data/raw/SPY_daily.csv`
  - Size: ~2 MB
  - Download method: Yahoo Finance website OR `yfinance` library

- [ ] **VIX_daily.csv** (Volatility index)
  - Link: https://finance.yahoo.com/quote/%5EVIX/history
  - Date range: 2015-01-01 to 2025-12-31
  - Save to: `data/raw/VIX_daily.csv`
  - Size: ~2 MB
  - Download method: Yahoo Finance OR `yfinance`

- [ ] **Synthetic GBM paths** (Generate yourself)
  - No download needed — generate with Python
  - Save to: `data/synthetic/gbm_paths_10k.npy`
  - Size: ~40 MB
  - Code: See `download_data.py` or `DATA_SOURCES.md`

**Status:** [ ] All Tier 1 files downloaded ✅

---

### RECOMMENDED (Tier 2) — Additional ~150 MB

These improve training quality and realism:

- [ ] **AAPL_daily.csv** (Apple stock prices)
  - Link: https://finance.yahoo.com/quote/AAPL/history
  - Save to: `data/raw/AAPL_daily.csv`
  - Size: ~2 MB

- [ ] **QQQ_daily.csv** (Nasdaq 100 ETF)
  - Link: https://finance.yahoo.com/quote/QQQ/history
  - Save to: `data/raw/QQQ_daily.csv`
  - Size: ~2 MB

- [ ] **VIX_History.csv** (VIX since 1990)
  - Link: https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv
  - Save to: `data/raw/VIX_History.csv`
  - Size: ~1 MB
  - Direct download: Click link OR visit https://www.cboe.com/tradable_products/vix/vix_historical_data/

- [ ] **US_Treasury_10Y.csv** (Risk-free rate)
  - Link: https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10
  - Save to: `data/raw/US_Treasury_10Y.csv`
  - Size: ~500 KB
  - Or visit: https://fred.stlouisfed.org/series/DGS10 → Download

- [ ] **SPY_calls_chain.csv** (Current call options)
  - Via `yfinance` library only (see code in `download_data.py`)
  - Save to: `data/raw/SPY_calls_chain.csv`
  - Size: ~1 MB

- [ ] **SPY_puts_chain.csv** (Current put options)
  - Via `yfinance` library only
  - Save to: `data/raw/SPY_puts_chain.csv`
  - Size: ~1 MB

- [ ] **Synthetic Heston paths** (Generate yourself)
  - Save to: `data/synthetic/heston_paths_20k.npy`
  - Size: ~100 MB
  - Code: See `download_data.py`

**Status:** [ ] All Tier 2 files downloaded ✅

---

### ADVANCED (Tier 3) — Kaggle Datasets ~4 GB

Optional — for research-grade work:

- [ ] **Optiver Realized Volatility** (~3 GB)
  - Link: https://www.kaggle.com/competitions/optiver-realized-volatility-prediction/data
  - Requires: Kaggle account (free)
  - Save to: `data/raw/optiver_volatility/`
  - Method: 
    1. Go to competition page
    2. Click "Data" → "Download All"
    3. OR use Kaggle API: `kaggle competitions download -c optiver-realized-volatility-prediction`

- [ ] **S&P 500 Stock Data** (~50 MB)
  - Link: https://www.kaggle.com/datasets/camnugent/sandp500
  - Save to: `data/raw/sp500/`
  - Method: Kaggle website OR API: `kaggle datasets download -d camnugent/sandp500`

- [ ] **JPX Tokyo Stock Exchange** (~300 MB)
  - Link: https://www.kaggle.com/competitions/jpx-tokyo-stock-exchange-prediction/data
  - Save to: `data/raw/jpx/`
  - Method: Kaggle API: `kaggle competitions download -c jpx-tokyo-stock-exchange-prediction`

- [ ] **Huge US Stock Market Dataset** (~800 MB)
  - Link: https://www.kaggle.com/datasets/borismarjanovic/price-volume-data-for-all-us-stocks-etfs
  - Save to: `data/raw/us_stocks/`
  - Method: Kaggle API: `kaggle datasets download -d borismarjanovic/price-volume-data-for-all-us-stocks-etfs`

**Status:** [ ] Tier 3 files downloaded (optional) ✅

---

## 📋 Download Methods Comparison

| Method | Pros | Cons | Recommended For |
|--------|------|------|-----------------|
| **Automated Script** (`download_data.py`) | • One command<br>• No manual steps<br>• Reliable | • Requires Python packages | Everyone |
| **Python Code** (`yfinance`, etc.) | • Programmable<br>• Latest data<br>• Free | • Need to write code | Developers |
| **Manual Website Download** | • No code needed<br>• Visual interface | • Tedious<br>• Error-prone | Beginners |
| **Kaggle API** | • Fast<br>• Automated | • Setup required<br>• Kaggle account | Advanced users |

---

## 🔧 Exact Download Commands

### Method 1: Automated (RECOMMENDED)

```bash
# One command, downloads everything
python download_data.py
```

### Method 2: Python Script

```python
import yfinance as yf
import pandas as pd

# Download SPY
spy = yf.download("SPY", start="2015-01-01", end="2025-12-31")
spy.to_csv("data/raw/SPY_daily.csv")

# Download VIX
vix = yf.download("^VIX", start="2015-01-01", end="2025-12-31")
vix.to_csv("data/raw/VIX_daily.csv")

# Download AAPL
aapl = yf.download("AAPL", start="2015-01-01", end="2025-12-31")
aapl.to_csv("data/raw/AAPL_daily.csv")

# Download options chain
ticker = yf.Ticker("SPY")
options = ticker.option_chain("2026-03-20")
options.calls.to_csv("data/raw/SPY_calls_chain.csv")
options.puts.to_csv("data/raw/SPY_puts_chain.csv")

# Download VIX history from CBOE
vix_hist = pd.read_csv(
    "https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv",
    skiprows=1
)
vix_hist.to_csv("data/raw/VIX_History.csv", index=False)

# Download Treasury yields
treasury = pd.read_csv("https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10")
treasury.to_csv("data/raw/US_Treasury_10Y.csv", index=False)

print("Download complete!")
```

### Method 3: Kaggle API (for Tier 3 datasets)

```bash
# Setup Kaggle API (one-time)
pip install kaggle
# Download kaggle.json from https://www.kaggle.com/settings/account
# Place in ~/.kaggle/ (Linux/Mac) or C:\Users\YourName\.kaggle\ (Windows)

# Download datasets
kaggle competitions download -c optiver-realized-volatility-prediction
kaggle datasets download -d camnugent/sandp500
kaggle competitions download -c jpx-tokyo-stock-exchange-prediction

# Extract
unzip optiver-realized-volatility-prediction.zip -d data/raw/optiver_volatility/
unzip sandp500.zip -d data/raw/sp500/
unzip jpx-tokyo-stock-exchange-prediction.zip -d data/raw/jpx/
```

---

## ✅ Verification Checklist

After downloading, verify you have the correct files:

```bash
# Check directory structure
ls -R data/

# Should see:
# data/raw/
#   SPY_daily.csv
#   VIX_daily.csv
#   ... (more CSVs)
# 
# data/synthetic/
#   gbm_paths_10k.npy
#   heston_paths_20k.npy (optional)
```

### Verify File Sizes

Run this Python script:

```python
import os

files_to_check = {
    "data/raw/SPY_daily.csv": (1, 3),      # 1-3 MB expected
    "data/raw/VIX_daily.csv": (1, 3),
    "data/raw/AAPL_daily.csv": (1, 3),
    "data/synthetic/gbm_paths_10k.npy": (30, 50),  # 30-50 MB
}

print("File verification:")
for filepath, (min_mb, max_mb) in files_to_check.items():
    if os.path.exists(filepath):
        size_mb = os.path.getsize(filepath) / (1024 * 1024)
        status = "✓" if min_mb <= size_mb <= max_mb else "⚠"
        print(f"{status} {filepath}: {size_mb:.2f} MB")
    else:
        print(f"✗ {filepath}: NOT FOUND")
```

### Verify Data Quality

```python
import pandas as pd
import numpy as np

# Check CSV files
spy = pd.read_csv("data/raw/SPY_daily.csv")
print(f"SPY rows: {len(spy)} (should be ~2,500)")
print(f"SPY columns: {spy.columns.tolist()}")
print(f"Date range: {spy['Date'].min()} to {spy['Date'].max()}")

# Check synthetic data
paths = np.load("data/synthetic/gbm_paths_10k.npy")
print(f"Synthetic paths shape: {paths.shape} (should be 10000 × 61)")
print(f"Price range: {paths.min():.2f} to {paths.max():.2f}")
```

---

## 🎯 What You Actually Need (Practical Guide)

### For Learning / Testing

```
✅ MUST HAVE:
  - SPY_daily.csv
  - gbm_paths_10k.npy (generate)

This is enough for basic training!
```

### For Good Results

```
✅ RECOMMENDED:
  - SPY_daily.csv
  - AAPL_daily.csv
  - VIX_daily.csv
  - US_Treasury_10Y.csv
  - gbm_paths_50k.npy (generate)
  - heston_paths_20k.npy (generate)

This gives publication-quality results.
```

### For Research-Grade Project

```
✅ FULL SETUP:
  - All Tier 1 files
  - All Tier 2 files
  - Optiver Volatility dataset (Tier 3)

This is what top researchers use.
```

---

## 📊 Expected File Structure After Download

```
Derivative_Hedging_RL/
├── data/
│   ├── raw/
│   │   ├── SPY_daily.csv              ✓ Downloaded
│   │   ├── AAPL_daily.csv             ✓ Downloaded
│   │   ├── QQQ_daily.csv              ✓ Downloaded
│   │   ├── IWM_daily.csv              (optional)
│   │   ├── GLD_daily.csv              (optional)
│   │   ├── VIX_daily.csv              ✓ Downloaded
│   │   ├── VIX_History.csv            ✓ Downloaded
│   │   ├── US_Treasury_10Y.csv        ✓ Downloaded
│   │   ├── SPY_calls_chain.csv        ✓ Downloaded
│   │   ├── SPY_puts_chain.csv         ✓ Downloaded
│   │   ├── optiver_volatility/        (optional, 3 GB)
│   │   ├── sp500/                     (optional, 50 MB)
│   │   └── jpx/                       (optional, 300 MB)
│   │
│   ├── processed/                     (created by preprocessing scripts)
│   │   └── (empty initially)
│   │
│   └── synthetic/
│       ├── gbm_paths_10k.npy          ✓ Generated
│       ├── gbm_paths_50k.npy          ✓ Generated
│       ├── heston_paths_20k.npy       ✓ Generated
│       └── heston_vols_20k.npy        ✓ Generated
│
├── download_data.py                   ← Run this!
├── DATA_SOURCES.md                    ← Reference guide
└── DATA_DOWNLOAD_CHECKLIST.md         ← You are here
```

---

## 🚨 Common Issues & Solutions

### Issue 1: `yfinance` fails to download

**Error:** `No data found, symbol may be delisted`

**Solution:**
```python
# Use longer timeout
import yfinance as yf
yf.pdr_override()
data = yf.download("SPY", start="2015-01-01", end="2025-12-31", 
                   progress=False, timeout=30)
```

### Issue 2: CBOE VIX link broken

**Solution:** Use Yahoo Finance instead:
```python
vix = yf.download("^VIX", start="2015-01-01", end="2025-12-31")
```

### Issue 3: Kaggle API not working

**Solution:** Manual download from website:
1. Go to dataset page
2. Click "Download" button
3. Extract manually

### Issue 4: Synthetic data generation too slow

**Solution:** Use fewer paths initially:
```python
# Start with 1,000 paths for testing
paths = generate_gbm_paths(..., n_paths=1000)
```

---

## ⏱️ Time Estimates

| Task | Time Required |
|------|--------------|
| **Automated download** (`download_data.py`) | 2-5 minutes |
| **Manual download** (Tier 1 + 2) | 15-20 minutes |
| **Generate synthetic data** (10K GBM + 20K Heston) | 5-10 minutes |
| **Kaggle datasets** (Tier 3) | 30-60 minutes (large files) |
| **Total (all data)** | 45-90 minutes |

---

## 📞 Need Help?

If downloads fail:
1. Check internet connection
2. Try alternative sources (Yahoo Finance ↔ Quandl)
3. Use synthetic data only (works fine for training!)
4. Reduce date range to speed up downloads

**Remember:** Synthetic data (GBM/Heston) is the PRIMARY training source used in academic research. Real market data is mainly for fine-tuning and testing.

---

## ✅ Final Status Check

- [ ] Ran `python download_data.py` successfully
- [ ] Verified files exist in `data/raw/` and `data/synthetic/`
- [ ] Checked file sizes are reasonable
- [ ] Loaded sample data in Python without errors
- [ ] Ready to proceed to training phase!

**Once all checked → You're ready to train your RL agents!** 🚀

Next step: `python src/training/train.py --algorithm SAC`
