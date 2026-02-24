"""
Real Data Hedging Environment

Uses actual historical market data for option hedging simulation.
"""

import gymnasium as gym
import numpy as np
import pandas as pd
from typing import Dict, Optional, Tuple, List
from pathlib import Path

from src.pricing.black_scholes import BlackScholesModel
from src.data.historical_loader import HistoricalDataLoader


class RealDataHedgingEnv(gym.Env):
    """
    Option hedging environment using real historical market data.
    
    This environment replays actual market conditions from historical data,
    providing more realistic training scenarios than synthetic data.
    """
    
    metadata = {"render_modes": ["human"]}
    
    def __init__(
        self,
        data_episodes: Optional[List[pd.DataFrame]] = None,
        data_dir: str = "data/processed",
        n_episodes: int = 100,
        episode_length: int = 100,
        strike: float = 400.0,
        initial_option_position: float = -1.0,
        transaction_cost: float = 0.001,
        seed: Optional[int] = None,
        use_vix_for_volatility: bool = True,
    ):
        """
        Initialize the real data hedging environment.
        
        Args:
            data_episodes: Pre-loaded list of DataFrames (one per episode)
            data_dir: Directory with processed data (if data_episodes not provided)
            n_episodes: Number of episodes to generate (if data_episodes not provided)
            episode_length: Length of each episode in days
            strike: Option strike price
            initial_option_position: Initial option position (-1 = short 1 contract)
            transaction_cost: Transaction cost as fraction of trade value
            seed: Random seed for reproducibility
            use_vix_for_volatility: Use VIX for implied volatility, else use realized vol
        """
        super().__init__()
        
        self.data_dir = data_dir
        self.episode_length = episode_length
        self.strike = strike
        self.initial_option_position = initial_option_position
        self.transaction_cost = transaction_cost
        self.use_vix_for_volatility = use_vix_for_volatility
        self.seed = seed
        
        # Load or use provided data
        if data_episodes is not None:
            self.data_episodes = data_episodes
            print(f"✓ Using {len(data_episodes)} pre-loaded episodes")
        else:
            print(f"📊 Loading historical market data from {data_dir}...")
            loader = HistoricalDataLoader(data_dir)
            self.data_episodes = loader.get_random_episodes(
                n_episodes=n_episodes,
                episode_length=episode_length,
                seed=seed
            )
            print(f"✓ Generated {len(self.data_episodes)} episodes from historical data")
        
        # Validate episodes
        if len(self.data_episodes) == 0:
            raise ValueError("No data episodes provided")
        
        # Current episode tracking
        self.current_episode_idx = 0
        self.current_step = 0
        self.current_episode_data = None
        
        # State variables
        self.current_hedge = 0.0
        self.cumulative_pnl = 0.0
        self.cumulative_cost = 0.0
        
        # Define observation and action spaces
        # Observation: [spot_price, moneyness, time_to_maturity, volatility, 
        #               returns, current_hedge, risk_free_rate, vix]
        self.observation_space = gym.spaces.Box(
            low=-np.inf, high=np.inf, shape=(8,), dtype=np.float32
        )
        
        # Action: target hedge ratio [-2, 2]
        self.action_space = gym.spaces.Box(
            low=-2.0, high=2.0, shape=(1,), dtype=np.float32
        )
    
    def reset(
        self,
        seed: Optional[int] = None,
        options: Optional[dict] = None,
    ) -> Tuple[np.ndarray, Dict]:
        """Reset to a new episode."""
        super().reset(seed=seed)
        
        if seed is not None:
            self.np_random = np.random.default_rng(seed)
        
        # Select next episode (cycle through episodes)
        self.current_episode_data = self.data_episodes[self.current_episode_idx]
        self.current_episode_idx = (self.current_episode_idx + 1) % len(self.data_episodes)
        
        # Reset state
        self.current_step = 0
        self.current_hedge = 0.0
        self.cumulative_pnl = 0.0
        self.cumulative_cost = 0.0
        
        # Get initial observation
        obs = self._get_observation()
        info = self._get_info()
        
        return obs, info
    
    def step(self, action: np.ndarray) -> Tuple[np.ndarray, float, bool, bool, Dict]:
        """Execute one step in the environment."""
        if self.current_episode_data is None:
            raise RuntimeError("Must call reset() before step()")
        
        # Get current and next market data
        current_row = self.current_episode_data.iloc[self.current_step]
        
        # Extract action (target hedge ratio)
        target_hedge = float(action[0])
        target_hedge = np.clip(target_hedge, -2.0, 2.0)
        
        # Calculate hedge adjustment
        hedge_adjustment = target_hedge - self.current_hedge
        
        # Get current spot price and volatility
        spot_price = current_row['SPY_Close']
        
        if self.use_vix_for_volatility:
            volatility = current_row['VIX'] / 100.0  # VIX is in percentage
        else:
            volatility = current_row.get('SPY_volatility_20', 0.20)
        
        risk_free_rate = current_row.get('risk_free_rate', 0.05)
        
        # Calculate time to maturity (decreasing linearly)
        initial_ttm = self.episode_length / 252.0  # Convert days to years
        time_to_maturity = max(0.01, initial_ttm - (self.current_step / 252.0))
        
        # Calculate option value
        option_value = BlackScholesModel.price(
            S=spot_price,
            K=self.strike,
            T=time_to_maturity,
            r=risk_free_rate,
            sigma=volatility,
            option_type='call'
        )
        
        # Calculate transaction cost
        transaction_cost = abs(hedge_adjustment) * spot_price * self.transaction_cost
        
        # Move to next step
        self.current_step += 1
        is_terminal = self.current_step >= len(self.current_episode_data) - 1
        
        # Calculate reward (PnL from hedge - transaction cost)
        if is_terminal:
            # Final payoff
            next_row = self.current_episode_data.iloc[self.current_step]
            final_spot = next_row['SPY_Close']
            
            # Option payoff (we are short the option)
            option_payoff = -max(final_spot - self.strike, 0) * self.initial_option_position
            
            # Hedge P&L
            spot_change = final_spot - spot_price
            hedge_pnl = target_hedge * spot_change
            
            # Total reward
            reward = option_payoff + hedge_pnl - transaction_cost
        else:
            # Intermediate step: reward based on hedge effectiveness
            next_row = self.current_episode_data.iloc[self.current_step]
            next_spot = next_row['SPY_Close']
            
            # Spot change
            spot_change = next_spot - spot_price
            
            # Option value change (we are short)
            next_vol = next_row['VIX'] / 100.0 if self.use_vix_for_volatility else next_row.get('SPY_volatility_20', 0.20)
            next_ttm = max(0.01, initial_ttm - (self.current_step / 252.0))
            next_option_value = BlackScholesModel.price(
                S=next_spot,
                K=self.strike,
                T=next_ttm,
                r=risk_free_rate,
                sigma=next_vol,
                option_type='call'
            )
            
            option_pnl = -(next_option_value - option_value) * self.initial_option_position
            
            # Hedge P&L  
            hedge_pnl = self.current_hedge * spot_change
            
            # Total reward
            reward = option_pnl + hedge_pnl - transaction_cost
        
        # Update cumulative metrics
        self.cumulative_pnl += reward
        self.cumulative_cost += transaction_cost
        
        # Update hedge position
        self.current_hedge = target_hedge
        
        # Get next observation
        obs = self._get_observation()
        info = self._get_info()
        info['transaction_cost'] = transaction_cost
        info['hedge_adjustment'] = hedge_adjustment
        
        return obs, reward, is_terminal, False, info
    
    def _get_observation(self) -> np.ndarray:
        """Get current observation."""
        if self.current_step >= len(self.current_episode_data):
            self.current_step = len(self.current_episode_data) - 1
        
        row = self.current_episode_data.iloc[self.current_step]
        
        spot_price = row['SPY_Close']
        moneyness = spot_price / self.strike
        
        initial_ttm = self.episode_length / 252.0
        time_to_maturity = max(0.01, initial_ttm - (self.current_step / 252.0))
        
        if self.use_vix_for_volatility:
            volatility = row['VIX'] / 100.0
        else:
            volatility = row.get('SPY_volatility_20', 0.20)
        
        returns = row.get('SPY_returns', 0.0)
        risk_free_rate = row.get('risk_free_rate', 0.05)
        vix = row['VIX']
        
        obs = np.array([
            spot_price / 100.0,  # Normalize around 100
            moneyness,
            time_to_maturity,
            volatility,
            returns,
            self.current_hedge,
            risk_free_rate,
            vix / 100.0  # Normalize VIX
        ], dtype=np.float32)
        
        return obs
    
    def _get_info(self) -> Dict:
        """Get additional information."""
        row = self.current_episode_data.iloc[self.current_step]
        
        return {
            'step': self.current_step,
            'spot_price': row['SPY_Close'],
            'current_hedge': self.current_hedge,
            'cumulative_pnl': self.cumulative_pnl,
            'cumulative_cost': self.cumulative_cost,
            'date': row.get('Date', 'N/A'),
            'episode_idx': self.current_episode_idx,
        }
    
    def render(self):
        """Render the environment state."""
        if self.current_episode_data is None:
            print("Environment not initialized. Call reset() first.")
            return
        
        row = self.current_episode_data.iloc[self.current_step]
        print(f"Step: {self.current_step}/{len(self.current_episode_data)-1}")
        print(f"Date: {row.get('Date', 'N/A')}")
        print(f"Spot: ${row['SPY_Close']:.2f}")
        print(f"VIX: {row['VIX']:.2f}")
        print(f"Hedge: {self.current_hedge:.4f}")
        print(f"Cumulative PnL: ${self.cumulative_pnl:.2f}")
        print("-" * 50)


def create_real_data_env(
    difficulty: str = "medium",
    data_dir: str = "data/processed",
    **kwargs
) -> RealDataHedgingEnv:
    """
    Create a real data environment with preset difficulty.
    
    Args:
        difficulty: One of "easy", "medium", "hard", "realistic"
        data_dir: Directory with processed data
        **kwargs: Additional arguments to pass to RealDataHedgingEnv
        
    Returns:
        Configured RealDataHedgingEnv
    """
    # Difficulty presets (mainly affects transaction costs and episode length)
    configs = {
        "easy": {
            "transaction_cost": 0.0005,  # 0.05%
            "episode_length": 60,
            "strike": 400.0,
        },
        "medium": {
            "transaction_cost": 0.001,  # 0.1%
            "episode_length": 100,
            "strike": 400.0,
        },
        "hard": {
            "transaction_cost": 0.002,  # 0.2%
            "episode_length": 120,
            "strike": 400.0,
        },
        "realistic": {
            "transaction_cost": 0.0015,  # 0.15%
            "episode_length": 100,
            "strike": 400.0,
        },
    }
    
    if difficulty not in configs:
        raise ValueError(f"Unknown difficulty: {difficulty}. Choose from {list(configs.keys())}")
    
    config = configs[difficulty]
    config.update(kwargs)
    config['data_dir'] = data_dir
    
    return RealDataHedgingEnv(**config)


if __name__ == "__main__":
    # Demo usage
    print("=" * 80)
    print("Real Data Hedging Environment Demo")
    print("=" * 80)
    
    # Create environment
    env = create_real_data_env(difficulty="medium", n_episodes=5)
    
    print("\nRunning one episode with random actions...")
    obs, info = env.reset(seed=42)
    print(f"Initial observation shape: {obs.shape}")
    print(f"Initial info: {info}")
    
    total_reward = 0
    for step in range(10):
        # Random action
        action = env.action_space.sample()
        obs, reward, terminated, truncated, info = env.step(action)
        
        total_reward += reward
        
        if step % 5 == 0:
            print(f"\nStep {step}: Reward={reward:.2f}, Cumulative PnL={info['cumulative_pnl']:.2f}")
        
        if terminated or truncated:
            break
    
    print(f"\nEpisode finished!")
    print(f"Total reward: {total_reward:.2f}")
    print("\n✓ Demo complete!")
