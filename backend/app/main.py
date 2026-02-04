"""
DevFlow API - Main Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers import auth, usuarios, projetos, execucoes, plugins

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    await init_db()
    yield
    # Shutdown
    pass



# Trigger reload for aiosqlite installation
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Plataforma de apoio ao desenvolvimento de software",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/auth", tags=["Autenticação"])
app.include_router(usuarios.router, prefix="/usuarios", tags=["Usuários"])
app.include_router(projetos.router, prefix="/projetos", tags=["Projetos"])
app.include_router(execucoes.router, prefix="/execucoes", tags=["Execuções"])
app.include_router(plugins.router, prefix="/plugins", tags=["Plugins"])


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "status": "healthy"
    }
