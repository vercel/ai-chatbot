from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from typing import Optional

router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    # TODO: Implement user lookup from database
    # For now, return a placeholder response
    # user = await get_user_by_email(db, request.email)

    # if not user or not user.password:
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="Invalid email or password"
    #     )

    # if not verify_password(request.password, user.password):
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="Invalid email or password"
    #     )

    # Placeholder - replace with actual user lookup
    access_token = create_access_token(
        data={"sub": "user-id-placeholder", "type": "regular"}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": "user-id-placeholder",
            "email": request.email,
            "type": "regular"
        }
    }


@router.post("/register", response_model=TokenResponse)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    # TODO: Implement user creation
    # existing_user = await get_user_by_email(db, request.email)
    # if existing_user:
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail="Email already registered"
    #     )

    # hashed_password = get_password_hash(request.password)
    # user = await create_user(db, request.email, hashed_password)

    # Placeholder
    access_token = create_access_token(
        data={"sub": "user-id-placeholder", "type": "regular"}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": "user-id-placeholder",
            "email": request.email,
            "type": "regular"
        }
    }


@router.post("/guest", response_model=TokenResponse)
async def create_guest(
    db: AsyncSession = Depends(get_db)
):
    # TODO: Implement guest user creation
    # user = await create_guest_user(db)

    # Placeholder
    access_token = create_access_token(
        data={"sub": "guest-id-placeholder", "type": "guest"}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": "guest-id-placeholder",
            "email": None,
            "type": "guest"
        }
    }

