"""
Evaluation framework for hedging strategies.

This module provides tools to evaluate and compare hedging strategies,
including baselines and RL agents. It calculates comprehensive metrics
and generates comparison reports.
"""

from typing import Dict, List, Optional, Tuple, Callable
from dataclasses import dataclass, field
import numpy as np
import pandas as pd
from datetime import datetime, UTC

from src.baselines.hedging_strategies import BaseHedgingStrategy
from src.pricing.black_scholes import BlackScholesModel


@dataclass
class EpisodeResult:
    """Results from a single hedging episode."""
    
    strategy_name: str
    final_pnl: float
    total_costs: float
    net_pnl: float
    sharpe_ratio: float
    max_drawdown: float
    hedge_error_mean: float
    hedge_error_std: float
    num_rebalances: int
    avg_position: float
    final_stock_price: float
    episode_length: int
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))
    
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            "strategy_name": self.strategy_name,
            "final_pnl": float(self.final_pnl),
            "total_costs": float(self.total_costs),
            "net_pnl": float(self.net_pnl),
            "sharpe_ratio": float(self.sharpe_ratio),
            "max_drawdown": float(self.max_drawdown),
            "hedge_error_mean": float(self.hedge_error_mean),
            "hedge_error_std": float(self.hedge_error_std),
            "num_rebalances": int(self.num_rebalances),
            "avg_position": float(self.avg_position),
            "final_stock_price": float(self.final_stock_price),
            "episode_length": int(self.episode_length),
            "timestamp": self.timestamp.isoformat(),
        }


@dataclass
class BacktestResult:
    """Results from backtesting over multiple episodes."""
    
    strategy_name: str
    num_episodes: int
    mean_pnl: float
    std_pnl: float
    mean_sharpe: float
    mean_costs: float
    win_rate: float
    best_pnl: float
    worst_pnl: float
    mean_hedge_error: float
    episodes: List[EpisodeResult] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            "strategy_name": self.strategy_name,
            "num_episodes": self.num_episodes,
            "mean_pnl": float(self.mean_pnl),
            "std_pnl": float(self.std_pnl),
            "mean_sharpe": float(self.mean_sharpe),
            "mean_costs": float(self.mean_costs),
            "win_rate": float(self.win_rate),
            "best_pnl": float(self.best_pnl),
            "worst_pnl": float(self.worst_pnl),
            "mean_hedge_error": float(self.mean_hedge_error),
        }


class HedgingEvaluator:
    """Evaluator for hedging strategies."""
    
    def __init__(
        self,
        S0: float = 100.0,
        K: float = 100.0,
        T: float = 1.0,
        r: float = 0.05,
        sigma: float = 0.2,
        n_steps: int = 252,
        option_type: str = "call",
    ):
        """
        Initialize evaluator.
        
        Args:
            S0: Initial stock price
            K: Strike price
            T: Time to maturity
            r: Risk-free rate
            sigma: Volatility
            n_steps: Number of rebalancing steps
            option_type: 'call' or 'put'
        """
        self.S0 = S0
        self.K = K
        self.T = T
        self.r = r
        self.sigma = sigma
        self.n_steps = n_steps
        self.dt = T / n_steps
        self.option_type = option_type
        
        self.bs_model = BlackScholesModel()
    
    def simulate_price_path(
        self,
        seed: Optional[int] = None,
    ) -> np.ndarray:
        """
        Simulate stock price path using GBM.
        
        Args:
            seed: Random seed
        
        Returns:
            prices: Array of stock prices
        """
        if seed is not None:
            np.random.seed(seed)
        
        prices = np.zeros(self.n_steps + 1)
        prices[0] = self.S0
        
        for i in range(self.n_steps):
            dW = np.random.normal(0, np.sqrt(self.dt))
            prices[i + 1] = prices[i] * np.exp(
                (self.r - 0.5 * self.sigma ** 2) * self.dt + self.sigma * dW
            )
        
        return prices
    
    def evaluate_strategy(
        self,
        strategy: BaseHedgingStrategy,
        price_path: np.ndarray,
        strategy_name: str,
    ) -> EpisodeResult:
        """
        Evaluate a hedging strategy on a given price path.
        
        Args:
            strategy: Hedging strategy instance
            price_path: Simulated price path
            strategy_name: Name of strategy
        
        Returns:
            result: Episode evaluation result
        """
        # Initialize strategy
        initial_premium = strategy.initialize()
        
        # Track metrics
        pnl_history = []
        position_history = []
        hedge_errors = []
        
        # Simulate hedging over the price path
        for step in range(self.n_steps):
            S = price_path[step]
            tau = self.T - step * self.dt
            
            # Rebalance hedge
            if step > 0:
                strategy.rebalance(S, tau)
            
            # Calculate current portfolio value and PnL
            portfolio_info = strategy.get_portfolio_value(S, tau)
            pnl = portfolio_info["portfolio_value"] - initial_premium
            pnl_history.append(pnl)
            position_history.append(strategy.stock_position)
            
            # Calculate hedge error vs delta hedge
            if tau > 0:
                greeks = self.bs_model.greeks(
                    S=S, K=self.K, T=tau, r=self.r, sigma=self.sigma, option_type=self.option_type
                )
                optimal_delta = greeks["delta"]
                hedge_error = abs(strategy.stock_position - optimal_delta)
                hedge_errors.append(hedge_error)
        
        # Final evaluation at maturity
        S_final = price_path[-1]
        final_portfolio = strategy.get_portfolio_value(S_final, 0.0)
        final_pnl = final_portfolio["portfolio_value"] - initial_premium
        
        # Calculate metrics
        pnl_array = np.array(pnl_history)
        sharpe_ratio = np.mean(pnl_array) / (np.std(pnl_array) + 1e-8)
        max_drawdown = np.min(pnl_array)
        
        result = EpisodeResult(
            strategy_name=strategy_name,
            final_pnl=final_pnl,
            total_costs=strategy.total_costs,
            net_pnl=final_pnl - strategy.total_costs,
            sharpe_ratio=sharpe_ratio,
            max_drawdown=max_drawdown,
            hedge_error_mean=np.mean(hedge_errors) if hedge_errors else 0.0,
            hedge_error_std=np.std(hedge_errors) if hedge_errors else 0.0,
            num_rebalances=self.n_steps,
            avg_position=np.mean(position_history),
            final_stock_price=S_final,
            episode_length=self.n_steps,
        )
        
        return result
    
    def backtest_strategy(
        self,
        strategy_class: type,
        strategy_kwargs: Dict,
        strategy_name: str,
        num_episodes: int = 100,
        seed: Optional[int] = None,
    ) -> BacktestResult:
        """
        Backtest a strategy over multiple episodes.
        
        Args:
            strategy_class: Strategy class to instantiate
            strategy_kwargs: Kwargs for strategy initialization
            strategy_name: Name of strategy
            num_episodes: Number of episodes to run
            seed: Random seed for reproducibility
        
        Returns:
            result: Backtest results
        """
        if seed is not None:
            np.random.seed(seed)
        
        episodes = []
        
        for i in range(num_episodes):
            # Generate random price path
            price_path = self.simulate_price_path(seed=seed + i if seed else None)
            
            # Create fresh strategy instance
            strategy = strategy_class(**strategy_kwargs)
            
            # Evaluate
            episode_result = self.evaluate_strategy(
                strategy, price_path, strategy_name
            )
            episodes.append(episode_result)
        
        # Aggregate metrics
        pnls = [ep.final_pnl for ep in episodes]
        sharpes = [ep.sharpe_ratio for ep in episodes]
        costs = [ep.total_costs for ep in episodes]
        hedge_errors = [ep.hedge_error_mean for ep in episodes]
        
        result = BacktestResult(
            strategy_name=strategy_name,
            num_episodes=num_episodes,
            mean_pnl=np.mean(pnls),
            std_pnl=np.std(pnls),
            mean_sharpe=np.mean(sharpes),
            mean_costs=np.mean(costs),
            win_rate=np.mean([pnl > 0 for pnl in pnls]),
            best_pnl=np.max(pnls),
            worst_pnl=np.min(pnls),
            mean_hedge_error=np.mean(hedge_errors),
            episodes=episodes,
        )
        
        return result
    
    def compare_strategies(
        self,
        strategies: List[Tuple[type, Dict, str]],
        num_episodes: int = 100,
        seed: Optional[int] = None,
    ) -> pd.DataFrame:
        """
        Compare multiple strategies.
        
        Args:
            strategies: List of (strategy_class, kwargs, name) tuples
            num_episodes: Number of episodes per strategy
            seed: Random seed
        
        Returns:
            comparison_df: DataFrame comparing strategies
        """
        results = []
        
        for strategy_class, kwargs, name in strategies:
            print(f"Backtesting {name}...")
            result = self.backtest_strategy(
                strategy_class, kwargs, name, num_episodes, seed
            )
            results.append(result.to_dict())
        
        df = pd.DataFrame(results)
        df = df.sort_values("mean_pnl", ascending=False)
        
        return df


class PerformanceMetrics:
    """Calculate various performance metrics for hedging strategies."""
    
    @staticmethod
    def sharpe_ratio(returns: np.ndarray, risk_free_rate: float = 0.0) -> float:
        """Calculate Sharpe ratio."""
        excess_returns = returns - risk_free_rate
        return np.mean(excess_returns) / (np.std(excess_returns) + 1e-8)
    
    @staticmethod
    def sortino_ratio(returns: np.ndarray, risk_free_rate: float = 0.0) -> float:
        """Calculate Sortino ratio (penalizes downside volatility only)."""
        excess_returns = returns - risk_free_rate
        downside_returns = returns[returns < 0]
        downside_std = np.std(downside_returns) if len(downside_returns) > 0 else 1e-8
        return np.mean(excess_returns) / downside_std
    
    @staticmethod
    def max_drawdown(pnl_series: np.ndarray) -> float:
        """Calculate maximum drawdown."""
        cumulative = np.cumsum(pnl_series)
        running_max = np.maximum.accumulate(cumulative)
        drawdown = running_max - cumulative
        return float(np.max(drawdown))
    
    @staticmethod
    def calmar_ratio(returns: np.ndarray, pnl_series: np.ndarray) -> float:
        """Calculate Calmar ratio (return/max_drawdown)."""
        max_dd = PerformanceMetrics.max_drawdown(pnl_series)
        if max_dd > 0:
            return np.mean(returns) / max_dd
        return 0.0
    
    @staticmethod
    def var(returns: np.ndarray, confidence: float = 0.95) -> float:
        """Calculate Value at Risk at given confidence level."""
        return np.percentile(returns, (1 - confidence) * 100)
    
    @staticmethod
    def cvar(returns: np.ndarray, confidence: float = 0.95) -> float:
        """Calculate Conditional Value at Risk (Expected Shortfall)."""
        var_threshold = PerformanceMetrics.var(returns, confidence)
        return np.mean(returns[returns <= var_threshold])
    
    @staticmethod
    def hedge_effectiveness(
        hedged_pnl: np.ndarray,
        unhedged_pnl: np.ndarray,
    ) -> float:
        """
        Calculate hedge effectiveness ratio.
        
        HE = 1 - Var(hedged) / Var(unhedged)
        """
        var_hedged = np.var(hedged_pnl)
        var_unhedged = np.var(unhedged_pnl)
        return 1 - var_hedged / (var_unhedged + 1e-8)
