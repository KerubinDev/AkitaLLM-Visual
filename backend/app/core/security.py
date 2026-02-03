"""
Security Module - JWT and password handling
"""
from datetime import datetime, timedelta
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.auth import TokenData

settings = get_settings()

# Password hashing
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    
    return encoded_jwt


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Usuario:
    """
    Dependency that extracts and validates current user from JWT token.
    Raises 401 if token is invalid or user not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id_str: str = payload.get("sub")
        email: str = payload.get("email")
        
        if user_id_str is None:
            raise credentials_exception
            
        user_id = int(user_id_str)
        token_data = TokenData(user_id=user_id, email=email)
        
    except (JWTError, ValueError):
        raise credentials_exception
    
    # Fetch user from database
    try:
        result = await db.execute(
            select(Usuario).where(Usuario.id == token_data.user_id)
        )
        user = result.scalar_one_or_none()
    except Exception as e:
        print(f"Error extracting user from DB: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Erro de banco de dados: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user is None or not user.ativo:
        raise credentials_exception
    
    return user
