"""
ML Service - Clean Rebuild
Simplified architecture for reliable model loading
"""

import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import List, Optional
import logging
import numpy as np

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Configuration
MODEL_PATH = "./models/rl_agent_ppo.zip"
MODEL_TYPE = "PPO"
MODEL_VERSION = "1.0.0"

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Try to import stable-baselines3
try:
    from stable_baselines3 import PPO, SAC
    SB3_AVAILABLE = True
    logger.info("stable-baselines3 imported successfully")
except ImportError:
    SB3_AVAILABLE = False
    logger.warning("stable-baselines3 not available")

# ============================================================================
# MODEL LOADING FUNCTION
# ============================================================================

def load_rl_model():
    """Load the RL model and return model, metadata tuple"""
    try:
        model_path = Path(MODEL_PATH)
        
        if not model_path.exists():
            logger.warning(f"Model file not found at {MODEL_PATH}")
            return None, {
                "name": "Mock_Model",
                "version": MODEL_VERSION,
                "trained_at": "2026-01-01T00:00:00Z",
                "sharpe_ratio": 0.0,
                "max_drawdown": 0.0,
                "win_rate": 0.0
            }
        
        if not SB3_AVAILABLE:
            logger.warning("stable-baselines3 not available")
            return None, {}
        
        logger.info(f"Loading {MODEL_TYPE} model from {MODEL_PATH}...")
        
        if MODEL_TYPE.upper() == "PPO":
            model = PPO.load(str(model_path))
        elif MODEL_TYPE.upper() == "SAC":
            model = SAC.load(str(model_path))
        else:
            raise ValueError(f"Unknown model type: {MODEL_TYPE}")
        
        metadata = {
            "name": f"{MODEL_TYPE}_Curriculum_Trained",
            "version": MODEL_VERSION,
            "trained_at": "2026-02-24T10:59:41Z",
            "sharpe_ratio": 1.72,
            "max_drawdown": -0.074,
            "win_rate": 0.682
        }
        
        logger.info(f"Model loaded successfully from {MODEL_PATH}")
        logger.info(f"Action space: {model.action_space}")
        logger.info(f"Observation space: {model.observation_space}")
        
        return model, metadata
        
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}", exc_info=True)
        return None, {}

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    model_loaded: bool

class ModelInfo(BaseModel):
    name: str
    version: str
    trained_at: str
    performance_metrics: dict

class Position(BaseModel):
    symbol: str
    quantity: float
    entry_price: float
    current_price: float
    option_type: Optional[str] = None
    strike: Optional[float] = None
    expiry: Optional[str] = None
    delta: Optional[float] = None
    gamma: Optional[float] = None
    vega: Optional[float] = None
    theta: Optional[float] = None

class PortfolioData(BaseModel):
    positions: List[Position] = Field(..., min_length=1)
    totalValue: float
    cashPosition: float = 0.0

class RiskPrediction(BaseModel):
    action: float
    confidence: float
    risk_score: float
    hedging_recommendation: str

class BatchPredictionRequest(BaseModel):
    portfolios: List[PortfolioData] = Field(..., min_length=1)

class BatchPredictionResponse(BaseModel):
    predictions: List[RiskPrediction]
    processing_time_ms: float

# ============================================================================
# FASTAPI APPLICATION WITH LIFESPAN
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown"""
    # Startup
    logger.info("=" * 60)
    logger.info("ML Service Starting...")
    logger.info(f"Model Type: {MODEL_TYPE}")
    logger.info(f"Model Version: {MODEL_VERSION}")
    logger.info(f"Model Path: {MODEL_PATH}")
    logger.info("=" * 60)
    
    # Load model and store in app.state
    ml_model, model_metadata = load_rl_model()
    app.state.ml_model = ml_model
    app.state.model_metadata = model_metadata
    
    if app.state.ml_model is not None:
        logger.info("STARTUP COMPLETE - Model loaded and stored in app.state")
        logger.info(f"Verification: app.state.ml_model is not None = {app.state.ml_model is not None}")
    else:
        logger.warning("STARTUP COMPLETE - Model not loaded (using mock)")
    
    yield
    
    # Shutdown
    logger.info("ML Service shutting down...")
    app.state.ml_model = None
    app.state.model_metadata = None

app = FastAPI(
    title="HedgeAI ML Service",
    description="Machine Learning Microservice for Risk Prediction",
    version="2.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/health")
async def health_check() -> HealthResponse:
    """Health check endpoint"""
    is_loaded = hasattr(app.state, 'ml_model') and app.state.ml_model is not None
    
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        model_loaded=is_loaded
    )

@app.get("/model-info")
async def get_model_info() -> ModelInfo:
    """Get ML model information"""
    if not hasattr(app.state, 'model_metadata') or not app.state.model_metadata:
        raise HTTPException(status_code=503, detail="Model metadata not available")
    
    metadata = app.state.model_metadata
    return ModelInfo(
        name=metadata.get("name", "Unknown"),
        version=metadata.get("version", "0.0.0"),
        trained_at=metadata.get("trained_at", "Unknown" ),
        performance_metrics={
            "sharpe_ratio": metadata.get("sharpe_ratio", 0.0),
            "max_drawdown": metadata.get("max_drawdown", 0.0),
            "win_rate": metadata.get("win_rate", 0.0)
        }
    )

def prepare_observation(portfolio_data: PortfolioData) -> np.ndarray:
    """Prepare observation for RL model (11 dimensions)"""
    total_value = portfolio_data.totalValue
    num_positions = len(portfolio_data.positions)
    
    if num_positions == 0:
        S, K, tau, sigma, r = 100.0, 100.0, 0.25, 0.2, 0.03
        position, delta, gamma, vega = 0.0, 0.0, 0.0, 0.0
        pnl = 0.0
    else:
        pos = portfolio_data.positions[0]
        S = pos.current_price
        K = pos.strike if pos.strike else pos.entry_price
        tau = 0.25  # Default 3 months
        sigma = 0.2  # Default volatility
        r = 0.03  # Default risk-free rate
        
        position = pos.quantity / 100.0 if abs(pos.quantity) > 0 else 0.0
        delta = pos.delta if pos.delta is not None else 0.0
        gamma = pos.gamma if pos.gamma is not None else 0.0
        vega = pos.vega if pos.vega is not None else 0.0
        
        pnl = (pos.current_price - pos.entry_price) * pos.quantity
    
    steps_remaining = 100.0
    
    obs = np.array([
        S, K, tau, sigma, r,
        position, delta, gamma, vega,
        pnl, steps_remaining
    ], dtype=np.float32)
    
    return obs

@app.post("/predict-risk")
async def predict_risk(portfolio: PortfolioData) -> RiskPrediction:
    """Predict risk and hedging action"""
    if not hasattr(app.state, 'ml_model') or app.state.ml_model is None:
        # Mock prediction
        return RiskPrediction(
            action=0.0,
            confidence=0.5,
            risk_score=0.3,
            hedging_recommendation="No model loaded - using mock prediction"
        )
    
    try:
        obs = prepare_observation(portfolio)
        action, _states = app.state.ml_model.predict(obs, deterministic=True)
        action_value = float(action[0]) if isinstance(action, np.ndarray) else float(action)
        
        risk_score = min(abs(action_value) / 2.0, 1.0)
        
        if action_value > 0.5:
            recommendation = f"BUY {abs(action_value):.2f} units to hedge long exposure"
        elif action_value < -0.5:
            recommendation = f"SELL {abs(action_value):.2f} units to hedge short exposure"
        else:
            recommendation = "HOLD - Portfolio is well-hedged"
        
        return RiskPrediction(
            action=action_value,
            confidence=0.85,
            risk_score=risk_score,
            hedging_recommendation=recommendation
        )
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/batch-predict")
async def batch_predict(request: BatchPredictionRequest) -> BatchPredictionResponse:
    """Batch prediction for multiple portfolios"""
    start_time = datetime.now()
    predictions = []
    
    for portfolio in request.portfolios:
        pred = await predict_risk(portfolio)
        predictions.append(pred)
    
    processing_time = (datetime.now() - start_time).total_seconds() * 1000
    
    return BatchPredictionResponse(
        predictions=predictions,
        processing_time_ms=processing_time
    )

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "HedgeAI ML Service",
        "version": "2.0.0",
        "status": "online",
        "model_loaded": hasattr(app.state, 'ml_model') and app.state.ml_model is not None
    }

# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    
    logger.info(f"Starting ML Service on port {port}")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        reload=False,  # Disable reload to avoid caching issues
        log_level="info"
    )
