"""
Auth Schemas - Token validation
"""
from pydantic import BaseModel


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Data extracted from JWT token."""
    user_id: int | None = None
    email: str | None = None
