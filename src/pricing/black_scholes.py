"""Black-Scholes option pricing model."""

import numpy as np
from scipy.stats import norm
from typing import Dict


class BlackScholesModel:
    """Black-Scholes option pricing and Greeks calculation."""

    @staticmethod
    def price(
        S: float,
        K: float,
        T: float,
        r: float,
        sigma: float,
        option_type: str = "call"
    ) -> float:
        """
        Calculate Black-Scholes option price.

        Args:
            S: Spot price
            K: Strike price
            T: Time to maturity (years)
            r: Risk-free rate
            sigma: Volatility
            option_type: 'call' or 'put'

        Returns:
            Option price
        """
        if T <= 0:
            if option_type == "call":
                return max(S - K, 0)
            else:
                return max(K - S, 0)

        d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
        d2 = d1 - sigma * np.sqrt(T)

        if option_type == "call":
            price = S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
        elif option_type == "put":
            price = K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)
        else:
            raise ValueError(f"Invalid option_type: {option_type}")

        return price

    @staticmethod
    def greeks(
        S: float,
        K: float,
        T: float,
        r: float,
        sigma: float,
        option_type: str = "call"
    ) -> Dict[str, float]:
        """
        Calculate all Greeks.

        Args:
            S: Spot price
            K: Strike price
            T: Time to maturity (years)
            r: Risk-free rate
            sigma: Volatility
            option_type: 'call' or 'put'

        Returns:
            Dictionary with delta, gamma, vega, theta, rho
        """
        if T <= 0:
            return {
                "delta": 1.0 if (option_type == "call" and S > K) else 0.0,
                "gamma": 0.0,
                "vega": 0.0,
                "theta": 0.0,
                "rho": 0.0,
            }

        d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
        d2 = d1 - sigma * np.sqrt(T)

        # Delta
        if option_type == "call":
            delta = norm.cdf(d1)
        else:
            delta = -norm.cdf(-d1)

        # Gamma (same for calls and puts)
        gamma = norm.pdf(d1) / (S * sigma * np.sqrt(T))

        # Vega (same for calls and puts)
        vega = S * norm.pdf(d1) * np.sqrt(T) / 100  # Divided by 100 for 1% change

        # Theta
        term1 = -(S * norm.pdf(d1) * sigma) / (2 * np.sqrt(T))
        if option_type == "call":
            term2 = -r * K * np.exp(-r * T) * norm.cdf(d2)
            theta = (term1 + term2) / 365  # Per day
        else:
            term2 = r * K * np.exp(-r * T) * norm.cdf(-d2)
            theta = (term1 + term2) / 365  # Per day

        # Rho
        if option_type == "call":
            rho = K * T * np.exp(-r * T) * norm.cdf(d2) / 100  # For 1% rate change
        else:
            rho = -K * T * np.exp(-r * T) * norm.cdf(-d2) / 100

        return {
            "delta": delta,
            "gamma": gamma,
            "vega": vega,
            "theta": theta,
            "rho": rho,
        }


def compute_greeks(
    S: float,
    K: float,
    T: float,
    r: float,
    sigma: float,
    option_type: str = "call"
) -> Dict[str, float]:
    """Convenience function to compute Greeks."""
    return BlackScholesModel.greeks(S, K, T, r, sigma, option_type)
