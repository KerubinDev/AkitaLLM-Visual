"""
Auth Router - Endpoints de autenticação
"""
from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioResponse
from app.schemas.auth import Token
from app.core.security import create_access_token, get_current_user
from app.services.auth_service import AuthService

settings = get_settings()
router = APIRouter()


@router.post("/register", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UsuarioCreate,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Register a new user.
    """
    return await AuthService.register(db, user_data)


@router.post("/login", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Authenticate user and return JWT token.
    Uses OAuth2 password flow (username = email).
    """
    user = await AuthService.authenticate(db, form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
    )
    
    return Token(access_token=access_token)


@router.get("/me", response_model=UsuarioResponse)
async def get_me(
    current_user: Annotated[Usuario, Depends(get_current_user)]
):
    """Get current authenticated user info."""
    return current_user
