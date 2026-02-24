"""
API routes for baseline hedging strategies.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
import numpy as np

from src.baselines.hedging_strategies import (
    DeltaHedging,
    DeltaGammaHedging,
    DeltaGammaVegaHedging,
    MinimumVarianceHedging,
)
from src.evaluation.metrics import HedgingEvaluator, BacktestResult

# Router
router = APIRouter(prefix="/baselines", tags=["baselines"])


# Request/Response Models
class BaselineExecuteRequest(BaseModel):
    """Request to execute a baseline strategy."""
    
    strategy_name: str = Field(description="Strategy name: delta, delta_gamma, delta_gamma_vega, min_variance")
    S0: float = Field(default=100.0, description="Initial stock price")
    K: float = Field(default=100.0, description="Strike price")
    T: float = Field(default=1.0, description="Time to maturity in years")
    r: float = Field(default=0.05, description="Risk-free rate")
    sigma: float = Field(default=0.2, description="Volatility")
    n_steps: int = Field(default=252, description="Number of rebalancing steps")
    option_type: str = Field(default="call", description="Option type: call or put")
    transaction_cost_pct: float = Field(default=0.001, description="Transaction cost percentage")
    num_episodes: int = Field(default=100, description="Number of episodes to run")
    seed: Optional[int] = Field(default=None, description="Random seed")
    
    # Strategy-specific parameters
    gamma_weight: float = Field(default=0.5, description="Gamma adjustment weight (for delta-gamma)")
    vega_weight: float = Field(default=0.5, description="Vega adjustment weight (for delta-gamma-vega)")


class BaselineCompareRequest(BaseModel):
    """Request to compare multiple baseline strategies."""
    
    strategies: List[str] = Field(description="List of strategy names to compare")
    S0: float = Field(default=100.0, description="Initial stock price")
    K: float = Field(default=100.0, description="Strike price")
    T: float = Field(default=1.0, description="Time to maturity in years")
    r: float = Field(default=0.05, description="Risk-free rate")
    sigma: float = Field(default=0.2, description="Volatility")
    n_steps: int = Field(default=252, description="Number of rebalancing steps")
    option_type: str = Field(default="call", description="Option type: call or put")
    transaction_cost_pct: float = Field(default=0.001, description="Transaction cost percentage")
    num_episodes: int = Field(default=100, description="Number of episodes per strategy")
    seed: Optional[int] = Field(default=None, description="Random seed")


class BacktestResultResponse(BaseModel):
    """Response with backtest results."""
    
    strategy_name: str
    num_episodes: int
    mean_pnl: float
    std_pnl: float
    mean_sharpe: float
    mean_costs: float
    win_rate: float
    best_pnl: float
    worst_pnl: float
    mean_hedge_error: float


class ComparisonResponse(BaseModel):
    """Response with strategy comparison."""
    
    strategies: List[BacktestResultResponse]
    best_strategy: str
    comparison_metric: str


def _get_strategy_class(strategy_name: str):
    """Get strategy class by name."""
    strategies = {
        "delta": DeltaHedging,
        "delta_gamma": DeltaGammaHedging,
        "delta_gamma_vega": DeltaGammaVegaHedging,
        "min_variance": MinimumVarianceHedging,
    }
    
    if strategy_name.lower() not in strategies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown strategy: {strategy_name}. Available: {list(strategies.keys())}",
        )
    
    return strategies[strategy_name.lower()]


def _get_strategy_kwargs(request: BaselineExecuteRequest) -> Dict[str, Any]:
    """Build strategy kwargs from request."""
    kwargs = {
        "S0": request.S0,
        "K": request.K,
        "T": request.T,
        "r": request.r,
        "sigma": request.sigma,
        "option_type": request.option_type,
        "transaction_cost_pct": request.transaction_cost_pct,
    }
    
    # Add strategy-specific params
    if request.strategy_name.lower() == "delta_gamma":
        kwargs["gamma_weight"] = request.gamma_weight
    elif request.strategy_name.lower() == "delta_gamma_vega":
        kwargs["gamma_weight"] = request.gamma_weight
        kwargs["vega_weight"] = request.vega_weight
    elif request.strategy_name.lower() == "min_variance":
        # Generate some dummy historical data for min variance
        # In production, this should come from actual historical data
        returns_stock = np.random.randn(252) * request.sigma / np.sqrt(252)
        returns_option = returns_stock * 0.5 + np.random.randn(252) * 0.01
        kwargs["historical_stock_returns"] = returns_stock
        kwargs["historical_option_returns"] = returns_option
    
    return kwargs


@router.post("/execute", response_model=BacktestResultResponse)
def execute_baseline(request: BaselineExecuteRequest):
    """
    Execute a baseline hedging strategy.
    
    Args:
        request: Execution configuration
    
    Returns:
        Backtest results
    """
    # Get strategy class
    strategy_class = _get_strategy_class(request.strategy_name)
    
    # Build kwargs
    strategy_kwargs = _get_strategy_kwargs(request)
    
    # Create evaluator
    evaluator = HedgingEvaluator(
        S0=request.S0,
        K=request.K,
        T=request.T,
        r=request.r,
        sigma=request.sigma,
        n_steps=request.n_steps,
        option_type=request.option_type,
    )
    
    # Run backtest
    try:
        result = evaluator.backtest_strategy(
            strategy_class=strategy_class,
            strategy_kwargs=strategy_kwargs,
            strategy_name=request.strategy_name,
            num_episodes=request.num_episodes,
            seed=request.seed,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Backtest failed: {str(e)}",
        )
    
    return BacktestResultResponse(**result.to_dict())


@router.post("/compare", response_model=ComparisonResponse)
def compare_baselines(request: BaselineCompareRequest):
    """
    Compare multiple baseline strategies.
    
    Args:
        request: Comparison configuration
    
    Returns:
        Comparison results
    """
    # Create evaluator
    evaluator = HedgingEvaluator(
        S0=request.S0,
        K=request.K,
        T=request.T,
        r=request.r,
        sigma=request.sigma,
        n_steps=request.n_steps,
        option_type=request.option_type,
    )
    
    # Prepare strategies list
    strategies = []
    for strategy_name in request.strategies:
        strategy_class = _get_strategy_class(strategy_name)
        
        # Build minimal kwargs (without strategy-specific params for now)
        strategy_kwargs = {
            "S0": request.S0,
            "K": request.K,
            "T": request.T,
            "r": request.r,
            "sigma": request.sigma,
            "option_type": request.option_type,
            "transaction_cost_pct": request.transaction_cost_pct,
        }
        
        # Add strategy-specific params with defaults
        if strategy_name.lower() == "delta_gamma":
            strategy_kwargs["gamma_weight"] = 0.5
        elif strategy_name.lower() == "delta_gamma_vega":
            strategy_kwargs["gamma_weight"] = 0.5
            strategy_kwargs["vega_weight"] = 0.5
        elif strategy_name.lower() == "min_variance":
            returns_stock = np.random.randn(252) * request.sigma / np.sqrt(252)
            returns_option = returns_stock * 0.5 + np.random.randn(252) * 0.01
            strategy_kwargs["historical_stock_returns"] = returns_stock
            strategy_kwargs["historical_option_returns"] = returns_option
        
        strategies.append((strategy_class, strategy_kwargs, strategy_name))
    
    # Run comparison
    try:
        comparison_df = evaluator.compare_strategies(
            strategies=strategies,
            num_episodes=request.num_episodes,
            seed=request.seed,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Comparison failed: {str(e)}",
        )
    
    # Convert to response
    results = []
    for _, row in comparison_df.iterrows():
        results.append(BacktestResultResponse(**row.to_dict()))
    
    # Find best strategy by mean PnL
    best_idx = comparison_df["mean_pnl"].idxmax()
    best_strategy = comparison_df.loc[best_idx, "strategy_name"]
    
    return ComparisonResponse(
        strategies=results,
        best_strategy=best_strategy,
        comparison_metric="mean_pnl",
    )


@router.get("/strategies")
def list_strategies():
    """
    List available baseline strategies.
    
    Returns:
        List of strategy names and descriptions
    """
    strategies = [
        {
            "name": "delta",
            "description": "Delta hedging - neutralizes first-order price risk",
            "parameters": [],
        },
        {
            "name": "delta_gamma",
            "description": "Delta-Gamma hedging - neutralizes first and second-order price risk",
            "parameters": ["gamma_weight"],
        },
        {
            "name": "delta_gamma_vega",
            "description": "Delta-Gamma-Vega hedging - neutralizes price and volatility risk",
            "parameters": ["gamma_weight", "vega_weight"],
        },
        {
            "name": "min_variance",
            "description": "Minimum Variance hedging - statistical hedge ratio from historical covariance",
            "parameters": ["historical_stock_returns", "historical_option_returns"],
        },
    ]
    
    return {"strategies": strategies, "count": len(strategies)}
