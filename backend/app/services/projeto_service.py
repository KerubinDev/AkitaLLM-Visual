"""
Projeto Service - Business logic for project management
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.projeto import Projeto
from app.schemas.projeto import ProjetoCreate, ProjetoUpdate

class ProjetoService:
    @staticmethod
    async def list_by_user(db: AsyncSession, user_id: int, skip: int = 0, limit: int = 100) -> list[Projeto]:
        result = await db.execute(
            select(Projeto)
            .where(Projeto.usuario_id == user_id)
            .where(Projeto.ativo == True)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    @staticmethod
    async def create(db: AsyncSession, projeto_data: ProjetoCreate, user_id: int) -> Projeto:
        projeto = Projeto(
            usuario_id=user_id,
            nome=projeto_data.nome,
            descricao=projeto_data.descricao,
            idioma=projeto_data.idioma,
            temperatura=projeto_data.temperatura,
            configuracao_pipeline=projeto_data.configuracao_pipeline
        )
        
        db.add(projeto)
        await db.flush()
        await db.refresh(projeto)
        return projeto

    @staticmethod
    async def get_by_id(db: AsyncSession, projeto_id: int, user_id: int) -> Projeto:
        result = await db.execute(
            select(Projeto)
            .where(Projeto.id == projeto_id)
            .where(Projeto.usuario_id == user_id)
        )
        projeto = result.scalar_one_or_none()
        
        if not projeto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Projeto não encontrado"
            )
        return projeto

    @staticmethod
    async def update(db: AsyncSession, projeto_id: int, projeto_data: ProjetoUpdate, user_id: int) -> Projeto:
        projeto = await ProjetoService.get_by_id(db, projeto_id, user_id)
        
        if projeto_data.nome is not None:
            projeto.nome = projeto_data.nome
        
        if projeto_data.descricao is not None:
            projeto.descricao = projeto_data.descricao
        
        if projeto_data.idioma is not None:
            projeto.idioma = projeto_data.idioma
        
        if projeto_data.temperatura is not None:
            projeto.temperatura = projeto_data.temperatura

        if projeto_data.configuracao_pipeline is not None:
            projeto.configuracao_pipeline = projeto_data.configuracao_pipeline
        
        await db.flush()
        await db.refresh(projeto)
        return projeto

    @staticmethod
    async def delete(db: AsyncSession, projeto_id: int, user_id: int) -> None:
        projeto = await ProjetoService.get_by_id(db, projeto_id, user_id)
        projeto.ativo = False
        await db.flush()
