"""
Projeto Schemas - Validação de dados de projeto
"""
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class ProjetoBase(BaseModel):
    """Base schema with common project fields."""
    nome: str = Field(..., min_length=1, max_length=100)
    descricao: str | None = None


class ProjetoCreate(ProjetoBase):
    """Schema for project creation."""
    configuracao_pipeline: dict[str, Any] = Field(default_factory=dict)


class ProjetoUpdate(BaseModel):
    """Schema for project updates (all fields optional)."""
    nome: str | None = Field(None, min_length=1, max_length=100)
    descricao: str | None = None
    configuracao_pipeline: dict[str, Any] | None = None


class ProjetoResponse(ProjetoBase):
    """Schema for project responses."""
    id: int
    usuario_id: int
    configuracao_pipeline: dict[str, Any]
    ativo: bool
    criado_em: datetime
    atualizado_em: datetime
    
    class Config:
        from_attributes = True
