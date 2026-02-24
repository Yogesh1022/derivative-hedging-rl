"""
Configuration presets for training RL agents.

Contains recommended hyperparameters for different training scenarios.
"""

# PPO Configurations
PPO_CONFIGS = {
    "default": {
        "learning_rate": 3e-4,
        "n_steps": 2048,
        "batch_size": 64,
        "n_epochs": 10,
        "gamma": 0.99,
        "gae_lambda": 0.95,
        "clip_range": 0.2,
        "ent_coef": 0.01,
        "vf_coef": 0.5,
        "max_grad_norm": 0.5,
        "policy_kwargs": {
            "net_arch": [dict(pi=[256, 256], vf=[256, 256])],
        }
    },
    
    "fast_learning": {
        "learning_rate": 1e-3,
        "n_steps": 1024,
        "batch_size": 128,
        "n_epochs": 5,
        "gamma": 0.98,
        "gae_lambda": 0.95,
        "clip_range": 0.2,
        "ent_coef": 0.02,
        "vf_coef": 0.5,
        "max_grad_norm": 0.5,
        "policy_kwargs": {
            "net_arch": [dict(pi=[128, 128], vf=[128, 128])],
        }
    },
    
    "stable": {
        "learning_rate": 1e-4,
        "n_steps": 2048,
        "batch_size": 64,
        "n_epochs": 15,
        "gamma": 0.995,
        "gae_lambda": 0.98,
        "clip_range": 0.15,
        "ent_coef": 0.005,
        "vf_coef": 0.5,
        "max_grad_norm": 0.3,
        "policy_kwargs": {
            "net_arch": [dict(pi=[256, 256, 128], vf=[256, 256, 128])],
        }
    },
}

# SAC Configurations
SAC_CONFIGS = {
    "default": {
        "learning_rate": 3e-4,
        "buffer_size": 1000000,
        "learning_starts": 100,
        "batch_size": 256,
        "tau": 0.005,
        "gamma": 0.99,
        "train_freq": 1,
        "gradient_steps": 1,
        "ent_coef": "auto",
        "policy_kwargs": {
            "net_arch": [256, 256],
        }
    },
    
    "sample_efficient": {
        "learning_rate": 5e-4,
        "buffer_size": 500000,
        "learning_starts": 500,
        "batch_size": 512,
        "tau": 0.01,
        "gamma": 0.99,
        "train_freq": 4,
        "gradient_steps": 4,
        "ent_coef": "auto",
        "policy_kwargs": {
            "net_arch": [256, 256],
        }
    },
    
    "deep": {
        "learning_rate": 1e-4,
        "buffer_size": 2000000,
        "learning_starts": 1000,
        "batch_size": 256,
        "tau": 0.002,
        "gamma": 0.995,
        "train_freq": 1,
        "gradient_steps": 1,
        "ent_coef": "auto",
        "policy_kwargs": {
            "net_arch": [512, 512, 256],
        }
    },
}

# Environment Configurations
ENV_CONFIGS = {
    "easy": {
        "S0": 100.0,
        "K": 100.0,
        "T": 1.0,
        "r": 0.05,
        "sigma": 0.15,
        "n_steps": 50,
        "transaction_cost": 0.0005,
        "risk_penalty": 0.1,
    },
    
    "medium": {
        "S0": 100.0,
        "K": 100.0,
        "T": 1.0,
        "r": 0.05,
        "sigma": 0.20,
        "n_steps": 100,
        "transaction_cost": 0.001,
        "risk_penalty": 0.1,
    },
    
    "hard": {
        "S0": 100.0,
        "K": 100.0,
        "T": 1.0,
        "r": 0.05,
        "sigma": 0.30,
        "n_steps": 252,
        "transaction_cost": 0.002,
        "risk_penalty": 0.2,
    },
    
    "realistic": {
        "S0": 100.0,
        "K": 100.0,
        "T": 1.0,
        "r": 0.05,
        "sigma": 0.22,
        "n_steps": 252,
        "transaction_cost": 0.0015,
        "risk_penalty": 0.15,
    },
}

# Training Schedules
CURRICULUM_SCHEDULES = {
    "standard": [
        {"difficulty": "easy", "timesteps": 100000},
        {"difficulty": "medium", "timesteps": 250000},
        {"difficulty": "hard", "timesteps": 150000},
    ],
    
    "aggressive": [
        {"difficulty": "easy", "timesteps": 50000},
        {"difficulty": "medium", "timesteps": 150000},
        {"difficulty": "hard", "timesteps": 300000},
    ],
    
    "cautious": [
        {"difficulty": "easy", "timesteps": 200000},
        {"difficulty": "medium", "timesteps": 400000},
        {"difficulty": "hard", "timesteps": 400000},
    ],
    
    "quick": [
        {"difficulty": "medium", "timesteps": 100000},
    ],
}

# Hyperparameter Search Spaces
OPTUNA_SEARCH_SPACES = {
    "PPO": {
        "learning_rate": {"type": "loguniform", "low": 1e-5, "high": 1e-3},
        "n_steps": {"type": "categorical", "choices": [512, 1024, 2048, 4096]},
        "batch_size": {"type": "categorical", "choices": [32, 64, 128, 256]},
        "n_epochs": {"type": "categorical", "choices": [5, 10, 15, 20]},
        "gamma": {"type": "uniform", "low": 0.95, "high": 0.9999},
        "gae_lambda": {"type": "uniform", "low": 0.90, "high": 0.99},
        "clip_range": {"type": "uniform", "low": 0.1, "high": 0.3},
        "ent_coef": {"type": "uniform", "low": 0.0, "high": 0.1},
    },
    
    "SAC": {
        "learning_rate": {"type": "loguniform", "low": 1e-5, "high": 1e-3},
        "batch_size": {"type": "categorical", "choices": [64, 128, 256, 512]},
        "tau": {"type": "uniform", "low": 0.001, "high": 0.02},
        "gamma": {"type": "uniform", "low": 0.95, "high": 0.9999},
        "learning_starts": {"type": "int", "low": 100, "high": 1000},
        "train_freq": {"type": "categorical", "choices": [1, 4, 8, 16]},
        "gradient_steps": {"type": "categorical", "choices": [1, 2, 4, 8]},
    },
}


def get_config(agent_type: str, config_name: str = "default"):
    """
    Get configuration for agent.
    
    Args:
        agent_type: 'PPO' or 'SAC'
        config_name: Configuration name
        
    Returns:
        config: Configuration dictionary
    """
    if agent_type.upper() == "PPO":
        return PPO_CONFIGS.get(config_name, PPO_CONFIGS["default"])
    elif agent_type.upper() == "SAC":
        return SAC_CONFIGS.get(config_name, SAC_CONFIGS["default"])
    else:
        raise ValueError(f"Unknown agent type: {agent_type}")
