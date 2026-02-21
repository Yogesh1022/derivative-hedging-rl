"""Data preprocessing and feature engineering."""

import numpy as np
import pandas as pd
from typing import List, Optional

from src.utils.logger import setup_logger

logger = setup_logger(__name__)


class DataPreprocessor:
    """Preprocess and clean market data."""

    @staticmethod
    def handle_missing_values(
        df: pd.DataFrame, method: str = "ffill", columns: Optional[List[str]] = None
    ) -> pd.DataFrame:
        """
        Handle missing values in DataFrame.

        Args:
            df: Input DataFrame
            method: 'ffill' (forward fill), 'bfill' (backward fill), 'drop', or 'interpolate'
            columns: Specific columns to handle, None for all

        Returns:
            DataFrame with missing values handled
        """
        df = df.copy()

        if columns is None:
            columns = df.columns.tolist()

        if method == "ffill":
            df[columns] = df[columns].fillna(method="ffill")
        elif method == "bfill":
            df[columns] = df[columns].fillna(method="bfill")
        elif method == "drop":
            df = df.dropna(subset=columns)
        elif method == "interpolate":
            df[columns] = df[columns].interpolate(method="linear")
        else:
            raise ValueError(f"Unknown method: {method}")

        return df

    @staticmethod
    def remove_outliers(
        df: pd.DataFrame, columns: List[str], n_std: float = 3.0
    ) -> pd.DataFrame:
        """
        Remove outliers using standard deviation method.

        Args:
            df: Input DataFrame
            columns: Columns to check for outliers
            n_std: Number of standard deviations for threshold

        Returns:
            DataFrame with outliers removed
        """
        df = df.copy()

        for col in columns:
            mean = df[col].mean()
            std = df[col].std()
            lower = mean - n_std * std
            upper = mean + n_std * std

            before = len(df)
            df = df[(df[col] >= lower) & (df[col] <= upper)]
            after = len(df)

            if before != after:
                logger.info(f"Removed {before - after} outliers from {col}")

        return df

    @staticmethod
    def add_returns(df: pd.DataFrame, price_col: str = "close") -> pd.DataFrame:
        """
        Add return columns to DataFrame.

        Args:
            df: Input DataFrame with price data
            price_col: Name of price column

        Returns:
            DataFrame with added return columns
        """
        df = df.copy()

        # Simple returns
        df["returns"] = df[price_col].pct_change()

        # Log returns
        df["log_returns"] = np.log(df[price_col] / df[price_col].shift(1))

        logger.info("Added returns columns")
        return df

    @staticmethod
    def add_technical_indicators(df: pd.DataFrame) -> pd.DataFrame:
        """
        Add technical indicators.

        Args:
            df: Input DataFrame with OHLCV data

        Returns:
            DataFrame with technical indicators
        """
        df = df.copy()

        # Moving averages
        df["sma_20"] = df["close"].rolling(window=20).mean()
        df["sma_50"] = df["close"].rolling(window=50).mean()
        df["ema_20"] = df["close"].ewm(span=20, adjust=False).mean()

        # Volatility (rolling std)
        df["volatility_20"] = df["returns"].rolling(window=20).std()

        # Volume moving average
        if "volume" in df.columns:
            df["volume_sma_20"] = df["volume"].rolling(window=20).mean()

        logger.info("Added technical indicators")
        return df


class FeatureEngineer:
    """Create features for RL training."""

    @staticmethod
    def create_option_features(
        S: float,
        K: float,
        T: float,
        r: float = 0.02,
        sigma: float = 0.2,
    ) -> dict:
        """
        Create features for option pricing.

        Args:
            S: Spot price
            K: Strike price
            T: Time to maturity (years)
            r: Risk-free rate
            sigma: Implied volatility

        Returns:
            Dictionary of features
        """
        from src.pricing.black_scholes import BlackScholesModel

        # Moneyness features
        moneyness = S / K
        log_moneyness = np.log(moneyness)

        # Time features
        sqrt_T = np.sqrt(T)

        # Greeks for call
        greeks = BlackScholesModel.greeks(S, K, T, r, sigma, "call")

        features = {
            "S": S,
            "K": K,
            "T": T,
            "r": r,
            "sigma": sigma,
            "moneyness": moneyness,
            "log_moneyness": log_moneyness,
            "sqrt_T": sqrt_T,
            **greeks,
        }

        return features

    @staticmethod
    def normalize_features(
        df: pd.DataFrame, columns: List[str], method: str = "minmax"
    ) -> pd.DataFrame:
        """
        Normalize features.

        Args:
            df: Input DataFrame
            columns: Columns to normalize
            method: 'minmax' or 'standard'

        Returns:
            DataFrame with normalized features
        """
        df = df.copy()

        if method == "minmax":
            for col in columns:
                min_val = df[col].min()
                max_val = df[col].max()
                df[f"{col}_norm"] = (df[col] - min_val) / (max_val - min_val + 1e-8)

        elif method == "standard":
            for col in columns:
                mean = df[col].mean()
                std = df[col].std()
                df[f"{col}_norm"] = (df[col] - mean) / (std + 1e-8)

        else:
            raise ValueError(f"Unknown normalization method: {method}")

        return df
