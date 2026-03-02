"""
Evaluation script for comparing trained agents with baselines.

Usage:
    python scripts/evaluate_agents.py --ppo models/ppo_final.zip
    python scripts/evaluate_agents.py --ppo models/ppo_final.zip --sac models/sac_final.zip
    python scripts/evaluate_agents.py --ppo models/ppo_final.zip --episodes 200
"""

import argparse
from pathlib import Path
import pandas as pd

from src.agents.ppo_agent import PPOHedgingAgent
from src.agents.sac_agent import SACHedgingAgent
from src.agents.evaluator import AgentEvaluator
from src.environments.hedging_env import OptionHedgingEnv


def main():
    parser = argparse.ArgumentParser(
        description="Evaluate trained RL agents against baseline strategies"
    )
    
    # Model paths
    parser.add_argument(
        "--ppo",
        type=str,
        default=None,
        help="Path to trained PPO model"
    )
    
    parser.add_argument(
        "--sac",
        type=str,
        default=None,
        help="Path to trained SAC model"
    )
    
    # Evaluation parameters
    parser.add_argument(
        "--episodes",
        type=int,
        default=100,
        help="Number of episodes for evaluation"
    )
    
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed"
    )
    
    # Environment settings
    parser.add_argument(
        "--volatility",
        type=float,
        default=0.20,
        help="Stock volatility (sigma)"
    )
    
    parser.add_argument(
        "--transaction_cost",
        type=float,
        default=0.001,
        help="Transaction cost as fraction"
    )
    
    # Output
    parser.add_argument(
        "--output_dir",
        type=str,
        default="evaluation_results",
        help="Directory to save evaluation results"
    )
    
    args = parser.parse_args()
    
    if not args.ppo and not args.sac:
        print("Error: Please provide at least one model path (--ppo or --sac)")
        return
    
    # Create output directory
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n{'='*80}")
    print("RL Agent Evaluation Suite")
    print(f"{'='*80}")
    print(f"Parameters:")
    print(f"  - Episodes: {args.episodes}")
    print(f"  - Volatility: {args.volatility:.1%}")
    print(f"  - Transaction Cost: {args.transaction_cost:.2%}")
    print(f"  - Seed: {args.seed}")
    print(f"{'='*80}\n")
    
    # Create environment
    env = OptionHedgingEnv(
        sigma=args.volatility,
        transaction_cost=args.transaction_cost,
        n_steps=100,
    )
    
    # Create evaluator
    evaluator = AgentEvaluator(
        env=env,
        n_episodes=args.episodes,
        seed=args.seed,
    )
    
    # Load and evaluate agents
    agents = {}
    
    if args.ppo:
        print(f"Loading PPO agent from {args.ppo}...")
        ppo_agent = PPOHedgingAgent.load_pretrained(args.ppo, env=env)
        agents["PPO Agent"] = ppo_agent
        print("✓ PPO agent loaded")
    
    if args.sac:
        print(f"Loading SAC agent from {args.sac}...")
        sac_agent = SACHedgingAgent.load_pretrained(args.sac, env=env)
        agents["SAC Agent"] = sac_agent
        print("✓ SAC agent loaded")
    
    # Run comprehensive evaluation
    print(f"\n{'='*80}")
    print("Running Evaluation")
    print(f"{'='*80}")
    
    comparison_df = evaluator.compare_all(agents=agents)
    
    # Display results
    print(f"\n{'='*80}")
    print("COMPARISON RESULTS")
    print(f"{'='*80}\n")
    print(comparison_df.to_string(index=False))
    
    # Save results
    csv_path = output_dir / "comparison_results.csv"
    comparison_df.to_csv(csv_path, index=False)
    print(f"\n✓ Results saved to {csv_path}")
    
    # Generate visualizations
    print("\nGenerating plots...")
    plot_path = output_dir / "comparison_plot.png"
    evaluator.plot_comparison(save_path=str(plot_path))
    print(f"✓ Plot saved to {plot_path}")
    
    # Generate detailed report
    print("\nGenerating detailed report...")
    report_path = output_dir / "evaluation_report.txt"
    evaluator.generate_report(output_path=str(report_path))
    print(f"✓ Report saved to {report_path}")
    
    # Calculate improvement over best baseline
    baseline_names = [
        "Delta Hedging",
        "Delta-Gamma Hedging",
        "Delta-Gamma-Vega Hedging",
        "Minimum Variance Hedging"
    ]
    
    baseline_rewards = comparison_df[
        comparison_df["Strategy"].isin(baseline_names)
    ]["Mean Reward"].max()
    
    agent_rewards = comparison_df[
        ~comparison_df["Strategy"].isin(baseline_names)
    ]["Mean Reward"].max()
    
    improvement = ((agent_rewards - baseline_rewards) / abs(baseline_rewards)) * 100
    
    print(f"\n{'='*80}")
    print("PERFORMANCE IMPROVEMENT")
    print(f"{'='*80}")
    print(f"Best Baseline Reward: {baseline_rewards:.2f}")
    print(f"Best RL Agent Reward: {agent_rewards:.2f}")
    print(f"Improvement: {improvement:+.1f}%")
    print(f"{'='*80}\n")


if __name__ == "__main__":
    main()
