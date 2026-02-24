"""
Evaluation framework for comparing RL agents with baseline strategies.
"""

from typing import Any, Dict, List, Optional, Union
import numpy as np
import pandas as pd
from pathlib import Path
import matplotlib.pyplot as plt
import seaborn as sns

from src.agents.ppo_agent import PPOHedgingAgent
from src.agents.sac_agent import SACHedgingAgent
from src.baselines.hedging_strategies import (
    DeltaHedging,
    DeltaGammaHedging,
    DeltaGammaVegaHedging,
    MinimumVarianceHedging,
)
from src.environments.hedging_env import OptionHedgingEnv
from src.evaluation.metrics import HedgingEvaluator


class AgentEvaluator:
    """
    Comprehensive evaluation comparing RL agents with baselines.
    
    Evaluates:
    - Episode returns and Sharpe ratios
    - Transaction costs
    - Risk metrics (max drawdown, volatility)
    - Sample efficiency
    """
    
    def __init__(
        self,
        env: OptionHedgingEnv,
        n_episodes: int = 100,
        seed: Optional[int] = None,
    ):
        """
        Initialize evaluator.
        
        Args:
            env: Environment for evaluation
            n_episodes: Number of episodes to evaluate
            seed: Random seed
        """
        self.env = env
        self.n_episodes = n_episodes
        self.seed = seed
        self.results = {}
    
    def evaluate_rl_agent(
        self,
        agent: Union[PPOHedgingAgent, SACHedgingAgent],
        agent_name: str = "RL Agent",
        deterministic: bool = True,
    ) -> Dict[str, Any]:
        """
        Evaluate an RL agent.
        
        Args:
            agent: Trained RL agent
            agent_name: Name for results
            deterministic: Whether to use deterministic policy
            
        Returns:
            results: Dictionary of metrics
        """
        print(f"\nEvaluating {agent_name}...")
        
        episode_rewards = []
        episode_costs = []
        episode_pnls = []
        episode_sharpes = []
        
        for episode in range(self.n_episodes):
            obs, _ = self.env.reset(seed=self.seed + episode if self.seed else None)
            
            episode_reward = 0
            done = False
            
            while not done:
                action, _ = agent.predict(obs, deterministic=deterministic)
                obs, reward, terminated, truncated, info = self.env.step(action)
                episode_reward += reward
                done = terminated or truncated
            
            # Get episode metrics
            metrics = self.env.get_episode_metrics()
            
            episode_rewards.append(episode_reward)
            episode_costs.append(metrics["total_costs"])
            episode_pnls.append(metrics["total_pnl"])
            episode_sharpes.append(metrics["sharpe_ratio"])
        
        # Aggregate results
        results = {
            "agent_name": agent_name,
            "mean_reward": np.mean(episode_rewards),
            "std_reward": np.std(episode_rewards),
            "mean_pnl": np.mean(episode_pnls),
            "std_pnl": np.std(episode_pnls),
            "mean_costs": np.mean(episode_costs),
            "sharpe_ratio": np.mean(episode_sharpes),
            "success_rate": np.mean([p > 0 for p in episode_pnls]),
            "episode_rewards": episode_rewards,
            "episode_costs": episode_costs,
            "episode_pnls": episode_pnls,
        }
        
        self.results[agent_name] = results
        
        print(f"  Mean Reward: {results['mean_reward']:.2f} ± {results['std_reward']:.2f}")
        print(f"  Mean PnL: {results['mean_pnl']:.2f} ± {results['std_pnl']:.2f}")
        print(f"  Mean Costs: {results['mean_costs']:.2f}")
        print(f"  Sharpe Ratio: {results['sharpe_ratio']:.3f}")
        print(f"  Success Rate: {results['success_rate']*100:.1f}%")
        
        return results
    
    def evaluate_baseline(
        self,
        strategy_class,
        strategy_name: str,
        **strategy_kwargs,
    ) -> Dict[str, Any]:
        """
        Evaluate a baseline strategy.
        
        Args:
            strategy_class: Baseline strategy class
            strategy_name: Name for results
            **strategy_kwargs: Arguments for strategy initialization
            
        Returns:
            results: Dictionary of metrics
        """
        print(f"\nEvaluating {strategy_name}...")
        
        episode_pnls = []
        episode_costs = []
        episode_sharpes = []
        episode_rewards = []
        
        for episode in range(self.n_episodes):
            # Reset environment
            obs, info = self.env.reset(seed=self.seed + episode if self.seed else None)
            
            # Create strategy
            strategy = strategy_class(
                S0=info["S0"],
                K=info["K"],
                T=info["T"],
                r=self.env.r,
                sigma=self.env.sigma,
                option_type=self.env.option_type,
                transaction_cost=self.env.transaction_cost,
                **strategy_kwargs
            )
            
            # Initialize strategy
            strategy.initialize()
            
            episode_reward = 0
            done = False
            step = 0
            
            while not done:
                # Get baseline action
                tau = max(info["T"] - step * self.env.dt, 0)
                positions = strategy.get_hedge_positions(S=info["S"], tau=tau)
                
                # Convert to environment action (target position)
                target_position = positions.get("stock", 0.0)
                action = np.array([target_position])
                
                # Step environment
                obs, reward, terminated, truncated, info = self.env.step(action)
                episode_reward += reward
                done = terminated or truncated
                step += 1
            
            # Get episode metrics
            metrics = self.env.get_episode_metrics()
            
            episode_rewards.append(episode_reward)
            episode_pnls.append(metrics["total_pnl"])
            episode_costs.append(metrics["total_costs"])
            episode_sharpes.append(metrics["sharpe_ratio"])
        
        # Aggregate results
        results = {
            "agent_name": strategy_name,
            "mean_reward": np.mean(episode_rewards),
            "std_reward": np.std(episode_rewards),
            "mean_pnl": np.mean(episode_pnls),
            "std_pnl": np.std(episode_pnls),
            "mean_costs": np.mean(episode_costs),
            "sharpe_ratio": np.mean(episode_sharpes),
            "success_rate": np.mean([p > 0 for p in episode_pnls]),
            "episode_rewards": episode_rewards,
            "episode_costs": episode_costs,
            "episode_pnls": episode_pnls,
        }
        
        self.results[strategy_name] = results
        
        print(f"  Mean Reward: {results['mean_reward']:.2f} ± {results['std_reward']:.2f}")
        print(f"  Mean PnL: {results['mean_pnl']:.2f} ± {results['std_pnl']:.2f}")
        print(f"  Mean Costs: {results['mean_costs']:.2f}")
        print(f"  Sharpe Ratio: {results['sharpe_ratio']:.3f}")
        print(f"  Success Rate: {results['success_rate']*100:.1f}%")
        
        return results
    
    def evaluate_all_baselines(self) -> Dict[str, Dict[str, Any]]:
        """
        Evaluate all baseline strategies.
        
        Returns:
            results: Dictionary of results for each baseline
        """
        print(f"\n{'='*60}")
        print("Evaluating All Baseline Strategies")
        print(f"{'='*60}")
        
        baselines = [
            (DeltaHedging, "Delta Hedging", {}),
            (DeltaGammaHedging, "Delta-Gamma Hedging", {"gamma_target": 0.0}),
            (DeltaGammaVegaHedging, "Delta-Gamma-Vega Hedging", {"gamma_weight": 0.5, "vega_weight": 0.5}),
            (MinimumVarianceHedging, "Minimum Variance Hedging", {"lookback_window": 20}),
        ]
        
        for strategy_class, strategy_name, kwargs in baselines:
            self.evaluate_baseline(strategy_class, strategy_name, **kwargs)
        
        return self.results
    
    def compare_all(
        self,
        agents: Optional[Dict[str, Union[PPOHedgingAgent, SACHedgingAgent]]] = None,
    ) -> pd.DataFrame:
        """
        Compare all strategies and return summary DataFrame.
        
        Args:
            agents: Dictionary of {name: agent} to evaluate
            
        Returns:
            df: Comparison DataFrame
        """
        # Evaluate agents if provided
        if agents:
            for name, agent in agents.items():
                self.evaluate_rl_agent(agent, agent_name=name)
        
        # Evaluate baselines
        self.evaluate_all_baselines()
        
        # Create comparison DataFrame
        comparison_data = []
        for name, results in self.results.items():
            comparison_data.append({
                "Strategy": name,
                "Mean Reward": results["mean_reward"],
                "Std Reward": results["std_reward"],
                "Mean PnL": results["mean_pnl"],
                "Std PnL": results["std_pnl"],
                "Mean Costs": results["mean_costs"],
                "Sharpe Ratio": results["sharpe_ratio"],
                "Success Rate": results["success_rate"] * 100,
            })
        
        df = pd.DataFrame(comparison_data)
        df = df.sort_values("Mean Reward", ascending=False)
        
        return df
    
    def plot_comparison(
        self,
        save_path: Optional[str] = None,
    ) -> None:
        """
        Create comparison plots.
        
        Args:
            save_path: Path to save plots
        """
        if not self.results:
            print("No results to plot. Run evaluation first.")
            return
        
        # Set style
        sns.set_style("whitegrid")
        
        # Create subplots
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        fig.suptitle("RL Agent vs Baseline Strategies Comparison", fontsize=16, fontweight="bold")
        
        # Extract data
        names = list(self.results.keys())
        mean_rewards = [self.results[name]["mean_reward"] for name in names]
        mean_costs = [self.results[name]["mean_costs"] for name in names]
        sharpe_ratios = [self.results[name]["sharpe_ratio"] for name in names]
        success_rates = [self.results[name]["success_rate"] * 100 for name in names]
        
        # Color RL agents differently
        colors = ['#2ecc71' if 'PPO' in name or 'SAC' in name else '#3498db' for name in names]
        
        # Plot 1: Mean Rewards
        axes[0, 0].barh(names, mean_rewards, color=colors)
        axes[0, 0].set_xlabel("Mean Episode Reward", fontsize=12)
        axes[0, 0].set_title("Performance Comparison", fontsize=13, fontweight="bold")
        axes[0, 0].axvline(x=0, color='red', linestyle='--', alpha=0.5)
        
        # Plot 2: Transaction Costs
        axes[0, 1].barh(names, mean_costs, color=colors)
        axes[0, 1].set_xlabel("Mean Transaction Costs", fontsize=12)
        axes[0, 1].set_title("Cost Efficiency", fontsize=13, fontweight="bold")
        
        # Plot 3: Sharpe Ratios
        axes[1, 0].barh(names, sharpe_ratios, color=colors)
        axes[1, 0].set_xlabel("Sharpe Ratio", fontsize=12)
        axes[1, 0].set_title("Risk-Adjusted Returns", fontsize=13, fontweight="bold")
        axes[1, 0].axvline(x=1.0, color='orange', linestyle='--', alpha=0.5, label='Target')
        axes[1, 0].legend()
        
        # Plot 4: Success Rates
        axes[1, 1].barh(names, success_rates, color=colors)
        axes[1, 1].set_xlabel("Success Rate (%)", fontsize=12)
        axes[1, 1].set_title("Profitable Episodes", fontsize=13, fontweight="bold")
        axes[1, 1].set_xlim(0, 100)
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"Plot saved to {save_path}")
        
        plt.show()
    
    def generate_report(
        self,
        output_path: Optional[str] = None,
    ) -> str:
        """
        Generate detailed evaluation report.
        
        Args:
            output_path: Path to save report
            
        Returns:
            report: Report text
        """
        report = []
        report.append("=" * 80)
        report.append("RL AGENT EVALUATION REPORT")
        report.append("=" * 80)
        report.append("")
        
        report.append(f"Evaluation Settings:")
        report.append(f"  - Episodes: {self.n_episodes}")
        report.append(f"  - Environment: {self.env.__class__.__name__}")
        report.append(f"  - Option Type: {self.env.option_type}")
        report.append(f"  - Volatility: {self.env.sigma:.1%}")
        report.append(f"  - Transaction Cost: {self.env.transaction_cost:.2%}")
        report.append("")
        
        # Sort by mean reward
        sorted_results = sorted(
            self.results.items(),
            key=lambda x: x[1]["mean_reward"],
            reverse=True
        )
        
        report.append("Results Summary (sorted by Mean Reward):")
        report.append("-" * 80)
        
        for name, results in sorted_results:
            report.append(f"\n{name}:")
            report.append(f"  Mean Reward:     {results['mean_reward']:>10.2f} ± {results['std_reward']:.2f}")
            report.append(f"  Mean PnL:        {results['mean_pnl']:>10.2f} ± {results['std_pnl']:.2f}")
            report.append(f"  Mean Costs:      {results['mean_costs']:>10.2f}")
            report.append(f"  Sharpe Ratio:    {results['sharpe_ratio']:>10.3f}")
            report.append(f"  Success Rate:    {results['success_rate']*100:>10.1f}%")
        
        # Best strategy
        best_name = sorted_results[0][0]
        best_results = sorted_results[0][1]
        
        report.append("")
        report.append("=" * 80)
        report.append(f"BEST STRATEGY: {best_name}")
        report.append(f"  Outperforms baseline by: {best_results['mean_reward']:.2f} reward")
        report.append("=" * 80)
        
        report_text = "\n".join(report)
        
        if output_path:
            with open(output_path, "w") as f:
                f.write(report_text)
            print(f"\nReport saved to {output_path}")
        
        print("\n" + report_text)
        
        return report_text
