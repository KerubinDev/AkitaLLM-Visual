# DevFlow Backend

API REST para a plataforma DevFlow de apoio ao desenvolvimento de software.

## Requisitos

- Python 3.10+
- PostgreSQL 14+

## Instalação

```bash
# Criar ambiente virtual
python -m venv venv
venv\Scripts\activate  # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
copy .env.example .env

# Executar migrações
alembic upgrade head

# Rodar servidor de desenvolvimento
uvicorn app.main:app --reload
```

## Estrutura

```
app/
├── main.py          # Aplicação FastAPI
├── config.py        # Configurações
├── database.py      # Conexão SQLAlchemy
├── models/          # Modelos ORM
├── schemas/         # Schemas Pydantic
├── routers/         # Endpoints API
├── services/        # Lógica de negócio
├── core/            # Segurança e utilitários
└── tasks/           # Background tasks
```

## Documentação

Após iniciar o servidor, acesse:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
