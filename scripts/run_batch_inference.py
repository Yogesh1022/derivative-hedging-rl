"""
Batch Inference Script

Run inference on batch of market data using trained RL agent.

Usage:
    python scripts/run_batch_inference.py --model models/ppo_final.zip --data data/test_data.csv --output results/predictions.csv
"""

import argparse
import logging
from pathlib import Path
import sys

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.inference.pipeline import InferencePipeline

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description="Batch inference for hedging models")
    
    # Model arguments
    parser.add_argument(
        "--model",
        type=str,
        required=True,
        help="Path to trained model (.zip file)",
    )
    parser.add_argument(
        "--model_type",
        type=str,
        default="PPO",
        choices=["PPO", "SAC"],
        help="Type of model",
    )
    
    # Data arguments
    parser.add_argument(
        "--data",
        type=str,
        required=True,
        help="Path to input CSV file",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="results/batch_predictions.csv",
        help="Path to save predictions",
    )
    parser.add_argument(
        "--report",
        type=str,
        default="results/batch_report.txt",
        help="Path to save report",
    )
    
    # Column names
    parser.add_argument("--spot_col", type=str, default="spot_price")
    parser.add_argument("--strike_col", type=str, default="strike")
    parser.add_argument("--ttm_col", type=str, default="time_to_maturity")
    parser.add_argument("--rate_col", type=str, default="risk_free_rate")
    parser.add_argument("--vol_col", type=str, default="volatility")
    parser.add_argument("--option_type_col", type=str, default="option_type")
    parser.add_argument("--hedge_col", type=str, default=None)
    
    # Inference options
    parser.add_argument(
        "--deterministic",
        action="store_true",
        help="Use deterministic policy (recommended for production)",
    )
    parser.add_argument(
        "--no_risk_limits",
        action="store_true",
        help="Disable risk limits",
    )
    parser.add_argument(
        "--max_hedge_ratio",
        type=float,
        default=2.0,
        help="Maximum hedge ratio",
    )
    
    # Benchmark
    parser.add_argument(
        "--benchmark",
        action="store_true",
        help="Run inference speed benchmark",
    )
    
    args = parser.parse_args()
    
    # Create output directory
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    
    try:
        # Initialize pipeline
        logger.info("=" * 80)
        logger.info("BATCH INFERENCE PIPELINE")
        logger.info("=" * 80)
        
        pipeline = InferencePipeline(
            model_path=args.model,
            model_type=args.model_type,
            apply_risk_limits=not args.no_risk_limits,
            max_hedge_ratio=args.max_hedge_ratio,
            log_predictions=True,
        )
        
        # Print model info
        model_info = pipeline.get_model_info()
        logger.info(f"Model Type: {model_info['model_type']}")
        logger.info(f"Model Path: {model_info['model_path']}")
        logger.info(f"Risk Limits: {model_info['risk_limits_enabled']}")
        logger.info(f"Max Hedge Ratio: {model_info['max_hedge_ratio']}")
        logger.info("")
        
        # Benchmark if requested
        if args.benchmark:
            logger.info("Running inference speed benchmark...")
            benchmark_results = pipeline.benchmark_inference_speed(n_samples=1000)
            logger.info(f"Throughput: {benchmark_results['samples_per_second']:.1f} samples/sec")
            logger.info(f"Latency: {benchmark_results['ms_per_sample']:.2f} ms/sample")
            logger.info("")
        
        # Run batch inference
        logger.info(f"Loading data from: {args.data}")
        results_df = pipeline.predict_batch(
            data=args.data,
            spot_col=args.spot_col,
            strike_col=args.strike_col,
            ttm_col=args.ttm_col,
            rate_col=args.rate_col,
            vol_col=args.vol_col,
            option_type_col=args.option_type_col,
            hedge_col=args.hedge_col,
            deterministic=args.deterministic,
            save_results=args.output,
        )
        
        logger.info(f"✓ Predictions saved to: {args.output}")
        
        # Generate report
        report = pipeline.generate_batch_report(
            results_df=results_df,
            output_path=args.report,
        )
        
        print("\n" + report)
        logger.info(f"✓ Report saved to: {args.report}")
        
        logger.info("")
        logger.info("=" * 80)
        logger.info("BATCH INFERENCE COMPLETE")
        logger.info("=" * 80)
        
    except Exception as e:
        logger.error(f"Batch inference failed: {e}")
        raise


if __name__ == "__main__":
    main()
