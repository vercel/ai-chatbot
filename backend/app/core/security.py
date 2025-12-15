import uuid
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    # Bcrypt has a 72-byte limit. Validate before hashing to provide clear error.
    password_bytes = password.encode("utf-8")
    password_byte_length = len(password_bytes)

    if password_byte_length > 72:
        raise ValueError(
            f"Password cannot exceed 72 bytes (got {password_byte_length} bytes). "
            "Please use a shorter password or avoid special characters that use multiple bytes."
        )

    try:
        return pwd_context.hash(password)
    except ValueError as e:
        # Catch bcrypt's own 72-byte limit error and provide a clearer message
        error_msg = str(e)
        if "cannot be longer than 72 bytes" in error_msg:
            raise ValueError(
                f"Password cannot exceed 72 bytes (got {password_byte_length} bytes). "
                "Please use a shorter password or avoid special characters that use multiple bytes."
            ) from e
        # Re-raise other ValueError exceptions
        raise


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    now = datetime.utcnow()
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    # Add iat (issued at) claim for session invalidation
    # Add jti (JWT ID) claim for token revocation
    jti = str(uuid.uuid4())
    to_encode.update({"exp": expire, "iat": now, "jti": jti})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str):
    """
    Decode JWT token with key rotation support.
    Tries current key first, then old key (if configured) for backward compatibility.
    """
    # Try current key first
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        pass

    # If current key fails and old key is configured, try old key (key rotation)
    if settings.JWT_SECRET_KEY_OLD:
        try:
            payload = jwt.decode(
                token, settings.JWT_SECRET_KEY_OLD, algorithms=[settings.JWT_ALGORITHM]
            )
            return payload
        except JWTError:
            pass

    return None
