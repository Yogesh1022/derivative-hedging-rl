"""Evaluation results routes."""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.api.schemas import Evaluation, EvaluationCreate, EvaluationUpdate, User
from src.auth.security import get_current_active_user
from src.database import get_async_db
from src.database import models

router = APIRouter()


@router.get("/", response_model=List[Evaluation])
async def list_evaluations(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all evaluations."""
    result = await db.execute(
        select(models.Evaluation)
        .offset(skip)
        .limit(limit)
        .order_by(models.Evaluation.created_at.desc())
    )
    evaluations = result.scalars().all()
    return evaluations


@router.post("/", response_model=Evaluation, status_code=status.HTTP_201_CREATED)
async def create_evaluation(
    evaluation: EvaluationCreate,
    experiment_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new evaluation."""
    # Check if experiment exists and belongs to user
    exp_result = await db.execute(
        select(models.Experiment).where(
            models.Experiment.id == experiment_id,
            models.Experiment.user_id == current_user.id,
        )
    )
    experiment = exp_result.scalar_one_or_none()
    if not experiment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experiment not found")

    db_evaluation = models.Evaluation(
        experiment_id=experiment_id, **evaluation.model_dump()
    )
    db.add(db_evaluation)
    await db.commit()
    await db.refresh(db_evaluation)
    return db_evaluation


@router.get("/{evaluation_id}", response_model=Evaluation)
async def get_evaluation(
    evaluation_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get evaluation by ID."""
    result = await db.execute(
        select(models.Evaluation).where(models.Evaluation.id == evaluation_id)
    )
    evaluation = result.scalar_one_or_none()
    if not evaluation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evaluation not found")
    return evaluation


@router.patch("/{evaluation_id}", response_model=Evaluation)
async def update_evaluation(
    evaluation_id: UUID,
    evaluation_update: EvaluationUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update evaluation."""
    result = await db.execute(
        select(models.Evaluation).where(models.Evaluation.id == evaluation_id)
    )
    evaluation = result.scalar_one_or_none()
    if not evaluation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evaluation not found")

    update_data = evaluation_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(evaluation, field, value)

    await db.commit()
    await db.refresh(evaluation)
    return evaluation
