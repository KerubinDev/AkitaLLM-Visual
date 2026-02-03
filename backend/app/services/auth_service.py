"""
Auth Service - Business logic for authentication and user management
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate
from app.core.security import get_password_hash, verify_password

class AuthService:
    @staticmethod
    async def register(db: AsyncSession, user_data: UsuarioCreate) -> Usuario:
        # Check if email already exists
        result = await db.execute(
            select(Usuario).where(Usuario.email == user_data.email)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já cadastrado"
            )
        
        # Create new user
        user = Usuario(
            email=user_data.email,
            nome=user_data.nome,
            senha_hash=get_password_hash(user_data.senha)
        )
        
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user

    @staticmethod
    async def authenticate(db: AsyncSession, email: str, password: str) -> Usuario:
        # Find user by email
        result = await db.execute(
            select(Usuario).where(Usuario.email == email)
        )
        user = result.scalar_one_or_none()
        
        if not user or not verify_password(password, user.senha_hash):
            return None
        
        if not user.ativo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuário desativado"
            )
            
        return user
