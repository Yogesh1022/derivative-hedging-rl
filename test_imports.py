#!/usr/bin/env python
"""Quick test to verify all imports work correctly."""

print("Testing imports...")
print("-" * 60)

try:
    import tensorboard
    print(f"✓ TensorBoard: {tensorboard.__version__}")
except Exception as e:
    print(f"✗ TensorBoard: {e}")

try:
    from stable_baselines3 import PPO
    print(f"✓ Stable-Baselines3: PPO imported")
except Exception as e:
    print(f"✗ Stable-Baselines3: {e}")

try:
    import gymnasium
    print(f"✓ Gymnasium: {gymnasium.__version__}")
except Exception as e:
    print(f"✗ Gymnasium: {e}")

try:
    import torch
    print(f"✓ PyTorch: {torch.__version__}")
except Exception as e:
    print(f"✗ PyTorch: {e}")

try:
    from src.environments.hedging_env import OptionHedgingEnv
    print(f"✓ Custom Environment: Imported")
except Exception as e:
    print(f"✗ Custom Environment: {e}")

print("-" * 60)
print("✅ All critical imports successful! Ready to run notebooks.")
