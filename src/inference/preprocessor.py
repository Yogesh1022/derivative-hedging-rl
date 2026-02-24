"""
Data Preprocessor for Inference Pipeline

Handles data cleaning and preprocessing before inference:
- Missing value handling
- Outlier detection
- Feature engineering
- Normalization
"""

import numpy as np
import pandas as pd
from typing import Dict, Optional, Tuple, List
import logging
from src.pricing.black_scholes import BlackScholesModel

logger = logging.getLogger(__name__)


class DataPreprocessor:
    """Preprocess data for model inference."""
    
    def __init__(
        self,
        normalize: bool = True,
        handle_missing: str = "drop",
        clip_outliers: bool = True,
    ):
        """
        Initialize DataPreprocessor.
        
        Args:
            normalize: Whether to normalize features
            handle_missing: How to handle missing values ('drop', 'fill', 'interpolate')
            clip_outliers: Whether to clip outliers
        """
        self.normalize = normalize
        self.handle_missing = handle_missing
        self.clip_outliers = clip_outliers
        self.stats: Dict = {}
        logger.info(f"DataPreprocessor initialized")
    
    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean data by handling missing values and outliers.
        
        Args:
            df: Raw DataFrame
            
        Returns:
            Cleaned DataFrame
        """
        df = df.copy()
        
        # Handle missing values
        if self.handle_missing == "drop":
            original_len = len(df)
            df = df.dropna()
            dropped = original_len - len(df)
            if dropped > 0:
                logger.warning(f"Dropped {dropped} rows with missing values")
        
        elif self.handle_missing == "fill":
            df = df.fillna(method="ffill").fillna(method="bfill")
            logger.info("Filled missing values using forward/backward fill")
        
        elif self.handle_missing == "interpolate":
            df = df.interpolate(method="linear")
            logger.info("Interpolated missing values")
        
        # Clip outliers if enabled
        if self.clip_outliers:
            df = self._clip_outliers(df)
        
        return df
    
    def _clip_outliers(self, df: pd.DataFrame, n_std: float = 3.0) -> pd.DataFrame:
        """
        Clip outliers beyond n standard deviations.
        
        Args:
            df: DataFrame to process
            n_std: Number of standard deviations for clipping
            
        Returns:
            DataFrame with clipped values
        """
        df = df.copy()
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols:
            mean = df[col].mean()
            std = df[col].std()
            lower = mean - n_std * std
            upper = mean + n_std * std
            
            clipped = df[col].clip(lower, upper)
            n_clipped = (df[col] != clipped).sum()
            
            if n_clipped > 0:
                logger.debug(f"Clipped {n_clipped} outliers in column '{col}'")
                df[col] = clipped
        
        return df
    
    def engineer_features(
        self,
        spot_price: float,
        strike: float,
        time_to_maturity: float,
        risk_free_rate: float,
        volatility: float,
        option_type: str = "call",
        current_hedge: float = 0.0,
    ) -> np.ndarray:
        """
        Engineer features from raw inputs, including Greeks calculation.
        
        Args:
            spot_price: Current underlying price
            strike: Option strike price
            time_to_maturity: Time to expiration (years)
            risk_free_rate: Risk-free rate
            volatility: Implied volatility
            option_type: 'call' or 'put'
            current_hedge: Current hedge ratio
            
        Returns:
            Feature vector as numpy array
        """
        # Calculate moneyness
        moneyness = spot_price / strike
        
        # Calculate Greeks using Black-Scholes
        try:
            greeks = BlackScholesModel.greeks(
                S=spot_price,
                K=strike,
                T=time_to_maturity,
                r=risk_free_rate,
                sigma=volatility,
                option_type=option_type,
            )
            delta = greeks['delta']
            gamma = greeks['gamma']
            vega = greeks['vega']
            theta = greeks['theta']
        except Exception as e:
            logger.error(f"Failed to calculate Greeks: {e}")
            # Provide default values
            delta = 0.5 if option_type == "call" else -0.5
            gamma = 0.01
            vega = 0.01
            theta = -0.01
        
        # Construct feature vector matching environment observation space
        features = np.array([
            moneyness,           # S/K
            strike,              # K
            time_to_maturity,    # T
            risk_free_rate,      # r
            volatility,          # sigma
            current_hedge,       # current hedge ratio
            delta,               # Delta
            gamma,               # Gamma
            vega,                # Vega
            theta,               # Theta
            time_to_maturity,    # Days remaining (scaled)
        ], dtype=np.float32)
        
        logger.debug(f"Engineered features: shape={features.shape}")
        return features
    
    def preprocess_batch(
        self,
        df: pd.DataFrame,
        spot_col: str = "spot_price",
        strike_col: str = "strike",
        ttm_col: str = "time_to_maturity",
        rate_col: str = "risk_free_rate",
        vol_col: str = "volatility",
        option_type_col: str = "option_type",
        hedge_col: Optional[str] = None,
    ) -> np.ndarray:
        """
        Preprocess a batch of observations from DataFrame.
        
        Args:
            df: DataFrame with market data
            spot_col: Column name for spot price
            strike_col: Column name for strike
            ttm_col: Column name for time to maturity
            rate_col: Column name for risk-free rate
            vol_col: Column name for volatility
            option_type_col: Column name for option type
            hedge_col: Column name for current hedge (optional)
            
        Returns:
            Numpy array of shape (n_samples, n_features)
        """
        # Clean data first
        df = self.clean_data(df)
        
        n_samples = len(df)
        features_list = []
        
        for idx, row in df.iterrows():
            current_hedge = row[hedge_col] if hedge_col and hedge_col in df.columns else 0.0
            option_type = row.get(option_type_col, "call")
            
            features = self.engineer_features(
                spot_price=row[spot_col],
                strike=row[strike_col],
                time_to_maturity=row[ttm_col],
                risk_free_rate=row[rate_col],
                volatility=row[vol_col],
                option_type=option_type,
                current_hedge=current_hedge,
            )
            
            features_list.append(features)
        
        batch_features = np.array(features_list, dtype=np.float32)
        logger.info(f"Preprocessed batch: shape={batch_features.shape}")
        
        return batch_features
    
    def normalize_features(self, features: np.ndarray) -> np.ndarray:
        """
        Normalize features (z-score normalization).
        
        Args:
            features: Feature array
            
        Returns:
            Normalized features
        """
        if not self.normalize:
            return features
        
        # Calculate or use cached statistics
        if not self.stats:
            self.stats["mean"] = features.mean(axis=0)
            self.stats["std"] = features.std(axis=0) + 1e-8
        
        normalized = (features - self.stats["mean"]) / self.stats["std"]
        return normalized.astype(np.float32)
    
    def validate_preprocessed_data(self, features: np.ndarray) -> bool:
        """
        Validate preprocessed features are ready for inference.
        
        Args:
            features: Preprocessed feature array
            
        Returns:
            True if valid, raises ValueError otherwise
        """
        # Check for NaN or Inf
        if np.isnan(features).any():
            raise ValueError("Preprocessed features contain NaN values")
        
        if np.isinf(features).any():
            raise ValueError("Preprocessed features contain infinite values")
        
        # Check shape (should be 11 features for hedging environment)
        if features.ndim == 1 and features.shape[0] != 11:
            raise ValueError(f"Expected 11 features, got {features.shape[0]}")
        
        if features.ndim == 2 and features.shape[1] != 11:
            raise ValueError(f"Expected 11 features per sample, got {features.shape[1]}")
        
        logger.info("Preprocessed data validation passed")
        return True
