"""
Quick test to verify model loads
"""
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

try:
    from stable_baselines3 import PPO
    print("✅ Stable-baselines3 imported successfully")
    
    model = PPO.load("models/rl_agent_ppo.zip")
    print("✅ MODEL LOADED SUCCESSFULLY!")
    print(f"Action space: {model.action_space}")
    print(f"Observation space: {model.observation_space}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
