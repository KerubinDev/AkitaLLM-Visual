"""
Usuario Model - Representa usuários do sistema
"""
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Usuario(Base):
    """User entity for authentication and ownership."""
    
    __tablename__ = "usuarios"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # Relationships
    projetos: Mapped[list["Projeto"]] = relationship(
        "Projeto", back_populates="usuario", lazy="selectin"
    )
    execucoes: Mapped[list["Execucao"]] = relationship(
        "Execucao", back_populates="usuario", lazy="selectin"
    )
    
    def __repr__(self) -> str:
        return f"<Usuario(id={self.id}, email={self.email})>"
