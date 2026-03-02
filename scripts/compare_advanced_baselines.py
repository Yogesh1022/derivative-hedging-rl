"""
Compare Advanced Baseline Models with RL Agents

Evaluates SABR, Local Vol, and RL agents on common test scenarios

Usage:
    python scripts/compare_advanced_baselines.py
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import logging
import sys
sys.path.append(str(Path(__file__).parent.parent))

from stable_baselines3 import SAC
from src.baselines.advanced_models import SABRHedging, LocalVolatilityHedging
from src.baselines.hedging_strategies import DeltaHedging, DeltaGammaHedging
from src.environments.hedging_env import OptionHedgingEnv

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class BaselineComparator:
    """Compare multiple hedging strategies"""
    
    def __init__(self, model_path: str = "models/sac/best_model.zip"):
        self.model_path = model_path
        self.results = {}
        
    def load_rl_model(self):
        """Load trained RL model"""
        logger.info(f"Loading RL model from {self.model_path}")
        try:
            self.rl_model = SAC.load(self.model_path)
            logger.info("✅ RL model loaded")
        except Exception as e:
            logger.warning(f"⚠️ Could not load RL model: {e}")
            self.rl_model = None
            
    def evaluate_strategy(
        self,
        strategy_name: str,
        n_episodes: int = 100,
        n_steps: int = 252
    ):
        """
        Evaluate a hedging strategy
        
        Args:
            strategy_name: Name of strategy (RL, SABR, LocalVol, Delta, DeltaGamma)
            n_episodes: Number of episodes to evaluate
            n_steps: Steps per episode
            
        Returns:
            DataFrame with results
        """
        logger.info(f"\n🔄 Evaluating {strategy_name} strategy...")
        
        # Create environment
        env = OptionHedgingEnv(n_steps=n_steps)
        
        # Initialize strategy-specific models
        if strategy_name == "SABR":
            sabr = SABRHedging(alpha=0.05, beta=0.5, rho=-0.3, nu=0.4)
        elif strategy_name == "Delta":
            delta_hedger = DeltaHedging()
        elif strategy_name == "DeltaGamma":
            dg_hedger = DeltaGammaHedging()
        
        episode_results = []
        
        for episode in range(n_episodes):
            obs, info = env.reset()
            episode_pnl = []
            episode_costs = []
            episode_hedges = []
            
            for step in range(n_steps):
                # Get action based on strategy
                if strategy_name == "RL" and self.rl_model is not None:
                    action, _ = self.rl_model.predict(obs, deterministic=True)
                    hedge_ratio = action[0]
                    
                elif strategy_name == "SABR":
                    # Extract env state
                    S = env.S
                    K = env.K
                    T = env.T_remaining / 252  # Convert to years
                    r = getattr(env, 'r', 0.05)
                    
                    hedge_result = sabr.compute_hedge(S, K, T, r)
                    hedge_ratio = hedge_result['hedge_ratio']
                    action = np.array([hedge_ratio])
                    
                elif strategy_name == "LocalVol":
                    # Simplified: use Black-Scholes delta as proxy
                    # In practice, would use calibrated local vol surface
                    S = env.S
                    K = env.K
                    T = env.T_remaining / 252
                    hedge_ratio = env.black_scholes_delta() if hasattr(env, 'black_scholes_delta') else 0.5
                    action = np.array([hedge_ratio])
                    
                elif strategy_name == "Delta":
                    hedge_ratio = env.black_scholes_delta() if hasattr(env, 'black_scholes_delta') else 0.5
                    action = np.array([hedge_ratio])
                    
                elif strategy_name == "DeltaGamma":
                    delta = env.black_scholes_delta() if hasattr(env, 'black_scholes_delta') else 0.5
                    gamma = env.black_scholes_gamma() if hasattr(env, 'black_scholes_gamma') else 0.01
                    hedge_ratio = delta + 0.5 * gamma * env.S if hasattr(env, 'S') else 0.5
                    action = np.array([hedge_ratio])
                    
                else:
                    action = np.array([0.5])  # Neutral
                
                # Step environment
                obs, reward, terminated, truncated, info = env.step(action)
                
                episode_pnl.append(info.get('pnl', 0))
                episode_costs.append(info.get('transaction_cost', 0))
                episode_hedges.append(hedge_ratio)
                
                if terminated or truncated:
                    break
            
            # Calculate episode metrics
            total_pnl = sum(episode_pnl)
            total_costs = sum(episode_costs)
            avg_hedge = np.mean(episode_hedges)
            hedge_volatility = np.std(episode_hedges)
            
            episode_results.append({
                'episode': episode,
                'total_pnl': total_pnl,
                'total_costs': total_costs,
                'net_pnl': total_pnl - total_costs,
                'avg_hedge_ratio': avg_hedge,
                'hedge_volatility': hedge_volatility,
                'num_steps': len(episode_pnl)
            })
        
        df = pd.DataFrame(episode_results)
        
        # Calculate aggregate metrics
        metrics = {
            'strategy': strategy_name,
            'mean_pnl': df['net_pnl'].mean(),
            'std_pnl': df['net_pnl'].std(),
            'sharpe': df['net_pnl'].mean() / df['net_pnl'].std() * np.sqrt(252) if df['net_pnl'].std() > 0 else 0,
            'max_pnl': df['net_pnl'].max(),
            'min_pnl': df['net_pnl'].min(),
            'win_rate': (df['net_pnl'] > 0).mean(),
            'avg_costs': df['total_costs'].mean(),
            'avg_hedge_vol': df['hedge_volatility'].mean()
        }
        
        # Sortino ratio
        downside_returns = df['net_pnl'][df['net_pnl'] < 0]
        downside_std = downside_returns.std() if len(downside_returns) > 0 else df['net_pnl'].std()
        metrics['sortino'] = df['net_pnl'].mean() / downside_std * np.sqrt(252) if downside_std > 0 else 0
        
        self.results[strategy_name] = {
            'df': df,
            'metrics': metrics
        }
        
        logger.info(f"✅ {strategy_name} evaluation complete")
        logger.info(f"   Mean PnL: ${metrics['mean_pnl']:.2f}")
        logger.info(f"   Sharpe: {metrics['sharpe']:.2f}")
        logger.info(f"   Win Rate: {metrics['win_rate']:.1%}")
        
        return df, metrics
        
    def compare_all(self, strategies: list = None):
        """Compare all strategies"""
        if strategies is None:
            strategies = ['RL', 'SABR', 'Delta', 'DeltaGamma']
        
        logger.info("\n" + "="*80)
        logger.info("🎯 COMPARING ADVANCED BASELINES")
        logger.info("="*80)
        
        for strategy in strategies:
            self.evaluate_strategy(strategy)
        
        self.print_comparison_table()
        self.plot_comparison()
        
    def print_comparison_table(self):
        """Print formatted comparison table"""
        logger.info("\n" + "="*80)
        logger.info("📊 PERFORMANCE COMPARISON")
        logger.info("="*80)
        
        # Create comparison DataFrame
        comparison_data = []
        for strategy, data in self.results.items():
            metrics = data['metrics']
            comparison_data.append({
                'Strategy': strategy,
                'Mean PnL': f"${metrics['mean_pnl']:.2f}",
                'Sharpe': f"{metrics['sharpe']:.2f}",
                'Sortino': f"{metrics['sortino']:.2f}",
                'Win Rate': f"{metrics['win_rate']:.1%}",
                'Avg Costs': f"${metrics['avg_costs']:.2f}",
                'Hedge Vol': f"{metrics['avg_hedge_vol']:.3f}"
            })
        
        df_comparison = pd.DataFrame(comparison_data)
        print("\n" + df_comparison.to_string(index=False))
        
        # Highlight best performers
        if 'RL' in self.results:
            logger.info("\n🎯 RL vs Baselines:")
            rl_sharpe = self.results['RL']['metrics']['sharpe']
            
            for strategy, data in self.results.items():
                if strategy != 'RL':
                    baseline_sharpe = data['metrics']['sharpe']
                    improvement = (rl_sharpe - baseline_sharpe) / baseline_sharpe * 100 if baseline_sharpe > 0 else 0
                    logger.info(f"   RL vs {strategy}: {improvement:+.1f}% Sharpe improvement")
        
        logger.info("\n" + "="*80)
        
    def plot_comparison(self, save_path: str = "test_output"):
        """Create comparison visualizations"""
        logger.info("\n📈 Creating comparison plots...")
        
        save_dir = Path(save_path)
        save_dir.mkdir(parents=True, exist_ok=True)
        
        fig, axes = plt.subplots(2, 3, figsize=(18, 10))
        
        # Plot 1: PnL Distribution
        ax = axes[0, 0]
        for strategy, data in self.results.items():
            df = data['df']
            ax.hist(df['net_pnl'], bins=30, alpha=0.5, label=strategy)
        ax.set_title('PnL Distribution', fontsize=14, fontweight='bold')
        ax.set_xlabel('Net PnL ($)')
        ax.set_ylabel('Frequency')
        ax.legend()
        ax.grid(alpha=0.3)
        
        # Plot 2: Sharpe Ratio Comparison
        ax = axes[0, 1]
        strategies = list(self.results.keys())
        sharpe_ratios = [self.results[s]['metrics']['sharpe'] for s in strategies]
        colors = ['#2ecc71' if s == 'RL' else '#3498db' for s in strategies]
        ax.bar(strategies, sharpe_ratios, color=colors)
        ax.set_title('Sharpe Ratio Comparison', fontsize=14, fontweight='bold')
        ax.set_ylabel('Sharpe Ratio')
        ax.grid(alpha=0.3, axis='y')
        ax.axhline(y=1.5, color='red', linestyle='--', label='Target: 1.5')
        ax.legend()
        
        # Plot 3: Win Rate
        ax = axes[0, 2]
        win_rates = [self.results[s]['metrics']['win_rate'] * 100 for s in strategies]
        ax.bar(strategies, win_rates, color=colors)
        ax.set_title('Win Rate Comparison', fontsize=14, fontweight='bold')
        ax.set_ylabel('Win Rate (%)')
        ax.grid(alpha=0.3, axis='y')
        ax.axhline(y=60, color='red', linestyle='--', label='Target: 60%')
        ax.legend()
        
        # Plot 4: Transaction Costs
        ax = axes[1, 0]
        costs = [self.results[s]['metrics']['avg_costs'] for s in strategies]
        ax.bar(strategies, costs, color=colors)
        ax.set_title('Average Transaction Costs', fontsize=14, fontweight='bold')
        ax.set_ylabel('Avg Costs ($)')
        ax.grid(alpha=0.3, axis='y')
        
        # Plot 5: Risk-Return Scatter
        ax = axes[1, 1]
        for strategy in strategies:
            metrics = self.results[strategy]['metrics']
            color = '#2ecc71' if strategy == 'RL' else '#3498db'
            ax.scatter(metrics['std_pnl'], metrics['mean_pnl'], 
                      s=200, alpha=0.6, color=color, label=strategy)
        ax.set_title('Risk-Return Profile', fontsize=14, fontweight='bold')
        ax.set_xlabel('Std Dev of PnL ($)')
        ax.set_ylabel('Mean PnL ($)')
        ax.legend()
        ax.grid(alpha=0.3)
        
        # Plot 6: Hedge Ratio Volatility
        ax = axes[1, 2]
        hedge_vols = [self.results[s]['metrics']['avg_hedge_vol'] for s in strategies]
        ax.bar(strategies, hedge_vols, color=colors)
        ax.set_title('Hedge Ratio Volatility', fontsize=14, fontweight='bold')
        ax.set_ylabel('Std Dev of Hedge Ratio')
        ax.grid(alpha=0.3, axis='y')
        
        plt.tight_layout()
        plt.savefig(save_dir / 'advanced_baseline_comparison.png', dpi=300, bbox_inches='tight')
        logger.info(f"✅ Saved plot to {save_dir / 'advanced_baseline_comparison.png'}")
        plt.close()


def main():
    # Initialize comparator
    comparator = BaselineComparator()
    
    # Load RL model
    comparator.load_rl_model()
    
    # Compare all strategies
    strategies = ['RL', 'SABR', 'Delta', 'DeltaGamma']
    comparator.compare_all(strategies)
    
    logger.info("\n✅ Advanced baseline comparison complete!")


if __name__ == "__main__":
    main()
