"""
Password strength validation utilities.
"""

import hashlib
import logging
import re
from typing import Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# Cache for HIBP results (in-memory, simple implementation)
# In production, consider using Redis for distributed caching
_hibp_cache: dict[str, bool] = {}


def validate_password_strength(password: str) -> tuple[bool, Optional[str]]:
    """
    Validate password strength.
    Returns (is_valid, error_message).

    Requirements:
    - Minimum 8 characters (already enforced by frontend: 6, but we recommend 8)
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

    Note: Bcrypt has a 72-byte limit, which is already checked elsewhere.
    """
    errors = []

    # Check minimum length (8 characters recommended, but frontend allows 6)
    if len(password) < 6:
        errors.append("Password must be at least 6 characters long")
    elif len(password) < 8:
        # Warn but don't fail for 6-7 character passwords (frontend compatibility)
        pass

    # Check for uppercase letter
    if not re.search(r"[A-Z]", password):
        errors.append("Password must contain at least one uppercase letter")

    # Check for lowercase letter
    if not re.search(r"[a-z]", password):
        errors.append("Password must contain at least one lowercase letter")

    # Check for number
    if not re.search(r"\d", password):
        errors.append("Password must contain at least one number")

    # Check for special character
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]", password):
        errors.append(
            "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)"
        )

    if errors:
        return False, ". ".join(errors)

    return True, None


def is_common_password(password: str) -> bool:
    """
    Check if password is in a list of common passwords.
    This is a basic check - in production, consider using Have I Been Pwned API.
    """
    common_passwords = {
        "password",
        "123456",
        "12345678",
        "123456789",
        "1234567890",
        "qwerty",
        "abc123",
        "password1",
        "Password1",
        "password123",
        "admin",
        "letmein",
        "welcome",
        "monkey",
        "1234567",
        "sunshine",
        "princess",
        "dragon",
        "passw0rd",
        "master",
    }

    return password.lower() in common_passwords


async def check_password_breached_hibp(password: str) -> Optional[bool]:
    """
    Check if password appears in Have I Been Pwned database using k-anonymity.
    Returns:
        True if password is found in breaches
        False if password is not found
        None if check failed (API error, timeout, etc.)

    Uses k-anonymity: only sends first 5 characters of SHA-1 hash to HIBP API.
    Full password never leaves the server.
    """
    if not settings.ENABLE_HIBP_CHECK:
        return None  # HIBP check disabled

    # Check cache first
    cache_key = hashlib.sha256(password.encode()).hexdigest()
    if cache_key in _hibp_cache:
        return _hibp_cache[cache_key]

    try:
        # Hash password with SHA-1 (HIBP uses SHA-1)
        sha1_hash = hashlib.sha1(password.encode()).hexdigest().upper()

        # Split hash: first 5 chars (sent to API), rest (checked locally)
        prefix = sha1_hash[:5]
        suffix = sha1_hash[5:]

        # Call HIBP API with k-anonymity
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"https://api.pwnedpasswords.com/range/{prefix}",
                headers={"User-Agent": "AI-Chatbot-Password-Checker"},
            )

            if response.status_code == 200:
                # Parse response: each line is "HASH_SUFFIX:COUNT"
                hashes = response.text.strip().splitlines()
                for hash_line in hashes:
                    if ":" in hash_line:
                        hash_suffix, count = hash_line.split(":", 1)
                        if hash_suffix == suffix:
                            # Password found in breaches
                            _hibp_cache[cache_key] = True
                            logger.warning(
                                "Password found in HIBP database (breached %s times)", count
                            )
                            return True

                # Password not found in breaches
                _hibp_cache[cache_key] = False
                return False
            else:
                logger.warning(
                    "HIBP API returned status %d, skipping password check", response.status_code
                )
                return None

    except httpx.TimeoutException:
        logger.warning("HIBP API timeout, skipping password check")
        return None
    except httpx.RequestError as e:
        logger.warning("HIBP API request error: %s, skipping password check", e)
        return None
    except Exception as e:
        logger.error("Unexpected error checking HIBP: %s", e, exc_info=True)
        return None


async def is_password_breached(password: str) -> bool:
    """
    Check if password is breached (common passwords or HIBP).
    Returns True if password should be rejected.

    This function:
    1. Checks local common password list (fast)
    2. Optionally checks HIBP API if enabled (more comprehensive)
    3. Returns True if password is found in either source
    """
    # First check local common passwords (fast, no API call)
    if is_common_password(password):
        return True

    # Then check HIBP if enabled
    if settings.ENABLE_HIBP_CHECK:
        hibp_result = await check_password_breached_hibp(password)
        if hibp_result is True:
            return True
        # If hibp_result is None (API error), we don't block the password
        # This ensures availability even if HIBP is down

    return False
