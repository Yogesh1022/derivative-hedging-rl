"""
Alternative Reward Functions for Hedging Environment

Implements:
1. Asymmetric Reward (penalize losses more than gains)
2. CVaR-based Reward (optimize tail risk)
3. Sharpe-based Reward (maximize risk-adjusted returns)
4. Variance-Penalized Reward (encourage stable hedging)

Usage:
    from src.environments.reward_functions import AsymmetricReward, CVaRReward
    
    reward_fn = AsymmetricReward(loss_multiplier=2.0)
    reward = reward_fn.calculate(pnl, hedge_error, portfolio_history)
"""

import numpy as np
from typing import List, Optional
from abc import ABC, abstractmethod


class BaseReward(ABC):
    """Base class for reward functions"""
    
    @abstractmethod
    def calculate(self, pnl: float, hedge_error: float, **kwargs) -> float:
        """Calculate reward"""
        pass


class StandardReward(BaseReward):
    """Standard PnL-based reward"""
    
    def __init__(self, pnl_scale: float = 10.0):
        self.pnl_scale = pnl_scale
        
    def calculate(self, pnl: float, hedge_error: float, **kwargs) -> float:
        return pnl / self.pnl_scale


class AsymmetricReward(BaseReward):
    """
    Asymmetric Reward Function
    
    Penalizes losses more heavily than rewarding gains.
    Useful for risk-averse strategies.
    
    Args:
        loss_multiplier: Multiplier for negative PnL (default: 2.0)
        gain_multiplier: Multiplier for positive PnL (default: 1.0)
    """
    
    def __init__(
        self,
        loss_multiplier: float = 2.0,
        gain_multiplier: float = 1.0,
        pnl_scale: float = 10.0
    ):
        self.loss_multiplier = loss_multiplier
        self.gain_multiplier = gain_multiplier
        self.pnl_scale = pnl_scale
        
    def calculate(self, pnl: float, hedge_error: float, **kwargs) -> float:
        """Calculate asymmetric reward"""
        if pnl >= 0:
            pnl_reward = pnl * self.gain_multiplier
        else:
            pnl_reward = pnl * self.loss_multiplier
        
        # Scale and add hedge accuracy component
        reward = pnl_reward / self.pnl_scale - hedge_error * 5.0
        
        return reward


class CVaRReward(BaseReward):
    """
    Conditional Value at Risk (CVaR) Reward
    
    Optimizes expected shortfall at specified confidence level.
    Focuses on tail risk management.
    
    Args:
        alpha: Confidence level (e.g., 0.05 for 95% CVaR)
        lambda_cvar: Weight for CVaR component [0, 1]
        window: Rolling window size for CVaR calculation
    """
    
    def __init__(
        self,
        alpha: float = 0.05,
        lambda_cvar: float = 0.3,
        window: int = 20,
        pnl_scale: float = 10.0
    ):
        self.alpha = alpha
        self.lambda_cvar = lambda_cvar
        self.window = window
        self.pnl_scale = pnl_scale
        self.pnl_history = []
        
    def calculate(self, pnl: float, hedge_error: float, **kwargs) -> float:
        """Calculate CVaR-based reward"""
        # Update history
        self.pnl_history.append(pnl)
        if len(self.pnl_history) > self.window:
            self.pnl_history.pop(0)
        
        # Standard PnL component
        pnl_reward = pnl / self.pnl_scale
        
        # CVaR component (if enough history)
        if len(self.pnl_history) >= 10:
            sorted_pnls = sorted(self.pnl_history)
            n_tail = max(1, int(self.alpha * len(sorted_pnls)))
            cvar = np.mean(sorted_pnls[:n_tail])  # Expected value of worst alpha% outcomes
            cvar_penalty = -abs(cvar) / self.pnl_scale
        else:
            cvar_penalty = 0.0
        
        # Combined reward
        reward = (
            (1 - self.lambda_cvar) * pnl_reward +
            self.lambda_cvar * cvar_penalty -
            hedge_error * 3.0
        )
        
        return reward
        
    def reset(self):
        """Reset history for new episode"""
        self.pnl_history = []


class SharpeReward(BaseReward):
    """
    Sharpe Ratio-based Reward
    
    Maximizes risk-adjusted returns using rolling Sharpe ratio.
    
    Args:
        window: Rolling window for Sharpe calculation
        target_sharpe: Target Sharpe ratio for normalization
    """
    
    def __init__(
        self,
        window: int = 50,
        target_sharpe: float = 1.5
    ):
        self.window = window
        self.target_sharpe = target_sharpe
        self.returns_history = []
        
    def calculate(self, pnl: float, hedge_error: float, **kwargs) -> float:
        """Calculate Sharpe-based reward"""
        # Update history
        self.returns_history.append(pnl)
        if len(self.returns_history) > self.window:
            self.returns_history.pop(0)
        
        # Calculate rolling Sharpe
        if len(self.returns_history) >= 10:
            mean_return = np.mean(self.returns_history)
            std_return = np.std(self.returns_history)
            
            if std_return > 0:
                sharpe = (mean_return / std_return) * np.sqrt(252)
                sharpe_reward = sharpe / self.target_sharpe  # Normalize
            else:
                sharpe_reward = 0.0
        else:
            sharpe_reward = pnl / 10.0  # Use simple PnL reward initially
        
        # Add hedge accuracy component
        reward = sharpe_reward - hedge_error * 3.0
        
        return reward
        
    def reset(self):
        """Reset history for new episode"""
        self.returns_history = []


class VariancePenalizedReward(BaseReward):
    """
    Variance-Penalized Reward
    
    Encourages stable hedging by penalizing high variance in hedge ratios.
    
    Args:
        variance_penalty: Weight for variance penalty
        window: Rolling window for variance calculation
    """
    
    def __init__(
        self,
        variance_penalty: float = 0.5,
        window: int = 20
    ):
        self.variance_penalty = variance_penalty
        self.window = window
        self.hedge_history = []
        
    def calculate(self, pnl: float, hedge_error: float, **kwargs) -> float:
        """Calculate variance-penalized reward"""
        hedge_ratio = kwargs.get('hedge_ratio', 0.0)
        
        # Update history
        self.hedge_history.append(hedge_ratio)
        if len(self.hedge_history) > self.window:
            self.hedge_history.pop(0)
        
        # PnL component
        pnl_reward = pnl / 10.0
        
        # Variance penalty
        if len(self.hedge_history) >= 5:
            hedge_variance = np.var(self.hedge_history)
            variance_penalty = -self.variance_penalty * hedge_variance
        else:
            variance_penalty = 0.0
        
        # Combined reward
        reward = pnl_reward + variance_penalty - hedge_error * 3.0
        
        return reward
        
    def reset(self):
        """Reset history for new episode"""
        self.hedge_history = []


class CompositeReward(BaseReward):
    """
    Composite Reward Function
    
    Combines multiple reward functions with weights.
    
    Args:
        reward_functions: List of (reward_fn, weight) tuples
    """
    
    def __init__(self, reward_functions: List[tuple]):
        """
        Initialize composite reward
        
        Example:
            CompositeReward([
                (AsymmetricReward(), 0.5),
                (CVaRReward(), 0.3),
                (VariancePenalizedReward(), 0.2)
            ])
        """
        self.reward_functions = reward_functions
        
        # Normalize weights
        total_weight = sum(weight for _, weight in reward_functions)
        self.reward_functions = [
            (fn, weight / total_weight)
            for fn, weight in reward_functions
        ]
        
    def calculate(self, pnl: float, hedge_error: float, **kwargs) -> float:
        """Calculate weighted composite reward"""
        total_reward = 0.0
        
        for reward_fn, weight in self.reward_functions:
            reward = reward_fn.calculate(pnl, hedge_error, **kwargs)
            total_reward += weight * reward
        
        return total_reward
        
    def reset(self):
        """Reset all component reward functions"""
        for reward_fn, _ in self.reward_functions:
            if hasattr(reward_fn, 'reset'):
                reward_fn.reset()


# ==================== Example Usage ====================

if __name__ == "__main__":
    print("="*80)
    print("ALTERNATIVE REWARD FUNCTIONS - EXAMPLES")
    print("="*80)
    
    # Simulate episode PnLs
    np.random.seed(42)
    pnls = np.random.randn(100) * 10  # Random PnLs
    hedge_errors = np.abs(np.random.randn(100) * 0.1)  # Random hedge errors
    
    # Test different reward functions
    reward_functions = {
        'Standard': StandardReward(),
        'Asymmetric (2x loss penalty)': AsymmetricReward(loss_multiplier=2.0),
        'CVaR (5%)': CVaRReward(alpha=0.05, lambda_cvar=0.3),
        'Sharpe-based': SharpeReward(),
        'Variance-Penalized': VariancePenalizedReward()
    }
    
    # Calculate rewards for each function
    results = {name: [] for name in reward_functions}
    
    for pnl, hedge_error in zip(pnls, hedge_errors):
        for name, reward_fn in reward_functions.items():
            reward = reward_fn.calculate(pnl, hedge_error, hedge_ratio=0.5)
            results[name].append(reward)
    
    # Print statistics
    print("\n📊 Reward Function Comparison:\n")
    print(f"{'Reward Function':<30} {'Mean':<10} {'Std':<10} {'Min':<10} {'Max':<10}")
    print("-" * 70)
    
    for name, rewards in results.items():
        mean = np.mean(rewards)
        std = np.std(rewards)
        min_val = np.min(rewards)
        max_val = np.max(rewards)
        print(f"{name:<30} {mean:>9.2f} {std:>9.2f} {min_val:>9.2f} {max_val:>9.2f}")
    
    print("\n" + "="*80)
    print("✅ Example complete!")
    print("\nIntegration with Environment:")
    print("  1. Import desired reward function")
    print("  2. Pass to environment during initialization")
    print("  3. Call reward_fn.calculate() in env.step()")
    print("  4. Reset with reward_fn.reset() in env.reset()")
