"""
Data validation layer for market data, synthetic data, and options data.
Ensures data quality and consistency before processing or training.
"""

from datetime import datetime
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from pydantic import BaseModel, Field, validator


class DataQualityReport(BaseModel):
    """Report summarizing data quality checks."""

    is_valid: bool
    dataset_name: str
    total_records: int
    issues: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    statistics: Dict = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class MarketDataValidator:
    """Validator for stock price time series data."""

    def __init__(
        self,
        min_records: int = 100,
        max_missing_pct: float = 0.05,
        max_price_change_pct: float = 0.50,
    ):
        """
        Initialize market data validator.

        Args:
            min_records: Minimum number of records required
            max_missing_pct: Maximum allowed percentage of missing values
            max_price_change_pct: Maximum daily price change (as fraction)
        """
        self.min_records = min_records
        self.max_missing_pct = max_missing_pct
        self.max_price_change_pct = max_price_change_pct

    def validate(
        self, df: pd.DataFrame, ticker: str = "UNKNOWN"
    ) -> DataQualityReport:
        """
        Validate market data DataFrame.

        Args:
            df: DataFrame with columns [Date, Open, High, Low, Close, Volume]
            ticker: Stock ticker symbol

        Returns:
            DataQualityReport with validation results
        """
        report = DataQualityReport(
            dataset_name=f"MarketData_{ticker}",
            total_records=len(df),
            is_valid=True,
        )

        # Check 1: Minimum records
        if len(df) < self.min_records:
            report.issues.append(
                f"Insufficient data: {len(df)} < {self.min_records} required records"
            )
            report.is_valid = False

        # Check 2: Required columns
        required_cols = ["Open", "High", "Low", "Close", "Volume"]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            report.issues.append(f"Missing columns: {missing_cols}")
            report.is_valid = False
            return report  # Cannot continue without required columns

        # Check 3: Missing values
        for col in required_cols:
            missing_pct = df[col].isna().sum() / len(df)
            if missing_pct > self.max_missing_pct:
                report.issues.append(
                    f"Column '{col}' has {missing_pct:.2%} missing values "
                    f"(max: {self.max_missing_pct:.2%})"
                )
                report.is_valid = False

        # Check 4: Price consistency (High >= Low, Close between High and Low)
        invalid_hl = (df["High"] < df["Low"]).sum()
        if invalid_hl > 0:
            report.issues.append(
                f"{invalid_hl} records where High < Low (impossible)"
            )
            report.is_valid = False

        invalid_close = ((df["Close"] > df["High"]) | (df["Close"] < df["Low"])).sum()
        if invalid_close > 0:
            report.warnings.append(
                f"{invalid_close} records where Close outside [Low, High] range"
            )

        # Check 5: Negative prices
        negative_prices = (
            (df["Open"] <= 0)
            | (df["High"] <= 0)
            | (df["Low"] <= 0)
            | (df["Close"] <= 0)
        ).sum()
        if negative_prices > 0:
            report.issues.append(f"{negative_prices} records with non-positive prices")
            report.is_valid = False

        # Check 6: Extreme price changes
        df_sorted = df.sort_index()
        returns = df_sorted["Close"].pct_change().abs()
        extreme_changes = (returns > self.max_price_change_pct).sum()
        if extreme_changes > 0:
            max_return = returns.max()
            report.warnings.append(
                f"{extreme_changes} days with >±{self.max_price_change_pct:.0%} "
                f"price change (max: {max_return:.2%})"
            )

        # Check 7: Volume anomalies
        if (df["Volume"] < 0).any():
            report.issues.append("Negative volume detected")
            report.is_valid = False

        zero_volume_pct = (df["Volume"] == 0).sum() / len(df)
        if zero_volume_pct > 0.1:
            report.warnings.append(
                f"{zero_volume_pct:.1%} of days have zero trading volume"
            )

        # Statistics
        report.statistics = {
            "date_range": {
                "start": str(df.index.min()) if isinstance(df.index, pd.DatetimeIndex) else "N/A",
                "end": str(df.index.max()) if isinstance(df.index, pd.DatetimeIndex) else "N/A",
            },
            "price_stats": {
                "mean": float(df["Close"].mean()),
                "std": float(df["Close"].std()),
                "min": float(df["Close"].min()),
                "max": float(df["Close"].max()),
            },
            "missing_data_pct": {
                col: float(df[col].isna().sum() / len(df)) for col in required_cols
            },
        }

        return report


class OptionsDataValidator:
    """Validator for options chain data."""

    def __init__(self, min_strikes: int = 5):
        """
        Initialize options data validator.

        Args:
            min_strikes: Minimum number of strike prices required
        """
        self.min_strikes = min_strikes

    def validate(
        self, df: pd.DataFrame, option_type: str = "UNKNOWN"
    ) -> DataQualityReport:
        """
        Validate options chain DataFrame.

        Args:
            df: DataFrame with columns [strike, bid, ask, volume, openInterest, impliedVolatility]
            option_type: 'call' or 'put'

        Returns:
            DataQualityReport with validation results
        """
        report = DataQualityReport(
            dataset_name=f"OptionsData_{option_type}",
            total_records=len(df),
            is_valid=True,
        )

        # Check 1: Minimum strikes
        if len(df) < self.min_strikes:
            report.issues.append(
                f"Insufficient strikes: {len(df)} < {self.min_strikes} required"
            )
            report.is_valid = False

        # Check 2: Required columns
        required_cols = ["strike"]
        recommended_cols = ["bid", "ask", "volume", "openInterest", "impliedVolatility"]
        
        missing_required = [col for col in required_cols if col not in df.columns]
        if missing_required:
            report.issues.append(f"Missing required columns: {missing_required}")
            report.is_valid = False
            return report

        missing_recommended = [col for col in recommended_cols if col not in df.columns]
        if missing_recommended:
            report.warnings.append(f"Missing recommended columns: {missing_recommended}")

        # Check 3: Strike prices
        if (df["strike"] <= 0).any():
            report.issues.append("Non-positive strike prices detected")
            report.is_valid = False

        # Check 4: Bid-ask spread
        if "bid" in df.columns and "ask" in df.columns:
            invalid_spread = (df["ask"] < df["bid"]).sum()
            if invalid_spread > 0:
                report.issues.append(
                    f"{invalid_spread} options with ask < bid (impossible)"
                )
                report.is_valid = False

            negative_prices = ((df["bid"] < 0) | (df["ask"] < 0)).sum()
            if negative_prices > 0:
                report.issues.append(f"{negative_prices} options with negative prices")
                report.is_valid = False

        # Check 5: Implied volatility
        if "impliedVolatility" in df.columns:
            invalid_iv = ((df["impliedVolatility"] <= 0) | (df["impliedVolatility"] > 5)).sum()
            if invalid_iv > 0:
                report.warnings.append(
                    f"{invalid_iv} options with unusual implied volatility "
                    f"(<=0 or >500%)"
                )

        # Check 6: Volume and open interest
        if "volume" in df.columns:
            if (df["volume"] < 0).any():
                report.issues.append("Negative volume detected")
                report.is_valid = False

        if "openInterest" in df.columns:
            if (df["openInterest"] < 0).any():
                report.issues.append("Negative open interest detected")
                report.is_valid = False

        # Statistics
        report.statistics = {
            "strike_range": {
                "min": float(df["strike"].min()),
                "max": float(df["strike"].max()),
                "count": int(len(df)),
            }
        }

        if "impliedVolatility" in df.columns:
            report.statistics["implied_vol"] = {
                "mean": float(df["impliedVolatility"].mean()),
                "std": float(df["impliedVolatility"].std()),
            }

        return report


class SyntheticDataValidator:
    """Validator for synthetically generated price paths."""

    def __init__(
        self,
        min_paths: int = 100,
        min_steps: int = 50,
        max_paths: int = 1_000_000,
    ):
        """
        Initialize synthetic data validator.

        Args:
            min_paths: Minimum number of simulation paths
            min_steps: Minimum time steps per path
            max_paths: Maximum number of paths (memory constraint)
        """
        self.min_paths = min_paths
        self.min_steps = min_steps
        self.max_paths = max_paths

    def validate(
        self, paths: np.ndarray, simulator_name: str = "UNKNOWN"
    ) -> DataQualityReport:
        """
        Validate synthetic price paths.

        Args:
            paths: Array of shape (n_paths, n_steps) containing simulated prices
            simulator_name: Name of the simulator used

        Returns:
            DataQualityReport with validation results
        """
        report = DataQualityReport(
            dataset_name=f"SyntheticData_{simulator_name}",
            total_records=paths.shape[0] if paths.ndim > 1 else 1,
            is_valid=True,
        )

        # Check 1: Array shape
        if paths.ndim != 2:
            report.issues.append(f"Expected 2D array, got {paths.ndim}D")
            report.is_valid = False
            return report

        n_paths, n_steps = paths.shape

        # Check 2: Number of paths
        if n_paths < self.min_paths:
            report.issues.append(
                f"Insufficient paths: {n_paths} < {self.min_paths} required"
            )
            report.is_valid = False

        if n_paths > self.max_paths:
            report.warnings.append(
                f"Large dataset: {n_paths} paths may cause memory issues"
            )

        # Check 3: Number of steps
        if n_steps < self.min_steps:
            report.issues.append(
                f"Insufficient time steps: {n_steps} < {self.min_steps} required"
            )
            report.is_valid = False

        # Check 4: NaN or Inf values
        if np.isnan(paths).any():
            nan_count = np.isnan(paths).sum()
            report.issues.append(f"{nan_count} NaN values detected")
            report.is_valid = False

        if np.isinf(paths).any():
            inf_count = np.isinf(paths).sum()
            report.issues.append(f"{inf_count} infinite values detected")
            report.is_valid = False

        # Check 5: Non-positive prices
        if (paths <= 0).any():
            negative_count = (paths <= 0).sum()
            report.issues.append(f"{negative_count} non-positive prices detected")
            report.is_valid = False

        # Check 6: Price path statistics
        mean_final_price = paths[:, -1].mean()
        std_final_price = paths[:, -1].std()

        # Check for degenerate paths (all prices the same)
        if std_final_price < 1e-10:
            report.warnings.append("All paths converge to same price (no variance)")

        # Statistics
        report.statistics = {
            "shape": {"n_paths": int(n_paths), "n_steps": int(n_steps)},
            "price_stats": {
                "initial_mean": float(paths[:, 0].mean()),
                "initial_std": float(paths[:, 0].std()),
                "final_mean": float(mean_final_price),
                "final_std": float(std_final_price),
                "global_min": float(paths.min()),
                "global_max": float(paths.max()),
            },
            "data_quality": {
                "nan_count": int(np.isnan(paths).sum()),
                "inf_count": int(np.isinf(paths).sum()),
                "negative_count": int((paths <= 0).sum()),
            },
        }

        return report


class DatasetValidator:
    """Main validator class that orchestrates different data validators."""

    def __init__(self):
        """Initialize dataset validator with all sub-validators."""
        self.market_validator = MarketDataValidator()
        self.options_validator = OptionsDataValidator()
        self.synthetic_validator = SyntheticDataValidator()

    def validate_market_data(
        self, df: pd.DataFrame, ticker: str = "UNKNOWN"
    ) -> DataQualityReport:
        """Validate market data."""
        return self.market_validator.validate(df, ticker)

    def validate_options_data(
        self, df: pd.DataFrame, option_type: str = "UNKNOWN"
    ) -> DataQualityReport:
        """Validate options chain data."""
        return self.options_validator.validate(df, option_type)

    def validate_synthetic_data(
        self, paths: np.ndarray, simulator_name: str = "UNKNOWN"
    ) -> DataQualityReport:
        """Validate synthetic price paths."""
        return self.synthetic_validator.validate(paths, simulator_name)

    def validate_all(
        self, data: Dict, data_type: str
    ) -> List[DataQualityReport]:
        """
        Validate multiple datasets at once.

        Args:
            data: Dictionary of datasets to validate
            data_type: Type of data ('market', 'options', 'synthetic')

        Returns:
            List of DataQualityReports
        """
        reports = []

        if data_type == "market":
            for ticker, df in data.items():
                reports.append(self.validate_market_data(df, ticker))
        elif data_type == "options":
            for option_id, df in data.items():
                reports.append(self.validate_options_data(df, option_id))
        elif data_type == "synthetic":
            for sim_name, paths in data.items():
                reports.append(self.validate_synthetic_data(paths, sim_name))
        else:
            raise ValueError(f"Unknown data type: {data_type}")

        return reports


# Convenience functions
def validate_market_dataframe(df: pd.DataFrame, ticker: str = "UNKNOWN") -> DataQualityReport:
    """Quick validation for market data DataFrame."""
    validator = MarketDataValidator()
    return validator.validate(df, ticker)


def validate_options_dataframe(df: pd.DataFrame, option_type: str = "UNKNOWN") -> DataQualityReport:
    """Quick validation for options data DataFrame."""
    validator = OptionsDataValidator()
    return validator.validate(df, option_type)


def validate_synthetic_paths(paths: np.ndarray, simulator_name: str = "UNKNOWN") -> DataQualityReport:
    """Quick validation for synthetic price paths."""
    validator = SyntheticDataValidator()
    return validator.validate(paths, simulator_name)
