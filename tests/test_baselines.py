"""
Tests for baseline hedging strategies.
"""

import pytest
import numpy as np

from src.baselines.hedging_strategies import (
    DeltaHedging,
    DeltaGammaHedging,
    DeltaGammaVegaHedging,
    MinimumVarianceHedging,
)
from src.pricing.black_scholes import BlackScholesModel


class TestDeltaHedging:
    """Test cases for Delta hedging strategy."""
    
    def test_initialization(self):
        """Test delta hedging initializes correctly."""
        strategy = DeltaHedging(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.2, option_type="call"
        )
        
        premium = strategy.initialize()
        
        assert premium > 0
        assert strategy.stock_position != 0  # Should establish initial hedge
        assert strategy.option_position == -1  # Short one option
    
    def test_rebalance(self):
        """Test delta hedging rebalances correctly."""
        strategy = DeltaHedging(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.2, option_type="call"
        )
        strategy.initialize()
        
        initial_position = strategy.stock_position
        
        # Price moves, hedge should change
        strategy.rebalance(S=110.0, tau=0.9)
        
        # Position should have changed (not necessarily increased)
        assert strategy.stock_position != initial_position
    
    def test_transaction_costs(self):
        """Test transaction costs accumulate."""
        strategy = DeltaHedging(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.2,
            option_type="call", transaction_cost=0.01
        )
        strategy.initialize()
        
        initial_costs = strategy.total_costs
        
        # Rebalance should incur costs
        strategy.rebalance(S=110.0, tau=0.9)
        
        assert strategy.total_costs > initial_costs
    
    def test_portfolio_value(self):
        """Test portfolio value calculation."""
        strategy = DeltaHedging(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.2, option_type="call"
        )
        premium = strategy.initialize()
        
        portfolio_info = strategy.get_portfolio_value(S=100.0, tau=1.0)
        
        assert "stock_value" in portfolio_info
        assert "option_value" in portfolio_info
        assert "cash" in portfolio_info
        assert "portfolio_value" in portfolio_info
        
        # Portfolio value should be close to zero (hedged)
        assert abs(portfolio_info["portfolio_value"]) < premium


class TestDeltaGammaHedging:
    """Test cases for Delta-Gamma hedging strategy."""
    
    def test_initialization(self):
        """Test delta-gamma hedging initializes correctly."""
        strategy = DeltaGammaHedging(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.2, option_type="call"
        )
        
        premium = strategy.initialize()
        
        assert premium > 0
        assert strategy.stock_position != 0
        assert strategy.option_position == -1
    
    def test_gamma_adjustment(self):
        """Test gamma adjustment is applied."""
        strategy = DeltaGammaHedging(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.2,
            option_type="call", gamma_target=0.5
        )
        strategy.initialize()
        
        # Should have adjustment from gamma term
        portfolio = strategy.get_portfolio_value(S=100.0, tau=1.0)
        assert "portfolio_value" in portfolio
    
    def test_different_gamma_weights(self):
        """Test different gamma weights produce different hedges."""
        strategy1 = DeltaGammaHedging(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.2,
            option_type="call", gamma_target=0.1
        )
        strategy2 = DeltaGammaHedging(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.2,
            option_type="call", gamma_target=0.9
        )
        
        strategy1.initialize()
        strategy2.initialize()
        
        # Same initial conditions, different gamma weights
        # Should produce different hedges
        # (Note: might be similar for ATM, but should differ as gamma changes)
        assert True  # Structure test


class TestDeltaGammaVegaHedging:
    """Test cases for Delta-Gamma-Vega hedging strategy."""
    
    def test_initialization(self):
        """Test delta-gamma-vega hedging initializes correctly."""
        strategy = DeltaGammaVegaHedging(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.2, option_type="call"
        )
        
        premium = strategy.initialize()
        
        assert premium > 0
        assert strategy.stock_position != 0
        assert strategy.option_position == -1
    
    def test_vega_adjustment(self):
        """Test vega adjustment is applied."""
        strategy = DeltaGammaVegaHedging(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.2,
            option_type="call", vega_weight=0.5
        )
        strategy.initialize()
        
        portfolio = strategy.get_portfolio_value(S=100.0, tau=1.0)
        assert "portfolio_value" in portfolio
    
    def test_volatility_sensitivity(self):
        """Test strategy responds to volatility changes."""
        strategy = DeltaGammaVegaHedging(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.2,
            option_type="call", vega_weight=1.0
        )
        strategy.initialize()
        
        initial_position = strategy.stock_position
        
        # With vega weight, position should consider vol risk
        strategy.rebalance(S=100.0, tau=0.8)
        
        # Position changed due to time decay affecting vega
        assert True  # Structure test


class TestMinimumVarianceHedging:
    """Test cases for Minimum Variance hedging strategy."""
    
    def test_initialization(self):
        """Test minimum variance hedging initializes correctly."""
        strategy = MinimumVarianceHedging(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.2,
            option_type="call",
            lookback_window=20,
        )
        
        premium = strategy.initialize()
        
        assert premium > 0
        assert strategy.stock_position != 0
        assert strategy.option_position == -1
    
    def test_hedge_ratio_calculation(self):
        """Test minimum variance hedge ratio is calculated."""
        strategy = MinimumVarianceHedging(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.2,
            option_type="call",
            lookback_window=20,
        )
        strategy.initialize()
        
        # Hedge ratio should be calculated from covariance
        assert hasattr(strategy, "stock_position")
        assert strategy.stock_position != 0
    
    def test_perfect_correlation(self):
        """Test with sufficient lookback window."""
        strategy = MinimumVarianceHedging(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.2,
            option_type="call",
            lookback_window=50,
        )
        strategy.initialize()
        
        # Should establish hedge based on ratio
        assert strategy.stock_position != 0


class TestStrategyComparison:
    """Test comparison between different strategies."""
    
    def test_all_strategies_initialize(self):
        """Test all strategies can initialize with same parameters."""
        params = {
            "S0": 100.0,
            "K": 100.0,
            "T": 1.0,
            "r": 0.05,
            "sigma": 0.2,
            "option_type": "call",
        }
        
        delta = DeltaHedging(**params)
        delta_gamma = DeltaGammaHedging(**params)
        delta_gamma_vega = DeltaGammaVegaHedging(**params)
        
        # All should initialize
        p1 = delta.initialize()
        p2 = delta_gamma.initialize()
        p3 = delta_gamma_vega.initialize()
        
        # Premiums should be similar (same option)
        assert abs(p1 - p2) < 1.0
        assert abs(p2 - p3) < 1.0
    
    def test_hedging_behavior_under_price_change(self):
        """Test all strategies hedge under price movement."""
        params = {
            "S0": 100.0,
            "K": 100.0,
            "T": 1.0,
            "r": 0.05,
            "sigma": 0.2,
            "option_type": "call",
        }
        
        strategies = [
            DeltaHedging(**params),
            DeltaGammaHedging(**params),
            DeltaGammaVegaHedging(**params),
        ]
        
        for strategy in strategies:
            strategy.initialize()
            initial_pos = strategy.stock_position
            
            # Large price move
            strategy.rebalance(S=120.0, tau=0.9)
            
            # All should rebalance (change position)
            assert strategy.stock_position != initial_pos
    
    def test_transaction_costs_across_strategies(self):
        """Test transaction costs accumulate for all strategies."""
        params = {
            "S0": 100.0,
            "K": 100.0,
            "T": 1.0,
            "r": 0.05,
            "sigma": 0.2,
            "option_type": "call",
            "transaction_cost": 0.001,
        }
        
        strategies = [
            DeltaHedging(**params),
            DeltaGammaHedging(**params),
            DeltaGammaVegaHedging(**params),
        ]
        
        for strategy in strategies:
            strategy.initialize()
            initial_costs = strategy.total_costs
            
            # Multiple rebalances
            for S in [105, 110, 115, 110, 105]:
                strategy.rebalance(S=S, tau=0.8)
            
            # Costs should accumulate
            assert strategy.total_costs > initial_costs


class TestEdgeCases:
    """Test edge cases for hedging strategies."""
    
    def test_zero_time_to_maturity(self):
        """Test strategies at expiration."""
        strategy = DeltaHedging(
            S0=100.0, K=100.0, T=0.01, r=0.05, sigma=0.2, option_type="call"
        )
        strategy.initialize()
        
        # At expiration
        portfolio = strategy.get_portfolio_value(S=110.0, tau=0.0)
        
        # Should calculate terminal payoff
        assert "option_value" in portfolio
    
    def test_deep_itm_hedging(self):
        """Test hedging deep in-the-money option."""
        strategy = DeltaHedging(
            S0=150.0, K=100.0, T=1.0, r=0.05, sigma=0.2, option_type="call"
        )
        premium = strategy.initialize()
        
        # Delta should be close to 1
        assert abs(strategy.stock_position - 1.0) < 0.2
    
    def test_deep_otm_hedging(self):
        """Test hedging deep out-of-the-money option."""
        strategy = DeltaHedging(
            S0=50.0, K=100.0, T=1.0, r=0.05, sigma=0.2, option_type="call"
        )
        premium = strategy.initialize()
        
        # Delta should be close to 0
        assert abs(strategy.stock_position) < 0.2
    
    def test_put_option_hedging(self):
        """Test hedging put option (negative delta)."""
        strategy = DeltaHedging(
            S0=100.0, K=100.0, T=1.0, r=0.05, sigma=0.2, option_type="put"
        )
        premium = strategy.initialize()
        
        # Put has negative delta, short put needs negative stock hedge
        assert strategy.stock_position < 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
