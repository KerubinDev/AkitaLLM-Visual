import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import async_session, init_db
from app.models.usuario import Usuario
from app.core.security import get_password_hash

async def create_test_user():
    print("Iniciando criação de usuário de teste...")
    await init_db()
    
    async with async_session() as session:
        # Check if user already exists
        result = await session.execute(select(Usuario).where(Usuario.email == "teste@devflow.com"))
        user = result.scalar_one_or_none()
        
        if not user:
            print("Criando usuário: teste@devflow.com")
            new_user = Usuario(
                email="teste@devflow.com",
                nome="Usuário de Teste",
                senha_hash=get_password_hash("devflow123"),
                ativo=True
            )
            session.add(new_user)
            await session.commit()
            print("Usuário criado com sucesso!")
        else:
            print("Usuário já existe. Resetando senha para 'devflow123'...")
            user.senha_hash = get_password_hash("devflow123")
            await session.commit()
            print("Senha resetada com sucesso!")

if __name__ == "__main__":
    asyncio.run(create_test_user())
