# 📓 Demonstration Notebooks

Interactive Jupyter notebooks demonstrating the Derivative Hedging RL system from training to deployment.

## Quick Links

| Notebook | Description | Time | Audience |
|----------|-------------|------|----------|
| [01_quick_start.ipynb](01_quick_start.ipynb) | 5-minute quick start guide | ~5-10 min | Beginners, Demos |
| [02_training_demo.ipynb](02_training_demo.ipynb) | Deep dive into training with curriculum learning | ~30-60 min | ML Engineers |
| [03_evaluation_analysis.ipynb](03_evaluation_analysis.ipynb) | Comprehensive performance evaluation | ~20-30 min | Researchers |
| [04_inference_examples.ipynb](04_inference_examples.ipynb) | Production inference pipeline | ~20 min | ML Engineers, DevOps |
| [05_backtesting.ipynb](05_backtesting.ipynb) | Historical data validation | ~30-40 min | Quants, Traders |

## Setup

**⚠️ IMPORTANT: Complete these steps before running any notebook!**

### 1. Install Project Dependencies

From the **project root directory** (not the notebooks folder), run:

```bash
# Install core dependencies + development tools
pip install -e ".[dev]"

# Or just core dependencies
pip install -e .
```

This installs all required packages including:
- `stable-baselines3` (RL algorithms)
- `gymnasium` (RL environments)
- `optuna` (hyperparameter tuning)
- `torch`, `pandas`, `numpy`, etc.

### 2. Install Jupyter

```bash
pip install jupyter notebook ipykernel
```

### 3. Verify Installation

Run this in Python or in a notebook cell:

```python
import stable_baselines3
import gymnasium
import optuna
print("✓ All packages installed correctly!")
```

### 4. Launch Jupyter

**Important:** Launch Jupyter from the **project root directory**:

```bash
# Navigate to project root first
cd E:\Derivative_Hedging_RL

# Then launch Jupyter
jupyter notebook notebooks/
```

Or launch from notebooks directory (the notebooks handle the path automatically):

```bash
cd notebooks
jupyter notebook
```

### Troubleshooting

**❌ Error: `ModuleNotFoundError: No module named 'src'`**

**Solution:** The notebooks automatically add the project root to Python's path. Make sure you:
1. Installed the package with `pip install -e .`
2. Run the first cell in each notebook (it sets up the path)

**❌ Error: `ModuleNotFoundError: No module named 'optuna'`**

**Solution:** Install the full dependencies:
```bash
pip install -e ".[dev]"
```

**❌ Error: Package version conflicts**

**Solution:** Create a fresh virtual environment:
```bash
# Create new environment
python -m venv venv_hedge

# Activate it
# Windows:
venv_hedge\Scripts\activate
# Mac/Linux:
source venv_hedge/bin/activate

# Install dependencies
pip install -e ".[dev]"
```

---

## Notebook Summaries

### 01_quick_start.ipynb ⚡
**Perfect for: New users, quick demos**

Get up and running in 5 minutes:
- Install dependencies
- Train basic PPO agent (50K steps)
- Evaluate vs baselines
- Visualize results
- Make first predictions

**Output:** Trained model + performance comparison

---

### 02_training_demo.ipynb 🎓
**Perfect for: ML engineers wanting to understand the system**

Deep dive into training:
- Environment configuration
- Curriculum learning (3-stage progressive training)
- Training monitoring and callbacks
- Comparison: curriculum vs standard training
- Model checkpointing and saving
- Training curves and reward distributions

**Output:** Production-ready trained agent

---

### 03_evaluation_analysis.ipynb 📊
**Perfect for: Researchers analyzing performance**

Comprehensive evaluation:
- Statistical significance testing (t-tests)
- Risk-adjusted metrics (Sharpe, Sortino, VaR, CVaR)
- Distribution analysis
- Volatility sensitivity analysis
- Transaction cost sensitivity
- Win rate and consistency metrics
- Comprehensive performance report

**Output:** Detailed evaluation report with statistical validation

---

### 04_inference_examples.ipynb 🚀
**Perfect for: ML engineers preparing for deployment**

Production inference pipeline:
- Complete pipeline setup (DataLoader → Preprocessor → Inference → PostProcessor)
- Single prediction (real-time)
- Batch prediction (CSV processing)
- Risk management and confidence scoring
- Performance benchmarking (throughput/latency)
- Production deployment patterns

**Output:** Inference pipeline ready for API integration

---

### 05_backtesting.ipynb 📈
**Perfect for: Quants and traders validating strategies**

Historical data validation:
- Loading real market data (SPY options, VIX)
- Walk-forward backtesting
- Realistic execution simulation
- Comparison with Delta hedging
- Transaction cost analysis
- Performance attribution
- Production recommendations

**Output:** Historical validation report

## Learning Path

### For Beginners
1. Start with [01_quick_start.ipynb](01_quick_start.ipynb)
2. Then try [02_training_demo.ipynb](02_training_demo.ipynb)
3. Explore [04_inference_examples.ipynb](04_inference_examples.ipynb)

### For ML Engineers
1. Review [02_training_demo.ipynb](02_training_demo.ipynb) for training details
2. Study [03_evaluation_analysis.ipynb](03_evaluation_analysis.ipynb) for metrics
3. Master [04_inference_examples.ipynb](04_inference_examples.ipynb) for deployment

### For Quants/Traders
1. Quick overview: [01_quick_start.ipynb](01_quick_start.ipynb)
2. Validation: [03_evaluation_analysis.ipynb](03_evaluation_analysis.ipynb)
3. Historical testing: [05_backtesting.ipynb](05_backtesting.ipynb)

## Common Tasks

### Train a Custom Agent

See [02_training_demo.ipynb](02_training_demo.ipynb) cells 3-5:

```python
from src.agents.trainer import AgentTrainer
from src.agents.config import get_config, ENV_CONFIGS

trainer = AgentTrainer(
    agent_type="PPO",
    env_config=ENV_CONFIGS["realistic"],
    output_dir="models/custom",
    seed=42
)

agent = trainer.train_with_curriculum(
    total_timesteps=500000,
    agent_config=get_config("PPO", "default"),
)
```

### Run Batch Inference

See [04_inference_examples.ipynb](04_inference_examples.ipynb) cell 5:

```python
from src.inference.pipeline import InferencePipeline

pipeline = InferencePipeline(
    model_path="models/ppo_agent.zip",
    model_type="PPO"
)

predictions = pipeline.predict_batch(
    data_path="data/test_data.csv",
    output_path="data/predictions.csv"
)
```

### Compare Multiple Strategies

See [03_evaluation_analysis.ipynb](03_evaluation_analysis.ipynb) cells 6-7:

```python
from src.agents.evaluator import AgentEvaluator

evaluator = AgentEvaluator(env=env, n_episodes=200, seed=42)
results = evaluator.compare_all(agents={"PPO": agent})
```

### Backtest on Historical Data

See [05_backtesting.ipynb](05_backtesting.ipynb) cells 7-10 for complete example.

## Tips & Tricks

### Reducing Training Time
- Use fewer timesteps for quick experiments: `total_timesteps=50000`
- Skip curriculum learning: `trainer.train_standard()` instead of `train_with_curriculum()`
- Use simpler environment: `ENV_CONFIGS["easy"]`

### Better Performance
- Train longer: `total_timesteps=1000000`
- Use curriculum learning (already default)
- Try SAC agent: `agent_type="SAC"`
- Tune hyperparameters (see `src/agents/config.py`)

### Debugging
- Set deterministic mode: `agent.predict(obs, deterministic=True)`
- Enable verbose logging: `verbose=1` in trainer
- Check environment observations: `env.reset()` and inspect

### Production Deployment
- Always use `deterministic=True` for inference
- Implement confidence thresholds (see [04_inference_examples.ipynb](04_inference_examples.ipynb))
- Monitor inference latency with `benchmark_inference_speed()`
- Save models with metadata using trainer

## Troubleshooting

### "Module not found" errors
```bash
# Make sure you installed the project in editable mode
pip install -e .
```

### Jupyter kernel issues
```bash
# Install ipykernel
pip install ipykernel
python -m ipykernel install --user --name=derivative-hedging
```

### Out of memory errors
- Reduce `n_episodes` in evaluation
- Use smaller `total_timesteps` for training
- Close other applications

### GPU not detected
```bash
# Check PyTorch CUDA availability
python -c "import torch; print(torch.cuda.is_available())"

# If False, you may need to reinstall PyTorch with CUDA support
```

## Data Requirements

All notebooks expect data in `data/raw/`:
- `SPY_daily.csv` - Historical SPY prices
- `SPY_calls_chain.csv` - SPY call options data
- `VIX_daily.csv` - VIX volatility index

Download data using:
```bash
python download_data.py
```

See [DATA_SOURCES.md](../DATA_SOURCES.md) for details.

## Output Files

Notebooks create outputs in their respective directories:

- `models/notebook_quickstart/` - Quick start models
- `models/notebook_training/` - Training demo models
- `models/notebook_evaluation/` - Evaluation results and reports
- `models/notebook_inference/` - Inference examples
- `models/notebook_backtest/` - Backtest results

## Contributing

To add a new notebook:

1. Create `XX_your_notebook.ipynb` with proper numbering
2. Follow existing structure (title, setup, sections, summary)
3. Include time estimate and target audience
4. Add entry to this README
5. Test thoroughly before committing

## Support

- **Issues:** GitHub Issues
- **Questions:** GitHub Discussions
- **Documentation:** [../README.md](../README.md)
- **API Reference:** [../docs/](../docs/)

## License

Same as main project - see [../LICENSE](../LICENSE)
