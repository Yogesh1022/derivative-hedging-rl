"""
Data Loader for Inference Pipeline

Handles loading data from various sources:
- CSV files
- Real-time market data
- Database queries
- API responses
"""

import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Optional, Union, List
import logging

logger = logging.getLogger(__name__)


class DataLoader:
    """Load data from various sources for inference."""
    
    def __init__(self, data_source: str = "csv"):
        """
        Initialize DataLoader.
        
        Args:
            data_source: Type of data source ('csv', 'database', 'api', 'realtime')
        """
        self.data_source = data_source
        logger.info(f"DataLoader initialized with source: {data_source}")
    
    def load_from_csv(self, file_path: Union[str, Path]) -> pd.DataFrame:
        """
        Load data from CSV file.
        
        Args:
            file_path: Path to CSV file
            
        Returns:
            DataFrame with loaded data
            
        Raises:
            FileNotFoundError: If file doesn't exist
            ValueError: If CSV format is invalid
        """
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"CSV file not found: {file_path}")
        
        try:
            df = pd.read_csv(file_path)
            logger.info(f"Loaded {len(df)} rows from {file_path}")
            return df
        except Exception as e:
            logger.error(f"Failed to load CSV: {e}")
            raise ValueError(f"Invalid CSV format: {e}")
    
    def load_market_data(
        self,
        ticker: str,
        start_date: str,
        end_date: str,
    ) -> pd.DataFrame:
        """
        Load market data for inference.
        
        Args:
            ticker: Stock ticker symbol
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            
        Returns:
            DataFrame with market data
        """
        import yfinance as yf
        
        try:
            data = yf.download(ticker, start=start_date, end=end_date, progress=False)
            logger.info(f"Downloaded {len(data)} rows for {ticker}")
            return data
        except Exception as e:
            logger.error(f"Failed to download market data: {e}")
            raise
    
    def load_options_chain(self, file_path: Union[str, Path]) -> pd.DataFrame:
        """
        Load options chain data from CSV.
        
        Args:
            file_path: Path to options chain CSV
            
        Returns:
            DataFrame with options data
        """
        df = self.load_from_csv(file_path)
        
        # Validate required columns
        required_cols = ["strike", "expiration", "option_type"]
        missing = [col for col in required_cols if col not in df.columns]
        
        if missing:
            logger.warning(f"Missing optional columns: {missing}")
        
        return df
    
    def load_from_dict(self, data: Dict) -> pd.DataFrame:
        """
        Load data from dictionary (useful for API responses).
        
        Args:
            data: Dictionary with data
            
        Returns:
            DataFrame
        """
        try:
            df = pd.DataFrame(data)
            logger.info(f"Loaded {len(df)} rows from dictionary")
            return df
        except Exception as e:
            logger.error(f"Failed to convert dict to DataFrame: {e}")
            raise ValueError(f"Invalid data format: {e}")
    
    def load_realtime_observation(
        self,
        spot_price: float,
        strike: float,
        time_to_maturity: float,
        risk_free_rate: float,
        volatility: float,
        option_type: str = "call",
        current_hedge: float = 0.0,
    ) -> Dict[str, float]:
        """
        Load a single real-time observation for immediate inference.
        
        Args:
            spot_price: Current underlying price
            strike: Option strike price
            time_to_maturity: Time to expiration (years)
            risk_free_rate: Risk-free rate
            volatility: Implied volatility
            option_type: 'call' or 'put'
            current_hedge: Current hedge ratio
            
        Returns:
            Dictionary with observation data
        """
        observation = {
            "spot_price": spot_price,
            "strike": strike,
            "time_to_maturity": time_to_maturity,
            "risk_free_rate": risk_free_rate,
            "volatility": volatility,
            "option_type": option_type,
            "current_hedge": current_hedge,
        }
        
        logger.info(f"Loaded real-time observation: S={spot_price}, K={strike}")
        return observation
    
    def validate_data(self, df: pd.DataFrame) -> bool:
        """
        Validate loaded data has required structure.
        
        Args:
            df: DataFrame to validate
            
        Returns:
            True if valid, raises ValueError otherwise
        """
        if df.empty:
            raise ValueError("DataFrame is empty")
        
        # Check for NaN values
        if df.isnull().any().any():
            logger.warning("Data contains NaN values")
        
        # Check for infinite values
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if np.isinf(df[numeric_cols]).any().any():
            raise ValueError("Data contains infinite values")
        
        logger.info("Data validation passed")
        return True
