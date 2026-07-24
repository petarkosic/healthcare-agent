import os
from typing import Optional

from cryptography.fernet import Fernet

_ENCRYPTION_KEY = os.getenv("TOKEN_ENCRYPTION_KEY")
if not _ENCRYPTION_KEY:
    raise RuntimeError(
        "TOKEN_ENCRYPTION_KEY environment variable is required and must not be empty"
    )

_fernet = Fernet(_ENCRYPTION_KEY.encode())


def encrypt_token(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None

    return _fernet.encrypt(value.encode()).decode()


def decrypt_token(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None

    return _fernet.decrypt(value.encode()).decode()
