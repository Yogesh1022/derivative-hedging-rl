"""Trained model management routes."""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.api.schemas import TrainedModel, TrainedModelCreate, TrainedModelUpdate, User
from src.auth.security import get_current_active_user
from src.database import get_async_db
from src.database import models

router = APIRouter()


@router.get("/", response_model=List[TrainedModel])
async def list_models(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user),
):
    """List user's trained models."""
    result = await db.execute(
        select(models.TrainedModel)
        .where(models.TrainedModel.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .order_by(models.TrainedModel.created_at.desc())
    )
    models_list = result.scalars().all()
    return models_list


@router.post("/", response_model=TrainedModel, status_code=status.HTTP_201_CREATED)
async def create_model(
    model: TrainedModelCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new trained model entry."""
    db_model = models.TrainedModel(user_id=current_user.id, **model.model_dump())
    db.add(db_model)
    await db.commit()
    await db.refresh(db_model)
    return db_model


@router.get("/{model_id}", response_model=TrainedModel)
async def get_model(
    model_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get model by ID."""
    result = await db.execute(
        select(models.TrainedModel).where(
            models.TrainedModel.id == model_id,
            models.TrainedModel.user_id == current_user.id,
        )
    )
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Model not found")
    return model


@router.patch("/{model_id}", response_model=TrainedModel)
async def update_model(
    model_id: UUID,
    model_update: TrainedModelUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update model."""
    result = await db.execute(
        select(models.TrainedModel).where(
            models.TrainedModel.id == model_id,
            models.TrainedModel.user_id == current_user.id,
        )
    )
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Model not found")

    update_data = model_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(model, field, value)

    await db.commit()
    await db.refresh(model)
    return model


@router.delete("/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_model(
    model_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete model."""
    result = await db.execute(
        select(models.TrainedModel).where(
            models.TrainedModel.id == model_id,
            models.TrainedModel.user_id == current_user.id,
        )
    )
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Model not found")

    await db.delete(model)
    await db.commit()
    return None
