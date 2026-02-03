"""
Usuarios Router - CRUD de usuários
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioResponse, UsuarioUpdate
from app.core.security import get_current_user, get_password_hash

router = APIRouter()


@router.get("/", response_model=list[UsuarioResponse])
async def list_usuarios(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)],
    skip: int = 0,
    limit: int = 100
):
    """
    List all active users.
    Requires authentication.
    """
    result = await db.execute(
        select(Usuario)
        .where(Usuario.ativo == True)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/{usuario_id}", response_model=UsuarioResponse)
async def get_usuario(
    usuario_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)]
):
    """Get a specific user by ID."""
    result = await db.execute(
        select(Usuario).where(Usuario.id == usuario_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    return user


@router.put("/{usuario_id}", response_model=UsuarioResponse)
async def update_usuario(
    usuario_id: int,
    user_data: UsuarioUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)]
):
    """
    Update user information.
    Users can only update their own profile.
    """
    if current_user.id != usuario_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você só pode editar seu próprio perfil"
        )
    
    result = await db.execute(
        select(Usuario).where(Usuario.id == usuario_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Update fields
    if user_data.nome is not None:
        user.nome = user_data.nome
    
    if user_data.senha is not None:
        user.senha_hash = get_password_hash(user_data.senha)
    
    await db.flush()
    await db.refresh(user)
    
    return user


@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_usuario(
    usuario_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)]
):
    """
    Deactivate a user account.
    Users can only deactivate their own account.
    """
    if current_user.id != usuario_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você só pode desativar sua própria conta"
        )
    
    result = await db.execute(
        select(Usuario).where(Usuario.id == usuario_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    user.ativo = False
    await db.flush()
