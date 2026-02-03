import asyncio
from sqlalchemy import select
from app.database import async_session
from app.models.usuario import Usuario

async def check():
    async with async_session() as s:
        r = await s.execute(select(Usuario).where(Usuario.email == 'teste@devflow.com'))
        u = r.scalar_one_or_none()
        if u:
            print(f"USUARIO_ENCONTRADO: {u.email} | ATIVO: {u.ativo}")
        else:
            print("USUARIO_NAO_ENCONTRADO")

if __name__ == "__main__":
    asyncio.run(check())
