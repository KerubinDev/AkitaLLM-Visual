"""
Execucoes Router - Gerenciamento de execuções de pipeline
"""
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.execucao import ExecucaoResponse, ExecucaoLogsResponse
from app.core.security import get_current_user
from app.services.execucao_service import ExecucaoService

router = APIRouter()


@router.get("/", response_model=list[ExecucaoResponse])
async def list_execucoes(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)],
    skip: int = 0,
    limit: int = 100
):
    """List all executions for the current user."""
    return await ExecucaoService.list_by_user(db, current_user.id, skip, limit)


@router.get("/{execucao_id}", response_model=ExecucaoResponse)
async def get_execucao(
    execucao_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)]
):
    """Get execution details by ID."""
    return await ExecucaoService.get_by_id(db, execucao_id, current_user.id)


@router.get("/{execucao_id}/logs", response_model=ExecucaoLogsResponse)
async def get_execucao_logs(
    execucao_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)]
):
    """Get execution logs (for real-time monitoring)."""
    return await ExecucaoService.get_by_id(db, execucao_id, current_user.id)


@router.post("/{execucao_id}/cancelar", response_model=ExecucaoResponse)
async def cancel_execucao(
    execucao_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)]
):
    """Cancel a pending or running execution."""
    return await ExecucaoService.cancel(db, execucao_id, current_user.id)
