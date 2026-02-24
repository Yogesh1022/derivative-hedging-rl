"""
Historical Market Data Loader

Loads and prepares processed market data for training and backtesting.
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime


class HistoricalDataLoader:
    """Load historical market data from processed CSV files."""
    
    def __init__(self, data_dir: str = "data/processed"):
        """
        Initialize the data loader.
        
        Args:
            data_dir: Directory containing processed data files
        """
        self.data_dir = Path(data_dir)
        self._market_data = None
        self._options_data = None
        
    def load_market_data(self, reload: bool = False) -> pd.DataFrame:
        """
        Load processed market data (SPY, VIX, etc.).
        
        Args:
            reload: Force reload even if already cached
            
        Returns:
            DataFrame with market data
        """
        if self._market_data is None or reload:
            market_file = self.data_dir / "market_data_processed.csv"
            
            if not market_file.exists():
                raise FileNotFoundError(
                    f"Market data file not found: {market_file}\n"
                    f"Please run data preprocessing first."
                )
            
            self._market_data = pd.read_csv(market_file, parse_dates=['Date'])
            print(f"✓ Loaded market data: {len(self._market_data)} rows")
            
        return self._market_data
    
    def load_options_data(self, reload: bool = False) -> pd.DataFrame:
        """
        Load processed options chain data.
        
        Args:
            reload: Force reload even if already cached
            
        Returns:
            DataFrame with options data
        """
        if self._options_data is None or reload:
            options_file = self.data_dir / "spy_options_processed.csv"
            
            if not options_file.exists():
                raise FileNotFoundError(
                    f"Options data file not found: {options_file}\n"
                    f"Please run data preprocessing first."
                )
            
            self._options_data = pd.read_csv(options_file)
            print(f"✓ Loaded options data: {len(self._options_data)} contracts")
            
        return self._options_data
    
    def get_date_range(self) -> Tuple[datetime, datetime]:
        """Get the available date range."""
        df = self.load_market_data()
        return df['Date'].min(), df['Date'].max()
    
    def get_data_for_period(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        train_split: float = 0.8
    ) -> Dict[str, pd.DataFrame]:
        """
        Get data split into train/test periods.
        
        Args:
            start_date: Start date (YYYY-MM-DD) or None for all data
            end_date: End date (YYYY-MM-DD) or None for all data  
            train_split: Fraction of data to use for training
            
        Returns:
            Dictionary with 'train' and 'test' DataFrames
        """
        df = self.load_market_data()
        
        # Filter by date range
        if start_date:
            df = df[df['Date'] >= start_date]
        if end_date:
            df = df[df['Date'] <= end_date]
        
        # Split into train/test
        split_idx = int(len(df) * train_split)
        
        return {
            'train': df.iloc[:split_idx].reset_index(drop=True),
            'test': df.iloc[split_idx:].reset_index(drop=True),
        }
    
    def get_random_episodes(
        self,
        n_episodes: int = 100,
        episode_length: int = 100,
        seed: Optional[int] = None
    ) -> List[pd.DataFrame]:
        """
        Create random episodes from historical data.
        
        Each episode is a continuous window of market data.
        
        Args:
            n_episodes: Number of episodes to generate
            episode_length: Length of each episode in days
            seed: Random seed for reproducibility
            
        Returns:
            List of DataFrames, each representing one episode
        """
        df = self.load_market_data()
        
        if len(df) < episode_length:
            raise ValueError(
                f"Not enough data: need {episode_length} rows, have {len(df)}"
            )
        
        # Set random seed
        if seed is not None:
            np.random.seed(seed)
        
        episodes = []
        max_start = len(df) - episode_length
        
        for _ in range(n_episodes):
            start_idx = np.random.randint(0, max_start)
            end_idx = start_idx + episode_length
            episode = df.iloc[start_idx:end_idx].reset_index(drop=True)
            episodes.append(episode)
        
        return episodes
    
    def get_market_stats(self) -> Dict:
        """Get summary statistics of the market data."""
        df = self.load_market_data()
        
        stats = {
            'num_rows': len(df),
            'date_range': f"{df['Date'].min()} to {df['Date'].max()}",
            'spy_price_range': f"${df['SPY_Close'].min():.2f} - ${df['SPY_Close'].max():.2f}",
            'spy_mean_price': f"${df['SPY_Close'].mean():.2f}",
            'vix_range': f"{df['VIX'].min():.2f} - {df['VIX'].max():.2f}",
            'vix_mean': f"{df['VIX'].mean():.2f}",
            'num_features': len(df.columns),
            'features': list(df.columns),
        }
        
        return stats
    
    def prepare_for_environment(
        self,
        data: pd.DataFrame,
        normalize: bool = True
    ) -> np.ndarray:
        """
        Prepare market data for use in RL environment.
        
        Args:
            data: Market data DataFrame
            normalize: Whether to normalize the features
            
        Returns:
            Numpy array ready for environment
        """
        # Select relevant columns for RL environment
        feature_cols = [
            'SPY_Close', 'SPY_returns', 'SPY_volatility_20',
            'VIX', 'risk_free_rate'
        ]
        
        # Check if columns exist
        missing = [col for col in feature_cols if col not in data.columns]
        if missing:
            raise ValueError(f"Missing columns: {missing}")
        
        features = data[feature_cols].values
        
        # Handle NaN values
        if np.isnan(features).any():
            print("⚠️  Warning: NaN values found, filling with forward fill")
            features = pd.DataFrame(features).fillna(method='ffill').fillna(0).values
        
        # Normalize if requested
        if normalize:
            # Simple standardization (mean=0, std=1)
            features = (features - features.mean(axis=0)) / (features.std(axis=0) + 1e-8)
        
        return features


def quick_load_market_data(data_dir: str = "data/processed") -> pd.DataFrame:
    """
    Quick function to load market data.
    
    Args:
        data_dir: Directory containing processed data
        
    Returns:
        Market data DataFrame
    """
    loader = HistoricalDataLoader(data_dir)
    return loader.load_market_data()


def quick_load_options_data(data_dir: str = "data/processed") -> pd.DataFrame:
    """
    Quick function to load options data.
    
    Args:
        data_dir: Directory containing processed data
        
    Returns:
        Options data DataFrame
    """
    loader = HistoricalDataLoader(data_dir)
    return loader.load_options_data()


if __name__ == "__main__":
    # Demo usage
    print("=" * 80)
    print("Historical Data Loader Demo")
    print("=" * 80)
    
    loader = HistoricalDataLoader()
    
    # Load and show stats
    print("\nLoading data...")
    stats = loader.get_market_stats()
    
    print("\nMarket Data Statistics:")
    print("-" * 80)
    for key, value in stats.items():
        if key != 'features':  # Skip full feature list
            print(f"  {key}: {value}")
    
    # Show date range
    start, end = loader.get_date_range()
    print(f"\nDate Range: {start.date()} to {end.date()}")
    
    # Get train/test split
    print("\nCreating train/test split (80/20)...")
    splits = loader.get_data_for_period(train_split=0.8)
    print(f"  Train: {len(splits['train'])} rows")
    print(f"  Test: {len(splits['test'])} rows")
    
    # Generate random episodes
    print("\nGenerating random episodes...")
    episodes = loader.get_random_episodes(n_episodes=5, episode_length=50, seed=42)
    print(f"  Generated {len(episodes)} episodes of length 50")
    
    print("\n✓ Demo complete!")
