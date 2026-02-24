"""
Advanced Baseline Models: SABR and Local Volatility Hedging

Implements sophisticated volatility modeling baselines for comparison with RL agents.

References:
- SABR model: Hagan et al. (2002) "Managing Smile Risk"
- Local Volatility: Dupire (1994) "Pricing with a Smile"
"""

import numpy as np
from scipy.stats import norm
from scipy.optimize import minimize
from scipy.interpolate import interp2d
import logging

logger = logging.getLogger(__name__)


class SABRHedging:
    """
    SABR (Stochastic Alpha Beta Rho) Model for Option Hedging
    
    Model: dF = alpha * F^beta * dW1
           dalpha = nu * alpha * dW2
           dW1 * dW2 = rho * dt
    
    Better captures smile dynamics than Black-Scholes
    """
    
    def __init__(
        self,
        alpha: float = 0.05,
        beta: float = 0.5,
        rho: float = -0.3,
        nu: float = 0.4
    ):
        """
        Initialize SABR model parameters
        
        Args:
            alpha: Initial volatility
            beta: CEV parameter (0=normal, 1=lognormal)
            rho: Correlation between asset and volatility
            nu: Volatility of volatility
        """
        self.alpha = alpha
        self.beta = beta
        self.rho = rho
        self.nu = nu
        
    def implied_volatility(self, F, K, T):
        """
        Calculate SABR implied volatility
        
        Args:
            F: Forward price
            K: Strike price
            T: Time to maturity
            
        Returns:
            Implied volatility
        """
        if abs(F - K) < 1e-10:
            # ATM approximation
            sigma_atm = self.alpha / (F ** (1 - self.beta))
            return sigma_atm
        
        # Log-moneyness
        log_FK = np.log(F / K)
        
        # Intermediate calculations
        FK_mid = (F * K) ** ((1 - self.beta) / 2)
        eps = self.nu / self.alpha * FK_mid * log_FK
        
        # z calculation
        z = (self.nu / self.alpha) * FK_mid * log_FK
        
        # x(z) calculation
        x_z = np.log((np.sqrt(1 - 2 * self.rho * z + z**2) + z - self.rho) / (1 - self.rho))
        
        # SABR formula
        numerator = self.alpha
        denominator = FK_mid * (
            1 + ((1 - self.beta)**2 / 24) * log_FK**2 
            + ((1 - self.beta)**4 / 1920) * log_FK**4
        )
        
        # Time-dependent correction
        correction = (
            1 + (
                ((1 - self.beta)**2 / 24) * (self.alpha**2 / FK_mid**2)
                + (self.rho * self.beta * self.nu * self.alpha) / (4 * FK_mid)
                + ((2 - 3 * self.rho**2) / 24) * self.nu**2
            ) * T
        )
        
        sigma = (numerator / denominator) * (z / x_z) * correction
        
        return sigma
        
    def delta(self, S, K, T, r, sigma=None):
        """
        Calculate SABR delta
        
        Args:
            S: Current stock price
            K: Strike price
            T: Time to maturity
            r: Risk-free rate
            sigma: Optional volatility (calculated if not provided)
            
        Returns:
            Delta hedge ratio
        """
        if sigma is None:
            F = S * np.exp(r * T)
            sigma = self.implied_volatility(F, K, T)
        
        # Black-Scholes delta with SABR vol
        d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
        delta = norm.cdf(d1)
        
        return delta
        
    def vega(self, S, K, T, r, sigma=None):
        """Calculate SABR vega"""
        if sigma is None:
            F = S * np.exp(r * T)
            sigma = self.implied_volatility(F, K, T)
        
        d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
        vega = S * norm.pdf(d1) * np.sqrt(T)
        
        return vega
        
    def compute_hedge(self, S, K, T, r, sigma=None):
        """
        Compute complete SABR hedge
        
        Returns:
            dict with delta, vega, and hedge ratio
        """
        delta = self.delta(S, K, T, r, sigma)
        vega = self.vega(S, K, T, r, sigma)
        
        # Combined hedge considers both delta and vega
        # Weight vega by volatility sensitivity
        hedge_ratio = delta + 0.1 * vega / S
        
        return {
            'hedge_ratio': hedge_ratio,
            'delta': delta,
            'vega': vega,
            'implied_vol': sigma if sigma is not None else self.implied_volatility(S, K, T)
        }
        
    def calibrate(self, market_data):
        """
        Calibrate SABR parameters to market data
        
        Args:
            market_data: DataFrame with columns [Strike, Maturity, ImpliedVol, Forward]
            
        Returns:
            Calibrated parameters
        """
        logger.info("Calibrating SABR parameters...")
        
        def objective(params):
            alpha, beta, rho, nu = params
            self.alpha, self.beta, self.rho, self.nu = alpha, beta, rho, nu
            
            errors = []
            for _, row in market_data.iterrows():
                K = row['Strike']
                T = row['Maturity']
                F = row['Forward']
                market_vol = row['ImpliedVol']
                
                try:
                    model_vol = self.implied_volatility(F, K, T)
                    errors.append((model_vol - market_vol)**2)
                except:
                    errors.append(1.0)  # Penalty for failures
                    
            return np.mean(errors)
        
        # Initial guess and bounds
        x0 = [self.alpha, self.beta, self.rho, self.nu]
        bounds = [(0.001, 1.0), (0.0, 1.0), (-0.99, 0.99), (0.001, 2.0)]
        
        result = minimize(objective, x0, bounds=bounds, method='L-BFGS-B')
        
        if result.success:
            self.alpha, self.beta, self.rho, self.nu = result.x
            logger.info(f"✅ Calibration successful: RMSE = {np.sqrt(result.fun):.6f}")
            logger.info(f"   alpha={self.alpha:.4f}, beta={self.beta:.4f}")
            logger.info(f"   rho={self.rho:.4f}, nu={self.nu:.4f}")
        else:
            logger.warning("⚠️ Calibration failed, using initial parameters")
            
        return {
            'alpha': self.alpha,
            'beta': self.beta,
            'rho': self.rho,
            'nu': self.nu,
            'rmse': np.sqrt(result.fun) if result.success else None
        }


class LocalVolatilityHedging:
    """
    Local Volatility Model (Dupire 1994)
    
    Derives instantaneous volatility from option prices:
    sigma_LV(K,T)^2 = 2 * dC/dT / (K^2 * d2C/dK2)
    
    Perfectly fits market prices by construction
    """
    
    def __init__(self):
        """Initialize Local Volatility model"""
        self.vol_surface = None
        self.strikes = None
        self.maturities = None
        
    def build_surface(self, market_data):
        """
        Build local volatility surface from market data
        
        Args:
            market_data: DataFrame with [Strike, Maturity, Price, ImpliedVol]
        """
        logger.info("Building local volatility surface...")
        
        # Extract unique strikes and maturities
        self.strikes = sorted(market_data['Strike'].unique())
        self.maturities = sorted(market_data['Maturity'].unique())
        
        # Create volatility grid
        vol_grid = np.zeros((len(self.maturities), len(self.strikes)))
        
        for i, T in enumerate(self.maturities):
            for j, K in enumerate(self.strikes):
                mask = (market_data['Strike'] == K) & (market_data['Maturity'] == T)
                if mask.any():
                    vol_grid[i, j] = market_data.loc[mask, 'ImpliedVol'].values[0]
                else:
                    # Interpolate missing values
                    vol_grid[i, j] = np.nan
        
        # Fill NaN values with interpolation
        from scipy.interpolate import griddata
        points = []
        values = []
        for i in range(len(self.maturities)):
            for j in range(len(self.strikes)):
                if not np.isnan(vol_grid[i, j]):
                    points.append([self.maturities[i], self.strikes[j]])
                    values.append(vol_grid[i, j])
        
        points = np.array(points)
        values = np.array(values)
        
        # Create interpolator
        self.vol_surface = lambda T, K: griddata(
            points, values, np.array([[T, K]]), method='cubic'
        )[0]
        
        logger.info(f"✅ Built local vol surface: {len(self.strikes)} strikes × {len(self.maturities)} maturities")
        
    def local_volatility(self, S, K, T):
        """
        Get local volatility at (S, K, T)
        
        Args:
            S: Current stock price
            K: Strike price
            T: Time to maturity
            
        Returns:
            Local volatility
        """
        if self.vol_surface is None:
            raise ValueError("Volatility surface not built. Call build_surface() first.")
        
        return self.vol_surface(T, K)
        
    def delta(self, S, K, T, r):
        """Calculate delta using local volatility"""
        sigma_local = self.local_volatility(S, K, T)
        
        # Use Black-Scholes formula with local vol
        d1 = (np.log(S / K) + (r + 0.5 * sigma_local**2) * T) / (sigma_local * np.sqrt(T))
        delta = norm.cdf(d1)
        
        return delta
        
    def gamma(self, S, K, T, r):
        """Calculate gamma using local volatility"""
        sigma_local = self.local_volatility(S, K, T)
        
        d1 = (np.log(S / K) + (r + 0.5 * sigma_local**2) * T) / (sigma_local * np.sqrt(T))
        gamma = norm.pdf(d1) / (S * sigma_local * np.sqrt(T))
        
        return gamma
        
    def compute_hedge(self, S, K, T, r):
        """
        Compute local vol hedge
        
        Returns:
            dict with delta, gamma, and hedge ratio
        """
        delta = self.delta(S, K, T, r)
        gamma = self.gamma(S, K, T, r)
        
        # Delta-gamma hedge
        hedge_ratio = delta + 0.5 * gamma * S
        
        return {
            'hedge_ratio': hedge_ratio,
            'delta': delta,
            'gamma': gamma,
            'local_vol': self.local_volatility(S, K, T)
        }


class MixedVolatilityHedging:
    """
    Combines SABR and Local Vol models for robust hedging
    
    Uses SABR for interpolation/extrapolation
    Uses Local Vol for markets with liquid option prices
    """
    
    def __init__(self, sabr_weight: float = 0.5):
        """
        Initialize mixed model
        
        Args:
            sabr_weight: Weight for SABR (1 - weight for Local Vol)
        """
        self.sabr = SABRHedging()
        self.local_vol = LocalVolatilityHedging()
        self.sabr_weight = sabr_weight
        
    def compute_hedge(self, S, K, T, r):
        """Compute weighted hedge"""
        sabr_hedge = self.sabr.compute_hedge(S, K, T, r)
        localvol_hedge = self.local_vol.compute_hedge(S, K, T, r)
        
        # Weighted average
        hedge_ratio = (
            self.sabr_weight * sabr_hedge['hedge_ratio'] +
            (1 - self.sabr_weight) * localvol_hedge['hedge_ratio']
        )
        
        return {
            'hedge_ratio': hedge_ratio,
            'sabr_hedge': sabr_hedge['hedge_ratio'],
            'localvol_hedge': localvol_hedge['hedge_ratio'],
            'sabr_delta': sabr_hedge['delta'],
            'localvol_delta': localvol_hedge['delta']
        }


# ==================== Example Usage ====================

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Example 1: SABR Hedging
    print("\n" + "="*60)
    print("SABR Model Example")
    print("="*60)
    
    sabr = SABRHedging(alpha=0.05, beta=0.5, rho=-0.3, nu=0.4)
    
    # Compute hedge for specific option
    S, K, T, r = 100, 100, 0.25, 0.05
    hedge = sabr.compute_hedge(S, K, T, r)
    
    print(f"\nOption Parameters:")
    print(f"  S={S}, K={K}, T={T}, r={r}")
    print(f"\nSABR Hedge:")
    print(f"  Hedge Ratio: {hedge['hedge_ratio']:.4f}")
    print(f"  Delta: {hedge['delta']:.4f}")
    print(f"  Vega: {hedge['vega']:.2f}")
    print(f"  Implied Vol: {hedge['implied_vol']:.4f}")
    
    # Example 2: Local Volatility (requires market data)
    print("\n" + "="*60)
    print("Local Volatility Model Example")
    print("="*60)
    print("Note: Requires market option prices to build surface")
    print("See notebooks/07_advanced_baseline_comparison.ipynb for full example")
