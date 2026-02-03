"""
Usuario Schemas - Validação de dados de usuário
"""
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UsuarioBase(BaseModel):
    """Base schema with common user fields."""
    email: EmailStr
    nome: str = Field(..., min_length=2, max_length=100)


class UsuarioCreate(UsuarioBase):
    """Schema for user registration."""
    senha: str = Field(..., min_length=6, max_length=100)


class UsuarioUpdate(BaseModel):
    """Schema for user updates (all fields optional)."""
    nome: str | None = Field(None, min_length=2, max_length=100)
    senha: str | None = Field(None, min_length=6, max_length=100)


class UsuarioResponse(UsuarioBase):
    """Schema for user responses."""
    id: int
    ativo: bool
    criado_em: datetime
    atualizado_em: datetime
    
    class Config:
        from_attributes = True


class UsuarioLogin(BaseModel):
    """Schema for login request."""
    email: EmailStr
    senha: str
