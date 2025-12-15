"""
Cookie utility functions for consistent cookie setting across the application.
"""

from fastapi import Response

from app.config import settings


def set_auth_cookie(
    response: Response,
    key: str,
    value: str,
    max_age: int,
    httponly: bool = True,
    secure: bool = None,
    samesite: str = "lax",
    path: str = "/",
    domain: str = None,
) -> None:
    """
    Set an authentication cookie with consistent settings.

    Args:
        response: FastAPI Response object
        key: Cookie name
        value: Cookie value
        max_age: Cookie expiration in seconds
        httponly: Whether cookie is httpOnly (default: True)
        secure: Whether cookie is secure (HTTPS only). If None, uses production setting
        samesite: SameSite attribute (default: "lax")
        path: Cookie path (default: "/")
        domain: Cookie domain. If None, uses COOKIE_DOMAIN from settings if set
    """
    if secure is None:
        secure = settings.ENVIRONMENT == "production"

    # Use explicit domain from parameter, or from settings, or None (default domain)
    cookie_domain = domain or (settings.COOKIE_DOMAIN if settings.COOKIE_DOMAIN else None)

    response.set_cookie(
        key=key,
        value=value,
        httponly=httponly,
        secure=secure,
        samesite=samesite,
        max_age=max_age,
        path=path,
        domain=cookie_domain,
    )


def delete_auth_cookie(
    response: Response,
    key: str,
    path: str = "/",
    domain: str = None,
) -> None:
    """
    Delete an authentication cookie.

    Args:
        response: FastAPI Response object
        key: Cookie name
        path: Cookie path (default: "/")
        domain: Cookie domain. If None, uses COOKIE_DOMAIN from settings if set
    """
    # Use explicit domain from parameter, or from settings, or None (default domain)
    cookie_domain = domain or (settings.COOKIE_DOMAIN if settings.COOKIE_DOMAIN else None)

    response.delete_cookie(key=key, path=path, domain=cookie_domain)
