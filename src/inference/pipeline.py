"""
Complete Inference Pipeline for Derivative Hedging RL Models

Orchestrates the full inference workflow:
Data → Load → Clean → Pre-Process → Model Load → Inference → Post-Process
"""

import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Optional, Union, Tuple
import logging
from datetime import datetime

from src.inference.data_loader import DataLoader
from src.inference.preprocessor import DataPreprocessor
from src.inference.postprocessor import PostProcessor
from src.agents.ppo_agent import PPOHedgingAgent
from src.agents.sac_agent import SACHedgingAgent
from src.environments.hedging_env import OptionHedgingEnv
from src.agents.config import ENV_CONFIGS

logger = logging.getLogger(__name__)


class InferencePipeline:
    """
    Complete inference pipeline for production deployment.
    
    Follows the workflow:
    1. Data Loading - Load from various sources
    2. Data Cleaning - Handle missing values, outliers
    3. Preprocessing - Feature engineering, normalization
    4. Model Loading - Load trained RL agent
    5. Inference - Generate predictions
    6. Post-processing - Apply risk limits, format results
    """
    
    def __init__(
        self,
        model_path: Union[str, Path],
        model_type: str = "PPO",
        env_config: Optional[Dict] = None,
        apply_risk_limits: bool = True,
        max_hedge_ratio: float = 2.0,
        log_predictions: bool = True,
    ):
        """
        Initialize InferencePipeline.
        
        Args:
            model_path: Path to trained model
            model_type: Type of model ('PPO' or 'SAC')
            env_config: Environment config (if None, uses 'hard' config for curriculum-trained models)
            apply_risk_limits: Apply risk limits to predictions
            max_hedge_ratio: Maximum allowed hedge ratio
            log_predictions: Log all predictions
        """
        self.model_path = Path(model_path)
        self.model_type = model_type.upper()
        self.env_config = env_config if env_config is not None else ENV_CONFIGS["hard"]
        
        # Initialize components
        self.data_loader = DataLoader()
        self.preprocessor = DataPreprocessor(
            normalize=False,  # Environment handles normalization
            handle_missing="drop",
            clip_outliers=True,
        )
        self.postprocessor = PostProcessor(
            apply_risk_limits=apply_risk_limits,
            max_hedge_ratio=max_hedge_ratio,
            log_predictions=log_predictions,
        )
        
        # Load model
        self.agent = self._load_model()
        
        logger.info(
            f"InferencePipeline initialized with {model_type} model from {model_path}"
        )
    
    def _load_model(self):
        """Load trained RL agent."""
        if not self.model_path.exists():
            raise FileNotFoundError(f"Model not found: {self.model_path}")
        
        # Create environment for model loading
        # Note: Models trained with curriculum learning have the observation space 
        # from the final stage (typically 'hard' config with n_steps=252)
        env = OptionHedgingEnv(**self.env_config)
        
        if self.model_type == "PPO":
            agent = PPOHedgingAgent.load_pretrained(str(self.model_path), env=env)
            logger.info(f"Loaded PPO agent from {self.model_path}")
        elif self.model_type == "SAC":
            agent = SACHedgingAgent.load_pretrained(str(self.model_path), env=env)
            logger.info(f"Loaded SAC agent from {self.model_path}")
        else:
            raise ValueError(f"Unknown model type: {self.model_type}")
        
        return agent
    
    def predict_single(
        self,
        spot_price: float,
        strike: float,
        time_to_maturity: float,
        risk_free_rate: float,
        volatility: float,
        option_type: str = "call",
        current_hedge: float = 0.0,
        deterministic: bool = True,
    ) -> Dict:
        """
        Make prediction for a single observation.
        
        Args:
            spot_price: Current underlying price
            strike: Option strike price
            time_to_maturity: Time to expiration (years)
            risk_free_rate: Risk-free rate
            volatility: Implied volatility
            option_type: 'call' or 'put'
            current_hedge: Current hedge ratio
            deterministic: Use deterministic policy
            
        Returns:
            Dictionary with prediction and metadata
        """
        start_time = datetime.now()
        
        # Step 1: Load (create observation)
        observation_dict = self.data_loader.load_realtime_observation(
            spot_price=spot_price,
            strike=strike,
            time_to_maturity=time_to_maturity,
            risk_free_rate=risk_free_rate,
            volatility=volatility,
            option_type=option_type,
            current_hedge=current_hedge,
        )
        
        # Step 2 & 3: Clean and Preprocess
        features = self.preprocessor.engineer_features(
            spot_price=spot_price,
            strike=strike,
            time_to_maturity=time_to_maturity,
            risk_free_rate=risk_free_rate,
            volatility=volatility,
            option_type=option_type,
            current_hedge=current_hedge,
        )
        
        # Validate
        self.preprocessor.validate_preprocessed_data(features)
        
        # Step 4: Inference
        action, _ = self.agent.predict(features, deterministic=deterministic)
        
        # Step 5: Post-process
        processed = self.postprocessor.process_action(
            action=action,
            current_hedge=current_hedge,
            spot_price=spot_price,
        )
        
        # Add metadata
        confidence = self.postprocessor.calculate_confidence_score(
            action=action.item() if hasattr(action, 'item') else action,
            features=features,
        )
        
        inference_time = (datetime.now() - start_time).total_seconds()
        
        result = self.postprocessor.format_for_api(
            processed_action=processed,
            confidence=confidence,
            metadata={
                "model_type": self.model_type,
                "inference_time_ms": inference_time * 1000,
                "features_shape": features.shape,
            },
        )
        
        logger.info(
            f"Single prediction completed in {inference_time*1000:.2f}ms: "
            f"target_hedge={processed['target_hedge_ratio']:.4f}"
        )
        
        return result
    
    def predict_batch(
        self,
        data: Union[pd.DataFrame, str, Path],
        spot_col: str = "spot_price",
        strike_col: str = "strike",
        ttm_col: str = "time_to_maturity",
        rate_col: str = "risk_free_rate",
        vol_col: str = "volatility",
        option_type_col: str = "option_type",
        hedge_col: Optional[str] = None,
        deterministic: bool = True,
        save_results: Optional[str] = None,
    ) -> pd.DataFrame:
        """
        Make predictions for batch of observations.
        
        Args:
            data: DataFrame or path to CSV file
            spot_col: Column name for spot price
            strike_col: Column name for strike
            ttm_col: Column name for time to maturity
            rate_col: Column name for risk-free rate
            vol_col: Column name for volatility
            option_type_col: Column name for option type
            hedge_col: Column name for current hedge
            deterministic: Use deterministic policy
            save_results: Optional path to save results CSV
            
        Returns:
            DataFrame with predictions
        """
        start_time = datetime.now()
        
        # Step 1: Load data
        if isinstance(data, (str, Path)):
            df = self.data_loader.load_from_csv(data)
        else:
            df = data.copy()
        
        logger.info(f"Processing batch of {len(df)} observations")
        
        # Step 2 & 3: Preprocess batch
        features_batch = self.preprocessor.preprocess_batch(
            df=df,
            spot_col=spot_col,
            strike_col=strike_col,
            ttm_col=ttm_col,
            rate_col=rate_col,
            vol_col=vol_col,
            option_type_col=option_type_col,
            hedge_col=hedge_col,
        )
        
        # Step 4: Batch inference
        actions = []
        for features in features_batch:
            action, _ = self.agent.predict(features, deterministic=deterministic)
            actions.append(action)
        
        actions = np.array(actions)
        
        # Step 5: Post-process batch
        current_hedges = df[hedge_col].values if hedge_col and hedge_col in df.columns else None
        spot_prices = df[spot_col].values
        
        results_df = self.postprocessor.process_batch(
            actions=actions,
            current_hedges=current_hedges,
            spot_prices=spot_prices,
        )
        
        # Add original data columns
        for col in df.columns:
            if col not in results_df.columns:
                results_df[col] = df[col].values
        
        # Calculate confidence scores
        confidences = []
        for action, features in zip(actions, features_batch):
            conf = self.postprocessor.calculate_confidence_score(
                action=action.item() if hasattr(action, 'item') else action,
                features=features,
            )
            confidences.append(conf)
        
        results_df["confidence"] = confidences
        
        inference_time = (datetime.now() - start_time).total_seconds()
        logger.info(
            f"Batch inference completed in {inference_time:.2f}s "
            f"({len(df)/inference_time:.1f} samples/sec)"
        )
        
        # Save if requested
        if save_results:
            # Ensure directory exists
            save_path = Path(save_results)
            save_path.parent.mkdir(parents=True, exist_ok=True)
            results_df.to_csv(save_results, index=False)
            logger.info(f"Results saved to {save_results}")
        
        return results_df
    
    def generate_batch_report(
        self,
        results_df: pd.DataFrame,
        output_path: Optional[str] = None,
    ) -> str:
        """
        Generate report for batch inference.
        
        Args:
            results_df: DataFrame with inference results
            output_path: Optional path to save report
            
        Returns:
            Report text
        """
        return self.postprocessor.generate_report(
            results_df=results_df,
            output_path=output_path,
        )
    
    def get_model_info(self) -> Dict:
        """
        Get information about loaded model.
        
        Returns:
            Dictionary with model information
        """
        params = self.agent.get_parameters()
        
        info = {
            "model_type": self.model_type,
            "model_path": str(self.model_path),
            "env_config": self.env_config,
            "parameters": params,
            "risk_limits_enabled": self.postprocessor.apply_risk_limits,
            "max_hedge_ratio": self.postprocessor.max_hedge_ratio,
        }
        
        return info
    
    def benchmark_inference_speed(
        self,
        n_samples: int = 1000,
    ) -> Dict[str, float]:
        """
        Benchmark inference speed.
        
        Args:
            n_samples: Number of samples to benchmark
            
        Returns:
            Dictionary with benchmark results
        """
        logger.info(f"Benchmarking inference speed with {n_samples} samples")
        
        # Generate random observations
        features_batch = []
        for _ in range(n_samples):
            features = self.preprocessor.engineer_features(
                spot_price=100.0,
                strike=100.0,
                time_to_maturity=0.25,
                risk_free_rate=0.05,
                volatility=0.2,
                option_type="call",
                current_hedge=0.0,
            )
            features_batch.append(features)
        
        features_batch = np.array(features_batch)
        
        # Benchmark
        start_time = datetime.now()
        
        for features in features_batch:
            self.agent.predict(features, deterministic=True)
        
        total_time = (datetime.now() - start_time).total_seconds()
        
        results = {
            "n_samples": n_samples,
            "total_time_seconds": total_time,
            "samples_per_second": n_samples / total_time,
            "ms_per_sample": (total_time / n_samples) * 1000,
        }
        
        logger.info(
            f"Benchmark complete: {results['samples_per_second']:.1f} samples/sec, "
            f"{results['ms_per_sample']:.2f} ms/sample"
        )
        
        return results
