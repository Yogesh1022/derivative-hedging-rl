"""
Baseline hedging strategies for option portfolios.

This module implements traditional hedging approaches that serve as
benchmarks for reinforcement learning agents:
- Delta hedging: neutralize first-order price risk
- Delta-Gamma hedging: neutralize first and second-order price risk
- Delta-Gamma-Vega hedging: neutralize price and volatility risk
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Tuple

import numpy as np

from src.pricing.black_scholes import BlackScholesModel


class BaseHedgingStrategy(ABC):
    """Abstract base class for hedging strategies."""
    
    def __init__(
        self,
        S0: float,
        K: float,
        T: float,
        r: float,
        sigma: float,
        option_type: str = "call",
        transaction_cost: float = 0.001,
    ):
        """
        Initialize hedging strategy.
        
        Args:
            S0: Initial stock price
            K: Strike price
            T: Time to maturity
            r: Risk-free rate
            sigma: Volatility
            option_type: 'call' or 'put'
            transaction_cost: Transaction cost as fraction
        """
        self.S0 = S0
        self.K = K
        self.T = T
        self.r = r
        self.sigma = sigma
        self.option_type = option_type
        self.transaction_cost = transaction_cost
        
        self.bs_model = BlackScholesModel()
        
        # Portfolio state
        self.stock_position = 0.0
        self.option_position = -1.0  # Short one option
        self.cash = 0.0
        self.total_costs = 0.0
        
        # History tracking
        self.history: List[Dict] = []
    
    @abstractmethod
    def get_hedge_positions(
        self, S: float, tau: float
    ) -> Dict[str, float]:
        """
        Calculate required hedge positions.
        
        Args:
            S: Current stock price
            tau: Time to maturity
        
        Returns:
            positions: Dictionary with position sizes
        """
        pass
    
    def initialize(self) -> float:
        """
        Initialize the hedging strategy.
        
        Returns:
            initial_premium: Option premium received
        """
        # Calculate initial option value
        initial_option_value = self.bs_model.price(
            S=self.S0, K=self.K, T=self.T, r=self.r, sigma=self.sigma, option_type=self.option_type
        )
        
        # Receive premium for selling option
        self.cash = initial_option_value
        
        # Set initial hedge
        positions = self.get_hedge_positions(self.S0, self.T)
        self.stock_position = positions.get("stock", 0.0)
        
        # Pay for initial hedge
        trade_cost = abs(self.stock_position) * self.S0
        transaction_cost = trade_cost * self.transaction_cost
        self.cash -= trade_cost + transaction_cost
        self.total_costs += transaction_cost
        
        return initial_option_value
    
    def rebalance(
        self, S: float, tau: float
    ) -> Dict[str, float]:
        """
        Rebalance hedge positions.
        
        Args:
            S: Current stock price
            tau: Time to maturity
        
        Returns:
            trade_info: Information about trades executed
        """
        # Get target positions
        target_positions = self.get_hedge_positions(S, tau)
        target_stock = target_positions.get("stock", 0.0)
        
        # Calculate trade size
        stock_trade = target_stock - self.stock_position
        
        # Execute trade with costs
        trade_cost = abs(stock_trade) * S
        transaction_cost = trade_cost * self.transaction_cost
        
        self.cash -= stock_trade * S + transaction_cost
        self.stock_position = target_stock
        self.total_costs += transaction_cost
        
        trade_info = {
            "stock_trade": stock_trade,
            "transaction_cost": transaction_cost,
            "new_position": self.stock_position,
        }
        
        return trade_info
    
    def get_portfolio_value(
        self, S: float, tau: float
    ) -> Dict[str, float]:
        """
        Calculate current portfolio value.
        
        Args:
            S: Current stock price
            tau: Time to maturity
        
        Returns:
            portfolio_info: Portfolio value breakdown
        """
        # Calculate option value
        if tau > 0:
            option_value = self.bs_model.price(
                S=S, K=self.K, T=tau, r=self.r, sigma=self.sigma, option_type=self.option_type
            )
        else:
            # At maturity
            if self.option_type == "call":
                option_value = max(S - self.K, 0)
            else:
                option_value = max(self.K - S, 0)
        
        # Portfolio components
        stock_value = self.stock_position * S
        option_liability = option_value * self.option_position  # Negative for short
        
        # Total portfolio value
        portfolio_value = self.cash + stock_value + option_liability
        
        return {
            "portfolio_value": portfolio_value,
            "cash": self.cash,
            "stock_value": stock_value,
            "option_value": option_value,
            "option_liability": option_liability,
        }


class DeltaHedging(BaseHedgingStrategy):
    """
    Delta hedging strategy.
    
    Maintains a hedge that neutralizes first-order price sensitivity (delta).
    The strategy rebalances to keep portfolio delta near zero.
    """
    
    def get_hedge_positions(
        self, S: float, tau: float
    ) -> Dict[str, float]:
        """
        Calculate delta hedge position.
        
        For a short option position, we buy delta units of stock to hedge.
        
        Args:
            S: Current stock price
            tau: Time to maturity
        
        Returns:
            positions: Required positions
        """
        if tau <= 0:
            return {"stock": 0.0}
        
        greeks = self.bs_model.greeks(
            S=S, K=self.K, T=tau, r=self.r, sigma=self.sigma, option_type=self.option_type
        )
        
        # For short option, hedge with +delta stock
        delta = greeks["delta"]
        stock_position = -self.option_position * delta
        
        return {"stock": stock_position}


class DeltaGammaHedging(BaseHedgingStrategy):
    """
    Delta-Gamma hedging strategy.
    
    Uses both the underlying asset and another option to hedge both
    first-order (delta) and second-order (gamma) price sensitivity.
    
    Note: In practice, this requires another option. For simplicity,
    we approximate by adjusting the underlying position to account
    for gamma exposure.
    """
    
    def __init__(
        self,
        S0: float,
        K: float,
        T: float,
        r: float,
        sigma: float,
        option_type: str = "call",
        transaction_cost: float = 0.001,
        gamma_target: float = 0.0,
    ):
        """
        Initialize Delta-Gamma hedging.
        
        Args:
            gamma_target: Target gamma exposure (default 0 for neutral)
        """
        super().__init__(S0, K, T, r, sigma, option_type, transaction_cost)
        self.gamma_target = gamma_target
    
    def get_hedge_positions(
        self, S: float, tau: float
    ) -> Dict[str, float]:
        """
        Calculate delta-gamma hedge positions.
        
        Args:
            S: Current stock price
            tau: Time to maturity
        
        Returns:
            positions: Required positions
        """
        if tau <= 0:
            return {"stock": 0.0}
        
        greeks = self.bs_model.greeks(
            S=S, K=self.K, T=tau, r=self.r, sigma=self.sigma, option_type=self.option_type
        )
        
        delta = greeks["delta"]
        gamma = greeks["gamma"]
        
        # Adjust delta hedge to account for gamma
        # This is a simplified approach - true delta-gamma hedging
        # would use another option
        gamma_adjustment = gamma * (S - self.S0) * 0.5
        adjusted_delta = delta + gamma_adjustment
        
        stock_position = -self.option_position * adjusted_delta
        
        return {"stock": stock_position}


class DeltaGammaVegaHedging(BaseHedgingStrategy):
    """
    Delta-Gamma-Vega hedging strategy.
    
    Hedges delta (price), gamma (curvature), and vega (volatility) exposures.
    This requires multiple hedging instruments (stock + 2 options typically).
    
    For simplicity, we approximate by adjusting the stock position to
    account for all three Greeks.
    """
    
    def __init__(
        self,
        S0: float,
        K: float,
        T: float,
        r: float,
        sigma: float,
        option_type: str = "call",
        transaction_cost: float = 0.001,
        gamma_weight: float = 0.5,
        vega_weight: float = 0.01,
    ):
        """
        Initialize Delta-Gamma-Vega hedging.
        
        Args:
            gamma_weight: Weight for gamma adjustment
            vega_weight: Weight for vega adjustment
        """
        super().__init__(S0, K, T, r, sigma, option_type, transaction_cost)
        self.gamma_weight = gamma_weight
        self.vega_weight = vega_weight
    
    def get_hedge_positions(
        self, S: float, tau: float
    ) -> Dict[str, float]:
        """
        Calculate delta-gamma-vega hedge positions.
        
        Args:
            S: Current stock price
            tau: Time to maturity
        
        Returns:
            positions: Required positions
        """
        if tau <= 0:
            return {"stock": 0.0}
        
        greeks = self.bs_model.greeks(
            S=S, K=self.K, T=tau, r=self.r, sigma=self.sigma, option_type=self.option_type
        )
        
        delta = greeks["delta"]
        gamma = greeks["gamma"]
        vega = greeks["vega"]
        
        # Adjust delta for gamma and vega exposures
        # This is a simplified heuristic approach
        price_change = S - self.S0
        gamma_adjustment = self.gamma_weight * gamma * price_change
        vega_adjustment = self.vega_weight * vega * (self.sigma - 0.2)  # Assume vol target of 0.2
        
        adjusted_delta = delta + gamma_adjustment + vega_adjustment
        stock_position = -self.option_position * adjusted_delta
        
        return {"stock": stock_position}


class MinimumVarianceHedging(BaseHedgingStrategy):
    """
    Minimum variance hedging strategy.
    
    Uses historical data to estimate the hedge ratio that minimizes
    portfolio variance. This is a statistical hedging approach.
    """
    
    def __init__(
        self,
        S0: float,
        K: float,
        T: float,
        r: float,
        sigma: float,
        option_type: str = "call",
        transaction_cost: float = 0.001,
        lookback_window: int = 20,
    ):
        """
        Initialize minimum variance hedging.
        
        Args:
            lookback_window: Number of periods for variance estimation
        """
        super().__init__(S0, K, T, r, sigma, option_type, transaction_cost)
        self.lookback_window = lookback_window
        self.price_history: List[float] = []
        self.option_value_history: List[float] = []
    
    def get_hedge_positions(
        self, S: float, tau: float
    ) -> Dict[str, float]:
        """
        Calculate minimum variance hedge position.
        
        Args:
            S: Current stock price
            tau: Time to maturity
        
        Returns:
            positions: Required positions
        """
        if tau <= 0:
            return {"stock": 0.0}
        
        # Calculate current option value
        option_value = self.bs_model.price(
            S=S, K=self.K, T=tau, r=self.r, sigma=self.sigma, option_type=self.option_type
        )
        
        # Update history
        self.price_history.append(S)
        self.option_value_history.append(option_value)
        
        # Keep only recent history
        if len(self.price_history) > self.lookback_window:
            self.price_history = self.price_history[-self.lookback_window:]
            self.option_value_history = self.option_value_history[-self.lookback_window:]
        
        # Calculate hedge ratio
        if len(self.price_history) < 3:
            # Not enough data, use delta hedge
            greeks = self.bs_model.greeks(
                S=S, K=self.K, T=tau, r=self.r, sigma=self.sigma, option_type=self.option_type
            )
            stock_position = -self.option_position * greeks["delta"]
        else:
            # Estimate hedge ratio from historical covariance
            stock_returns = np.diff(self.price_history) / self.price_history[:-1]
            option_returns = np.diff(self.option_value_history) / self.option_value_history[:-1]
            
            if len(stock_returns) > 0:
                # Hedge ratio = Cov(option, stock) / Var(stock)
                hedge_ratio = np.cov(option_returns, stock_returns)[0, 1] / (
                    np.var(stock_returns) + 1e-8
                )
                stock_position = -self.option_position * hedge_ratio
            else:
                stock_position = 0.0
        
        return {"stock": stock_position}
