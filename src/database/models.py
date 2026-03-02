"""Database models for the application."""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Enum as SQLEnum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.database import Base


class User(Base):
    """User model for authentication and authorization."""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    experiments = relationship("Experiment", back_populates="user", cascade="all, delete-orphan")
    models = relationship("TrainedModel", back_populates="user", cascade="all, delete-orphan")


class Dataset(Base):
    """Dataset model for storing information about market data."""

    __tablename__ = "datasets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text)
    ticker = Column(String(20))
    data_type = Column(String(50))  # 'historical', 'synthetic_gbm', 'synthetic_heston'
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    num_samples = Column(Integer)
    file_path = Column(String(500))
    meta_data = Column(JSON)  # Renamed from metadata to avoid SQLAlchemy reserved name
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    experiments = relationship("Experiment", back_populates="dataset")


class Experiment(Base):
    """Experiment model for tracking RL training experiments."""

    __tablename__ = "experiments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id"))
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    algorithm = Column(String(50))  # 'DQN', 'PPO', 'SAC', 'DDPG'
    status = Column(String(50), default="pending")  # 'pending', 'running', 'completed', 'failed'

    # Environment configuration
    env_config = Column(JSON)  # strike, maturity, position_size, etc.

    # Agent hyperparameters
    hyperparameters = Column(JSON)  # learning_rate, gamma, batch_size, etc.

    # Training configuration
    total_timesteps = Column(Integer)
    current_timestep = Column(Integer, default=0)
    num_episodes = Column(Integer)

    # Metrics
    best_reward = Column(Float)
    final_reward = Column(Float)
    training_time = Column(Float)  # seconds
    metrics = Column(JSON)  # Additional metrics

    # Model reference
    model_path = Column(String(500))

    # Timestamps
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="experiments")
    dataset = relationship("Dataset", back_populates="experiments")
    evaluations = relationship(
        "Evaluation", back_populates="experiment", cascade="all, delete-orphan"
    )


class TrainedModel(Base):
    """Model for storing trained RL models metadata."""

    __tablename__ = "trained_models"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    experiment_id = Column(UUID(as_uuid=True), ForeignKey("experiments.id"))
    name = Column(String(255), nullable=False, index=True)
    version = Column(String(50), default="1.0.0")
    algorithm = Column(String(50), nullable=False)
    description = Column(Text)

    # Model files
    model_path = Column(String(500), nullable=False)
    config_path = Column(String(500))

    # Model metrics
    performance_metrics = Column(JSON)

    # Model metadata
    trained_on_dataset = Column(String(255))
    training_duration = Column(Float)
    total_parameters = Column(Integer)
    meta_data = Column(JSON)  # Renamed from metadata to avoid SQLAlchemy reserved name

    # Deployment status
    is_deployed = Column(Boolean, default=False)
    deployed_at = Column(DateTime(timezone=True))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="models")


class Evaluation(Base):
    """Evaluation results for trained models."""

    __tablename__ = "evaluations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    experiment_id = Column(UUID(as_uuid=True), ForeignKey("experiments.id"), nullable=False)
    name = Column(String(255), nullable=False)

    # Test dataset info
    test_dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id"))
    test_start_date = Column(DateTime)
    test_end_date = Column(DateTime)

    # Performance metrics
    sharpe_ratio = Column(Float)
    max_drawdown = Column(Float)
    total_pnl = Column(Float)
    win_rate = Column(Float)
    avg_trade_pnl = Column(Float)
    value_at_risk = Column(Float)
    conditional_var = Column(Float)

    # Hedging metrics
    hedge_error_mean = Column(Float)
    hedge_error_std = Column(Float)
    transaction_cost_total = Column(Float)
    num_rebalances = Column(Integer)

    # Additional metrics
    metrics = Column(JSON)

    # Results files
    results_path = Column(String(500))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    experiment = relationship("Experiment", back_populates="evaluations")


class MarketData(Base):
    """Time-series market data (consider using TimescaleDB)."""

    __tablename__ = "market_data"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ticker = Column(String(20), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)

    # OHLCV data
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(Integer)

    # Additional fields
    adjusted_close = Column(Float)
    dividend = Column(Float)
    split_ratio = Column(Float)

    # Metadata
    source = Column(String(50))  # 'yfinance', 'alpha_vantage', etc.

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class OptionChain(Base):
    """Options chain data."""

    __tablename__ = "option_chains"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ticker = Column(String(20), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    option_type = Column(String(10), nullable=False)  # 'call' or 'put'
    expiration_date = Column(DateTime, nullable=False, index=True)
    strike = Column(Float, nullable=False)

    # Option prices
    bid = Column(Float)
    ask = Column(Float)
    last = Column(Float)
    volume = Column(Integer)
    open_interest = Column(Integer)

    # Greeks
    implied_volatility = Column(Float)
    delta = Column(Float)
    gamma = Column(Float)
    vega = Column(Float)
    theta = Column(Float)
    rho = Column(Float)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TrainingLog(Base):
    """Detailed training logs for experiments."""

    __tablename__ = "training_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    experiment_id = Column(UUID(as_uuid=True), ForeignKey("experiments.id"), nullable=False)
    timestep = Column(Integer, nullable=False)
    episode = Column(Integer)

    # Training metrics
    episode_reward = Column(Float)
    episode_length = Column(Integer)
    mean_reward = Column(Float)
    loss = Column(Float)
    learning_rate = Column(Float)

    # Additional logs
    metrics = Column(JSON)

    timestamp = Column(DateTime(timezone=True), server_default=func.now())
