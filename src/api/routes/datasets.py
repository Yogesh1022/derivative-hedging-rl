"""Dataset management routes."""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.api.schemas import Dataset, DatasetCreate, DatasetUpdate, User
from src.auth.security import get_current_active_user
from src.database import get_async_db
from src.database import models

router = APIRouter()


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
