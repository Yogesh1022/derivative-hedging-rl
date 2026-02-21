"""Experiment management routes."""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.api.schemas import Experiment, ExperimentCreate, ExperimentUpdate, User
from src.auth.security import get_current_active_user
from src.database import get_async_db
from src.database import models

router = APIRouter()


@router.get("/", response_model=List[Experiment])
async def list_experiments(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user),
):
    """List user's experiments."""
    result = await db.execute(
        select(models.Experiment)
        .where(models.Experiment.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .order_by(models.Experiment.created_at.desc())
    )
    experiments = result.scalars().all()
    return experiments


@router.post("/", response_model=Experiment, status_code=status.HTTP_201_CREATED)
async def create_experiment(
    experiment: ExperimentCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new experiment."""
    db_experiment = models.Experiment(
        user_id=current_user.id, **experiment.model_dump()
    )
    db.add(db_experiment)
    await db.commit()
    await db.refresh(db_experiment)
    return db_experiment


@router.get("/{experiment_id}", response_model=Experiment)
async def get_experiment(
    experiment_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get experiment by ID."""
    result = await db.execute(
        select(models.Experiment).where(
            models.Experiment.id == experiment_id,
            models.Experiment.user_id == current_user.id,
        )
    )
    experiment = result.scalar_one_or_none()
    if not experiment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experiment not found")
    return experiment


@router.patch("/{experiment_id}", response_model=Experiment)
async def update_experiment(
    experiment_id: UUID,
    experiment_update: ExperimentUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update experiment."""
    result = await db.execute(
        select(models.Experiment).where(
            models.Experiment.id == experiment_id,
            models.Experiment.user_id == current_user.id,
        )
    )
    experiment = result.scalar_one_or_none()
    if not experiment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experiment not found")

    update_data = experiment_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(experiment, field, value)

    await db.commit()
    await db.refresh(experiment)
    return experiment


@router.delete("/{experiment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_experiment(
    experiment_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete experiment."""
    result = await db.execute(
        select(models.Experiment).where(
            models.Experiment.id == experiment_id,
            models.Experiment.user_id == current_user.id,
        )
    )
    experiment = result.scalar_one_or_none()
    if not experiment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experiment not found")

    await db.delete(experiment)
    await db.commit()
    return None
