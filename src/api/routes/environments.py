"""
API routes for RL environment management.
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
import numpy as np
from datetime import datetime

from src.environments.hedging_env import OptionHedgingEnv

# Router
router = APIRouter(prefix="/environments", tags=["environments"])

# In-memory storage for active environments
_active_environments: Dict[str, OptionHedgingEnv] = {}


# Request/Response Models
class CreateEnvironmentRequest(BaseModel):
    """Request to create a new environment."""
    
    S0: float = Field(default=100.0, description="Initial stock price")
    K: float = Field(default=100.0, description="Strike price")
    T: float = Field(default=1.0, description="Time to maturity in years")
    r: float = Field(default=0.05, description="Risk-free rate")
    sigma: float = Field(default=0.2, description="Volatility")
    n_steps: int = Field(default=252, description="Number of rebalancing steps")
    option_type: str = Field(default="call", description="Option type: call or put")
    action_type: str = Field(default="continuous", description="Action type: continuous or discrete")
    transaction_cost_pct: float = Field(default=0.001, description="Transaction cost as percentage")
    risk_penalty: float = Field(default=0.01, description="Risk penalty coefficient")
    seed: Optional[int] = Field(default=None, description="Random seed for reproducibility")


class EnvironmentResponse(BaseModel):
    """Response with environment details."""
    
    env_id: str
    status: str
    current_step: int
    total_steps: int
    config: Dict[str, Any]
    created_at: str


class StepRequest(BaseModel):
    """Request to step the environment."""
    
    action: float = Field(description="Action to take (hedge ratio or action index)")


class StepResponse(BaseModel):
    """Response from environment step."""
    
    observation: list
    reward: float
    terminated: bool
    truncated: bool
    info: Dict[str, Any]
    current_step: int


class EpisodeMetricsResponse(BaseModel):
    """Episode performance metrics."""
    
    total_pnl: float
    total_costs: float
    net_pnl: float
    num_rebalances: int
    avg_position: float
    sharpe_ratio: float
    max_drawdown: float


@router.post("/create", response_model=EnvironmentResponse, status_code=status.HTTP_201_CREATED)
def create_environment(request: CreateEnvironmentRequest):
    """
    Create a new hedging environment instance.
    
    Args:
        request: Environment configuration
    
    Returns:
        Environment details including unique ID
    """
    # Create environment
    env = OptionHedgingEnv(
        S0=request.S0,
        K=request.K,
        T=request.T,
        r=request.r,
        sigma=request.sigma,
        n_steps=request.n_steps,
        option_type=request.option_type,
        action_type=request.action_type,
        transaction_cost_pct=request.transaction_cost_pct,
        risk_penalty=request.risk_penalty,
    )
    
    # Reset with seed
    env.reset(seed=request.seed)
    
    # Generate unique ID
    env_id = f"env_{len(_active_environments)}_{datetime.utcnow().timestamp()}"
    _active_environments[env_id] = env
    
    return EnvironmentResponse(
        env_id=env_id,
        status="active",
        current_step=env.current_step,
        total_steps=env.n_steps,
        config={
            "S0": request.S0,
            "K": request.K,
            "T": request.T,
            "r": request.r,
            "sigma": request.sigma,
            "n_steps": request.n_steps,
            "option_type": request.option_type,
            "action_type": request.action_type,
        },
        created_at=datetime.utcnow().isoformat(),
    )


@router.get("/{env_id}", response_model=EnvironmentResponse)
def get_environment(env_id: str):
    """
    Get environment details.
    
    Args:
        env_id: Environment ID
    
    Returns:
        Environment details
    """
    if env_id not in _active_environments:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Environment {env_id} not found",
        )
    
    env = _active_environments[env_id]
    
    return EnvironmentResponse(
        env_id=env_id,
        status="active" if env.current_step < env.n_steps else "completed",
        current_step=env.current_step,
        total_steps=env.n_steps,
        config={
            "S0": env.S0,
            "K": env.K,
            "T": env.T,
            "r": env.r,
            "sigma": env.sigma,
            "n_steps": env.n_steps,
            "option_type": env.option_type,
            "action_type": env.action_type,
        },
        created_at=datetime.utcnow().isoformat(),
    )


@router.post("/{env_id}/reset", response_model=StepResponse)
def reset_environment(env_id: str, seed: Optional[int] = None):
    """
    Reset an environment to initial state.
    
    Args:
        env_id: Environment ID
        seed: Optional random seed
    
    Returns:
        Initial observation
    """
    if env_id not in _active_environments:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Environment {env_id} not found",
        )
    
    env = _active_environments[env_id]
    obs, info = env.reset(seed=seed)
    
    return StepResponse(
        observation=obs.tolist(),
        reward=0.0,
        terminated=False,
        truncated=False,
        info=info,
        current_step=env.current_step,
    )


@router.post("/{env_id}/step", response_model=StepResponse)
def step_environment(env_id: str, request: StepRequest):
    """
    Take a step in the environment.
    
    Args:
        env_id: Environment ID
        request: Step request with action
    
    Returns:
        Step result with observation, reward, done flags
    """
    if env_id not in _active_environments:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Environment {env_id} not found",
        )
    
    env = _active_environments[env_id]
    
    # Convert action based on action type
    if env.action_type == "continuous":
        action = np.array([request.action])
    else:
        action = int(request.action)
    
    try:
        obs, reward, terminated, truncated, info = env.step(action)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Step failed: {str(e)}",
        )
    
    return StepResponse(
        observation=obs.tolist(),
        reward=float(reward),
        terminated=bool(terminated),
        truncated=bool(truncated),
        info=info,
        current_step=env.current_step,
    )


@router.get("/{env_id}/metrics", response_model=EpisodeMetricsResponse)
def get_episode_metrics(env_id: str):
    """
    Get episode performance metrics.
    
    Args:
        env_id: Environment ID
    
    Returns:
        Episode metrics
    """
    if env_id not in _active_environments:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Environment {env_id} not found",
        )
    
    env = _active_environments[env_id]
    metrics = env.get_episode_metrics()
    
    return EpisodeMetricsResponse(**metrics)


@router.delete("/{env_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_environment(env_id: str):
    """
    Delete an environment instance.
    
    Args:
        env_id: Environment ID
    """
    if env_id not in _active_environments:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Environment {env_id} not found",
        )
    
    del _active_environments[env_id]
    return None


@router.get("/")
def list_environments():
    """
    List all active environments.
    
    Returns:
        List of environment IDs and their status
    """
    envs = []
    for env_id, env in _active_environments.items():
        envs.append({
            "env_id": env_id,
            "status": "active" if env.current_step < env.n_steps else "completed",
            "current_step": env.current_step,
            "total_steps": env.n_steps,
        })
    
    return {"environments": envs, "count": len(envs)}
