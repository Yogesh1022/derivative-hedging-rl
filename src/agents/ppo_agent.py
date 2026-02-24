"""
PPO (Proximal Policy Optimization) agent for option hedging.

PPO is a policy gradient method that's stable and sample-efficient,
making it ideal for learning hedging strategies.
"""

from typing import Any, Dict, Optional, Tuple
import numpy as np
import torch
from stable_baselines3 import PPO
from stable_baselines3.common.callbacks import BaseCallback, EvalCallback, CheckpointCallback
from stable_baselines3.common.vec_env import DummyVecEnv, VecNormalize
from stable_baselines3.common.monitor import Monitor
import gymnasium as gym


class PPOHedgingAgent:
    """
    PPO agent specialized for option hedging tasks.
    
    PPO uses a clipped objective function to ensure stable policy updates,
    making it reliable for financial applications where catastrophic failures
    must be avoided.
    """
    
    def __init__(
        self,
        env: gym.Env,
        policy: str = "MlpPolicy",
        learning_rate: float = 3e-4,
        n_steps: int = 2048,
        batch_size: int = 64,
        n_epochs: int = 10,
        gamma: float = 0.99,
        gae_lambda: float = 0.95,
        clip_range: float = 0.2,
        ent_coef: float = 0.01,
        vf_coef: float = 0.5,
        max_grad_norm: float = 0.5,
        use_sde: bool = False,
        policy_kwargs: Optional[Dict[str, Any]] = None,
        verbose: int = 1,
        seed: Optional[int] = None,
        device: str = "auto",
    ):
        """
        Initialize PPO agent for hedging.
        
        Args:
            env: Gymnasium environment
            policy: Policy network architecture ('MlpPolicy' for feedforward)
            learning_rate: Learning rate for optimizer
            n_steps: Number of steps to collect per env before update
            batch_size: Minibatch size for SGD
            n_epochs: Number of epochs for policy update
            gamma: Discount factor
            gae_lambda: Factor for GAE (General Advantage Estimation)
            clip_range: Clipping parameter for PPO objective
            ent_coef: Entropy coefficient for exploration
            vf_coef: Value function coefficient in loss
            max_grad_norm: Max gradient norm for clipping
            use_sde: Whether to use State Dependent Exploration
            policy_kwargs: Additional policy network parameters
            verbose: Verbosity level
            seed: Random seed
            device: Device to use ('cpu', 'cuda', or 'auto')
        """
        self.env = env
        self.seed = seed
        
        # Default policy network architecture
        if policy_kwargs is None:
            policy_kwargs = {
                "net_arch": [dict(pi=[256, 256], vf=[256, 256])],
                "activation_fn": torch.nn.ReLU,
            }
        
        self.model = PPO(
            policy=policy,
            env=env,
            learning_rate=learning_rate,
            n_steps=n_steps,
            batch_size=batch_size,
            n_epochs=n_epochs,
            gamma=gamma,
            gae_lambda=gae_lambda,
            clip_range=clip_range,
            ent_coef=ent_coef,
            vf_coef=vf_coef,
            max_grad_norm=max_grad_norm,
            use_sde=use_sde,
            policy_kwargs=policy_kwargs,
            verbose=verbose,
            seed=seed,
            device=device,
        )
        
        self.training_history = []
    
    def train(
        self,
        total_timesteps: int,
        eval_env: Optional[gym.Env] = None,
        eval_freq: int = 10000,
        n_eval_episodes: int = 5,
        log_dir: Optional[str] = None,
        save_freq: int = 50000,
        callbacks: Optional[list] = None,
    ) -> "PPOHedgingAgent":
        """
        Train the PPO agent.
        
        Args:
            total_timesteps: Total number of environment steps
            eval_env: Environment for evaluation during training
            eval_freq: Frequency of evaluation (in timesteps)
            n_eval_episodes: Number of episodes for each evaluation
            log_dir: Directory for logs and checkpoints
            save_freq: Frequency of model checkpoints (in timesteps)
            callbacks: List of additional callbacks
            
        Returns:
            self: Trained agent
        """
        callback_list = callbacks or []
        
        # Add evaluation callback if eval_env provided
        if eval_env is not None and log_dir is not None:
            eval_callback = EvalCallback(
                eval_env,
                best_model_save_path=f"{log_dir}/best_model",
                log_path=f"{log_dir}/eval_logs",
                eval_freq=eval_freq,
                n_eval_episodes=n_eval_episodes,
                deterministic=True,
                render=False,
            )
            callback_list.append(eval_callback)
        
        # Add checkpoint callback
        if log_dir is not None:
            checkpoint_callback = CheckpointCallback(
                save_freq=save_freq,
                save_path=f"{log_dir}/checkpoints",
                name_prefix="ppo_hedging",
            )
            callback_list.append(checkpoint_callback)
        
        # Train the model
        self.model.learn(
            total_timesteps=total_timesteps,
            callback=callback_list,
            progress_bar=True,
        )
        
        return self
    
    def predict(
        self,
        observation: np.ndarray,
        deterministic: bool = True,
        state: Optional[Tuple] = None,
    ) -> Tuple[np.ndarray, Optional[Tuple]]:
        """
        Predict action given observation.
        
        Args:
            observation: Current state observation
            deterministic: Whether to use deterministic policy
            state: RNN state (not used for MLP policy)
            
        Returns:
            action: Predicted action
            state: Updated RNN state (None for MLP)
        """
        action, state = self.model.predict(
            observation, deterministic=deterministic, state=state
        )
        return action, state
    
    def save(self, path: str) -> None:
        """Save model to disk."""
        self.model.save(path)
    
    def load(self, path: str) -> "PPOHedgingAgent":
        """Load model from disk."""
        self.model = PPO.load(path, env=self.env)
        return self
    
    @staticmethod
    def load_pretrained(
        path: str,
        env: gym.Env,
        device: str = "auto",
    ) -> "PPOHedgingAgent":
        """
        Load a pre-trained PPO agent.
        
        Args:
            path: Path to saved model
            env: Environment for the agent
            device: Device to load model on
            
        Returns:
            agent: Loaded PPO agent
        """
        agent = PPOHedgingAgent(env=env, device=device)
        agent.model = PPO.load(path, env=env, device=device)
        return agent
    
    def get_parameters(self) -> Dict[str, Any]:
        """Get agent hyperparameters."""
        return {
            "learning_rate": self.model.learning_rate,
            "n_steps": self.model.n_steps,
            "batch_size": self.model.batch_size,
            "n_epochs": self.model.n_epochs,
            "gamma": self.model.gamma,
            "gae_lambda": self.model.gae_lambda,
            "clip_range": self.model.clip_range,
            "ent_coef": self.model.ent_coef,
            "vf_coef": self.model.vf_coef,
        }
