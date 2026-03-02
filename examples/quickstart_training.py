"""
Quick Start Example: Training RL Agents for Option Hedging

This script demonstrates the complete workflow:
1. Create environment
2. Train agent (PPO or SAC)
3. Evaluate against baselines
4. Save results

Run this to see Phase 3 in action!
"""

from src.agents.trainer import AgentTrainer
from src.agents.evaluator import AgentEvaluator
from src.agents.config import get_config, ENV_CONFIGS
from src.environments.hedging_env import OptionHedgingEnv

def main():
    print("=" * 80)
    print("OPTION HEDGING RL - QUICK START EXAMPLE")
    print("=" * 80)
    print()
    
    # Step 1: Setup
    print("Step 1: Setting up environment and trainer...")
    
    # Use medium difficulty environment
    env_config = ENV_CONFIGS["medium"]
    
    # Create trainer for PPO agent
    trainer = AgentTrainer(
        agent_type="PPO",
        env_config=env_config,
        output_dir="models/quickstart",
        seed=42
    )
    
    print("✓ Trainer initialized")
    print()
    
    # Step 2: Train agent
    print("Step 2: Training PPO agent...")
    print("(This will take a few minutes on CPU, faster on GPU)")
    print()
    
    # Get recommended configuration
    agent_config = get_config("PPO", "fast_learning")
    
    # Quick training with 50K timesteps
    agent = trainer.quick_train(
        agent_config=agent_config,
        total_timesteps=50000,
    )
    
    print()
    print("✓ Agent trained successfully!")
    print()
    
    # Step 3: Evaluate
    print("Step 3: Evaluating agent against baselines...")
    print()
    
    # Create evaluation environment
    eval_env = OptionHedgingEnv(**env_config)
    
    evaluator = AgentEvaluator(
        env=eval_env,
        n_episodes=20,  # Quick evaluation
        seed=42
    )
    
    # Compare with all baselines
    agents = {"PPO Agent": agent}
    comparison_df = evaluator.compare_all(agents=agents)
    
    print()
    print("=" * 80)
    print("RESULTS")
    print("=" * 80)
    print()
    print(comparison_df.to_string(index=False))
    print()
    
    # Step 4: Save results
    print("Step 4: Saving results...")
    
    # Save comparison
    comparison_df.to_csv("models/quickstart/comparison.csv", index=False)
    print("✓ Comparison saved to models/quickstart/comparison.csv")
    
    # Generate plots
    evaluator.plot_comparison(save_path="models/quickstart/comparison.png")
    print("✓ Plot saved to models/quickstart/comparison.png")
    
    # Generate report
    evaluator.generate_report(output_path="models/quickstart/report.txt")
    print("✓ Report saved to models/quickstart/report.txt")
    
    print()
    print("=" * 80)
    print("QUICK START COMPLETE!")
    print("=" * 80)
    print()
    print("Next steps:")
    print("1. Check 'models/quickstart/' for saved models and results")
    print("2. Try longer training with: python scripts/train_agent.py")
    print("3. Use curriculum learning for better results")
    print("4. Run hyperparameter optimization to find best settings")
    print()
    print("Example commands:")
    print("  python scripts/train_agent.py --agent PPO --curriculum --timesteps 500000")
    print("  python scripts/train_agent.py --agent SAC --hyperopt --trials 50")
    print("  python scripts/evaluate_agents.py --ppo models/quickstart/ppo_quick.zip")
    print()


if __name__ == "__main__":
    main()
