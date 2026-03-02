"""
View Training Results - Analyze and visualize the training output
"""
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

# Set style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (14, 10)

print("=" * 80)
print("TRAINING RESULTS ANALYSIS")
print("=" * 80)
print()

# 1. Load monitor logs (episode rewards during training)
print("📊 Loading Training Monitor Logs...")
monitor_file = Path("models/quickstart/monitor_logs/difficulty_medium.monitor.csv")

if monitor_file.exists():
    # Read monitor data (format: reward, length, time)
    # Skip the first 2 header lines (JSON metadata + CSV header)
    monitor_data = pd.read_csv(monitor_file, names=['reward', 'length', 'time'], skiprows=2)
    
    print(f"✓ Loaded {len(monitor_data)} training episodes")
    print()
    print("Training Progress Statistics:")
    print("-" * 80)
    print(f"Total Episodes: {len(monitor_data)}")
    print(f"Initial Mean Reward (first 10): {monitor_data['reward'].head(10).mean():.2f}")
    print(f"Final Mean Reward (last 10): {monitor_data['reward'].tail(10).mean():.2f}")
    print(f"Improvement: {monitor_data['reward'].tail(10).mean() - monitor_data['reward'].head(10).mean():.2f}")
    print(f"Best Episode Reward: {monitor_data['reward'].max():.2f}")
    print(f"Worst Episode Reward: {monitor_data['reward'].min():.2f}")
    print(f"Final Std Dev (last 20): {monitor_data['reward'].tail(20).std():.2f}")
    print()
else:
    print("❌ Monitor file not found")
    monitor_data = None

# 2. Load evaluation logs (periodic evaluations)
print("📈 Loading Evaluation Logs...")
eval_file = Path("models/quickstart/quick_train/eval_logs/evaluations.npz")

if eval_file.exists():
    eval_data = np.load(eval_file)
    timesteps = eval_data['timesteps']
    results = eval_data['results']  # shape: (n_evals, n_eval_episodes)
    
    # Calculate mean and std for each evaluation
    mean_rewards = results.mean(axis=1)
    std_rewards = results.std(axis=1)
    
    print(f"✓ Loaded {len(timesteps)} evaluation checkpoints")
    print()
    print("Evaluation Results:")
    print("-" * 80)
    print(f"{'Timestep':<12} {'Mean Reward':<15} {'Std Dev':<12} {'Improvement'}")
    print("-" * 80)
    
    for i, (ts, mean, std) in enumerate(zip(timesteps, mean_rewards, std_rewards)):
        if i == 0:
            improvement = "-"
        else:
            improvement = f"{mean - mean_rewards[i-1]:+.2f}"
        print(f"{ts:<12} {mean:<15.2f} {std:<12.2f} {improvement}")
    
    print()
    print(f"Best Evaluation Reward: {mean_rewards.max():.2f} at timestep {timesteps[mean_rewards.argmax()]}")
    print(f"Final Evaluation Reward: {mean_rewards[-1]:.2f} ± {std_rewards[-1]:.2f}")
    print()
else:
    print("❌ Evaluation file not found")
    eval_data = None

# 3. Create visualizations
print("📊 Creating Visualizations...")
print()

fig, axes = plt.subplots(2, 2, figsize=(16, 12))
fig.suptitle('Training Results Analysis', fontsize=16, fontweight='bold')

# Plot 1: Training rewards over time (rolling average)
if monitor_data is not None:
    ax = axes[0, 0]
    window = 20
    rolling_mean = monitor_data['reward'].rolling(window=window, min_periods=1).mean()
    rolling_std = monitor_data['reward'].rolling(window=window, min_periods=1).std()
    
    ax.plot(monitor_data.index, monitor_data['reward'], alpha=0.3, color='blue', label='Episode Reward')
    ax.plot(monitor_data.index, rolling_mean, color='darkblue', linewidth=2, label=f'{window}-Episode Average')
    ax.fill_between(monitor_data.index, 
                     rolling_mean - rolling_std, 
                     rolling_mean + rolling_std, 
                     alpha=0.2, color='blue')
    ax.set_xlabel('Episode')
    ax.set_ylabel('Reward')
    ax.set_title('Training Reward Progress')
    ax.legend()
    ax.grid(True, alpha=0.3)

# Plot 2: Evaluation rewards over timesteps
if eval_data is not None:
    ax = axes[0, 1]
    ax.errorbar(timesteps, mean_rewards, yerr=std_rewards, 
                marker='o', capsize=5, capthick=2, linewidth=2, 
                markersize=8, color='darkgreen', ecolor='lightgreen',
                label='Mean ± Std')
    ax.set_xlabel('Timesteps')
    ax.set_ylabel('Mean Reward')
    ax.set_title('Evaluation Performance')
    ax.legend()
    ax.grid(True, alpha=0.3)

# Plot 3: Reward distribution (violin plot)
if monitor_data is not None:
    ax = axes[1, 0]
    # Split into early, mid, late training
    n_episodes = len(monitor_data)
    thirds = n_episodes // 3
    
    data_for_violin = []
    labels = []
    
    if thirds > 0:
        data_for_violin = [
            monitor_data['reward'].iloc[:thirds].values,
            monitor_data['reward'].iloc[thirds:2*thirds].values,
            monitor_data['reward'].iloc[2*thirds:].values
        ]
        labels = ['Early\n(First Third)', 'Middle\n(Second Third)', 'Late\n(Final Third)']
    
    if data_for_violin:
        parts = ax.violinplot(data_for_violin, positions=[1, 2, 3], showmeans=True, showmedians=True)
        ax.set_xticks([1, 2, 3])
        ax.set_xticklabels(labels)
        ax.set_ylabel('Reward')
        ax.set_title('Reward Distribution Over Training Phases')
        ax.grid(True, alpha=0.3, axis='y')

# Plot 4: Learning curve comparison
if monitor_data is not None and eval_data is not None:
    ax = axes[1, 1]
    
    # Convert episode numbers to approximate timesteps (assuming 100 steps per episode)
    monitor_timesteps = monitor_data.index * 100
    monitor_rolling = monitor_data['reward'].rolling(window=20, min_periods=1).mean()
    
    ax.plot(monitor_timesteps, monitor_rolling, 
            color='blue', linewidth=2, label='Training (Rolling Avg)', alpha=0.7)
    ax.plot(timesteps, mean_rewards, 
            color='green', linewidth=2, marker='o', markersize=6,
            label='Evaluation (Periodic)', alpha=0.9)
    ax.set_xlabel('Timesteps')
    ax.set_ylabel('Mean Reward')
    ax.set_title('Training vs Evaluation Performance')
    ax.legend()
    ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('models/quickstart/training_analysis.png', dpi=150, bbox_inches='tight')
print("✓ Saved visualization to: models/quickstart/training_analysis.png")
print()

# 4. Summary statistics
print("=" * 80)
print("SUMMARY")
print("=" * 80)
print()

if monitor_data is not None:
    print("🎯 Key Achievements:")
    print(f"  • Agent learned for {len(monitor_data)} episodes")
    print(f"  • Improved from {monitor_data['reward'].head(10).mean():.2f} to {monitor_data['reward'].tail(10).mean():.2f}")
    print(f"  • Best single episode: {monitor_data['reward'].max():.2f}")
    print(f"  • Training volatility reduced: {monitor_data['reward'].head(20).std():.2f} → {monitor_data['reward'].tail(20).std():.2f}")
    print()

if eval_data is not None:
    print("📊 Evaluation Performance:")
    print(f"  • Best mean reward: {mean_rewards.max():.2f} at {timesteps[mean_rewards.argmax()]:,} steps")
    print(f"  • Final performance: {mean_rewards[-1]:.2f} ± {std_rewards[-1]:.2f}")
    print(f"  • Total timesteps: {timesteps[-1]:,}")
    print()

print("=" * 80)
print("To view the plots, open: models/quickstart/training_analysis.png")
print("=" * 80)
