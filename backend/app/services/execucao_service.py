"""
Execucao Service - Business logic for pipeline executions
"""
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.execucao import Execucao, StatusExecucao
from app.models.projeto import Projeto
from app.core.akita_wrapper import get_orchestrator
from app.database import async_session

class ExecucaoService:
    @staticmethod
    async def get_by_id(db: AsyncSession, execucao_id: int, user_id: int) -> Execucao:
        result = await db.execute(
            select(Execucao)
            .where(Execucao.id == execucao_id)
            .where(Execucao.usuario_id == user_id)
        )
        execucao = result.scalar_one_or_none()
        if not execucao:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Execução não encontrada"
            )
        return execucao

    @staticmethod
    async def list_by_user(db: AsyncSession, user_id: int, skip: int = 0, limit: int = 100) -> list[Execucao]:
        result = await db.execute(
            select(Execucao)
            .where(Execucao.usuario_id == user_id)
            .order_by(Execucao.iniciado_em.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    @staticmethod
    async def create(db: AsyncSession, projeto_id: int, user_id: int, params: dict) -> Execucao:
        # Verify project exists and belongs to user
        result = await db.execute(
            select(Projeto)
            .where(Projeto.id == projeto_id)
            .where(Projeto.usuario_id == user_id)
            .where(Projeto.ativo == True)
        )
        projeto = result.scalar_one_or_none()
        
        if not projeto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Projeto não encontrado"
            )
        
        execucao = Execucao(
            projeto_id=projeto_id,
            usuario_id=user_id,
            parametros_entrada=params
        )
        
        db.add(execucao)
        await db.flush()
        await db.refresh(execucao)
        
        return execucao

    @staticmethod
    async def cancel(db: AsyncSession, execucao_id: int, user_id: int) -> Execucao:
        execucao = await ExecucaoService.get_by_id(db, execucao_id, user_id)
        
        if execucao.status not in [StatusExecucao.PENDING.value, StatusExecucao.RUNNING.value]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Esta execução não pode ser cancelada"
            )
        
        execucao.status = StatusExecucao.CANCELLED.value
        execucao.append_log("Execução cancelada pelo usuário")
        execucao.finalizado_em = datetime.utcnow()
        
        await db.flush()
        await db.refresh(execucao)
        return execucao

async def run_pipeline_task(execucao_id: int, config: dict):
    """
    Background task that runs the pipeline execution.
    Updates execution status, logs, and results in the database.
    """
    async with async_session() as db:
        try:
            # Fetch execution
            result = await db.execute(
                select(Execucao).where(Execucao.id == execucao_id)
            )
            execucao = result.scalar_one_or_none()
            
            if not execucao:
                return
            
            # Update status to running
            execucao.status = StatusExecucao.RUNNING.value
            execucao.append_log("Pipeline iniciado")
            await db.commit()
            
            # Get orchestrator
            orchestrator = get_orchestrator()
            
            # Helper to save logs (we can't await inside the sync callback)
            # So we will collect them and saving is tricky in sync callback.
            # However, since we re-wrote the wrapper, we can assume it runs in the same loop.
            # But the wrapper calls on_log strictly as a sync function.
            # We'll simple append to a list and commit periodically? 
            # Or better: We pass a callback that just prints, and we rely on the final result?
            # NO, we want realtime.
            # Let's use a queue or just simple accumulating for now, 
            # and maybe force a refresh if possible. 
            # Currently, let's just append to object and commit only at the end to avoid DB lock issues,
            # unless we really need realtime streaming in frontend.
            # The User requested "Real-time logs". 
            # So we should try to commit every invalidation.
            
            # Hack: We define a sync wrapper that uses the running loop to schedule a commit
            # usage of asyncio.run_coroutine_threadsafe is for threads. We are in the same loop.
            # We can just create a Task.
            
            def log_callback(message: str):
                """Callback to append logs."""
                # Append to the SQLAlchemy object
                # Note: This might not persist immediately without commit
                execucao.append_log(message)
                
                # We schedule a commit task on the loop
                # This is risky if too frequent. Let's do it.
                asyncio.create_task(db.commit())

            # Execute pipeline
            pipeline_result = await orchestrator.execute(
                config=config,
                on_log=log_callback
            )
            
            # Update execution with results
            if pipeline_result.get("success"):
                execucao.status = StatusExecucao.SUCCESS.value
                execucao.resultado = pipeline_result.get("data", {})
                execucao.append_log("Pipeline concluído com sucesso")
            else:
                execucao.status = StatusExecucao.FAILED.value
                execucao.resultado = {"error": pipeline_result.get("error")}
                execucao.append_log(f"Pipeline falhou: {pipeline_result.get('error')}")
            
            execucao.finalizado_em = datetime.utcnow()
            await db.commit()
            
        except Exception as e:
            # Re-fetch if needed (session might be expired if error happened)
            # but usually we are fine.
            try:
                execucao.status = StatusExecucao.FAILED.value
                execucao.resultado = {"error": str(e)}
                execucao.append_log(f"Erro inesperado: {str(e)}")
                execucao.finalizado_em = datetime.utcnow()
                await db.commit()
            except:
                pass
