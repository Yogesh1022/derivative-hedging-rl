"""
Training script for RL agents with curriculum learning.

Usage:
    python scripts/train_agent.py --agent PPO --timesteps 500000
    python scripts/train_agent.py --agent SAC --curriculum --timesteps 1000000
    python scripts/train_agent.py --agent PPO --hyperopt --trials 50
"""

import argparse
from pathlib import Path
import json

from src.agents.trainer import AgentTrainer
from src.agents.evaluator import AgentEvaluator
from src.environments.hedging_env import OptionHedgingEnv


def main():
    parser = argparse.ArgumentParser(
        description="Train RL agents for option hedging"
    )
    
    # Agent selection
    parser.add_argument(
        "--agent",
        type=str,
        default="PPO",
        choices=["PPO", "SAC"],
        help="Type of RL agent to train"
    )
    
    # Training mode
    parser.add_argument(
        "--curriculum",
        action="store_true",
        help="Use curriculum learning (easy → medium → hard)"
    )
    
    parser.add_argument(
        "--quick",
        action="store_true",
        help="Quick training mode (for testing)"
    )
    
    parser.add_argument(
        "--hyperopt",
        action="store_true",
        help="Run hyperparameter optimization"
    )
    
    # Training parameters
    parser.add_argument(
        "--timesteps",
        type=int,
        default=500000,
        help="Total training timesteps"
    )
    
    parser.add_argument(
        "--trials",
        type=int,
        default=50,
        help="Number of trials for hyperparameter optimization"
    )
    
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for reproducibility"
    )
    
    # Environment configuration
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
        default="models",
        help="Directory to save trained models"
    )
    
    parser.add_argument(
        "--evaluate",
        action="store_true",
        help="Evaluate trained agent against baselines"
    )
    
    args = parser.parse_args()
    
    # Create environment configuration
    env_config = {
        "sigma": args.volatility,
        "transaction_cost": args.transaction_cost,
        "n_steps": 100,
        "seed": args.seed,
    }
    
    # Create trainer
    trainer = AgentTrainer(
        agent_type=args.agent,
        env_config=env_config,
        output_dir=args.output_dir,
        seed=args.seed,
    )
    
    print(f"\n{'='*80}")
    print(f"Training {args.agent} Agent for Option Hedging")
    print(f"{'='*80}")
    print(f"Configuration:")
    print(f"  - Agent: {args.agent}")
    print(f"  - Timesteps: {args.timesteps:,}")
    print(f"  - Volatility: {args.volatility:.1%}")
    print(f"  - Transaction Cost: {args.transaction_cost:.2%}")
    print(f"  - Seed: {args.seed}")
    print(f"  - Output: {args.output_dir}")
    print(f"{'='*80}\n")
    
    # Hyperparameter optimization
    if args.hyperopt:
        print("Running hyperparameter optimization...")
        best_params = trainer.hyperparameter_search(
            n_trials=args.trials,
            n_timesteps=args.timesteps // 10,  # Shorter for each trial
        )
        
        print(f"\nTraining final agent with best hyperparameters...")
        agent_config = best_params
    else:
        agent_config = None
    
    # Training
    if args.quick:
        print("Quick training mode...")
        agent = trainer.quick_train(
            agent_config=agent_config,
            total_timesteps=args.timesteps,
        )
    elif args.curriculum:
        print("Curriculum learning mode...")
        agent = trainer.train_with_curriculum(
            agent_config=agent_config,
            total_timesteps=args.timesteps,
        )
    else:
        print("Standard training mode...")
        # Use default single-stage training
        agent = trainer.train_with_curriculum(
            agent_config=agent_config,
            stages=[{"difficulty": "medium", "timesteps": args.timesteps}],
        )
    
    # Evaluation
    if args.evaluate:
        print(f"\n{'='*80}")
        print("Evaluating Trained Agent")
        print(f"{'='*80}")
        
        eval_env = OptionHedgingEnv(**env_config)
        evaluator = AgentEvaluator(
            env=eval_env,
            n_episodes=100,
            seed=args.seed,
        )
        
        # Compare with baselines
        agents = {f"{args.agent} Agent": agent}
        comparison_df = evaluator.compare_all(agents=agents)
        
        print("\n" + "="*80)
        print("COMPARISON RESULTS")
        print("="*80)
        print(comparison_df.to_string(index=False))
        
        # Save results
        results_path = Path(args.output_dir) / f"{args.agent.lower()}_evaluation.csv"
        comparison_df.to_csv(results_path, index=False)
        print(f"\nResults saved to {results_path}")
        
        # Generate plots
        plot_path = Path(args.output_dir) / f"{args.agent.lower()}_comparison.png"
        evaluator.plot_comparison(save_path=str(plot_path))
        
        # Generate report
        report_path = Path(args.output_dir) / f"{args.agent.lower()}_report.txt"
        evaluator.generate_report(output_path=str(report_path))
    
    print(f"\n{'='*80}")
    print("Training Complete!")
    print(f"{'='*80}\n")


if __name__ == "__main__":
    main()
