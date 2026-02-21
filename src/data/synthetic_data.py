"""Synthetic data generation for training."""

import numpy as np
from typing import Tuple

from src.utils.logger import setup_logger

logger = setup_logger(__name__)


class GBMSimulator:
    """Geometric Brownian Motion simulator for stock prices."""

    def __init__(
        self,
        S0: float = 100.0,
        mu: float = 0.05,
        sigma: float = 0.2,
        T: float = 1.0,
        dt: float = 1 / 252,
        seed: int = 42,
    ):
        """
        Initialize GBM simulator.

        Args:
            S0: Initial stock price
            mu: Drift (expected return)
            sigma: Volatility
            T: Time horizon (years)
            dt: Time step (years)
            seed: Random seed
        """
        self.S0 = S0
        self.mu = mu
        self.sigma = sigma
        self.T = T
        self.dt = dt
        self.seed = seed
        self.n_steps = int(T / dt)

        np.random.seed(seed)

    def simulate(self, n_paths: int = 1000) -> np.ndarray:
        """
        Simulate price paths.

        Args:
            n_paths: Number of paths to simulate

        Returns:
            Array of shape (n_paths, n_steps + 1) with price paths
        """
        logger.info(f"Simulating {n_paths} GBM paths with {self.n_steps} steps")

        paths = np.zeros((n_paths, self.n_steps + 1))
        paths[:, 0] = self.S0

        for t in range(1, self.n_steps + 1):
            Z = np.random.standard_normal(n_paths)
            paths[:, t] = paths[:, t - 1] * np.exp(
                (self.mu - 0.5 * self.sigma**2) * self.dt + self.sigma * np.sqrt(self.dt) * Z
            )

        logger.info(f"✓ Generated {n_paths} GBM paths")
        return paths


class HestonSimulator:
    """Heston stochastic volatility model simulator."""

    def __init__(
        self,
        S0: float = 100.0,
        V0: float = 0.04,
        mu: float = 0.05,
        kappa: float = 2.0,
        theta: float = 0.04,
        xi: float = 0.3,
        rho: float = -0.7,
        T: float = 1.0,
        dt: float = 1 / 252,
        seed: int = 42,
    ):
        """
        Initialize Heston model simulator.

        Args:
            S0: Initial stock price
            V0: Initial variance
            mu: Drift (expected return)
            kappa: Mean reversion speed of variance
            theta: Long-term variance
            xi: Volatility of variance (vol of vol)
            rho: Correlation between stock and variance
            T: Time horizon (years)
            dt: Time step (years)
            seed: Random seed
        """
        self.S0 = S0
        self.V0 = V0
        self.mu = mu
        self.kappa = kappa
        self.theta = theta
        self.xi = xi
        self.rho = rho
        self.T = T
        self.dt = dt
        self.seed = seed
        self.n_steps = int(T / dt)

        np.random.seed(seed)

    def simulate(self, n_paths: int = 1000) -> Tuple[np.ndarray, np.ndarray]:
        """
        Simulate price and variance paths.

        Args:
            n_paths: Number of paths to simulate

        Returns:
            Tuple of (price_paths, variance_paths), each of shape (n_paths, n_steps + 1)
        """
        logger.info(f"Simulating {n_paths} Heston paths with {self.n_steps} steps")

        prices = np.zeros((n_paths, self.n_steps + 1))
        variances = np.zeros((n_paths, self.n_steps + 1))

        prices[:, 0] = self.S0
        variances[:, 0] = self.V0

        for t in range(1, self.n_steps + 1):
            # Generate correlated random variables
            Z1 = np.random.standard_normal(n_paths)
            Z2 = np.random.standard_normal(n_paths)
            W1 = Z1
            W2 = self.rho * Z1 + np.sqrt(1 - self.rho**2) * Z2

            # Variance process (CIR process with Euler-Maruyama)
            # Use max to ensure variance stays positive
            V_prev = np.maximum(variances[:, t - 1], 0)
            variances[:, t] = (
                V_prev
                + self.kappa * (self.theta - V_prev) * self.dt
                + self.xi * np.sqrt(V_prev * self.dt) * W2
            )
            variances[:, t] = np.maximum(variances[:, t], 0)  # Ensure non-negative

            # Price process
            prices[:, t] = prices[:, t - 1] * np.exp(
                (self.mu - 0.5 * V_prev) * self.dt + np.sqrt(V_prev * self.dt) * W1
            )

        logger.info(f"✓ Generated {n_paths} Heston paths")
        return prices, variances


class SyntheticDataGenerator:
    """High-level interface for generating synthetic training data."""

    @staticmethod
    def generate_training_data(
        model: str = "gbm",
        n_paths: int = 10000,
        S0: float = 100.0,
        T: float = 60 / 252,
        **kwargs,
    ) -> np.ndarray:
        """
        Generate synthetic training data.

        Args:
            model: 'gbm' or 'heston'
            n_paths: Number of paths
            S0: Initial price
            T: Time horizon
            **kwargs: Additional model parameters

        Returns:
            Price paths array
        """
        if model.lower() == "gbm":
            simulator = GBMSimulator(S0=S0, T=T, **kwargs)
            return simulator.simulate(n_paths)

        elif model.lower() == "heston":
            simulator = HestonSimulator(S0=S0, T=T, **kwargs)
            prices, _ = simulator.simulate(n_paths)
            return prices

        else:
            raise ValueError(f"Unknown model: {model}. Use 'gbm' or 'heston'")
