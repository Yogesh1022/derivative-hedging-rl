"""
Prepare Multi-Asset Training Data

Downloads and processes data for SPY, AAPL, QQQ, and other assets

Usage:
    python scripts/prepare_multi_asset_data.py --tickers SPY AAPL QQQ
"""

import argparse
import pandas as pd
import numpy as np
import yfinance as yf
from pathlib import Path
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class MultiAssetDataPreparator:
    """Prepare and synchronize data for multiple assets"""
    
    def __init__(self, tickers: list, start_date: str, end_date: str):
        self.tickers = tickers
        self.start_date = start_date
        self.end_date = end_date
        self.data = {}
        
    def download_data(self):
        """Download data for all tickers"""
        logger.info(f"Downloading data for {len(self.tickers)} assets...")
        
        for ticker in self.tickers:
            logger.info(f"  Downloading {ticker}...")
            try:
                ticker_obj = yf.Ticker(ticker)
                df = ticker_obj.history(start=self.start_date, end=self.end_date, interval='1d')
                
                if df.empty:
                    logger.warning(f"  ⚠️ No data for {ticker}")
                    continue
                
                # Add technical indicators
                df['Returns'] = df['Close'].pct_change()
                df['Log_Returns'] = np.log(df['Close'] / df['Close'].shift(1))
                df['Volatility_20'] = df['Returns'].rolling(window=20).std() * np.sqrt(252)
                df['Volatility_60'] = df['Returns'].rolling(window=60).std() * np.sqrt(252)
                df['SMA_20'] = df['Close'].rolling(window=20).mean()
                df['SMA_50'] = df['Close'].rolling(window=50).mean()
                
                # RSI
                delta = df['Close'].diff()
                gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
                loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
                rs = gain / loss
                df['RSI'] = 100 - (100 / (1 + rs))
                
                # ATR (Average True Range)
                high_low = df['High'] - df['Low']
                high_close = np.abs(df['High'] - df['Close'].shift())
                low_close = np.abs(df['Low'] - df['Close'].shift())
                ranges = pd.concat([high_low, high_close, low_close], axis=1)
                true_range = ranges.max(axis=1)
                df['ATR'] = true_range.rolling(14).mean()
                
                # Drop NaN
                df = df.dropna()
                
                self.data[ticker] = df
                logger.info(f"  ✅ {ticker}: {len(df)} days")
                
            except Exception as e:
                logger.error(f"  ❌ Error downloading {ticker}: {e}")
                
    def calculate_correlations(self):
        """Calculate cross-asset correlations"""
        logger.info("\n📊 Calculating cross-asset correlations...")
        
        # Align data by date
        common_dates = None
        for ticker, df in self.data.items():
            if common_dates is None:
                common_dates = set(df.index)
            else:
                common_dates = common_dates.intersection(set(df.index))
        
        common_dates = sorted(common_dates)
        logger.info(f"  Common dates: {len(common_dates)}")
        
        # Build returns matrix
        returns_dict = {}
        for ticker, df in self.data.items():
            returns_dict[ticker] = df.loc[common_dates, 'Returns']
        
        returns_df = pd.DataFrame(returns_dict)
        
        # Calculate correlation matrix
        corr_matrix = returns_df.corr()
        logger.info("\n  Correlation Matrix:")
        print(corr_matrix.to_string())
        
        return corr_matrix
        
    def calculate_statistics(self):
        """Calculate statistics for each asset"""
        logger.info("\n📈 Asset Statistics:")
        
        stats = []
        for ticker, df in self.data.items():
            stats.append({
                'Ticker': ticker,
                'Mean Return': df['Returns'].mean() * 252,  # Annualized
                'Volatility': df['Returns'].std() * np.sqrt(252),  # Annualized
                'Sharpe (RF=0)': (df['Returns'].mean() / df['Returns'].std()) * np.sqrt(252),
                'Min Price': df['Close'].min(),
                'Max Price': df['Close'].max(),
                'Total Return': (df['Close'].iloc[-1] / df['Close'].iloc[0] - 1) * 100,
                'Days': len(df)
            })
        
        stats_df = pd.DataFrame(stats)
        print("\n" + stats_df.to_string(index=False))
        
        return stats_df
        
    def save_data(self, output_dir: str = "data/multi_asset"):
        """Save processed data"""
        logger.info(f"\n💾 Saving data to {output_dir}...")
        
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        for ticker, df in self.data.items():
            filepath = output_path / f"{ticker}.csv"
            df.to_csv(filepath)
            logger.info(f"  ✅ Saved {ticker} to {filepath}")
        
        # Save combined summary
        stats = self.calculate_statistics()
        stats.to_csv(output_path / "asset_statistics.csv", index=False)
        logger.info(f"  ✅ Saved statistics to {output_path / 'asset_statistics.csv'}")
        
        # Save correlation matrix
        corr_matrix = self.calculate_correlations()
        corr_matrix.to_csv(output_path / "correlation_matrix.csv")
        logger.info(f"  ✅ Saved correlations to {output_path / 'correlation_matrix.csv'}")
        
    def create_config(self, output_dir: str = "configs"):
        """Create config file for multi-asset training"""
        logger.info("\n⚙️ Creating multi-asset config...")
        
        config = {
            'multi_asset_training': {
                'enabled': True,
                'assets': self.tickers,
                'data_path': 'data/multi_asset',
                'n_steps': 252,
                'episode_length': 252,
                'randomize_asset': True
            },
            'environment': {
                'name': 'MultiAssetHedging-v0',
                'initial_price': 100.0,
                'strike': 100.0,
                'volatility': 0.20,
                'risk_free_rate': 0.05,
                'transaction_cost': 0.001
            }
        }
        
        import yaml
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        config_file = output_path / "multi_asset_config.yaml"
        with open(config_file, 'w') as f:
            yaml.dump(config, f, default_flow_style=False)
        
        logger.info(f"  ✅ Created config: {config_file}")


def main():
    parser = argparse.ArgumentParser(description='Prepare multi-asset data')
    parser.add_argument('--tickers', type=str, nargs='+', default=['SPY', 'AAPL', 'QQQ'],
                       help='List of ticker symbols')
    parser.add_argument('--start-date', type=str, default='2020-01-01',
                       help='Start date (YYYY-MM-DD)')
    parser.add_argument('--end-date', type=str, default='2024-12-31',
                       help='End date (YYYY-MM-DD)')
    parser.add_argument('--output-dir', type=str, default='data/multi_asset',
                       help='Output directory')
    
    args = parser.parse_args()
    
    logger.info("="*80)
    logger.info("🚀 MULTI-ASSET DATA PREPARATION")
    logger.info("="*80)
    logger.info(f"Tickers: {', '.join(args.tickers)}")
    logger.info(f"Date Range: {args.start_date} to {args.end_date}")
    
    # Initialize preparator
    preparator = MultiAssetDataPreparator(args.tickers, args.start_date, args.end_date)
    
    # Download data
    preparator.download_data()
    
    # Calculate correlations
    preparator.calculate_correlations()
    
    # Calculate statistics
    preparator.calculate_statistics()
    
    # Save data
    preparator.save_data(args.output_dir)
    
    # Create config
    preparator.create_config()
    
    logger.info("\n" + "="*80)
    logger.info("✅ Multi-asset data preparation complete!")
    logger.info("="*80)
    logger.info("\nNext steps:")
    logger.info("  1. Review data in data/multi_asset/")
    logger.info("  2. Run training with: python scripts/train_multi_asset.py")


if __name__ == "__main__":
    main()
