"""Pydantic schemas for API request/response validation."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ============================================
# User Schemas
# ============================================


class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8)


class UserInDB(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: Optional[datetime] = None


class User(UserInDB):
    pass


# ============================================
# Authentication Schemas
# ============================================


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[UUID] = None
    email: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ============================================
# Dataset Schemas
# ============================================


class DatasetBase(BaseModel):
    name: str
    description: Optional[str] = None
    ticker: Optional[str] = None
    data_type: str  # 'historical', 'synthetic_gbm', 'synthetic_heston'


class DatasetCreate(DatasetBase):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None


class DatasetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class Dataset(DatasetBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    num_samples: Optional[int]
    file_path: Optional[str]
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: Optional[datetime]


# ============================================
# Experiment Schemas
# ============================================


class ExperimentBase(BaseModel):
    name: str
    description: Optional[str] = None
    algorithm: str  # 'DQN', 'PPO', 'SAC', 'DDPG'


class ExperimentCreate(ExperimentBase):
    dataset_id: Optional[UUID] = None
    env_config: Dict[str, Any]
    hyperparameters: Dict[str, Any]
    total_timesteps: int = Field(..., gt=0)


class ExperimentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    current_timestep: Optional[int] = None
    metrics: Optional[Dict[str, Any]] = None


class Experiment(ExperimentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: UUID
    dataset_id: Optional[UUID]
    status: str
    env_config: Dict[str, Any]
    hyperparameters: Dict[str, Any]
    total_timesteps: int
    current_timestep: int
    num_episodes: Optional[int]
    best_reward: Optional[float]
    final_reward: Optional[float]
    training_time: Optional[float]
    metrics: Optional[Dict[str, Any]]
    model_path: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]


# ============================================
# Trained Model Schemas
# ============================================


class TrainedModelBase(BaseModel):
    name: str
    version: str = "1.0.0"
    algorithm: str
    description: Optional[str] = None


class TrainedModelCreate(TrainedModelBase):
    experiment_id: Optional[UUID] = None
    model_path: str
    config_path: Optional[str] = None
    performance_metrics: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class TrainedModelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_deployed: Optional[bool] = None


class TrainedModel(TrainedModelBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: UUID
    experiment_id: Optional[UUID]
    model_path: str
    config_path: Optional[str]
    performance_metrics: Optional[Dict[str, Any]]
    trained_on_dataset: Optional[str]
    training_duration: Optional[float]
    total_parameters: Optional[int]
    metadata: Optional[Dict[str, Any]]
    is_deployed: bool
    deployed_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]


# ============================================
# Evaluation Schemas
# ============================================


class EvaluationBase(BaseModel):
    name: str
    test_dataset_id: Optional[UUID] = None


class EvaluationCreate(EvaluationBase):
    test_start_date: Optional[datetime] = None
    test_end_date: Optional[datetime] = None


class EvaluationUpdate(BaseModel):
    sharpe_ratio: Optional[float] = None
    max_drawdown: Optional[float] = None
    total_pnl: Optional[float] = None
    metrics: Optional[Dict[str, Any]] = None


class Evaluation(EvaluationBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    experiment_id: UUID
    test_start_date: Optional[datetime]
    test_end_date: Optional[datetime]
    sharpe_ratio: Optional[float]
    max_drawdown: Optional[float]
    total_pnl: Optional[float]
    win_rate: Optional[float]
    avg_trade_pnl: Optional[float]
    value_at_risk: Optional[float]
    conditional_var: Optional[float]
    hedge_error_mean: Optional[float]
    hedge_error_std: Optional[float]
    transaction_cost_total: Optional[float]
    num_rebalances: Optional[int]
    metrics: Optional[Dict[str, Any]]
    results_path: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]


# ============================================
# Market Data Schemas
# ============================================


class MarketDataBase(BaseModel):
    ticker: str
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int


class MarketDataCreate(MarketDataBase):
    adjusted_close: Optional[float] = None
    dividend: Optional[float] = None
    split_ratio: Optional[float] = None
    source: Optional[str] = None


class MarketData(MarketDataBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    adjusted_close: Optional[float]
    dividend: Optional[float]
    split_ratio: Optional[float]
    source: Optional[str]
    created_at: datetime


# ============================================
# Generic Response Schemas
# ============================================


class Message(BaseModel):
    message: str


class ErrorResponse(BaseModel):
    detail: str


class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[Any]
