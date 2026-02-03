"""
Execucao Schemas - Validação de dados de execução
"""
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class ExecucaoBase(BaseModel):
    """Base schema with common execution fields."""
    parametros_entrada: dict[str, Any] = Field(default_factory=dict)


class ExecucaoCreate(ExecucaoBase):
    """Schema for initiating an execution."""
    pass


class ExecucaoResponse(ExecucaoBase):
    """Schema for execution responses."""
    id: int
    projeto_id: int
    usuario_id: int
    status: str
    resultado: dict[str, Any] | None
    iniciado_em: datetime
    finalizado_em: datetime | None
    
    class Config:
        from_attributes = True


class ExecucaoLogsResponse(BaseModel):
    """Schema for execution logs response."""
    id: int
    status: str
    logs: str
    
    class Config:
        from_attributes = True
