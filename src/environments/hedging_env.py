"""
Gymnasium-compatible environment for option hedging.

This environment simulates the hedging of a European option portfolio
using the underlying asset. The agent learns to minimize hedging error
while managing transaction costs.
"""

from typing import Dict, Optional, Tuple, Any

import gymnasium as gym
import numpy as np
from gymnasium import spaces

from src.pricing.black_scholes import BlackScholesModel


class OptionHedgingEnv(gym.Env):
    """
    Gymnasium environment for hedging European options.
    
    The agent holds a short position in an option and must hedge using
    the underlying asset. The environment simulates price dynamics and
    calculates hedging performance.
    
    State Space:
        - Stock price (S)
        - Strike price (K)
        - Time to maturity (T)
        - Volatility (sigma)
        - Risk-free rate (r)
        - Current hedge position
        - Option delta
        - Option gamma
        - Option vega
        - Cumulative PnL
        - Remaining steps
    
    Action Space:
        - Continuous: Target hedge ratio in [-2, 2]
        - Discrete: Adjust hedge by {-0.5, -0.1, 0, +0.1, +0.5}
    
    Reward:
        - Negative of: hedging_error + transaction_costs + penalty_terms
    """
    
    metadata = {"render_modes": ["human", "rgb_array"], "render_fps": 4}
    
    def __init__(
        self,
        S0: float = 100.0,
        K: float = 100.0,
        T: float = 1.0,
        r: float = 0.05,
        sigma: float = 0.2,
        n_steps: int = 252,
        option_type: str = "call",
        action_mode: str = "continuous",
        transaction_cost: float = 0.001,
        risk_penalty: float = 0.1,
        render_mode: Optional[str] = None,
    ):
        """
        Initialize the hedging environment.
        
        Args:
            S0: Initial stock price
            K: Strike price
            T: Time to maturity (years)
            r: Risk-free rate
            sigma: Volatility
            n_steps: Number of hedging steps
            option_type: 'call' or 'put'
            action_mode: 'continuous' or 'discrete'
            transaction_cost: Cost per unit of transaction (fraction)
            risk_penalty: Penalty for hedging error variance
            render_mode: Rendering mode
        """
        super().__init__()
        
        # Validate inputs
        if option_type not in ["call", "put"]:
            raise ValueError(f"option_type must be 'call' or 'put', got '{option_type}'")
        if action_mode not in ["continuous", "discrete"]:
            raise ValueError(f"action_mode must be 'continuous' or 'discrete', got '{action_mode}'")
        
        # Environment parameters
        self.S0 = S0
        self.K = K
        self.T = T
        self.r = r
        self.sigma = sigma
        self.n_steps = n_steps
        self.dt = T / n_steps
        self.option_type = option_type
        self.action_mode = action_mode
        self.transaction_cost = transaction_cost
        self.risk_penalty = risk_penalty
        self.render_mode = render_mode
        
        # Initialize pricing model
        self.bs_model = BlackScholesModel()
        
        # Define action space
        if action_mode == "continuous":
            # Target hedge ratio (can go long or short)
            self.action_space = spaces.Box(
                low=-2.0, high=2.0, shape=(1,), dtype=np.float32
            )
        else:  # discrete
            # 5 actions: large decrease, small decrease, hold, small increase, large increase
            self.action_space = spaces.Discrete(5)
            self.discrete_actions = np.array([-0.5, -0.1, 0.0, 0.1, 0.5])
        
        # Define observation space
        # [S, K, tau, sigma, r, position, delta, gamma, vega, pnl, steps_remaining]
        self.observation_space = spaces.Box(
            low=np.array([0, 0, 0, 0, -0.5, -2, -2, -10, -10, -1e6, 0]),
            high=np.array([1e6, 1e6, 10, 2, 0.5, 2, 2, 10, 10, 1e6, n_steps]),
            dtype=np.float32,
        )
        
        # State variables
        self.current_step = 0
        self.S = S0
        self.position = 0.0  # Hedge position in units of stock
        self.option_position = -1.0  # Short one option
        self.cash = 0.0
        self.pnl = 0.0
        self.total_transaction_costs = 0.0
        self.history = []
        
    def reset(
        self,
        seed: Optional[int] = None,
        options: Optional[dict] = None,
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Reset the environment to initial state.
        
        Args:
            seed: Random seed
            options: Additional reset options
        
        Returns:
            observation: Initial state
            info: Additional information
        """
        super().reset(seed=seed)
        
        # Reset state
        self.current_step = 0
        self.S = self.S0
        self.position = 0.0
        self.cash = 0.0
        self.pnl = 0.0
        self.total_transaction_costs = 0.0
        self.history = []
        
        # Initialize tracking lists
        self.price_history = [self.S0]
        self.position_history = [0.0]
        self.pnl_history = []
        
        # Calculate initial option value
        tau = self.T
        option_value = self.bs_model.price(
            S=self.S, K=self.K, T=tau, r=self.r, sigma=self.sigma, option_type=self.option_type
        )
        
        # Receive premium for selling option
        self.cash = option_value
        
        observation = self._get_obs()
        info = self._get_info()
        
        return observation, info
    
    def step(self, action: np.ndarray) -> Tuple[np.ndarray, float, bool, bool, Dict[str, Any]]:
        """
        Execute one step in the environment.
        
        Args:
            action: Hedge adjustment action
        
        Returns:
            observation: Next state
            reward: Reward signal
            terminated: Episode termination flag
            truncated: Episode truncation flag
            info: Additional information
        """
        # Parse action
        if self.action_mode == "continuous":
            target_position = float(action[0])
        else:
            target_position = self.position + self.discrete_actions[action]
        
        # Clip target position to action space bounds
        target_position = np.clip(target_position, -2.0, 2.0)
        
        # Calculate trade size
        trade_size = target_position - self.position
        
        # Apply transaction costs
        transaction_cost = abs(trade_size) * self.S * self.transaction_cost
        self.total_transaction_costs += transaction_cost
        
        # Execute trade
        self.cash -= trade_size * self.S + transaction_cost
        self.position = target_position
        
        # Simulate stock price dynamics (GBM) using seeded RNG
        dW = self.np_random.normal(0, np.sqrt(self.dt))
        self.S = self.S * np.exp(
            (self.r - 0.5 * self.sigma ** 2) * self.dt + self.sigma * dW
        )
        
        # Update cash with risk-free rate
        self.cash *= np.exp(self.r * self.dt)
        
        # Move to next step
        self.current_step += 1
        tau = self.T - self.current_step * self.dt
        
        # Calculate current portfolio value
        if tau > 0:
            option_value = self.bs_model.price(
                S=self.S, K=self.K, T=tau, r=self.r, sigma=self.sigma, option_type=self.option_type
            )
        else:
            # At maturity, option payoff
            if self.option_type == "call":
                option_value = max(self.S - self.K, 0)
            else:
                option_value = max(self.K - self.S, 0)
        
        # Portfolio value = cash + stock position - option liability
        portfolio_value = self.cash + self.position * self.S - option_value
        
        # Calculate PnL (relative to initial premium received)
        initial_premium = self.bs_model.price(
            S=self.S0, K=self.K, T=self.T, r=self.r, sigma=self.sigma, option_type=self.option_type
        )
        self.pnl = portfolio_value - initial_premium
        
        # Calculate reward
        reward = self._calculate_reward(tau, option_value)
        
        # Check if episode is done
        terminated = self.current_step >= self.n_steps
        truncated = False
        
        # Store history
        self.history.append({
            "step": self.current_step,
            "S": self.S,
            "position": self.position,
            "cash": self.cash,
            "pnl": self.pnl,
            "option_value": option_value,
            "transaction_cost": transaction_cost,
        })
        
        # Update tracking lists
        self.price_history.append(self.S)
        self.position_history.append(self.position)
        self.pnl_history.append(self.pnl)
        
        observation = self._get_obs()
        info = self._get_info()
        
        # Add final PnL when episode terminates
        if terminated:
            info["final_pnl"] = self.pnl
        
        return observation, reward, terminated, truncated, info
    
    def _calculate_reward(self, tau: float, option_value: float) -> float:
        """
        Calculate reward based on hedging performance.
        
        Args:
            tau: Time to maturity
            option_value: Current option value
        
        Returns:
            reward: Reward value
        """
        # Calculate Greeks for hedging error
        if tau > 0:
            greeks = self.bs_model.greeks(
                S=self.S, K=self.K, T=tau, r=self.r, sigma=self.sigma, option_type=self.option_type
            )
            delta = greeks["delta"]
            
            # Hedging error: difference between actual position and delta hedge
            hedging_error = abs(self.position - delta)
        else:
            hedging_error = abs(self.position)  # Should be flat at maturity
        
        # Reward components
        hedging_penalty = -hedging_error * self.risk_penalty
        cost_penalty = -self.total_transaction_costs * 0.1
        
        # Terminal reward: final PnL
        if self.current_step >= self.n_steps:
            terminal_reward = self.pnl
        else:
            terminal_reward = 0.0
        
        reward = hedging_penalty + cost_penalty + terminal_reward
        
        return reward
    
    def _get_obs(self) -> np.ndarray:
        """
        Get current observation.
        
        Returns:
            observation: State vector
        """
        tau = max(self.T - self.current_step * self.dt, 0.0)
        
        # Calculate Greeks
        if tau > 0:
            greeks = self.bs_model.greeks(
                S=self.S, K=self.K, T=tau, r=self.r, sigma=self.sigma, option_type=self.option_type
            )
            delta = greeks["delta"]
            gamma = greeks["gamma"]
            vega = greeks["vega"]
        else:
            delta = 0.0
            gamma = 0.0
            vega = 0.0
        
        obs = np.array([
            self.S / self.K,  # Normalized stock price
            1.0,  # Normalized strike (always 1 after normalization)
            tau,
            self.sigma,
            self.r,
            self.position,
            delta,
            gamma,
            vega / 100,  # Scale vega
            self.pnl / self.S0,  # Normalized PnL
            self.n_steps - self.current_step,
        ], dtype=np.float32)
        
        return obs
    
    def _get_info(self) -> Dict[str, Any]:
        """
        Get additional information.
        
        Returns:
            info: Dictionary with extra info
        """
        tau = max(self.T - self.current_step * self.dt, 0.0)
        
        if tau > 0:
            greeks = self.bs_model.greeks(
                S=self.S, K=self.K, T=tau, r=self.r, sigma=self.sigma, option_type=self.option_type
            )
        else:
            greeks = {"delta": 0.0, "gamma": 0.0, "vega": 0.0, "theta": 0.0, "rho": 0.0}
        
        info = {
            "step": self.current_step,
            "S": self.S,
            "S0": self.S0,
            "K": self.K,
            "T": self.T,
            "tau": tau,
            "position": self.position,
            "cash": self.cash,
            "pnl": self.pnl,
            "total_costs": self.total_transaction_costs,
            "greeks": greeks,
        }
        
        return info
    
    def render(self):
        """Render the environment."""
        if self.render_mode == "human":
            print(f"Step {self.current_step}/{self.n_steps}")
            print(f"Stock Price: {self.S:.2f}")
            print(f"Position: {self.position:.3f}")
            print(f"PnL: {self.pnl:.2f}")
            print(f"Transaction Costs: {self.total_transaction_costs:.2f}")
            print("-" * 50)
    
    def close(self):
        """Close the environment."""
        pass
    
    def get_episode_metrics(self) -> Dict[str, float]:
        """
        Calculate episode performance metrics.
        
        Returns:
            metrics: Dictionary of performance metrics
        """
        if not self.history:
            return {}
        
        pnl_series = np.array([h["pnl"] for h in self.history])
        
        # Calculate average position
        if self.position_history:
            avg_position = np.mean(np.abs(self.position_history))
        else:
            avg_position = 0.0
        
        metrics = {
            "total_pnl": self.pnl,
            "final_pnl": self.pnl,
            "total_costs": self.total_transaction_costs,
            "net_pnl": self.pnl - self.total_transaction_costs,
            "mean_abs_pnl": np.mean(np.abs(pnl_series)),
            "std_pnl": np.std(pnl_series),
            "max_drawdown": np.min(pnl_series),
            "sharpe_ratio": np.mean(pnl_series) / (np.std(pnl_series) + 1e-8),
            "num_trades": len([h for h in self.history if h["transaction_cost"] > 0]),
            "num_rebalances": len([h for h in self.history if h["transaction_cost"] > 0]),
            "avg_position": avg_position,
        }
        
        return metrics
