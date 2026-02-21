"""Data fetching utilities from various sources."""

from datetime import datetime
from typing import Optional

import pandas as pd
import yfinance as yf
from tqdm import tqdm

from src.utils.logger import setup_logger

logger = setup_logger(__name__)


class YFinanceDataFetcher:
    """Fetch market data from Yahoo Finance."""

    @staticmethod
    def fetch_stock_data(
        ticker: str,
        start_date: str,
        end_date: Optional[str] = None,
        interval: str = "1d",
    ) -> pd.DataFrame:
        """
        Fetch stock OHLCV data.

        Args:
            ticker: Stock ticker symbol
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD), defaults to today
            interval: Data interval (1d, 1wk, 1mo, etc.)

        Returns:
            DataFrame with OHLCV data
        """
        logger.info(f"Fetching {ticker} data from {start_date} to {end_date}")

        try:
            stock = yf.Ticker(ticker)
            df = stock.history(start=start_date, end=end_date, interval=interval)

            if df.empty:
                logger.warning(f"No data found for {ticker}")
                return df

            # Reset index to make Date a column
            df.reset_index(inplace=True)

            # Rename columns to lowercase
            df.columns = df.columns.str.lower()

            logger.info(f"✓ Fetched {len(df)} rows for {ticker}")
            return df

        except Exception as e:
            logger.error(f"Error fetching {ticker}: {e}")
            raise

    @staticmethod
    def fetch_options_chain(ticker: str, expiration_date: Optional[str] = None) -> pd.DataFrame:
        """
        Fetch options chain data.

        Args:
            ticker: Stock ticker symbol
            expiration_date: Option expiration date (YYYY-MM-DD)

        Returns:
            DataFrame with options data (calls and puts)
        """
        logger.info(f"Fetching options chain for {ticker}")

        try:
            stock = yf.Ticker(ticker)
            expirations = stock.options

            if not expirations:
                logger.warning(f"No options available for {ticker}")
                return pd.DataFrame()

            # Use specified expiration or first available
            expiry = expiration_date if expiration_date else expirations[0]

            # Get calls and puts
            opts = stock.option_chain(expiry)
            calls = opts.calls.copy()
            puts = opts.puts.copy()

            # Add option type column
            calls["option_type"] = "call"
            puts["option_type"] = "put"

            # Combine
            options_df = pd.concat([calls, puts], ignore_index=True)
            options_df["expiration_date"] = expiry
            options_df["ticker"] = ticker

            logger.info(f"✓ Fetched {len(options_df)} options contracts")
            return options_df

        except Exception as e:
            logger.error(f"Error fetching options for {ticker}: {e}")
            raise

    @staticmethod
    def fetch_multiple_tickers(
        tickers: list[str],
        start_date: str,
        end_date: Optional[str] = None,
        interval: str = "1d",
    ) -> dict[str, pd.DataFrame]:
        """
        Fetch data for multiple tickers.

        Args:
            tickers: List of ticker symbols
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            interval: Data interval

        Returns:
            Dictionary mapping ticker to DataFrame
        """
        results = {}

        for ticker in tqdm(tickers, desc="Fetching tickers"):
            try:
                df = YFinanceDataFetcher.fetch_stock_data(
                    ticker, start_date, end_date, interval
                )
                results[ticker] = df
            except Exception as e:
                logger.error(f"Failed to fetch {ticker}: {e}")
                continue

        return results


class VIXDataFetcher:
    """Fetch VIX (volatility index) data."""

    @staticmethod
    def fetch_vix_history(start_date: str, end_date: Optional[str] = None) -> pd.DataFrame:
        """
        Fetch historical VIX data.

        Args:
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)

        Returns:
            DataFrame with VIX data
        """
        return YFinanceDataFetcher.fetch_stock_data("^VIX", start_date, end_date)


class TreasuryDataFetcher:
    """Fetch US Treasury yield data."""

    @staticmethod
    def fetch_treasury_yield(
        maturity: str = "10Y", start_date: str = "2015-01-01", end_date: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Fetch US Treasury yield data.

        Args:
            maturity: Treasury maturity (10Y, 2Y, etc.)
            start_date: Start date
            end_date: End date

        Returns:
            DataFrame with yield data
        """
        # Use Treasury ETF as proxy
        ticker_map = {"10Y": "^TNX", "2Y": "^IRX", "30Y": "^TYX"}

        ticker = ticker_map.get(maturity, "^TNX")
        return YFinanceDataFetcher.fetch_stock_data(ticker, start_date, end_date)
