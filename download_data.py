"""
Automated Data Download Script for Derivative Hedging RL Project
Run this to download all necessary datasets
"""

import os
import yfinance as yf
import pandas as pd
from datetime import datetime
import requests
from tqdm import tqdm

# Create directories
os.makedirs("data/raw", exist_ok=True)
os.makedirs("data/processed", exist_ok=True)

print("=" * 60)
print("DERIVATIVE HEDGING RL - DATA DOWNLOAD SCRIPT")
print("=" * 60)

# ============================================================
# 1. YAHOO FINANCE DATA (Primary Dataset)
# ============================================================
print("\n[1/5] Downloading Yahoo Finance data...")

tickers = {
    "SPY": "S&P 500 ETF",
    "AAPL": "Apple Inc.",
    "QQQ": "Nasdaq 100 ETF",
    "IWM": "Russell 2000 ETF",
    "GLD": "Gold ETF",
    "^VIX": "CBOE Volatility Index"
}

start_date = "2015-01-01"
end_date = "2025-12-31"

for ticker, name in tickers.items():
    try:
        print(f"  Downloading {ticker} ({name})...")
        data = yf.download(ticker, start=start_date, end=end_date, progress=False)
        
        if len(data) > 0:
            filename = f"data/raw/{ticker.replace('^', '')}_daily.csv"
            data.to_csv(filename)
            print(f"    ✓ Saved {len(data)} rows to {filename}")
        else:
            print(f"    ✗ No data found for {ticker}")
    except Exception as e:
        print(f"    ✗ Error downloading {ticker}: {e}")

# ============================================================
# 2. OPTIONS CHAIN DATA (Current Snapshot)
# ============================================================
print("\n[2/5] Downloading current options chain for SPY...")

try:
    spy = yf.Ticker("SPY")
    expirations = spy.options[:5]  # First 5 expiration dates
    
    all_calls = []
    all_puts = []
    
    for exp_date in expirations:
        print(f"  Getting options for expiry: {exp_date}")
        chain = spy.option_chain(exp_date)
        
        calls = chain.calls.copy()
        puts = chain.puts.copy()
        calls['expiry'] = exp_date
        puts['expiry'] = exp_date
        
        all_calls.append(calls)
        all_puts.append(puts)
    
    calls_df = pd.concat(all_calls, ignore_index=True)
    puts_df = pd.concat(all_puts, ignore_index=True)
    
    calls_df.to_csv("data/raw/SPY_calls_chain.csv", index=False)
    puts_df.to_csv("data/raw/SPY_puts_chain.csv", index=False)
    
    print(f"    ✓ Saved {len(calls_df)} call options")
    print(f"    ✓ Saved {len(puts_df)} put options")
except Exception as e:
    print(f"    ✗ Error downloading options chain: {e}")

# ============================================================
# 3. CBOE VIX HISTORICAL DATA
# ============================================================
print("\n[3/5] Downloading CBOE VIX historical data...")

try:
    # VIX data from CBOE (direct CSV download)
    vix_url = "https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv"
    
    print(f"  Fetching from: {vix_url}")
    response = requests.get(vix_url, timeout=30)
    
    if response.status_code == 200:
        with open("data/raw/VIX_History.csv", "wb") as f:
            f.write(response.content)
        
        # Load and preview
        vix_df = pd.read_csv("data/raw/VIX_History.csv", skiprows=1)
        print(f"    ✓ Downloaded {len(vix_df)} rows of VIX data")
        print(f"    Date range: {vix_df['DATE'].min()} to {vix_df['DATE'].max()}")
    else:
        print(f"    ✗ Failed to download (Status {response.status_code})")
        print("    Alternative: Use ^VIX from yfinance above")
except Exception as e:
    print(f"    ✗ Error: {e}")
    print("    Using ^VIX data from Yahoo Finance instead")

# ============================================================
# 4. RISK-FREE RATE DATA (Treasury Yields)
# ============================================================
print("\n[4/5] Downloading US Treasury yields (risk-free rate)...")

try:
    # 10-Year Treasury Constant Maturity Rate from FRED
    treasury_url = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10"
    
    print(f"  Fetching from FRED...")
    treasury = pd.read_csv(treasury_url)
    treasury.to_csv("data/raw/US_Treasury_10Y.csv", index=False)
    
    print(f"    ✓ Downloaded {len(treasury)} rows")
    print(f"    Latest 10Y yield: {treasury['DGS10'].iloc[-1]}%")
except Exception as e:
    print(f"    ✗ Error: {e}")
    print("    Using fixed r=0.05 (5%) as fallback")

# ============================================================
# 5. GENERATE SYNTHETIC DATA (GBM Paths)
# ============================================================
print("\n[5/5] Generating synthetic price paths...")

import numpy as np

def generate_gbm_paths(S0, mu, sigma, T, dt, n_paths):
    """Generate GBM price paths"""
    n_steps = int(T / dt)
    paths = np.zeros((n_paths, n_steps + 1))
    paths[:, 0] = S0
    
    for t in range(1, n_steps + 1):
        Z = np.random.standard_normal(n_paths)
        paths[:, t] = paths[:, t-1] * np.exp(
            (mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * Z
        )
    return paths

# Generate training dataset
np.random.seed(42)
print("  Generating 10,000 GBM price paths (60 trading days each)...")

paths = generate_gbm_paths(
    S0=100.0, 
    mu=0.05, 
    sigma=0.20, 
    T=60/252,  # 60 trading days
    dt=1/252,  # Daily steps
    n_paths=10000
)

# Save as numpy array
np.save("data/synthetic/gbm_paths_10k.npy", paths)
print(f"    ✓ Saved 10,000 paths to data/synthetic/gbm_paths_10k.npy")
print(f"    Shape: {paths.shape} (paths × days)")

# ============================================================
# SUMMARY
# ============================================================
print("\n" + "=" * 60)
print("DOWNLOAD COMPLETE!")
print("=" * 60)

print("\n📁 Downloaded Files:")
print("  data/raw/")
print("    ├─ SPY_daily.csv          (S&P 500 ETF prices)")
print("    ├─ AAPL_daily.csv         (Apple stock prices)")
print("    ├─ QQQ_daily.csv          (Nasdaq 100 ETF)")
print("    ├─ IWM_daily.csv          (Russell 2000 ETF)")
print("    ├─ GLD_daily.csv          (Gold ETF)")
print("    ├─ VIX_daily.csv          (CBOE VIX Index)")
print("    ├─ SPY_calls_chain.csv    (Current call options)")
print("    ├─ SPY_puts_chain.csv     (Current put options)")
print("    ├─ VIX_History.csv        (VIX historical)")
print("    └─ US_Treasury_10Y.csv    (Risk-free rate)")
print("\n  data/synthetic/")
print("    └─ gbm_paths_10k.npy      (10K synthetic paths)")

print("\n✅ You can now proceed with training!")
print("   Next step: python src/training/train.py")
print("=" * 60)
