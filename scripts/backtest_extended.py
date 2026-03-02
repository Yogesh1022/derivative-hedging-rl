"""
Extended Backtesting Script
Performs 5-year backtest including COVID-19 crash and recovery

Usage:
    python scripts/backtest_extended.py --years 5 --model models/sac/best_model.zip
"""

import argparse
import pandas as pd
import numpy as np
from pathlib import Path
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import logging
import sys
sys.path.append(str(Path(__file__).parent.parent))

from stable_baselines3 import SAC, PPO, DQN
from src.environments.hedging_env import OptionHedgingEnv
from src.baselines.hedging_strategies import DeltaHedging, DeltaGammaHedging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class ExtendedBacktester:
    """Extended backtesting with regime analysis"""
    
    def __init__(self, model_path: str, data_path: str):
        self.model_path = model_path
        self.data_path = data_path
        self.results = {}
        
    def load_model(self):
        """Load trained RL model"""
        logger.info(f"Loading model from {self.model_path}")
        
        # Detect model type from filename
        if 'sac' in self.model_path.lower():
            self.model = SAC.load(self.model_path)
            self.model_name = "SAC"
        elif 'ppo' in self.model_path.lower():
            self.model = PPO.load(self.model_path)
            self.model_name = "PPO"
        elif 'dqn' in self.model_path.lower():
            self.model = DQN.load(self.model_path)
            self.model_name = "DQN"
        else:
            self.model = SAC.load(self.model_path)
            self.model_name = "SAC"
            
        logger.info(f"✅ Loaded {self.model_name} model")
        
    def load_data(self):
        """Load historical data"""
        logger.info(f"Loading data from {self.data_path}")
        self.data = pd.read_csv(self.data_path, index_col=0, parse_dates=True)
        logger.info(f"✅ Loaded {len(self.data)} days of data")
        logger.info(f"   Date range: {self.data.index[0]} to {self.data.index[-1]}")
        
    def identify_regimes(self):
        """Identify market regimes (Bull, Bear, Sideways, Crisis)"""
        logger.info("Identifying market regimes...")
        
        # Calculate rolling metrics
        window = 60  # 3 months
        self.data['Rolling_Return'] = self.data['Close'].pct_change(window)
        self.data['Rolling_Vol'] = self.data['Returns'].rolling(window).std() * np.sqrt(252)
        
        # Define regime rules
        conditions = [
            (self.data['Rolling_Return'] > 0.10) & (self.data['Rolling_Vol'] < 0.25),  # Bull
            (self.data['Rolling_Return'] < -0.10) & (self.data['Rolling_Vol'] > 0.25),  # Crisis
            (self.data['Rolling_Return'] < -0.05),  # Bear
            (abs(self.data['Rolling_Return']) < 0.05),  # Sideways
        ]
        choices = ['Bull', 'Crisis', 'Bear', 'Sideways']
        
        self.data['Regime'] = np.select(conditions, choices, default='Bull')
        
        # Print regime distribution
        regime_counts = self.data['Regime'].value_counts()
        logger.info(f"\n📊 Regime Distribution:")
        for regime, count in regime_counts.items():
            logger.info(f"   {regime}: {count} days ({count/len(self.data)*100:.1f}%)")
            
    def run_backtest(self, strategy: str = "RL"):
        """Run backtest for given strategy"""
        logger.info(f"\n🔄 Running {strategy} backtest...")
        
        # Create environment
        env = OptionHedgingEnv(n_steps=252)  # 1 year episodes
        
        pnl_list = []
        hedge_ratios = []
        transaction_costs = []
        
        # Reset environment with historical data
        obs, info = env.reset()
        episode_count = 0
        max_episodes = len(self.data) // 252  # Approximately 5 episodes for 5 years
        
        while episode_count < max_episodes:
            if strategy == "RL":
                action, _ = self.model.predict(obs, deterministic=True)
            elif strategy == "Delta":
                # Delta hedging
                delta = env.black_scholes_delta()
                action = np.array([delta])
            elif strategy == "DeltaGamma":
                # Delta-Gamma hedging
                delta = env.black_scholes_delta()
                gamma = env.black_scholes_gamma()
                action = np.array([delta + 0.5 * gamma * env.S])
            
            obs, reward, terminated, truncated, info = env.step(action)
            
            pnl_list.append(info.get('pnl', 0))
            hedge_ratios.append(action[0])
            transaction_costs.append(info.get('transaction_cost', 0))
            
            if terminated or truncated:
                obs, info = env.reset()
                episode_count += 1
                
        # Convert to DataFrame
        results_df = pd.DataFrame({
            'PnL': pnl_list,
            'Hedge_Ratio': hedge_ratios,
            'Transaction_Cost': transaction_costs
        })
        
        results_df['Cumulative_PnL'] = results_df['PnL'].cumsum()
        
        # Calculate metrics
        metrics = self.calculate_metrics(results_df)
        
        self.results[strategy] = {
            'df': results_df,
            'metrics': metrics
        }
        
        logger.info(f"✅ {strategy} backtest complete")
        return results_df, metrics
        
    def calculate_metrics(self, df: pd.DataFrame):
        """Calculate performance metrics"""
        returns = df['PnL'].values
        
        metrics = {
            'Total PnL': df['Cumulative_PnL'].iloc[-1],
            'Mean PnL': returns.mean(),
            'Std PnL': returns.std(),
            'Sharpe Ratio': returns.mean() / returns.std() * np.sqrt(252) if returns.std() > 0 else 0,
            'Max Drawdown': self.calculate_max_drawdown(df['Cumulative_PnL']),
            'Win Rate': (returns > 0).sum() / len(returns),
            'Total Transaction Costs': df['Transaction_Cost'].sum(),
            'Avg Hedge Ratio': df['Hedge_Ratio'].mean(),
            'Hedge Ratio Std': df['Hedge_Ratio'].std(),
        }
        
        # Sortino ratio
        downside_returns = returns[returns < 0]
        downside_std = downside_returns.std() if len(downside_returns) > 0 else returns.std()
        metrics['Sortino Ratio'] = returns.mean() / downside_std * np.sqrt(252) if downside_std > 0 else 0
        
        return metrics
        
    def calculate_max_drawdown(self, cumulative_returns):
        """Calculate maximum drawdown"""
        running_max = np.maximum.accumulate(cumulative_returns)
        drawdown = (cumulative_returns - running_max) / (running_max + 1e-10)
        return drawdown.min()
        
    def regime_analysis(self, strategy: str = "RL"):
        """Analyze performance by regime"""
        logger.info(f"\n📊 Regime Analysis for {strategy}")
        
        df = self.results[strategy]['df']
        
        # Align with data regimes (approximate)
        regime_slice_size = len(self.data) // len(df)
        regimes_aligned = self.data['Regime'].iloc[::regime_slice_size].values[:len(df)]
        df['Regime'] = regimes_aligned
        
        # Calculate metrics by regime
        regime_metrics = {}
        for regime in df['Regime'].unique():
            regime_data = df[df['Regime'] == regime]
            regime_metrics[regime] = {
                'Mean PnL': regime_data['PnL'].mean(),
                'Sharpe': regime_data['PnL'].mean() / regime_data['PnL'].std() * np.sqrt(252) if regime_data['PnL'].std() > 0 else 0,
                'Win Rate': (regime_data['PnL'] > 0).sum() / len(regime_data),
                'Count': len(regime_data)
            }
            
        # Print regime analysis
        for regime, metrics in regime_metrics.items():
            logger.info(f"\n{regime} Market:")
            logger.info(f"  Mean PnL: ${metrics['Mean PnL']:.2f}")
            logger.info(f"  Sharpe: {metrics['Sharpe']:.2f}")
            logger.info(f"  Win Rate: {metrics['Win Rate']:.1%}")
            logger.info(f"  Samples: {metrics['Count']}")
            
        return regime_metrics
        
    def plot_results(self, save_path: str = "test_output"):
        """Plot comprehensive results"""
        logger.info("\n📈 Generating plots...")
        
        save_dir = Path(save_path)
        save_dir.mkdir(parents=True, exist_ok=True)
        
        # 1. Cumulative PnL comparison
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        
        # Plot 1: Cumulative PnL
        ax = axes[0, 0]
        for strategy, data in self.results.items():
            df = data['df']
            ax.plot(df['Cumulative_PnL'], label=strategy, linewidth=2)
        ax.set_title('Cumulative PnL - 5 Year Backtest', fontsize=14, fontweight='bold')
        ax.set_xlabel('Trading Days')
        ax.set_ylabel('Cumulative PnL ($)')
        ax.legend()
        ax.grid(alpha=0.3)
        
        # Plot 2: Hedge Ratio Distribution
        ax = axes[0, 1]
        for strategy, data in self.results.items():
            df = data['df']
            ax.hist(df['Hedge_Ratio'], bins=50, alpha=0.5, label=strategy)
        ax.set_title('Hedge Ratio Distribution', fontsize=14, fontweight='bold')
        ax.set_xlabel('Hedge Ratio')
        ax.set_ylabel('Frequency')
        ax.legend()
        ax.grid(alpha=0.3)
        
        # Plot 3: Daily PnL
        ax = axes[1, 0]
        for strategy, data in self.results.items():
            df = data['df']
            ax.plot(df['PnL'], label=strategy, alpha=0.7, linewidth=1)
        ax.set_title('Daily PnL', fontsize=14, fontweight='bold')
        ax.set_xlabel('Trading Days')
        ax.set_ylabel('Daily PnL ($)')
        ax.axhline(y=0, color='black', linestyle='--', linewidth=1)
        ax.legend()
        ax.grid(alpha=0.3)
        
        # Plot 4: Performance Metrics Comparison
        ax = axes[1, 1]
        metrics_to_plot = ['Sharpe Ratio', 'Win Rate', 'Sortino Ratio']
        x = np.arange(len(metrics_to_plot))
        width = 0.25
        
        for i, (strategy, data) in enumerate(self.results.items()):
            metrics = data['metrics']
            values = [
                metrics['Sharpe Ratio'],
                metrics['Win Rate'] * 2,  # Scale for visibility
                metrics['Sortino Ratio']
            ]
            ax.bar(x + i * width, values, width, label=strategy)
            
        ax.set_title('Performance Metrics Comparison', fontsize=14, fontweight='bold')
        ax.set_xticks(x + width)
        ax.set_xticklabels(metrics_to_plot)
        ax.legend()
        ax.grid(alpha=0.3, axis='y')
        
        plt.tight_layout()
        plt.savefig(save_dir / 'extended_backtest_results.png', dpi=300, bbox_inches='tight')
        logger.info(f"✅ Saved plot to {save_dir / 'extended_backtest_results.png'}")
        plt.close()
        
    def print_summary(self):
        """Print comprehensive summary"""
        logger.info("\n" + "="*80)
        logger.info("📊 EXTENDED BACKTEST SUMMARY (5 YEARS)")
        logger.info("="*80)
        
        for strategy, data in self.results.items():
            metrics = data['metrics']
            logger.info(f"\n🔹 {strategy} Strategy:")
            logger.info(f"   Total PnL:              ${metrics['Total PnL']:,.2f}")
            logger.info(f"   Mean Daily PnL:         ${metrics['Mean PnL']:.2f}")
            logger.info(f"   Sharpe Ratio:           {metrics['Sharpe Ratio']:.2f}")
            logger.info(f"   Sortino Ratio:          {metrics['Sortino Ratio']:.2f}")
            logger.info(f"   Max Drawdown:           {metrics['Max Drawdown']:.2%}")
            logger.info(f"   Win Rate:               {metrics['Win Rate']:.1%}")
            logger.info(f"   Total Transaction Costs: ${metrics['Total Transaction Costs']:,.2f}")
            logger.info(f"   Avg Hedge Ratio:        {metrics['Avg Hedge Ratio']:.3f}")
            
        # Compare RL vs baselines
        if 'RL' in self.results and 'Delta' in self.results:
            rl_pnl = self.results['RL']['metrics']['Total PnL']
            delta_pnl = self.results['Delta']['metrics']['Total PnL']
            improvement = (rl_pnl - delta_pnl) / abs(delta_pnl) * 100
            
            logger.info(f"\n🎯 RL vs Delta Improvement:")
            logger.info(f"   PnL Improvement: {improvement:+.1f}%")
            
        logger.info("\n" + "="*80)


def main():
    parser = argparse.ArgumentParser(description='Extended backtesting for 5 years')
    parser.add_argument('--years', type=int, default=5, help='Number of years to backtest')
    parser.add_argument('--model', type=str, default='models/sac/best_model.zip', help='Path to trained model')
    parser.add_argument('--data', type=str, default='data/raw/SPY_extended_2020-01-01_2024-12-31.csv', 
                       help='Path to extended data')
    parser.add_argument('--strategies', type=str, nargs='+', default=['RL', 'Delta', 'DeltaGamma'],
                       help='Strategies to backtest')
    parser.add_argument('--output', type=str, default='test_output', help='Output directory')
    
    args = parser.parse_args()
    
    # Initialize backtester
    backtester = ExtendedBacktester(args.model, args.data)
    
    # Load model and data
    backtester.load_model()
    backtester.load_data()
    
    # Identify regimes
    backtester.identify_regimes()
    
    # Run backtests for all strategies
    for strategy in args.strategies:
        backtester.run_backtest(strategy)
        backtester.regime_analysis(strategy)
    
    # Plot results
    backtester.plot_results(args.output)
    
    # Print summary
    backtester.print_summary()
    
    logger.info("\n✅ Extended backtesting complete!")


if __name__ == "__main__":
    main()
