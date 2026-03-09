"""
Test script to verify trained model can be loaded in ML service
"""

import os
from pathlib import Path

# Disable TensorBoard to avoid import errors
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

from stable_baselines3 import PPO
import numpy as np

def test_model_loading():
    """Test loading the trained PPO model"""
    
    model_path = Path("models/rl_agent_ppo.zip")
    
    print("=" * 60)
    print("MODEL LOADING TEST")
    print("=" * 60)
    
    # Check if model exists
    if not model_path.exists():
        print(f"❌ Model not found at {model_path}")
        return False
    
    print(f"✓ Model file found: {model_path}")
    print(f"  Size: {model_path.stat().st_size / 1024:.2f} KB")
    
    try:
        # Load the model
        print("\nLoading PPO model...")
        model = PPO.load(str(model_path))
        print("✓ Model loaded successfully!")
        
        # Get model information
        print("\nModel Information:")
        print(f"  Algorithm: PPO")
        print(f"  Action space: {model.action_space}")
        print(f"  Observation space: {model.observation_space}")
        
        # Test prediction
        print("\nTesting prediction...")
        # Create a dummy observation (matching the environment's observation space)
        obs_dim = model.observation_space.shape[0]
        dummy_obs = np.random.randn(obs_dim).astype(np.float32)
        
        action, _ = model.predict(dummy_obs, deterministic=True)
        print(f"✓ Prediction successful!")
        print(f"  Sample observation shape: {dummy_obs.shape}")
        print(f"  Predicted action: {action}")
        
        # Get policy network info
        print("\nPolicy Network:")
        print(f"  Policy class: {model.policy.__class__.__name__}")
        if hasattr(model.policy, 'mlp_extractor'):
            print(f"  Features extractor: {model.policy.features_extractor_class.__name__}")
        
        print("\n" + "=" * 60)
        print("✅ MODEL READY FOR DEPLOYMENT")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error loading model: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_model_loading()
    exit(0 if success else 1)
