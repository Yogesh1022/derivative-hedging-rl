"""
Test Real Data Integration

Quick script to verify the real data infrastructure works correctly.
"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

print("=" * 80)
print("REAL DATA INTEGRATION TEST")
print("=" * 80)

# Test 1: Data Loader
print("\n[Test 1/3] Testing Historical Data Loader...")
print("-" * 80)

try:
    from src.data.historical_loader import HistoricalDataLoader
    
    loader = HistoricalDataLoader()
    market_data = loader.load_market_data()
    options_data = loader.load_options_data()
    
    print(f"✓ Market data loaded: {len(market_data)} rows")
    print(f"✓ Options data loaded: {len(options_data)} contracts")
    
    # Show stats
    stats = loader.get_market_stats()
    print(f"\nMarket Data Summary:")
    print(f"  Date range: {stats['date_range']}")
    print(f"  SPY price range: {stats['spy_price_range']}")
    print(f"  VIX range: {stats['vix_range']}")
    print(f"  Features: {stats['num_features']}")
    
    # Test episode generation
    episodes = loader.get_random_episodes(n_episodes=5, episode_length=50, seed=42)
    print(f"\n✓ Generated {len(episodes)} test episodes")
    print(f"  Episode length: {len(episodes[0])} days each")
    
    print("\n✅ Data Loader Test: PASSED")
    
except Exception as e:
    print(f"\n❌ Data Loader Test: FAILED")
    print(f"Error: {e}")
    print("\nMake sure you've run data preprocessing:")
    print("  python scripts/process_data.py")
    sys.exit(1)

# Test 2: Real Data Environment
print("\n[Test 2/3] Testing Real Data Environment...")
print("-" * 80)

try:
    from src.environments.real_data_env import create_real_data_env
    import numpy as np
    
    # Create environment
    env = create_real_data_env(
        difficulty="medium",
        n_episodes=10,
        episode_length=50,
        seed=42
    )
    
    print(f"✓ Environment created")
    print(f"  Observation space: {env.observation_space}")
    print(f"  Action space: {env.action_space}")
    
    # Test reset
    obs, info = env.reset(seed=42)
    print(f"\n✓ Environment reset successful")
    print(f"  Observation shape: {obs.shape}")
    print(f"  Initial spot price: ${info['spot_price']:.2f}")
    print(f"  Date: {info['date']}")
    
    # Test step
    action = env.action_space.sample()
    obs, reward, terminated, truncated, info = env.step(action)
    print(f"\n✓ Environment step successful")
    print(f"  Reward: {reward:.2f}")
    print(f"  Terminated: {terminated}")
    print(f"  Current hedge: {info['current_hedge']:.4f}")
    
    # Run a few more steps
    total_reward = reward
    for _ in range(5):
        action = env.action_space.sample()
        obs, reward, terminated, truncated, info = env.step(action)
        total_reward += reward
        if terminated or truncated:
            break
    
    print(f"\n✓ Multiple steps successful")
    print(f"  Total reward over 6 steps: {total_reward:.2f}")
    
    print("\n✅ Real Data Environment Test: PASSED")
    
except Exception as e:
    print(f"\n❌ Real Data Environment Test: FAILED")
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 3: Integration with Trainer
print("\n[Test 3/3] Testing Trainer Integration...")
print("-" * 80)

try:
    from src.agents.trainer import AgentTrainer
    from src.agents.config import get_config
    
    # For training with real data, we pass the env directly or use a custom approach
    # The trainer expects env_config for synthetic data, so we'll test differently
    
    print("✓ Testing agent prediction with real data environment...")
    
    # Create a simple PPO agent manually for testing
    from src.agents.ppo_agent import PPOHedgingAgent
    
    # Train very briefly just to test the workflow
    print(f"\nRunning mini training test (1,000 timesteps)...")
    
    agent = PPOHedgingAgent(
        env=env,
        learning_rate=0.001,
        seed=42
    )
    
    # Train for minimal steps
    agent.train(total_timesteps=1000, eval_freq=500)
    
    print(f"\n✓ Training test successful")
    print(f"  Agent type: PPO")
    print(f"  Timesteps: 1,000")
    
    # Test prediction
    obs, _ = env.reset(seed=123)
    action, _ = agent.predict(obs, deterministic=True)
    print(f"\n✓ Prediction test successful")
    print(f"  Predicted hedge ratio: {action[0]:.4f}")
    
    print("\n✅ Trainer Integration Test: PASSED")
    
except Exception as e:
    print(f"\n❌ Trainer Integration Test: FAILED")
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Final Summary
print("\n" + "=" * 80)
print("🎉 ALL TESTS PASSED!")
print("=" * 80)

print("\nReal Data Integration Status: ✅ WORKING")
print("\nYou can now:")
print("  1. Use real market data in all notebooks")
print("  2. Train agents on historical SPY options data (2015-2025)")
print("  3. Compare synthetic vs real data performance")

print("\nQuick Start:")
print("  # In any notebook:")
print("  from src.environments.real_data_env import create_real_data_env")
print("  env = create_real_data_env(difficulty='medium', n_episodes=100)")

print("\nNext steps:")
print("  1. Update notebooks following NOTEBOOKS_REAL_DATA_GUIDE.md")
print("  2. Train a model with real data")
print("  3. Compare results with synthetic data baseline")

print("\n✓ Integration test complete!")
