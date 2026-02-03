"""
Execucao Model - Representa execuções de pipeline
"""
from datetime import datetime
from enum import Enum
from sqlalchemy import String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class StatusExecucao(str, Enum):
    """Possible execution statuses."""
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Execucao(Base):
    """Pipeline execution entity with logs and results."""
    
    __tablename__ = "execucoes"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    projeto_id: Mapped[int] = mapped_column(ForeignKey("projetos.id"), nullable=False)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default=StatusExecucao.PENDING.value
    )
    parametros_entrada: Mapped[dict] = mapped_column(JSON, default=dict)
    logs: Mapped[str] = mapped_column(Text, default="")
    resultado: Mapped[dict] = mapped_column(JSON, nullable=True)
    iniciado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    finalizado_em: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    projeto: Mapped["Projeto"] = relationship("Projeto", back_populates="execucoes")
    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="execucoes")
    
    def __repr__(self) -> str:
        return f"<Execucao(id={self.id}, status={self.status})>"
    
    def append_log(self, message: str) -> None:
        """Append a log message with timestamp."""
        timestamp = datetime.utcnow().isoformat()
        self.logs = f"{self.logs}[{timestamp}] {message}\n"
