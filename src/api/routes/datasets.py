"""Dataset management routes."""

from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, Field

from src.api.schemas import Dataset, DatasetCreate, DatasetUpdate, User
from src.auth.security import get_current_active_user
from src.database import get_async_db
from src.database import models
from src.data import (
    YFinanceDataFetcher,
    GBMSimulator,
    HestonSimulator,
    DataPreprocessor,
    validate_market_dataframe,
    validate_synthetic_paths,
)

router = APIRouter()


# Request/Response Models
class FetchMarketDataRequest(BaseModel):
    """Request to fetch market data."""
    ticker: str = Field(..., description="Stock ticker symbol")
    start_date: Optional[str] = Field(None, description="Start date (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="End date (YYYY-MM-DD)")
    save_to_db: bool = Field(True, description="Save dataset to database")


class GenerateSyntheticDataRequest(BaseModel):
    """Request to generate synthetic data."""
    simulator: str = Field(..., description="Simulator type: 'gbm' or 'heston'")
    n_paths: int = Field(1000, ge=100, le=100000)
    n_steps: int = Field(252, ge=50, le=1000)
    S0: float = Field(100.0, gt=0, description="Initial stock price")
    r: float = Field(0.05, ge=-0.1, le=0.2, description="Risk-free rate")
    sigma: Optional[float] = Field(0.2, gt=0, description="Volatility (GBM only)")
    # Heston-specific parameters
    kappa: Optional[float] = Field(2.0, description="Mean reversion speed")
    theta: Optional[float] = Field(0.04, description="Long-run variance")
    xi: Optional[float] = Field(0.3, description="Vol of vol")
    rho: Optional[float] = Field(-0.7, description="Correlation")
    v0: Optional[float] = Field(0.04, description="Initial variance")
    save_to_db: bool = Field(True, description="Save dataset to database")


class DataValidationResponse(BaseModel):
    """Response from data validation."""
    is_valid: bool
    issues: List[str]
    warnings: List[str]
    statistics: dict


# CRUD Endpoints

@router.get("/", response_model=List[Dataset])
async def list_datasets(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all datasets."""
    result = await db.execute(
        select(models.Dataset).offset(skip).limit(limit).order_by(models.Dataset.created_at.desc())
    )
    datasets = result.scalars().all()
    return datasets


@router.post("/", response_model=Dataset, status_code=status.HTTP_201_CREATED)
async def create_dataset(
    dataset: DatasetCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new dataset."""
    db_dataset = models.Dataset(**dataset.model_dump())
    db.add(db_dataset)
    await db.commit()
    await db.refresh(db_dataset)
    return db_dataset


@router.get("/{dataset_id}", response_model=Dataset)
async def get_dataset(
    dataset_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get dataset by ID."""
    result = await db.execute(select(models.Dataset).where(models.Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")
    return dataset


@router.patch("/{dataset_id}", response_model=Dataset)
async def update_dataset(
    dataset_id: UUID,
    dataset_update: DatasetUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update dataset."""
    result = await db.execute(select(models.Dataset).where(models.Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")

    update_data = dataset_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(dataset, field, value)

    await db.commit()
    await db.refresh(dataset)
    return dataset


@router.delete("/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dataset(
    dataset_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete dataset."""
    result = await db.execute(select(models.Dataset).where(models.Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")

    await db.delete(dataset)
    await db.commit()
    return None


# Functional Data Pipeline Endpoints

@router.post("/fetch-market-data", status_code=status.HTTP_200_OK)
async def fetch_market_data(
    request: FetchMarketDataRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Fetch market data from Yahoo Finance.
    
    This endpoint fetches stock price data and optionally saves it to the database.
    """
    try:
        fetcher = YFinanceDataFetcher()
        
        # Parse dates
        start_date = datetime.strptime(request.start_date, "%Y-%m-%d") if request.start_date else None
        end_date = datetime.strptime(request.end_date, "%Y-%m-%d") if request.end_date else None
        
        # Fetch data
        df = fetcher.fetch_stock_data(request.ticker, start_date, end_date)
        
        if df.empty:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No data found for ticker {request.ticker}"
            )
        
        # Validate data
        validation_report = validate_market_dataframe(df, request.ticker)
        
        # Save to database if requested
        dataset_id = None
        if request.save_to_db:
            db_dataset = models.Dataset(
                name=f"{request.ticker}_market_data",
                dataset_type="market",
                source="yfinance",
                config={
                    "ticker": request.ticker,
                    "start_date": request.start_date,
                    "end_date": request.end_date,
                },
                metadata={
                    "records": len(df),
                    "validation": validation_report.model_dump(),
                }
            )
            db.add(db_dataset)
            await db.commit()
            await db.refresh(db_dataset)
            dataset_id = str(db_dataset.id)
        
        return {
            "status": "success",
            "ticker": request.ticker,
            "records": len(df),
            "dataset_id": dataset_id,
            "validation": {
                "is_valid": validation_report.is_valid,
                "issues": validation_report.issues,
                "warnings": validation_report.warnings,
            },
            "preview": df.head().to_dict(orient="records"),
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch market data: {str(e)}"
        )


@router.post("/generate-synthetic", status_code=status.HTTP_200_OK)
async def generate_synthetic_data(
    request: GenerateSyntheticDataRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Generate synthetic price paths using GBM or Heston model.
    
    This endpoint generates simulated stock prices for training/testing.
    """
    try:
        # Initialize simulator
        if request.simulator.lower() == "gbm":
            simulator = GBMSimulator(
                S0=request.S0,
                mu=request.r,
                sigma=request.sigma,
                T=1.0,
                n_steps=request.n_steps,
            )
        elif request.simulator.lower() == "heston":
            simulator = HestonSimulator(
                S0=request.S0,
                v0=request.v0 or 0.04,
                r=request.r,
                kappa=request.kappa or 2.0,
                theta=request.theta or 0.04,
                xi=request.xi or 0.3,
                rho=request.rho or -0.7,
                T=1.0,
                n_steps=request.n_steps,
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid simulator type: {request.simulator}. Use 'gbm' or 'heston'"
            )
        
        # Generate paths
        paths = simulator.simulate(request.n_paths)
        
        # Validate synthetic data
        validation_report = validate_synthetic_paths(paths, request.simulator)
        
        # Save to database if requested
        dataset_id = None
        if request.save_to_db:
            db_dataset = models.Dataset(
                name=f"{request.simulator}_synthetic_{request.n_paths}paths",
                dataset_type="synthetic",
                source=request.simulator,
                config=request.model_dump(exclude={"save_to_db"}),
                metadata={
                    "n_paths": request.n_paths,
                    "n_steps": request.n_steps,
                    "validation": validation_report.model_dump(),
                }
            )
            db.add(db_dataset)
            await db.commit()
            await db.refresh(db_dataset)
            dataset_id = str(db_dataset.id)
        
        return {
            "status": "success",
            "simulator": request.simulator,
            "n_paths": request.n_paths,
            "n_steps": request.n_steps,
            "dataset_id": dataset_id,
            "validation": {
                "is_valid": validation_report.is_valid,
                "issues": validation_report.issues,
                "warnings": validation_report.warnings,
            },
            "statistics": validation_report.statistics,
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate synthetic data: {str(e)}"
        )


@router.post("/{dataset_id}/validate", response_model=DataValidationResponse)
async def validate_dataset(
    dataset_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Validate a dataset for quality and consistency.
    
    This endpoint runs validation checks on an existing dataset.
    """
    result = await db.execute(select(models.Dataset).where(models.Dataset.id == dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")
    
    # Return cached validation if available
    if dataset.metadata and "validation" in dataset.metadata:
        validation_data = dataset.metadata["validation"]
        return DataValidationResponse(
            is_valid=validation_data.get("is_valid", False),
            issues=validation_data.get("issues", []),
            warnings=validation_data.get("warnings", []),
            statistics=validation_data.get("statistics", {}),
        )
    
    return DataValidationResponse(
        is_valid=False,
        issues=["No validation data available for this dataset"],
        warnings=[],
        statistics={},
    )
