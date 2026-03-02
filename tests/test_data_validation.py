"""
Tests for data validation module.
"""

import numpy as np
import pandas as pd
import pytest
from datetime import datetime, timedelta

from src.data.validation import (
    MarketDataValidator,
    OptionsDataValidator,
    SyntheticDataValidator,
    DatasetValidator,
    validate_market_dataframe,
    validate_options_dataframe,
    validate_synthetic_paths,
)


class TestMarketDataValidator:
    """Tests for MarketDataValidator."""

    def test_valid_market_data(self):
        """Test validation of valid market data."""
        # Create valid market data
        dates = pd.date_range(start="2023-01-01", periods=200, freq="D")
        df = pd.DataFrame(
            {
                "Open": np.random.uniform(95, 105, 200),
                "High": np.random.uniform(100, 110, 200),
                "Low": np.random.uniform(90, 100, 200),
                "Close": np.random.uniform(95, 105, 200),
                "Volume": np.random.randint(1000000, 10000000, 200),
            },
            index=dates,
        )
        
        # Ensure High >= Low
        df["High"] = df[["High", "Low"]].max(axis=1)
        df["Low"] = df[["High", "Low"]].min(axis=1)
        
        validator = MarketDataValidator()
        report = validator.validate(df, "TEST")
        
        assert report.is_valid
        assert len(report.issues) == 0
        assert report.total_records == 200
        assert "price_stats" in report.statistics

    def test_insufficient_data(self):
        """Test validation fails with insufficient data."""
        df = pd.DataFrame(
            {
                "Open": [100],
                "High": [105],
                "Low": [95],
                "Close": [102],
                "Volume": [1000000],
            }
        )
        
        validator = MarketDataValidator(min_records=100)
        report = validator.validate(df, "TEST")
        
        assert not report.is_valid
        assert any("Insufficient data" in issue for issue in report.issues)

    def test_missing_columns(self):
        """Test validation fails with missing columns."""
        df = pd.DataFrame(
            {
                "Open": np.random.uniform(95, 105, 200),
                "Close": np.random.uniform(95, 105, 200),
            }
        )
        
        validator = MarketDataValidator()
        report = validator.validate(df, "TEST")
        
        assert not report.is_valid
        assert any("Missing columns" in issue for issue in report.issues)

    def test_negative_prices(self):
        """Test validation fails with negative prices."""
        df = pd.DataFrame(
            {
                "Open": np.concatenate([np.random.uniform(95, 105, 150), [-10] * 50]),
                "High": np.random.uniform(100, 110, 200),
                "Low": np.random.uniform(90, 100, 200),
                "Close": np.random.uniform(95, 105, 200),
                "Volume": np.random.randint(1000000, 10000000, 200),
            }
        )
        
        validator = MarketDataValidator()
        report = validator.validate(df, "TEST")
        
        assert not report.is_valid
        assert any("non-positive prices" in issue for issue in report.issues)

    def test_high_less_than_low(self):
        """Test validation fails when High < Low."""
        df = pd.DataFrame(
            {
                "Open": [100] * 200,
                "High": [95] * 200,  # High < Low
                "Low": [100] * 200,
                "Close": [98] * 200,
                "Volume": [1000000] * 200,
            }
        )
        
        validator = MarketDataValidator()
        report = validator.validate(df, "TEST")
        
        assert not report.is_valid
        assert any("High < Low" in issue for issue in report.issues)

    def test_missing_values_warning(self):
        """Test validation with missing values."""
        df = pd.DataFrame(
            {
                "Open": np.concatenate([np.random.uniform(95, 105, 190), [np.nan] * 10]),
                "High": np.random.uniform(100, 110, 200),
                "Low": np.random.uniform(90, 100, 200),
                "Close": np.random.uniform(95, 105, 200),
                "Volume": np.random.randint(1000000, 10000000, 200),
            }
        )
        
        validator = MarketDataValidator(max_missing_pct=0.1)
        report = validator.validate(df, "TEST")
        
        # Should still be invalid if missing > threshold
        assert not report.is_valid or len(report.warnings) > 0


class TestOptionsDataValidator:
    """Tests for OptionsDataValidator."""

    def test_valid_options_data(self):
        """Test validation of valid options data."""
        df = pd.DataFrame(
            {
                "strike": np.arange(80, 120, 5),
                "bid": np.random.uniform(1, 10, 8),
                "ask": np.random.uniform(1.5, 11, 8),
                "volume": np.random.randint(100, 10000, 8),
                "openInterest": np.random.randint(1000, 50000, 8),
                "impliedVolatility": np.random.uniform(0.15, 0.35, 8),
            }
        )
        
        # Ensure ask >= bid
        df["ask"] = df[["ask", "bid"]].max(axis=1)
        
        validator = OptionsDataValidator()
        report = validator.validate(df, "call")
        
        assert report.is_valid
        assert len(report.issues) == 0

    def test_insufficient_strikes(self):
        """Test validation fails with insufficient strikes."""
        df = pd.DataFrame(
            {
                "strike": [100, 105],
                "bid": [5, 3],
                "ask": [5.5, 3.5],
            }
        )
        
        validator = OptionsDataValidator(min_strikes=5)
        report = validator.validate(df, "call")
        
        assert not report.is_valid
        assert any("Insufficient strikes" in issue for issue in report.issues)

    def test_ask_less_than_bid(self):
        """Test validation fails when ask < bid."""
        df = pd.DataFrame(
            {
                "strike": np.arange(80, 120, 5),
                "bid": np.random.uniform(5, 10, 8),
                "ask": np.random.uniform(1, 5, 8),  # ask < bid
            }
        )
        
        validator = OptionsDataValidator()
        report = validator.validate(df, "call")
        
        assert not report.is_valid
        assert any("ask < bid" in issue for issue in report.issues)

    def test_negative_strike(self):
        """Test validation fails with negative strikes."""
        df = pd.DataFrame(
            {
                "strike": [-100, 105, 110, 115, 120],
                "bid": [5, 3, 2, 1, 0.5],
                "ask": [5.5, 3.5, 2.5, 1.5, 1],
            }
        )
        
        validator = OptionsDataValidator()
        report = validator.validate(df, "put")
        
        assert not report.is_valid
        assert any("Non-positive strike" in issue for issue in report.issues)


class TestSyntheticDataValidator:
    """Tests for SyntheticDataValidator."""

    def test_valid_synthetic_data(self):
        """Test validation of valid synthetic paths."""
        paths = np.random.uniform(50, 150, (1000, 252))
        
        validator = SyntheticDataValidator()
        report = validator.validate(paths, "GBM")
        
        assert report.is_valid
        assert len(report.issues) == 0
        assert report.statistics["shape"]["n_paths"] == 1000
        assert report.statistics["shape"]["n_steps"] == 252

    def test_insufficient_paths(self):
        """Test validation fails with insufficient paths."""
        paths = np.random.uniform(50, 150, (50, 252))
        
        validator = SyntheticDataValidator(min_paths=100)
        report = validator.validate(paths, "GBM")
        
        assert not report.is_valid
        assert any("Insufficient paths" in issue for issue in report.issues)

    def test_insufficient_steps(self):
        """Test validation fails with insufficient steps."""
        paths = np.random.uniform(50, 150, (1000, 20))
        
        validator = SyntheticDataValidator(min_steps=50)
        report = validator.validate(paths, "GBM")
        
        assert not report.is_valid
        assert any("Insufficient time steps" in issue for issue in report.issues)

    def test_nan_values(self):
        """Test validation fails with NaN values."""
        paths = np.random.uniform(50, 150, (1000, 252))
        paths[500, 100] = np.nan  # Inject NaN
        
        validator = SyntheticDataValidator()
        report = validator.validate(paths, "GBM")
        
        assert not report.is_valid
        assert any("NaN values" in issue for issue in report.issues)

    def test_infinite_values(self):
        """Test validation fails with infinite values."""
        paths = np.random.uniform(50, 150, (1000, 252))
        paths[500, 100] = np.inf  # Inject inf
        
        validator = SyntheticDataValidator()
        report = validator.validate(paths, "Heston")
        
        assert not report.is_valid
        assert any("infinite values" in issue for issue in report.issues)

    def test_negative_prices(self):
        """Test validation fails with negative prices."""
        paths = np.random.uniform(50, 150, (1000, 252))
        paths[500, 100] = -10  # Inject negative price
        
        validator = SyntheticDataValidator()
        report = validator.validate(paths, "GBM")
        
        assert not report.is_valid
        assert any("non-positive prices" in issue for issue in report.issues)

    def test_wrong_dimensions(self):
        """Test validation fails with wrong array dimensions."""
        paths = np.random.uniform(50, 150, (1000,))  # 1D instead of 2D
        
        validator = SyntheticDataValidator()
        report = validator.validate(paths, "GBM")
        
        assert not report.is_valid
        assert any("Expected 2D array" in issue for issue in report.issues)


class TestDatasetValidator:
    """Tests for main DatasetValidator class."""

    def test_validate_multiple_market_datasets(self):
        """Test validation of multiple market datasets."""
        # Create multiple datasets
        data = {}
        for ticker in ["AAPL", "GOOGL", "MSFT"]:
            dates = pd.date_range(start="2023-01-01", periods=200, freq="D")
            df = pd.DataFrame(
                {
                    "Open": np.random.uniform(95, 105, 200),
                    "High": np.random.uniform(100, 110, 200),
                    "Low": np.random.uniform(90, 100, 200),
                    "Close": np.random.uniform(95, 105, 200),
                    "Volume": np.random.randint(1000000, 10000000, 200),
                },
                index=dates,
            )
            # Ensure High >= Low
            df["High"] = df[["High", "Low"]].max(axis=1)
            df["Low"] = df[["High", "Low"]].min(axis=1)
            data[ticker] = df
        
        validator = DatasetValidator()
        reports = validator.validate_all(data, "market")
        
        assert len(reports) == 3
        assert all(report.is_valid for report in reports)


class TestConvenienceFunctions:
    """Tests for convenience validation functions."""

    def test_validate_market_dataframe_convenience(self):
        """Test convenience function for market data."""
        dates = pd.date_range(start="2023-01-01", periods=200, freq="D")
        df = pd.DataFrame(
            {
                "Open": np.random.uniform(95, 105, 200),
                "High": np.random.uniform(100, 110, 200),
                "Low": np.random.uniform(90, 100, 200),
                "Close": np.random.uniform(95, 105, 200),
                "Volume": np.random.randint(1000000, 10000000, 200),
            },
            index=dates,
        )
        df["High"] = df[["High", "Low"]].max(axis=1)
        df["Low"] = df[["High", "Low"]].min(axis=1)
        
        report = validate_market_dataframe(df, "TEST")
        assert report.is_valid

    def test_validate_options_dataframe_convenience(self):
        """Test convenience function for options data."""
        df = pd.DataFrame(
            {
                "strike": np.arange(80, 120, 5),
                "bid": np.random.uniform(1, 10, 8),
                "ask": np.random.uniform(1.5, 11, 8),
            }
        )
        df["ask"] = df[["ask", "bid"]].max(axis=1)
        
        report = validate_options_dataframe(df, "call")
        assert report.is_valid

    def test_validate_synthetic_paths_convenience(self):
        """Test convenience function for synthetic data."""
        paths = np.random.uniform(50, 150, (1000, 252))
        
        report = validate_synthetic_paths(paths, "GBM")
        assert report.is_valid
