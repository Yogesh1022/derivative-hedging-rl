"""
Tests for the hedging environment.
"""

import pytest
import numpy as np
import gymnasium as gym

from src.environments.hedging_env import OptionHedgingEnv


class TestOptionHedgingEnv:
    """Test cases for OptionHedgingEnv."""
    
    def test_initialization_continuous(self):
        """Test environment initializes correctly with continuous actions."""
        env = OptionHedgingEnv(action_mode="continuous")
        
        assert env.observation_space.shape == (11,)
        assert env.action_space.shape == (1,)
        assert isinstance(env.action_space, gym.spaces.Box)
        assert env.action_space.low[0] == -2.0
        assert env.action_space.high[0] == 2.0
    
    def test_initialization_discrete(self):
        """Test environment initializes correctly with discrete actions."""
        env = OptionHedgingEnv(action_mode="discrete")
        
        assert env.observation_space.shape == (11,)
        assert isinstance(env.action_space, gym.spaces.Discrete)
        assert env.action_space.n == 5
    
    def test_reset(self):
        """Test reset returns valid observation."""
        env = OptionHedgingEnv()
        obs, info = env.reset(seed=42)
        
        assert obs.shape == (11,)
        assert isinstance(info, dict)
        assert "S0" in info
        assert "K" in info
        assert "T" in info
        assert env.current_step == 0
    
    def test_reset_reproducibility(self):
        """Test reset with same seed produces same initial state."""
        env1 = OptionHedgingEnv()
        env2 = OptionHedgingEnv()
        
        obs1, _ = env1.reset(seed=123)
        obs2, _ = env2.reset(seed=123)
        
        np.testing.assert_array_almost_equal(obs1, obs2)
    
    def test_step_continuous(self):
        """Test step with continuous action."""
        env = OptionHedgingEnv(action_mode="continuous")
        obs, _ = env.reset(seed=42)
        
        action = np.array([0.5])  # Hedge 50% of delta
        obs, reward, terminated, truncated, info = env.step(action)
        
        assert obs.shape == (11,)
        assert isinstance(reward, (int, float))
        assert isinstance(terminated, bool)
        assert isinstance(truncated, bool)
        assert isinstance(info, dict)
        assert env.current_step == 1
    
    def test_step_discrete(self):
        """Test step with discrete action."""
        env = OptionHedgingEnv(action_mode="discrete")
        obs, _ = env.reset(seed=42)
        
        action = 2  # Neutral (no change)
        obs, reward, terminated, truncated, info = env.step(action)
        
        assert obs.shape == (11,)
        assert isinstance(reward, (int, float))
        assert env.current_step == 1
    
    def test_episode_completion(self):
        """Test episode completes at terminal step."""
        env = OptionHedgingEnv(n_steps=10)
        env.reset(seed=42)
        
        done = False
        step_count = 0
        
        while not done:
            action = env.action_space.sample()
            obs, reward, terminated, truncated, info = env.step(action)
            done = terminated or truncated
            step_count += 1
        
        assert step_count == 10
        assert terminated
        assert "final_pnl" in info
        assert "total_costs" in info
    
    def test_observation_bounds(self):
        """Test observations are properly normalized."""
        env = OptionHedgingEnv()
        obs, _ = env.reset(seed=42)
        
        # Check normalized stock price is reasonable
        assert 0.5 < obs[0] < 2.0  # Normalized S/K
        
        # Check time to maturity decreases
        assert 0.0 < obs[2] <= 1.0
    
    def test_transaction_costs(self):
        """Test transaction costs are applied correctly."""
        env = OptionHedgingEnv(transaction_cost=0.01)
        env.reset(seed=42)
        
        # Take action with position change
        action = np.array([1.0])
        obs1, reward1, _, _, info1 = env.step(action)
        
        # Take opposite action
        action = np.array([-1.0])
        obs2, reward2, _, _, info2 = env.step(action)
        
        # Should have non-zero costs from position changes
        assert env.total_transaction_costs > 0
    
    def test_greeks_in_observation(self):
        """Test Greeks are included in observation."""
        env = OptionHedgingEnv()
        obs, _ = env.reset(seed=42)
        
        # Indices: 0=S_norm, 1=K_norm, 2=tau_norm, 3=sigma_norm, 4=r_norm, 
        #          5=position, 6=delta, 7=gamma, 8=vega, 9=pnl_norm, 10=step_norm
        
        delta = obs[6]
        gamma = obs[7]
        vega = obs[8]
        
        # For call option, delta should be in [0, 1]
        assert 0 <= delta <= 1, f"Delta {delta} out of range"
        
        # Gamma should be positive
        assert gamma >= 0, f"Gamma {gamma} should be non-negative"
        
        # Vega should be positive
        assert vega >= 0, f"Vega {vega} should be non-negative"
    
    def test_episode_metrics(self):
        """Test episode metrics are calculated correctly."""
        env = OptionHedgingEnv(n_steps=5)
        env.reset(seed=42)
        
        for _ in range(5):
            action = env.action_space.sample()
            env.step(action)
        
        metrics = env.get_episode_metrics()
        
        assert "total_pnl" in metrics
        assert "total_costs" in metrics
        assert "net_pnl" in metrics
        assert "num_rebalances" in metrics
        assert "avg_position" in metrics
        assert "sharpe_ratio" in metrics
        
        # Check metrics are reasonable
        assert isinstance(metrics["total_pnl"], (int, float))
        assert metrics["num_rebalances"] >= 0
    
    def test_different_option_types(self):
        """Test environment works with both call and put options."""
        env_call = OptionHedgingEnv(option_type="call")
        env_put = OptionHedgingEnv(option_type="put")
        
        obs_call, _ = env_call.reset(seed=42)
        obs_put, _ = env_put.reset(seed=42)
        
        # Deltas should have different signs
        delta_call = obs_call[6]
        delta_put = obs_put[6]
        
        # Call delta is positive, put delta is negative
        assert delta_call > 0
        assert delta_put < 0
    
    def test_render_mode(self):
        """Test render doesn't crash."""
        env = OptionHedgingEnv(render_mode=None)
        env.reset(seed=42)
        
        # Should not raise error
        output = env.render()
        assert output is None
    
    def test_seed_consistency(self):
        """Test seeding produces consistent results."""
        env = OptionHedgingEnv()
        
        env.reset(seed=999)
        obs1, _, _, _, _ = env.step(np.array([0.5]))
        
        env.reset(seed=999)
        obs2, _, _, _, _ = env.step(np.array([0.5]))
        
        np.testing.assert_array_almost_equal(obs1, obs2)
    
    def test_action_clipping(self):
        """Test actions are clipped to valid range."""
        env = OptionHedgingEnv(action_mode="continuous")
        env.reset(seed=42)
        
        # Try extreme action
        action = np.array([10.0])  # Way out of bounds
        obs, reward, _, _, info = env.step(action)
        
        # Should not crash and should clip action
        assert env.position <= 2.0
        assert env.position >= -2.0
    
    def test_history_tracking(self):
        """Test episode history is tracked correctly."""
        env = OptionHedgingEnv(n_steps=3)
        env.reset(seed=42)
        
        for _ in range(3):
            env.step(np.array([0.5]))
        
        assert len(env.price_history) == 4  # Initial + 3 steps
        assert len(env.position_history) == 4
        assert len(env.pnl_history) == 3  # One per step
    
    def test_volatility_variation(self):
        """Test environment with different volatilities."""
        env_low = OptionHedgingEnv(sigma=0.1)
        env_high = OptionHedgingEnv(sigma=0.5)
        
        obs_low, _ = env_low.reset(seed=42)
        obs_high, _ = env_high.reset(seed=42)
        
        # Higher vol should have higher vega
        vega_low = obs_low[8]
        vega_high = obs_high[8]
        
        # Both should be positive
        assert vega_low > 0
        assert vega_high > 0


class TestEnvironmentEdgeCases:
    """Test edge cases and error handling."""
    
    def test_zero_volatility(self):
        """Test environment with very low volatility."""
        env = OptionHedgingEnv(sigma=0.01)
        obs, _ = env.reset(seed=42)
        
        assert obs.shape == (11,)
    
    def test_short_maturity(self):
        """Test environment with short time to maturity."""
        env = OptionHedgingEnv(T=0.01, n_steps=5)
        obs, _ = env.reset(seed=42)
        
        # Should still work
        for _ in range(5):
            action = env.action_space.sample()
            env.step(action)
    
    def test_deep_itm_option(self):
        """Test with deep in-the-money option."""
        env = OptionHedgingEnv(S0=150.0, K=100.0)
        obs, _ = env.reset(seed=42)
        
        # Delta should be close to 1 for deep ITM call
        delta = obs[6]
        assert delta > 0.8
    
    def test_deep_otm_option(self):
        """Test with deep out-of-the-money option."""
        env = OptionHedgingEnv(S0=50.0, K=100.0)
        obs, _ = env.reset(seed=42)
        
        # Delta should be close to 0 for deep OTM call
        delta = obs[6]
        assert delta < 0.2
    
    def test_invalid_action_type(self):
        """Test invalid action type raises error."""
        with pytest.raises(ValueError):
            OptionHedgingEnv(action_mode="invalid")
    
    def test_invalid_option_type(self):
        """Test invalid option type raises error."""
        with pytest.raises(ValueError):
            OptionHedgingEnv(option_type="invalid")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
