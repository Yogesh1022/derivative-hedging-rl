"""
Post-Processor for Inference Pipeline

Handles post-processing of model predictions:
- Action interpretation
- Risk checks
- Result formatting
- Logging and monitoring
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class PostProcessor:
    """Post-process model predictions for production use."""
    
    def __init__(
        self,
        apply_risk_limits: bool = True,
        max_hedge_ratio: float = 2.0,
        log_predictions: bool = True,
    ):
        """
        Initialize PostProcessor.
        
        Args:
            apply_risk_limits: Whether to apply risk limits to predictions
            max_hedge_ratio: Maximum allowed hedge ratio (abs value)
            log_predictions: Whether to log predictions
        """
        self.apply_risk_limits = apply_risk_limits
        self.max_hedge_ratio = max_hedge_ratio
        self.log_predictions = log_predictions
        self.prediction_history: List[Dict] = []
        
        logger.info(f"PostProcessor initialized with risk limits: {apply_risk_limits}")
    
    def process_action(
        self,
        action: np.ndarray,
        current_hedge: float = 0.0,
        spot_price: float = 100.0,
        apply_limits: Optional[bool] = None,
    ) -> Dict[str, float]:
        """
        Process raw model action into executable trading decision.
        
        Args:
            action: Raw model output (hedge ratio adjustment)
            current_hedge: Current hedge position
            spot_price: Current spot price
            apply_limits: Override risk limits setting
            
        Returns:
            Dictionary with processed action details
        """
        # Extract scalar action
        if isinstance(action, np.ndarray):
            if action.ndim > 0:
                action = action.item()
        
        # The action is typically the target hedge ratio
        target_hedge = float(action)
        
        # Apply risk limits if enabled
        if apply_limits if apply_limits is not None else self.apply_risk_limits:
            target_hedge = self._apply_risk_limits(target_hedge)
        
        # Calculate hedge adjustment
        hedge_adjustment = target_hedge - current_hedge
        
        # Calculate number of shares to trade
        # For a call option, hedge adjustment is the change in delta hedge
        shares_to_trade = hedge_adjustment
        
        result = {
            "target_hedge_ratio": target_hedge,
            "current_hedge_ratio": current_hedge,
            "hedge_adjustment": hedge_adjustment,
            "shares_to_trade": shares_to_trade,
            "trade_value": shares_to_trade * spot_price,
            "timestamp": datetime.now().isoformat(),
        }
        
        if self.log_predictions:
            self.prediction_history.append(result)
            logger.info(
                f"Action processed: target_hedge={target_hedge:.4f}, "
                f"adjustment={hedge_adjustment:.4f}, shares={shares_to_trade:.2f}"
            )
        
        return result
    
    def _apply_risk_limits(self, hedge_ratio: float) -> float:
        """
        Apply risk limits to hedge ratio.
        
        Args:
            hedge_ratio: Proposed hedge ratio
            
        Returns:
            Risk-adjusted hedge ratio
        """
        original = hedge_ratio
        
        # Clip to maximum allowed
        hedge_ratio = np.clip(hedge_ratio, -self.max_hedge_ratio, self.max_hedge_ratio)
        
        if original != hedge_ratio:
            logger.warning(
                f"Hedge ratio clipped: {original:.4f} -> {hedge_ratio:.4f}"
            )
        
        return hedge_ratio
    
    def process_batch(
        self,
        actions: np.ndarray,
        current_hedges: Optional[np.ndarray] = None,
        spot_prices: Optional[np.ndarray] = None,
    ) -> pd.DataFrame:
        """
        Process batch of predictions.
        
        Args:
            actions: Array of model actions (n_samples,)
            current_hedges: Array of current hedge ratios (n_samples,)
            spot_prices: Array of spot prices (n_samples,)
            
        Returns:
            DataFrame with processed results
        """
        n_samples = len(actions)
        
        # Default values if not provided
        if current_hedges is None:
            current_hedges = np.zeros(n_samples)
        if spot_prices is None:
            spot_prices = np.full(n_samples, 100.0)
        
        results = []
        for i in range(n_samples):
            result = self.process_action(
                action=actions[i],
                current_hedge=current_hedges[i],
                spot_price=spot_prices[i],
            )
            results.append(result)
        
        df = pd.DataFrame(results)
        logger.info(f"Processed batch of {n_samples} predictions")
        
        return df
    
    def calculate_confidence_score(
        self,
        action: float,
        features: np.ndarray,
    ) -> float:
        """
        Calculate confidence score for prediction.
        
        Args:
            action: Model action
            features: Input features
            
        Returns:
            Confidence score (0-1)
        """
        # Simple heuristic: confidence based on input quality
        # In production, use model uncertainty estimates
        
        # Check if inputs are reasonable
        moneyness = features[0]
        ttm = features[2]
        
        confidence = 1.0
        
        # Reduce confidence for extreme moneyness
        if moneyness < 0.8 or moneyness > 1.2:
            confidence *= 0.8
        
        # Reduce confidence for very short or long TTM
        if ttm < 0.01 or ttm > 1.0:
            confidence *= 0.9
        
        # Reduce confidence for extreme actions
        if abs(action) > 1.5:
            confidence *= 0.7
        
        return confidence
    
    def format_for_api(
        self,
        processed_action: Dict[str, float],
        confidence: Optional[float] = None,
        metadata: Optional[Dict] = None,
    ) -> Dict:
        """
        Format processed action for API response.
        
        Args:
            processed_action: Processed action dictionary
            confidence: Confidence score
            metadata: Additional metadata
            
        Returns:
            API-ready dictionary
        """
        api_response = {
            "status": "success",
            "prediction": {
                "target_hedge_ratio": processed_action["target_hedge_ratio"],
                "shares_to_trade": processed_action["shares_to_trade"],
                "trade_value": processed_action["trade_value"],
            },
            "timestamp": processed_action["timestamp"],
        }
        
        if confidence is not None:
            api_response["confidence"] = confidence
        
        if metadata:
            api_response["metadata"] = metadata
        
        return api_response
    
    def generate_report(
        self,
        results_df: pd.DataFrame,
        output_path: Optional[str] = None,
    ) -> str:
        """
        Generate inference report.
        
        Args:
            results_df: DataFrame with inference results
            output_path: Optional path to save report
            
        Returns:
            Report text
        """
        report = []
        report.append("=" * 80)
        report.append("INFERENCE BATCH REPORT")
        report.append("=" * 80)
        report.append(f"Timestamp: {datetime.now().isoformat()}")
        report.append(f"Number of predictions: {len(results_df)}")
        report.append("")
        
        # Summary statistics
        report.append("HEDGE RATIO STATISTICS")
        report.append("-" * 80)
        report.append(f"Mean target hedge: {results_df['target_hedge_ratio'].mean():.4f}")
        report.append(f"Std target hedge: {results_df['target_hedge_ratio'].std():.4f}")
        report.append(f"Min target hedge: {results_df['target_hedge_ratio'].min():.4f}")
        report.append(f"Max target hedge: {results_df['target_hedge_ratio'].max():.4f}")
        report.append("")
        
        # Trade statistics
        report.append("TRADE STATISTICS")
        report.append("-" * 80)
        report.append(f"Total shares to trade: {results_df['shares_to_trade'].sum():.2f}")
        report.append(f"Total trade value: ${results_df['trade_value'].sum():,.2f}")
        report.append(f"Mean hedge adjustment: {results_df['hedge_adjustment'].mean():.4f}")
        report.append("")
        
        report_text = "\n".join(report)
        
        if output_path:
            with open(output_path, "w") as f:
                f.write(report_text)
            logger.info(f"Report saved to {output_path}")
        
        return report_text
    
    def get_prediction_history(self) -> pd.DataFrame:
        """
        Get history of all predictions.
        
        Returns:
            DataFrame with prediction history
        """
        if not self.prediction_history:
            return pd.DataFrame()
        
        return pd.DataFrame(self.prediction_history)
    
    def clear_history(self):
        """Clear prediction history."""
        self.prediction_history.clear()
        logger.info("Prediction history cleared")
