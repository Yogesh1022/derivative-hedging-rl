"""
Training pipeline for RL agents with curriculum learning and hyperparameter tuning.
"""

from typing import Any, Dict, List, Optional, Union, Callable
import os
import json
from pathlib import Path
import numpy as np
import optuna
from stable_baselines3.common.monitor import Monitor
from stable_baselines3.common.vec_env import DummyVecEnv, VecNormalize

from src.agents.ppo_agent import PPOHedgingAgent
from src.agents.sac_agent import SACHedgingAgent
from src.agents.config import ENV_CONFIGS
from src.environments.hedging_env import OptionHedgingEnv


class AgentTrainer:
    """
    Unified training pipeline for RL agents.
    
    Features:
    - Curriculum learning (start simple, increase difficulty)
    - Hyperparameter tuning with Optuna
    - Progress tracking and logging
    - Model checkpointing
    """
    
    def __init__(
        self,
        agent_type: str = "PPO",
        env_config: Optional[Dict[str, Any]] = None,
        output_dir: str = "models",
        seed: Optional[int] = None,
    ):
        """
        Initialize trainer.
        
        Args:
            agent_type: Type of agent ('PPO' or 'SAC')
            env_config: Environment configuration
            output_dir: Directory for saving models and logs
            seed: Random seed for reproducibility
        """
        self.agent_type = agent_type.upper()
        self.env_config = env_config or {}
        self.output_dir = Path(output_dir)
        self.seed = seed
        
        # Create output directory
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Training history
        self.history = []
    
    def create_env(
        self,
        difficulty: str = "medium",
        monitor_wrapper: bool = True,
    ) -> OptionHedgingEnv:
        """
        Create training environment with curriculum difficulty.
        
        Args:
            difficulty: 'easy', 'medium', or 'hard'
            monitor_wrapper: Whether to wrap with Monitor
            
        Returns:
            env: Configured environment
        """
        # Base configuration
        config = self.env_config.copy()
        
        # Adjust difficulty
        if difficulty == "easy":
            config.update({
                "sigma": 0.15,  # Lower volatility
                "transaction_cost": 0.0005,  # Lower costs
                "n_steps": 50,  # Shorter episodes
            })
        elif difficulty == "medium":
            config.update({
                "sigma": 0.20,  # Normal volatility
                "transaction_cost": 0.001,  # Normal costs
                "n_steps": 100,  # Medium episodes
            })
        elif difficulty == "hard":
            config.update({
                "sigma": 0.30,  # High volatility
                "transaction_cost": 0.002,  # Higher costs
                "n_steps": 252,  # Full year
            })
        
        env = OptionHedgingEnv(**config)
        
        if monitor_wrapper:
            log_dir = self.output_dir / "monitor_logs"
            log_dir.mkdir(exist_ok=True)
            env = Monitor(env, str(log_dir / f"difficulty_{difficulty}"))
        
        return env
    
    def train_with_curriculum(
        self,
        agent_config: Optional[Dict[str, Any]] = None,
        stages: Optional[List[Dict[str, Any]]] = None,
        total_timesteps: int = 500000,
    ) -> Union[PPOHedgingAgent, SACHedgingAgent]:
        """
        Train agent with curriculum learning.
        
        Args:
            agent_config: Agent hyperparameters
            stages: List of curriculum stages with difficulty and timesteps
            total_timesteps: Total timesteps if stages not specified
            
        Returns:
            agent: Trained agent
        """
        agent_config = agent_config or {}
        
        # Default curriculum stages
        if stages is None:
            stages = [
                {"difficulty": "easy", "timesteps": int(total_timesteps * 0.2)},
                {"difficulty": "medium", "timesteps": int(total_timesteps * 0.5)},
                {"difficulty": "hard", "timesteps": int(total_timesteps * 0.3)},
            ]
        
        print(f"\n{'='*60}")
        print(f"Training {self.agent_type} agent with curriculum learning")
        print(f"{'='*60}\n")
        
        agent = None
        
        # Determine consistent n_steps for all stages (use max to avoid truncation)
        max_n_steps = max(
            ENV_CONFIGS.get(stage["difficulty"], {}).get("n_steps", 100) 
            for stage in stages
        )
        print(f"Using n_steps={max_n_steps} for all curriculum stages (ensures consistent observation space)")
        
        for i, stage in enumerate(stages, 1):
            difficulty = stage["difficulty"]
            timesteps = stage["timesteps"]
            
            print(f"\n--- Stage {i}/{len(stages)}: {difficulty.upper()} ---")
            print(f"Timesteps: {timesteps:,}")
            
            # Create environment for this stage with consistent n_steps
            env_config = ENV_CONFIGS[difficulty].copy()
            env_config["n_steps"] = max_n_steps  # Override to ensure consistent obs space
            
            train_env = OptionHedgingEnv(**env_config)
            eval_env = OptionHedgingEnv(**env_config)
            
            # Create or update agent
            if agent is None:
                # First stage: create new agent
                if self.agent_type == "PPO":
                    agent = PPOHedgingAgent(
                        env=train_env,
                        seed=self.seed,
                        **agent_config
                    )
                elif self.agent_type == "SAC":
                    agent = SACHedgingAgent(
                        env=train_env,
                        seed=self.seed,
                        **agent_config
                    )
                else:
                    raise ValueError(f"Unknown agent type: {self.agent_type}")
            else:
                # Subsequent stages: update environment
                agent.env = train_env
                agent.model.set_env(train_env)
            
            # Train this stage
            stage_log_dir = self.output_dir / f"stage_{i}_{difficulty}"
            stage_log_dir.mkdir(exist_ok=True)
            
            agent.train(
                total_timesteps=timesteps,
                eval_env=eval_env,
                eval_freq=max(1000, timesteps // 20),
                n_eval_episodes=5,
                log_dir=str(stage_log_dir),
                save_freq=max(10000, timesteps // 10),
            )
            
            # Save after each stage
            stage_path = stage_log_dir / f"{self.agent_type.lower()}_stage_{i}"
            agent.save(str(stage_path))
            print(f"✓ Stage {i} complete. Model saved to {stage_path}")
        
        # Save final model
        final_path = self.output_dir / f"{self.agent_type.lower()}_final"
        agent.save(str(final_path))
        print(f"\n✓ Training complete! Final model saved to {final_path}")
        
        return agent
    
    def hyperparameter_search(
        self,
        n_trials: int = 50,
        n_startup_trials: int = 10,
        n_timesteps: int = 50000,
        study_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Hyperparameter optimization using Optuna.
        
        Args:
            n_trials: Number of trials to run
            n_startup_trials: Number of random trials before TPE
            n_timesteps: Timesteps per trial
            study_name: Name for the study
            
        Returns:
            best_params: Best hyperparameters found
        """
        study_name = study_name or f"{self.agent_type}_hyperopt"
        
        print(f"\n{'='*60}")
        print(f"Hyperparameter search for {self.agent_type}")
        print(f"Trials: {n_trials}, Timesteps per trial: {n_timesteps:,}")
        print(f"{'='*60}\n")
        
        def objective(trial: optuna.Trial) -> float:
            """Objective function for optimization."""
            # Sample hyperparameters
            if self.agent_type == "PPO":
                params = {
                    "learning_rate": trial.suggest_float("learning_rate", 1e-5, 1e-3, log=True),
                    "n_steps": trial.suggest_categorical("n_steps", [512, 1024, 2048]),
                    "batch_size": trial.suggest_categorical("batch_size", [32, 64, 128, 256]),
                    "n_epochs": trial.suggest_categorical("n_epochs", [5, 10, 20]),
                    "gamma": trial.suggest_float("gamma", 0.95, 0.9999),
                    "gae_lambda": trial.suggest_float("gae_lambda", 0.9, 0.99),
                    "clip_range": trial.suggest_float("clip_range", 0.1, 0.3),
                    "ent_coef": trial.suggest_float("ent_coef", 0.0, 0.1),
                }
            else:  # SAC
                params = {
                    "learning_rate": trial.suggest_float("learning_rate", 1e-5, 1e-3, log=True),
                    "batch_size": trial.suggest_categorical("batch_size", [64, 128, 256, 512]),
                    "tau": trial.suggest_float("tau", 0.001, 0.02),
                    "gamma": trial.suggest_float("gamma", 0.95, 0.9999),
                    "learning_starts": trial.suggest_int("learning_starts", 100, 1000),
                    "train_freq": trial.suggest_categorical("train_freq", [1, 4, 8]),
                }
            
            # Create environment
            env = self.create_env(difficulty="medium")
            eval_env = self.create_env(difficulty="medium")
            
            # Create agent
            try:
                if self.agent_type == "PPO":
                    agent = PPOHedgingAgent(env=env, seed=self.seed, **params)
                else:
                    agent = SACHedgingAgent(env=env, seed=self.seed, **params)
                
                # Train
                agent.train(
                    total_timesteps=n_timesteps,
                    eval_env=eval_env,
                    eval_freq=max(1000, n_timesteps // 10),
                    n_eval_episodes=3,
                )
                
                # Evaluate
                eval_rewards = []
                for _ in range(5):
                    obs, _ = eval_env.reset()
                    episode_reward = 0
                    done = False
                    
                    while not done:
                        action, _ = agent.predict(obs, deterministic=True)
                        obs, reward, terminated, truncated, _ = eval_env.step(action)
                        episode_reward += reward
                        done = terminated or truncated
                    
                    eval_rewards.append(episode_reward)
                
                mean_reward = np.mean(eval_rewards)
                
            except Exception as e:
                print(f"Trial {trial.number} failed: {e}")
                mean_reward = -1e6  # Penalty for failed trials
            
            return mean_reward
        
        # Run optimization
        study = optuna.create_study(
            study_name=study_name,
            direction="maximize",
            sampler=optuna.samplers.TPESampler(n_startup_trials=n_startup_trials),
        )
        
        study.optimize(objective, n_trials=n_trials, show_progress_bar=True)
        
        # Save results
        results = {
            "best_params": study.best_params,
            "best_value": study.best_value,
            "n_trials": n_trials,
        }
        
        results_path = self.output_dir / f"{self.agent_type.lower()}_hyperopt_results.json"
        with open(results_path, "w") as f:
            json.dump(results, f, indent=2)
        
        print(f"\n{'='*60}")
        print(f"Best hyperparameters (Reward: {study.best_value:.2f}):")
        print(f"{'='*60}")
        for key, value in study.best_params.items():
            print(f"  {key}: {value}")
        print(f"\nResults saved to {results_path}")
        
        return results["best_params"]
    
    def quick_train(
        self,
        agent_config: Optional[Dict[str, Any]] = None,
        total_timesteps: int = 100000,
    ) -> Union[PPOHedgingAgent, SACHedgingAgent]:
        """
        Quick training without curriculum (for testing).
        
        Args:
            agent_config: Agent hyperparameters
            total_timesteps: Total training timesteps
            
        Returns:
            agent: Trained agent
        """
        agent_config = agent_config or {}
        
        print(f"\nQuick training {self.agent_type} agent for {total_timesteps:,} steps...")
        
        # Create environments
        train_env = self.create_env(difficulty="medium")
        eval_env = self.create_env(difficulty="medium")
        
        # Create agent
        if self.agent_type == "PPO":
            agent = PPOHedgingAgent(env=train_env, seed=self.seed, **agent_config)
        elif self.agent_type == "SAC":
            agent = SACHedgingAgent(env=train_env, seed=self.seed, **agent_config)
        else:
            raise ValueError(f"Unknown agent type: {self.agent_type}")
        
        # Train
        log_dir = self.output_dir / "quick_train"
        log_dir.mkdir(exist_ok=True)
        
        agent.train(
            total_timesteps=total_timesteps,
            eval_env=eval_env,
            eval_freq=max(1000, total_timesteps // 20),
            n_eval_episodes=5,
            log_dir=str(log_dir),
            save_freq=max(10000, total_timesteps // 5),
        )
        
        # Save
        model_path = self.output_dir / f"{self.agent_type.lower()}_quick"
        agent.save(str(model_path))
        print(f"✓ Model saved to {model_path}")
        
        return agent
