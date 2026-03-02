"""
Hyperparameter Optimization using Optuna

Automatically finds optimal hyperparameters for RL algorithms

Usage:
    python scripts/optimize_hyperparameters.py --algorithm SAC --n-trials 100
"""

import argparse
import optuna
from optuna.pruners import MedianPruner
from optuna.samplers import TPESampler
import numpy as np
from pathlib import Path
import logging
import sys
sys.path.append(str(Path(__file__).parent.parent))

from stable_baselines3 import SAC, PPO, DQN
from stable_baselines3.common.evaluation import evaluate_policy
from src.environments.hedging_env import OptionHedgingEnv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def objective_sac(trial):
    """Objective function for SAC hyperparameter optimization"""
    # Suggest hyperparameters
    learning_rate = trial.suggest_float("learning_rate", 1e-5, 1e-3, log=True)
    gamma = trial.suggest_float("gamma", 0.95, 0.9999)
    batch_size = trial.suggest_categorical("batch_size", [128, 256, 512, 1024])
    tau = trial.suggest_float("tau", 0.001, 0.02)
    ent_coef = trial.suggest_categorical("ent_coef", ["auto", 0.01, 0.05, 0.1])
    
    # Create environment
    env = OptionHedgingEnv(n_steps=100)  # Medium curriculum stage
    
    # Create model with suggested hyperparameters
    model = SAC(
        "MlpPolicy",
        env,
        learning_rate=learning_rate,
        gamma=gamma,
        batch_size=batch_size,
        tau=tau,
        ent_coef=ent_coef,
        verbose=0,
        tensorboard_log=None
    )
    
    # Train for a short period
    model.learn(total_timesteps=50000, progress_bar=False)
    
    # Evaluate
    eval_env = OptionHedgingEnv(n_steps=100)
    mean_reward, std_reward = evaluate_policy(model, eval_env, n_eval_episodes=20, deterministic=True)
    
    return mean_reward


def objective_ppo(trial):
    """Objective function for PPO hyperparameter optimization"""
    learning_rate = trial.suggest_float("learning_rate", 1e-5, 1e-3, log=True)
    gamma = trial.suggest_float("gamma", 0.95, 0.9999)
    n_steps = trial.suggest_categorical("n_steps", [512, 1024, 2048])
    batch_size = trial.suggest_categorical("batch_size", [64, 128, 256])
    clip_range = trial.suggest_float("clip_range", 0.1, 0.3)
    ent_coef = trial.suggest_float("ent_coef", 0.0, 0.1)
    
    env = OptionHedgingEnv(n_steps=100)
    
    model = PPO(
        "MlpPolicy",
        env,
        learning_rate=learning_rate,
        gamma=gamma,
        n_steps=n_steps,
        batch_size=batch_size,
        clip_range=clip_range,
        ent_coef=ent_coef,
        verbose=0
    )
    
    model.learn(total_timesteps=50000, progress_bar=False)
    
    eval_env = OptionHedgingEnv(n_steps=100)
    mean_reward, std_reward = evaluate_policy(model, eval_env, n_eval_episodes=20)
    
    return mean_reward


def run_optimization(algorithm: str, n_trials: int, study_name: str, timeout: int = None):
    """Run hyperparameter optimization"""
    logger.info(f"Starting optimization for {algorithm}")
    logger.info(f"  Trials: {n_trials}")
    logger.info(f"  Study name: {study_name}")
    
    # Create study
    study = optuna.create_study(
        study_name=study_name,
        direction="maximize",
        sampler=TPESampler(seed=42),
        pruner=MedianPruner(n_startup_trials=5, n_warmup_steps=10),
        storage=f"sqlite:///optuna_studies.db",
        load_if_exists=True
    )
    
    # Select objective function
    if algorithm.upper() == "SAC":
        objective = objective_sac
    elif algorithm.upper() == "PPO":
        objective = objective_ppo
    else:
        raise ValueError(f"Unknown algorithm: {algorithm}")
    
    # Optimize
    study.optimize(objective, n_trials=n_trials, timeout=timeout, show_progress_bar=True)
    
    # Print results
    logger.info("\n" + "="*80)
    logger.info("📊 OPTIMIZATION RESULTS")
    logger.info("="*80)
    logger.info(f"  Best trial: {study.best_trial.number}")
    logger.info(f"  Best value (mean reward): {study.best_trial.value:.2f}")
    logger.info(f"\n  Best hyperparameters:")
    for key, value in study.best_trial.params.items():
        logger.info(f"    {key}: {value}")
    
    # Save results
    output_dir = Path("test_output/optuna")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save best parameters
    import json
    with open(output_dir / f"{study_name}_best_params.json", 'w') as f:
        json.dump(study.best_trial.params, f, indent=2)
    
    logger.info(f"\n✅ Saved best parameters to {output_dir / f'{study_name}_best_params.json'}")
    
    # Plot optimization history
    try:
        import plotly
        fig = optuna.visualization.plot_optimization_history(study)
        fig.write_html(output_dir / f"{study_name}_history.html")
        logger.info(f"✅ Saved optimization history plot")
        
        # Plot parameter importances
        fig = optuna.visualization.plot_param_importances(study)
        fig.write_html(output_dir / f"{study_name}_importances.html")
        logger.info(f"✅ Saved parameter importance plot")
    except:
        logger.warning("⚠️ Could not create plots (install plotly)")
    
    logger.info("\n" + "="*80)
    logger.info("🎯 Next steps:")
    logger.info(f"  1. Review plots in {output_dir}")
    logger.info(f"  2. Launch Optuna dashboard: optuna-dashboard sqlite:///optuna_studies.db")
    logger.info(f"  3. Train with best params: python scripts/train_optimized.py --study-name {study_name}")
    
    return study


def main():
    parser = argparse.ArgumentParser(description='Hyperparameter optimization with Optuna')
    parser.add_argument('--algorithm', type=str, default='SAC', choices=['SAC', 'PPO'],
                       help='RL algorithm')
    parser.add_argument('--n-trials', type=int, default=100,
                       help='Number of optimization trials')
    parser.add_argument('--timeout', type=int, default=None,
                       help='Timeout in seconds (optional)')
    parser.add_argument('--study-name', type=str, default=None,
                       help='Study name (default: algorithm_optimization_YYYYMMDD)')
    
    args = parser.parse_args()
    
    # Generate study name if not provided
    if args.study_name is None:
        from datetime import datetime
        date_str = datetime.now().strftime("%Y%m%d")
        args.study_name = f"{args.algorithm.lower()}_optimization_{date_str}"
    
    # Run optimization
    study = run_optimization(
        algorithm=args.algorithm,
        n_trials=args.n_trials,
        study_name=args.study_name,
        timeout=args.timeout
    )


if __name__ == "__main__":
    main()
