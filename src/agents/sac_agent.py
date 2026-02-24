"""
SAC (Soft Actor-Critic) agent for option hedging.

SAC is an off-policy algorithm that learns a stochastic policy while
maximizing both expected return and entropy, making it robust and
sample-efficient for continuous control tasks.
"""

from typing import Any, Dict, Optional, Tuple
import numpy as np
import torch
from stable_baselines3 import SAC
from stable_baselines3.common.callbacks import BaseCallback, EvalCallback, CheckpointCallback
from stable_baselines3.common.noise import NormalActionNoise
from stable_baselines3.common.vec_env import DummyVecEnv, VecNormalize
from stable_baselines3.common.monitor import Monitor
import gymnasium as gym


class SACHedgingAgent:
    """
    SAC agent specialized for option hedging tasks.
    
    SAC is particularly well-suited for hedging because:
    1. Off-policy learning enables efficient use of past experiences
    2. Entropy maximization encourages exploration of hedging strategies
    3. Handles continuous action spaces naturally (hedge position adjustments)
    """
    
    def __init__(
        self,
        env: gym.Env,
        policy: str = "MlpPolicy",
        learning_rate: float = 3e-4,
        buffer_size: int = 1000000,
        learning_starts: int = 100,
        batch_size: int = 256,
        tau: float = 0.005,
        gamma: float = 0.99,
        train_freq: int = 1,
        gradient_steps: int = 1,
        ent_coef: str = "auto",
        target_entropy: str = "auto",
        use_sde: bool = False,
        policy_kwargs: Optional[Dict[str, Any]] = None,
        verbose: int = 1,
        seed: Optional[int] = None,
        device: str = "auto",
    ):
        """
        Initialize SAC agent for hedging.
        
        Args:
            env: Gymnasium environment
            policy: Policy network architecture ('MlpPolicy' for feedforward)
            learning_rate: Learning rate for all networks
            buffer_size: Replay buffer size
            learning_starts: Steps before learning starts
            batch_size: Minibatch size for replay buffer sampling
            tau: Soft update coefficient for target networks
            gamma: Discount factor
            train_freq: Update frequency (in steps)
            gradient_steps: Number of gradient steps per update
            ent_coef: Entropy coefficient ('auto' for automatic tuning)
            target_entropy: Target entropy ('auto' for -dim(A))
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
                "net_arch": [256, 256],
                "activation_fn": torch.nn.ReLU,
            }
        
        self.model = SAC(
            policy=policy,
            env=env,
            learning_rate=learning_rate,
            buffer_size=buffer_size,
            learning_starts=learning_starts,
            batch_size=batch_size,
            tau=tau,
            gamma=gamma,
            train_freq=train_freq,
            gradient_steps=gradient_steps,
            ent_coef=ent_coef,
            target_entropy=target_entropy,
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
    ) -> "SACHedgingAgent":
        """
        Train the SAC agent.
        
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
                name_prefix="sac_hedging",
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
            deterministic: Whether to use deterministic policy (mean action)
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
    
    def load(self, path: str) -> "SACHedgingAgent":
        """Load model from disk."""
        self.model = SAC.load(path, env=self.env)
        return self
    
    @staticmethod
    def load_pretrained(
        path: str,
        env: gym.Env,
        device: str = "auto",
    ) -> "SACHedgingAgent":
        """
        Load a pre-trained SAC agent.
        
        Args:
            path: Path to saved model
            env: Environment for the agent
            device: Device to load model on
            
        Returns:
            agent: Loaded SAC agent
        """
        agent = SACHedgingAgent(env=env, device=device)
        agent.model = SAC.load(path, env=env, device=device)
        return agent
    
    def get_parameters(self) -> Dict[str, Any]:
        """Get agent hyperparameters."""
        return {
            "learning_rate": self.model.learning_rate,
            "buffer_size": self.model.buffer_size,
            "learning_starts": self.model.learning_starts,
            "batch_size": self.model.batch_size,
            "tau": self.model.tau,
            "gamma": self.model.gamma,
            "train_freq": self.model.train_freq,
            "gradient_steps": self.model.gradient_steps,
        }
