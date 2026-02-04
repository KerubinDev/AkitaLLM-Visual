"""
Projeto Model - Representa projetos de desenvolvimento
"""
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Projeto(Base):
    """Project entity containing pipeline configuration."""
    
    __tablename__ = "projetos"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    descricao: Mapped[str] = mapped_column(Text, nullable=True)
    idioma: Mapped[str] = mapped_column(String(10), default="en")
    temperatura: Mapped[float] = mapped_column(default=0.7)
    configuracao_pipeline: Mapped[dict] = mapped_column(JSON, default=dict)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # Relationships
    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="projetos")
    execucoes: Mapped[list["Execucao"]] = relationship(
        "Execucao", back_populates="projeto", lazy="selectin"
    )
    
    def __repr__(self) -> str:
        return f"<Projeto(id={self.id}, nome={self.nome})>"
