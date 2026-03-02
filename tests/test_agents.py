"""
Tests for RL agent implementations.
"""

import pytest
import numpy as np
from pathlib import Path
import tempfile

from src.agents.ppo_agent import PPOHedgingAgent
from src.agents.sac_agent import SACHedgingAgent
from src.agents.trainer import AgentTrainer
from src.agents.evaluator import AgentEvaluator
from src.environments.hedging_env import OptionHedgingEnv


class TestPPOAgent:
    """Test cases for PPO agent."""
    
    def test_initialization(self):
        """Test PPO agent initializes correctly."""
        env = OptionHedgingEnv()
        agent = PPOHedgingAgent(env=env, seed=42)
        
        assert agent.model is not None
        assert agent.env == env
        assert agent.seed == 42
    
    def test_predict(self):
        """Test PPO agent can predict actions."""
        env = OptionHedgingEnv()
        agent = PPOHedgingAgent(env=env, seed=42)
        
        obs, _ = env.reset(seed=42)
        action, state = agent.predict(obs)
        
        assert action.shape == (1,)  # Single continuous action
        assert -2.0 <= action[0] <= 2.0  # Within action space
    
    def test_train_quick(self):
        """Test PPO agent can train for a few steps."""
        env = OptionHedgingEnv(n_steps=10)
        agent = PPOHedgingAgent(env=env, seed=42, verbose=0)
        
        # Train for minimal steps
        agent.train(total_timesteps=100)
        
        # Should complete without errors
        assert agent.model is not None
    
    def test_save_load(self):
        """Test PPO agent can be saved and loaded."""
        env = OptionHedgingEnv()
        agent = PPOHedgingAgent(env=env, seed=42)
        
        with tempfile.TemporaryDirectory() as tmpdir:
            model_path = Path(tmpdir) / "test_ppo"
            
            # Save
            agent.save(str(model_path))
            assert model_path.with_suffix(".zip").exists()
            
            # Load
            loaded_agent = PPOHedgingAgent.load_pretrained(
                str(model_path),
                env=env
            )
            
            # Test loaded agent
            obs, _ = env.reset(seed=42)
            action1, _ = agent.predict(obs, deterministic=True)
            action2, _ = loaded_agent.predict(obs, deterministic=True)
            
            np.testing.assert_array_almost_equal(action1, action2)
    
    def test_get_parameters(self):
        """Test getting agent hyperparameters."""
        env = OptionHedgingEnv()
        agent = PPOHedgingAgent(
            env=env,
            learning_rate=3e-4,
            gamma=0.99,
            seed=42
        )
        
        params = agent.get_parameters()
        
        assert "learning_rate" in params
        assert "gamma" in params
        assert params["gamma"] == 0.99


class TestSACAgent:
    """Test cases for SAC agent."""
    
    def test_initialization(self):
        """Test SAC agent initializes correctly."""
        env = OptionHedgingEnv()
        agent = SACHedgingAgent(env=env, seed=42)
        
        assert agent.model is not None
        assert agent.env == env
        assert agent.seed == 42
    
    def test_predict(self):
        """Test SAC agent can predict actions."""
        env = OptionHedgingEnv()
        agent = SACHedgingAgent(env=env, seed=42)
        
        obs, _ = env.reset(seed=42)
        action, state = agent.predict(obs)
        
        assert action.shape == (1,)  # Single continuous action
        assert -2.0 <= action[0] <= 2.0  # Within action space
    
    def test_train_quick(self):
        """Test SAC agent can train for a few steps."""
        env = OptionHedgingEnv(n_steps=10)
        agent = SACHedgingAgent(
            env=env,
            seed=42,
            verbose=0,
            learning_starts=50  # Low for quick test
        )
        
        # Train for minimal steps
        agent.train(total_timesteps=100)
        
        # Should complete without errors
        assert agent.model is not None
    
    def test_save_load(self):
        """Test SAC agent can be saved and loaded."""
        env = OptionHedgingEnv()
        agent = SACHedgingAgent(env=env, seed=42)
        
        with tempfile.TemporaryDirectory() as tmpdir:
            model_path = Path(tmpdir) / "test_sac"
            
            # Save
            agent.save(str(model_path))
            assert model_path.with_suffix(".zip").exists()
            
            # Load
            loaded_agent = SACHedgingAgent.load_pretrained(
                str(model_path),
                env=env
            )
            
            # Test loaded agent
            obs, _ = env.reset(seed=42)
            action1, _ = agent.predict(obs, deterministic=True)
            action2, _ = loaded_agent.predict(obs, deterministic=True)
            
            np.testing.assert_array_almost_equal(action1, action2)
    
    def test_get_parameters(self):
        """Test getting agent hyperparameters."""
        env = OptionHedgingEnv()
        agent = SACHedgingAgent(
            env=env,
            learning_rate=3e-4,
            gamma=0.99,
            tau=0.005,
            seed=42
        )
        
        params = agent.get_parameters()
        
        assert "learning_rate" in params
        assert "gamma" in params
        assert "tau" in params
        assert params["gamma"] == 0.99


class TestAgentTrainer:
    """Test cases for agent trainer."""
    
    def test_initialization(self):
        """Test trainer initializes correctly."""
        trainer = AgentTrainer(
            agent_type="PPO",
            output_dir="test_output",
            seed=42
        )
        
        assert trainer.agent_type == "PPO"
        assert trainer.seed == 42
        assert trainer.output_dir.exists()
    
    def test_create_env(self):
        """Test environment creation with difficulty levels."""
        trainer = AgentTrainer(agent_type="PPO")
        
        # Test different difficulties
        env_easy = trainer.create_env(difficulty="easy", monitor_wrapper=False)
        env_medium = trainer.create_env(difficulty="medium", monitor_wrapper=False)
        env_hard = trainer.create_env(difficulty="hard", monitor_wrapper=False)
        
        assert env_easy.sigma == 0.15
        assert env_medium.sigma == 0.20
        assert env_hard.sigma == 0.30
        assert env_easy.n_steps == 50
        assert env_hard.n_steps == 252
    
    def test_quick_train_ppo(self):
        """Test quick training for PPO."""
        with tempfile.TemporaryDirectory() as tmpdir:
            trainer = AgentTrainer(
                agent_type="PPO",
                output_dir=tmpdir,
                seed=42
            )
            
            agent = trainer.quick_train(
                total_timesteps=500,  # Minimal for speed
            )
            
            assert isinstance(agent, PPOHedgingAgent)
            assert agent.model is not None
    
    def test_quick_train_sac(self):
        """Test quick training for SAC."""
        with tempfile.TemporaryDirectory() as tmpdir:
            trainer = AgentTrainer(
                agent_type="SAC",
                output_dir=tmpdir,
                seed=42
            )
            
            agent = trainer.quick_train(
                agent_config={"learning_starts": 50},
                total_timesteps=500,  # Minimal for speed
            )
            
            assert isinstance(agent, SACHedgingAgent)
            assert agent.model is not None
    
    def test_invalid_agent_type(self):
        """Test trainer raises error for invalid agent type."""
        trainer = AgentTrainer(agent_type="INVALID")
        
        with pytest.raises(ValueError):
            trainer.quick_train(total_timesteps=100)


class TestAgentEvaluator:
    """Test cases for agent evaluator."""
    
    def test_initialization(self):
        """Test evaluator initializes correctly."""
        env = OptionHedgingEnv()
        evaluator = AgentEvaluator(env=env, n_episodes=10, seed=42)
        
        assert evaluator.env == env
        assert evaluator.n_episodes == 10
        assert evaluator.seed == 42
    
    def test_evaluate_rl_agent(self):
        """Test evaluation of RL agent."""
        env = OptionHedgingEnv(n_steps=10)
        evaluator = AgentEvaluator(env=env, n_episodes=3, seed=42)
        
        # Create simple agent
        agent = PPOHedgingAgent(env=env, seed=42, verbose=0)
        
        # Evaluate
        results = evaluator.evaluate_rl_agent(agent, agent_name="Test PPO")
        
        assert "mean_reward" in results
        assert "mean_pnl" in results
        assert "sharpe_ratio" in results
        assert len(results["episode_rewards"]) == 3
    
    def test_evaluate_baseline(self):
        """Test evaluation of baseline strategy."""
        from src.baselines.hedging_strategies import DeltaHedging
        
        env = OptionHedgingEnv(n_steps=10)
        evaluator = AgentEvaluator(env=env, n_episodes=3, seed=42)
        
        # Evaluate baseline
        results = evaluator.evaluate_baseline(
            DeltaHedging,
            "Delta Hedging"
        )
        
        assert "mean_reward" in results
        assert "mean_pnl" in results
        assert "sharpe_ratio" in results
        assert len(results["episode_rewards"]) == 3
    
    def test_compare_all(self):
        """Test comparison of multiple strategies."""
        env = OptionHedgingEnv(n_steps=10)
        evaluator = AgentEvaluator(env=env, n_episodes=2, seed=42)
        
        # Create agent
        agent = PPOHedgingAgent(env=env, seed=42, verbose=0)
        
        # Compare
        df = evaluator.compare_all(agents={"PPO": agent})
        
        assert len(df) >= 5  # Agent + 4 baselines
        assert "Strategy" in df.columns
        assert "Mean Reward" in df.columns
        assert "Sharpe Ratio" in df.columns


class TestEndToEnd:
    """End-to-end integration tests."""
    
    def test_train_and_evaluate_workflow(self):
        """Test complete workflow: train → save → load → evaluate."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Train agent
            trainer = AgentTrainer(
                agent_type="PPO",
                output_dir=tmpdir,
                seed=42
            )
            
            agent = trainer.quick_train(total_timesteps=500)
            
            # Save
            model_path = Path(tmpdir) / "trained_ppo"
            agent.save(str(model_path))
            
            # Load
            env = OptionHedgingEnv(n_steps=10)
            loaded_agent = PPOHedgingAgent.load_pretrained(
                str(model_path),
                env=env
            )
            
            # Evaluate
            evaluator = AgentEvaluator(env=env, n_episodes=2, seed=42)
            results = evaluator.evaluate_rl_agent(loaded_agent, "Loaded PPO")
            
            assert "mean_reward" in results
            assert agent.model is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
