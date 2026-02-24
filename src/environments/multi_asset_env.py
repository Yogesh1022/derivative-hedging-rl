"""
Multi-Asset Option Hedging Environment

Trains a single RL agent across multiple underlying assets (SPY, AAPL, QQQ) 
for improved generalization and cross-asset transferability.

Key Benefits:
- Better generalization across different market conditions
- Reduced overfitting to single asset dynamics
- Transfer learning capabilities
- More robust policy
"""

import gymnasium as gym
from gymnasium import spaces
import numpy as np
from typing import Optional, Dict, List
import pandas as pd


class MultiAssetHedgingEnv(gym.Env):
    """
    Multi-Asset Option Hedging Environment
    
    Observation Space:
        - Asset-specific features (price, volatility, Greeks) for current asset
        - Market regime indicators
        - Cross-asset correlations
        - Asset identifier (one-hot encoded)
        
    Action Space:
        - Continuous: hedge ratio [-2, 2]
        
    Reward:
        - Risk-adjusted PnL with transaction costs
        - Penalty for excessive hedging
    """
    
    metadata = {"render_modes": ["human"]}
    
    def __init__(
        self,
        assets: List[str] = ["SPY", "AAPL", "QQQ"],
        n_steps: int = 252,  # 1 year
        initial_price: float = 100.0,
        strike: float = 100.0,
        volatility: float = 0.20,
        risk_free_rate: float = 0.05,
        transaction_cost: float = 0.001,
        data_path: Optional[str] = None
    ):
        super().__init__()
        
        self.assets = assets
        self.n_assets = len(assets)
        self.n_steps = n_steps
        self.current_step = 0
        
        # Asset-specific parameters
        self.asset_data = {}
        for asset in assets:
            self.asset_data[asset] = {
                'S0': initial_price,
                'K': strike,
                'sigma': volatility,
                'r': risk_free_rate
            }
        
        self.transaction_cost = transaction_cost
        self.current_asset = None
        self.current_asset_idx = 0
        
        # Load historical data if provided
        self.historical_data = {}
        if data_path:
            self.load_historical_data(data_path)
        
        # Observation space
        # [S, K, T, sigma, delta, gamma, vega, theta, 
        #  moneyness, vol_rank, asset_one_hot (n_assets), 
        #  prev_hedge_ratio, portfolio_value]
        obs_dim = 9 + self.n_assets + 2  # Base features + asset one-hot + portfolio features
        self.observation_space = spaces.Box(
            low=-np.inf,
            high=np.inf,
            shape=(obs_dim,),
            dtype=np.float32
        )
        
        # Action space: hedge ratio
        self.action_space = spaces.Box(
            low=-2.0,
            high=2.0,
            shape=(1,),
            dtype=np.float32
        )
        
        # State variables
        self.S = None
        self.K = None
        self.T_remaining = None
        self.sigma = None
        self.r = None
        self.prev_hedge_ratio = 0.0
        self.portfolio_value = 0.0
        self.total_costs = 0.0
        
    def load_historical_data(self, data_path: str):
        """Load historical data for all assets"""
        import os
        for asset in self.assets:
            asset_file = os.path.join(data_path, f"{asset}.csv")
            if os.path.exists(asset_file):
                self.historical_data[asset] = pd.read_csv(asset_file, index_col=0, parse_dates=True)
                
    def select_asset(self):
        """Randomly select an asset for this episode"""
        self.current_asset_idx = np.random.randint(0, self.n_assets)
        self.current_asset = self.assets[self.current_asset_idx]
        
        # Get asset-specific parameters
        asset_params = self.asset_data[self.current_asset]
        self.S = asset_params['S0']
        self.K = asset_params['K']
        self.sigma = asset_params['sigma']
        self.r = asset_params['r']
        
    def reset(self, seed: Optional[int] = None, options: Optional[dict] = None):
        """Reset environment for new episode"""
        super().reset(seed=seed)
        
        # Select random asset
        self.select_asset()
        
        # Reset episode variables
        self.current_step = 0
        self.T_remaining = self.n_steps
        self.prev_hedge_ratio = 0.0
        self.portfolio_value = 0.0
        self.total_costs = 0.0
        
        # If using historical data, sample random starting point
        if self.current_asset in self.historical_data:
            df = self.historical_data[self.current_asset]
            if len(df) > self.n_steps:
                start_idx = np.random.randint(0, len(df) - self.n_steps)
                self.data_slice = df.iloc[start_idx:start_idx + self.n_steps].copy()
                self.S = self.data_slice.iloc[0]['Close']
                self.sigma = self.data_slice.iloc[0].get('Volatility_20', self.sigma)
        
        obs = self._get_observation()
        info = self._get_info()
        
        return obs, info
        
    def step(self, action):
        """Execute one time step"""
        hedge_ratio = float(action[0])
        hedge_ratio = np.clip(hedge_ratio, -2.0, 2.0)
        
        # Calculate transaction cost
        position_change = abs(hedge_ratio - self.prev_hedge_ratio)
        transaction_cost = self.transaction_cost * position_change * self.S
        self.total_costs += transaction_cost
        
        # Simulate price movement
        if self.current_asset in self.historical_data and hasattr(self, 'data_slice'):
            # Use historical data
            if self.current_step < len(self.data_slice) - 1:
                self.S = self.data_slice.iloc[self.current_step + 1]['Close']
                self.sigma = self.data_slice.iloc[self.current_step + 1].get('Volatility_20', self.sigma)
        else:
            # Use GBM simulation
            dt = 1/252
            dW = np.random.normal(0, np.sqrt(dt))
            self.S = self.S * np.exp((self.r - 0.5 * self.sigma**2) * dt + self.sigma * dW)
        
        # Calculate Greeks
        delta = self.black_scholes_delta()
        gamma = self.black_scholes_gamma()
        
        # Calculate PnL (simplified)
        # PnL = delta_hedge_error * price_move - transaction_costs
        hedge_error = abs(delta - hedge_ratio)
        pnl = -hedge_error * abs(self.S - self.K) - transaction_cost
        
        # Update portfolio
        self.portfolio_value += pnl
        self.prev_hedge_ratio = hedge_ratio
        
        # Update time
        self.current_step += 1
        self.T_remaining = self.n_steps - self.current_step
        
        # Calculate reward
        reward = self._calculate_reward(pnl, hedge_error, position_change)
        
        # Check termination
        terminated = self.T_remaining <= 0
        truncated = False
        
        obs = self._get_observation()
        info = self._get_info()
        info.update({
            'pnl': pnl,
            'transaction_cost': transaction_cost,
            'hedge_ratio': hedge_ratio,
            'hedge_error': hedge_error,
            'asset': self.current_asset
        })
        
        return obs, reward, terminated, truncated, info
        
    def _get_observation(self):
        """Construct observation vector"""
        # Calculate Greeks
        delta = self.black_scholes_delta()
        gamma = self.black_scholes_gamma()
        vega = self.black_scholes_vega()
        theta = self.black_scholes_theta()
        
        # Additional features
        moneyness = self.S / self.K
        time_to_maturity = self.T_remaining / self.n_steps
        vol_rank = (self.sigma - 0.15) / 0.25  # Normalize around typical vol
        
        # Asset one-hot encoding
        asset_onehot = np.zeros(self.n_assets)
        asset_onehot[self.current_asset_idx] = 1.0
        
        obs = np.array([
            self.S / 100.0,  # Normalized price
            self.K / 100.0,  # Normalized strike
            time_to_maturity,
            self.sigma,
            delta,
            gamma * 100,  # Scale gamma
            vega / 100,  # Scale vega
            theta,
            moneyness,
            vol_rank,
            *asset_onehot,  # Asset identifier
            self.prev_hedge_ratio,
            self.portfolio_value / 1000.0  # Normalized portfolio value
        ], dtype=np.float32)
        
        return obs
        
    def _calculate_reward(self, pnl, hedge_error, position_change):
        """Calculate reward"""
        # Multi-component reward
        # 1. PnL component
        pnl_reward = pnl / 10.0  # Scale
        
        # 2. Hedge accuracy component
        accuracy_reward = -hedge_error * 5.0
        
        # 3. Transaction cost penalty
        cost_penalty = -position_change * 2.0
        
        # 4. Stability bonus (reward low hedge volatility)
        if position_change < 0.1:
            stability_bonus = 0.5
        else:
            stability_bonus = 0.0
        
        total_reward = pnl_reward + accuracy_reward + cost_penalty + stability_bonus
        
        return total_reward
        
    def _get_info(self):
        """Get environment info"""
        return {
            'asset': self.current_asset,
            'step': self.current_step,
            'portfolio_value': self.portfolio_value,
            'total_costs': self.total_costs,
            'current_price': self.S,
            'time_to_maturity': self.T_remaining / self.n_steps
        }
        
    # ==================== Greek Calculations ====================
    
    def black_scholes_delta(self):
        """Calculate Black-Scholes delta"""
        from scipy.stats import norm
        T = self.T_remaining / 252
        if T <= 0:
            return 1.0 if self.S > self.K else 0.0
        d1 = (np.log(self.S / self.K) + (self.r + 0.5 * self.sigma**2) * T) / (self.sigma * np.sqrt(T))
        return norm.cdf(d1)
        
    def black_scholes_gamma(self):
        """Calculate Black-Scholes gamma"""
        from scipy.stats import norm
        T = self.T_remaining / 252
        if T <= 0:
            return 0.0
        d1 = (np.log(self.S / self.K) + (self.r + 0.5 * self.sigma**2) * T) / (self.sigma * np.sqrt(T))
        return norm.pdf(d1) / (self.S * self.sigma * np.sqrt(T))
        
    def black_scholes_vega(self):
        """Calculate Black-Scholes vega"""
        from scipy.stats import norm
        T = self.T_remaining / 252
        if T <= 0:
            return 0.0
        d1 = (np.log(self.S / self.K) + (self.r + 0.5 * self.sigma**2) * T) / (self.sigma * np.sqrt(T))
        return self.S * norm.pdf(d1) * np.sqrt(T)
        
    def black_scholes_theta(self):
        """Calculate Black-Scholes theta"""
        from scipy.stats import norm
        T = self.T_remaining / 252
        if T <= 0:
            return 0.0
        d1 = (np.log(self.S / self.K) + (self.r + 0.5 * self.sigma**2) * T) / (self.sigma * np.sqrt(T))
        d2 = d1 - self.sigma * np.sqrt(T)
        theta = (
            -(self.S * norm.pdf(d1) * self.sigma) / (2 * np.sqrt(T))
            - self.r * self.K * np.exp(-self.r * T) * norm.cdf(d2)
        )
        return theta / 252  # Daily theta


# ==================== Gym Environment Registration ====================

try:
    from gymnasium.envs.registration import register
    
    register(
        id='MultiAssetHedging-v0',
        entry_point='src.environments.multi_asset_env:MultiAssetHedgingEnv',
        max_episode_steps=252,
    )
except:
    pass  # Already registered or gymnasium not available
