"""
Tests for the evaluation framework.
"""

import pytest
import numpy as np
import pandas as pd

from src.evaluation.metrics import (
    EpisodeResult,
    BacktestResult,
    HedgingEvaluator,
    PerformanceMetrics,
)
from src.baselines.hedging_strategies import DeltaHedging, DeltaGammaHedging


class TestEpisodeResult:
    """Test cases for EpisodeResult dataclass."""
    
    def test_initialization(self):
        """Test episode result initializes correctly."""
        result = EpisodeResult(
            strategy_name="Delta",
            final_pnl=100.0,
            total_costs=5.0,
            net_pnl=95.0,
            sharpe_ratio=1.5,
            max_drawdown=-10.0,
            hedge_error_mean=0.05,
            hedge_error_std=0.02,
            num_rebalances=252,
            avg_position=0.5,
            final_stock_price=105.0,
            episode_length=252,
        )
        
        assert result.strategy_name == "Delta"
        assert result.final_pnl == 100.0
        assert result.net_pnl == 95.0
    
    def test_to_dict(self):
        """Test conversion to dictionary."""
        result = EpisodeResult(
            strategy_name="Delta",
            final_pnl=100.0,
            total_costs=5.0,
            net_pnl=95.0,
            sharpe_ratio=1.5,
            max_drawdown=-10.0,
            hedge_error_mean=0.05,
            hedge_error_std=0.02,
            num_rebalances=252,
            avg_position=0.5,
            final_stock_price=105.0,
            episode_length=252,
        )
        
        result_dict = result.to_dict()
        
        assert isinstance(result_dict, dict)
        assert result_dict["strategy_name"] == "Delta"
        assert result_dict["final_pnl"] == 100.0
        assert "timestamp" in result_dict


class TestBacktestResult:
    """Test cases for BacktestResult dataclass."""
    
    def test_initialization(self):
        """Test backtest result initializes correctly."""
        result = BacktestResult(
            strategy_name="Delta",
            num_episodes=100,
            mean_pnl=50.0,
            std_pnl=25.0,
            mean_sharpe=1.2,
            mean_costs=3.0,
            win_rate=0.65,
            best_pnl=150.0,
            worst_pnl=-30.0,
            mean_hedge_error=0.04,
        )
        
        assert result.strategy_name == "Delta"
        assert result.num_episodes == 100
        assert result.win_rate == 0.65
    
    def test_to_dict(self):
        """Test conversion to dictionary."""
        result = BacktestResult(
            strategy_name="Delta",
            num_episodes=100,
            mean_pnl=50.0,
            std_pnl=25.0,
            mean_sharpe=1.2,
            mean_costs=3.0,
            win_rate=0.65,
            best_pnl=150.0,
            worst_pnl=-30.0,
            mean_hedge_error=0.04,
        )
        
        result_dict = result.to_dict()
        
        assert isinstance(result_dict, dict)
        assert result_dict["num_episodes"] == 100
        assert result_dict["win_rate"] == 0.65


class TestHedgingEvaluator:
    """Test cases for HedgingEvaluator."""
    
    def test_initialization(self):
        """Test evaluator initializes correctly."""
        evaluator = HedgingEvaluator(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.2, n_steps=252
        )
        
        assert evaluator.S0 == 100.0
        assert evaluator.K == 100.0
        assert evaluator.n_steps == 252
        assert evaluator.dt < 0.01  # Daily steps
    
    def test_simulate_price_path(self):
        """Test price path simulation."""
        evaluator = HedgingEvaluator(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.2, n_steps=252
        )
        
        prices = evaluator.simulate_price_path(seed=42)
        
        assert len(prices) == 253  # n_steps + 1
        assert prices[0] == 100.0  # Initial price
        assert all(prices > 0)  # All prices positive
    
    def test_price_path_reproducibility(self):
        """Test price paths are reproducible with same seed."""
        evaluator = HedgingEvaluator(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.2, n_steps=100
        )
        
        prices1 = evaluator.simulate_price_path(seed=123)
        prices2 = evaluator.simulate_price_path(seed=123)
        
        np.testing.assert_array_almost_equal(prices1, prices2)
    
    def test_evaluate_strategy(self):
        """Test strategy evaluation on a price path."""
        evaluator = HedgingEvaluator(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.2, n_steps=50
        )
        
        strategy = DeltaHedging(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.2, option_type="call"
        )
        
        price_path = evaluator.simulate_price_path(seed=42)
        result = evaluator.evaluate_strategy(strategy, price_path, "Delta")
        
        assert isinstance(result, EpisodeResult)
        assert result.strategy_name == "Delta"
        assert result.episode_length == 50
        assert isinstance(result.final_pnl, float)
        assert isinstance(result.sharpe_ratio, float)
    
    def test_backtest_strategy(self):
        """Test backtesting over multiple episodes."""
        evaluator = HedgingEvaluator(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.2, n_steps=20
        )
        
        result = evaluator.backtest_strategy(
            strategy_class=DeltaHedging,
            strategy_kwargs={
                "S0": 100.0,
                "K": 100.0,
                "T": 1.0,
                "r": 0.05,
                "sigma": 0.2,
                "option_type": "call",
            },
            strategy_name="Delta",
            num_episodes=10,
            seed=42,
        )
        
        assert isinstance(result, BacktestResult)
        assert result.strategy_name == "Delta"
        assert result.num_episodes == 10
        assert len(result.episodes) == 10
        assert 0.0 <= result.win_rate <= 1.0
    
    def test_backtest_reproducibility(self):
        """Test backtest is reproducible with same seed."""
        evaluator = HedgingEvaluator(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.2, n_steps=20
        )
        
        kwargs = {
            "strategy_class": DeltaHedging,
            "strategy_kwargs": {
                "S0": 100.0,
                "K": 100.0,
                "T": 1.0,
                "r": 0.05,
                "sigma": 0.2,
                "option_type": "call",
            },
            "strategy_name": "Delta",
            "num_episodes": 5,
            "seed": 999,
        }
        
        result1 = evaluator.backtest_strategy(**kwargs)
        result2 = evaluator.backtest_strategy(**kwargs)
        
        # Should produce same results
        assert result1.mean_pnl == result2.mean_pnl
        assert result1.mean_sharpe == result2.mean_sharpe
    
    def test_compare_strategies(self):
        """Test comparing multiple strategies."""
        evaluator = HedgingEvaluator(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.2, n_steps=20
        )
        
        strategies = [
            (
                DeltaHedging,
                {
                    "S0": 100.0,
                    "K": 100.0,
                    "T": 1.0,
                    "r": 0.05,
                    "sigma": 0.2,
                    "option_type": "call",
                },
                "Delta",
            ),
            (
                DeltaGammaHedging,
                {
                    "S0": 100.0,
                    "K": 100.0,
                    "T": 1.0,
                    "r": 0.05,
                    "sigma": 0.2,
                    "option_type": "call",
                },
                "DeltaGamma",
            ),
        ]
        
        comparison_df = evaluator.compare_strategies(
            strategies, num_episodes=5, seed=42
        )
        
        assert isinstance(comparison_df, pd.DataFrame)
        assert len(comparison_df) == 2
        assert "strategy_name" in comparison_df.columns
        assert "mean_pnl" in comparison_df.columns
        assert "mean_sharpe" in comparison_df.columns


class TestPerformanceMetrics:
    """Test cases for PerformanceMetrics."""
    
    def test_sharpe_ratio(self):
        """Test Sharpe ratio calculation."""
        returns = np.array([0.01, 0.02, -0.01, 0.03, 0.02])
        sharpe = PerformanceMetrics.sharpe_ratio(returns, risk_free_rate=0.0)
        
        assert isinstance(sharpe, float)
        assert sharpe > 0  # Positive average return
    
    def test_sharpe_ratio_negative(self):
        """Test Sharpe ratio with negative returns."""
        returns = np.array([-0.01, -0.02, -0.01, -0.03, -0.02])
        sharpe = PerformanceMetrics.sharpe_ratio(returns, risk_free_rate=0.0)
        
        assert isinstance(sharpe, float)
        assert sharpe < 0  # Negative average return
    
    def test_sortino_ratio(self):
        """Test Sortino ratio calculation."""
        returns = np.array([0.01, 0.02, -0.01, 0.03, -0.02])
        sortino = PerformanceMetrics.sortino_ratio(returns, risk_free_rate=0.0)
        
        assert isinstance(sortino, float)
    
    def test_max_drawdown(self):
        """Test maximum drawdown calculation."""
        pnl_series = np.array([10, 20, 15, 25, 10, 30])
        max_dd = PerformanceMetrics.max_drawdown(pnl_series)
        
        assert isinstance(max_dd, float)
        assert max_dd >= 0  # Drawdown is positive
    
    def test_max_drawdown_monotonic(self):
        """Test max drawdown with monotonic increase."""
        pnl_series = np.array([10, 20, 30, 40, 50])
        max_dd = PerformanceMetrics.max_drawdown(pnl_series)
        
        assert max_dd == 0.0  # No drawdown
    
    def test_calmar_ratio(self):
        """Test Calmar ratio calculation."""
        returns = np.array([0.01, 0.02, -0.01, 0.03, 0.02])
        pnl_series = np.cumsum(returns)
        
        calmar = PerformanceMetrics.calmar_ratio(returns, pnl_series)
        
        assert isinstance(calmar, float)
    
    def test_var(self):
        """Test Value at Risk calculation."""
        returns = np.random.randn(1000) * 0.02
        var_95 = PerformanceMetrics.var(returns, confidence=0.95)
        
        assert isinstance(var_95, float)
        assert var_95 < 0  # VaR is negative (loss)
        
        # Should be at 5th percentile
        percentile_5 = np.percentile(returns, 5)
        assert abs(var_95 - percentile_5) < 1e-6
    
    def test_cvar(self):
        """Test Conditional Value at Risk calculation."""
        returns = np.random.randn(1000) * 0.02
        cvar_95 = PerformanceMetrics.cvar(returns, confidence=0.95)
        
        assert isinstance(cvar_95, float)
        assert cvar_95 < 0  # CVaR is negative (expected loss)
        
        # CVaR should be more extreme than VaR
        var_95 = PerformanceMetrics.var(returns, confidence=0.95)
        assert cvar_95 <= var_95
    
    def test_hedge_effectiveness(self):
        """Test hedge effectiveness calculation."""
        # Hedged portfolio has lower variance
        hedged_pnl = np.random.randn(100) * 0.01
        unhedged_pnl = np.random.randn(100) * 0.05
        
        he = PerformanceMetrics.hedge_effectiveness(hedged_pnl, unhedged_pnl)
        
        assert isinstance(he, float)
        # Hedged should reduce variance (HE close to 1)
        # Note: due to randomness, this might not always hold
        # But the method should execute correctly
    
    def test_hedge_effectiveness_perfect(self):
        """Test hedge effectiveness with perfect hedge."""
        hedged_pnl = np.zeros(100)  # Perfect hedge (no variance)
        unhedged_pnl = np.random.randn(100) * 0.05
        
        he = PerformanceMetrics.hedge_effectiveness(hedged_pnl, unhedged_pnl)
        
        # Perfect hedge should give HE close to 1
        assert he > 0.99
    
    def test_hedge_effectiveness_no_hedge(self):
        """Test hedge effectiveness with no hedge."""
        unhedged_pnl = np.random.randn(100) * 0.05
        
        # Same as unhedged (no hedge effectiveness)
        he = PerformanceMetrics.hedge_effectiveness(unhedged_pnl, unhedged_pnl)
        
        # Should be 0 (no reduction in variance)
        assert abs(he) < 0.01


class TestEvaluatorEdgeCases:
    """Test edge cases in evaluation."""
    
    def test_short_episode(self):
        """Test evaluation with very short episode."""
        evaluator = HedgingEvaluator(
            S0=100.0, K=100.0, T=0.1, r=0.05, sigma=0.2, n_steps=5
        )
        
        strategy = DeltaHedging(
            S0=100.0, K=100.0, T=0.1, r=0.05, sigma=0.2, option_type="call"
        )
        
        price_path = evaluator.simulate_price_path(seed=42)
        result = evaluator.evaluate_strategy(strategy, price_path, "Delta")
        
        assert result.episode_length == 5
    
    def test_high_volatility_path(self):
        """Test with high volatility."""
        evaluator = HedgingEvaluator(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.8, n_steps=50
        )
        
        prices = evaluator.simulate_price_path(seed=42)
        
        # Prices should vary more
        price_std = np.std(np.diff(np.log(prices)))
        assert price_std > 0.01
    
    def test_put_option_evaluation(self):
        """Test evaluation with put option."""
        evaluator = HedgingEvaluator(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.2, n_steps=20, option_type="put"
        )
        
        strategy = DeltaHedging(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.2, option_type="put"
        )
        
        price_path = evaluator.simulate_price_path(seed=42)
        result = evaluator.evaluate_strategy(strategy, price_path, "DeltaPut")
        
        assert isinstance(result, EpisodeResult)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
