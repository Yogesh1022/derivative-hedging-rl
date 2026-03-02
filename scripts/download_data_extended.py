"""
Extended Data Download Script
Downloads 5 years of historical data (2020-2024) for extended backtesting

Usage:
    python scripts/download_data_extended.py --start-date 2020-01-01 --end-date 2024-12-31
"""

import argparse
import pandas as pd
import yfinance as yf
from pathlib import Path
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def download_extended_data(
    ticker: str,
    start_date: str,
    end_date: str,
    save_dir: str = "data/raw"
):
    """
    Download extended historical data for backtesting
    
    Args:
        ticker: Stock ticker symbol
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
        save_dir: Directory to save downloaded data
    """
    logger.info(f"Downloading {ticker} data from {start_date} to {end_date}")
    
    # Create save directory
    save_path = Path(save_dir)
    save_path.mkdir(parents=True, exist_ok=True)
    
    try:
        # Download data using yfinance
        ticker_obj = yf.Ticker(ticker)
        df = ticker_obj.history(start=start_date, end=end_date, interval='1d')
        
        if df.empty:
            logger.error(f"No data downloaded for {ticker}")
            return None
        
        # Add technical indicators
        df['Returns'] = df['Close'].pct_change()
        df['Log_Returns'] = np.log(df['Close'] / df['Close'].shift(1))
        df['Volatility_20'] = df['Returns'].rolling(window=20).std() * np.sqrt(252)
        df['SMA_20'] = df['Close'].rolling(window=20).mean()
        df['SMA_50'] = df['Close'].rolling(window=50).mean()
        
        # RSI calculation
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))
        
        # Drop NaN rows
        df = df.dropna()
        
        # Save to CSV
        filename = f"{ticker}_extended_{start_date}_{end_date}.csv"
        filepath = save_path / filename
        df.to_csv(filepath)
        
        logger.info(f"✅ Downloaded {len(df)} rows for {ticker}")
        logger.info(f"   Date range: {df.index[0]} to {df.index[-1]}")
        logger.info(f"   Saved to: {filepath}")
        
        # Print summary statistics
        logger.info(f"\n📊 Summary Statistics:")
        logger.info(f"   Mean Return: {df['Returns'].mean():.4%}")
        logger.info(f"   Volatility: {df['Returns'].std() * np.sqrt(252):.4%}")
        logger.info(f"   Min Price: ${df['Close'].min():.2f}")
        logger.info(f"   Max Price: ${df['Close'].max():.2f}")
        logger.info(f"   Total Return: {(df['Close'].iloc[-1] / df['Close'].iloc[0] - 1):.2%}")
        
        return df
        
    except Exception as e:
        logger.error(f"Error downloading {ticker}: {str(e)}")
        return None


def download_multiple_tickers(
    tickers: list,
    start_date: str,
    end_date: str,
    save_dir: str = "data/raw"
):
    """Download data for multiple tickers"""
    logger.info(f"Downloading data for {len(tickers)} tickers")
    
    results = {}
    for ticker in tickers:
        df = download_extended_data(ticker, start_date, end_date, save_dir)
        results[ticker] = df
        
    success_count = sum(1 for df in results.values() if df is not None)
    logger.info(f"\n✅ Successfully downloaded {success_count}/{len(tickers)} tickers")
    
    return results


def main():
    parser = argparse.ArgumentParser(description='Download extended historical data')
    parser.add_argument('--ticker', type=str, default='SPY', help='Stock ticker symbol')
    parser.add_argument('--tickers', type=str, nargs='+', help='Multiple ticker symbols')
    parser.add_argument('--start-date', type=str, default='2020-01-01', help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, default='2024-12-31', help='End date (YYYY-MM-DD)')
    parser.add_argument('--save-dir', type=str, default='data/raw', help='Directory to save data')
    
    args = parser.parse_args()
    
    # Import numpy here since it's needed in the functions
    import numpy as np
    globals()['np'] = np
    
    if args.tickers:
        # Download multiple tickers
        download_multiple_tickers(args.tickers, args.start_date, args.end_date, args.save_dir)
    else:
        # Download single ticker
        download_extended_data(args.ticker, args.start_date, args.end_date, args.save_dir)


if __name__ == "__main__":
    main()
