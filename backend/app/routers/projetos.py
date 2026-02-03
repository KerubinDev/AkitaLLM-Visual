"""
Projetos Router - CRUD de projetos
"""
from typing import Annotated

from fastapi import APIRouter, Depends, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.projeto import ProjetoCreate, ProjetoUpdate, ProjetoResponse
from app.schemas.execucao import ExecucaoCreate, ExecucaoResponse
from app.core.security import get_current_user
from app.services.projeto_service import ProjetoService
from app.services.execucao_service import ExecucaoService, run_pipeline_task

router = APIRouter()


@router.get("/", response_model=list[ProjetoResponse])
async def list_projetos(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)],
    skip: int = 0,
    limit: int = 100
):
    """
    List all projects for the current user.
    """
    return await ProjetoService.list_by_user(db, current_user.id, skip, limit)


@router.post("/", response_model=ProjetoResponse, status_code=status.HTTP_201_CREATED)
async def create_projeto(
    projeto_data: ProjetoCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)]
):
    """Create a new project."""
    return await ProjetoService.create(db, projeto_data, current_user.id)


@router.get("/{projeto_id}", response_model=ProjetoResponse)
async def get_projeto(
    projeto_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)]
):
    """Get a specific project by ID."""
    return await ProjetoService.get_by_id(db, projeto_id, current_user.id)


@router.put("/{projeto_id}", response_model=ProjetoResponse)
async def update_projeto(
    projeto_id: int,
    projeto_data: ProjetoUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)]
):
    """Update a project."""
    return await ProjetoService.update(db, projeto_id, projeto_data, current_user.id)


@router.delete("/{projeto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_projeto(
    projeto_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)]
):
    """Deactivate a project (soft delete)."""
    await ProjetoService.delete(db, projeto_id, current_user.id)


@router.post("/{projeto_id}/execucoes", response_model=ExecucaoResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_execucao(
    projeto_id: int,
    execucao_data: ExecucaoCreate,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)]
):
    """
    Initiate a new pipeline execution for a project.
    
    The execution runs asynchronously. Use GET /execucoes/{id} to check status.
    
    Returns 202 Accepted with execution ID.
    """
    # Create execution record via Service
    execucao = await ExecucaoService.create(
        db, 
        projeto_id, 
        current_user.id, 
        execucao_data.parametros_entrada
    )
    
    # We need to re-fetch the project to get configuration for the pipeline
    # (Or modify ExecucaoService.create to return it, but keeping it simple for now)
    projeto = await ProjetoService.get_by_id(db, projeto_id, current_user.id)
    
    # Build pipeline config
    # Merge project config with execution params (mode, target, etc.)
    pipeline_config = {
        **projeto.configuracao_pipeline,
        **execucao_data.parametros_entrada
    }
    
    # Schedule background execution
    background_tasks.add_task(run_pipeline_task, execucao.id, pipeline_config)
    
    return execucao
