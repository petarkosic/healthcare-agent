import os
from datetime import datetime, timedelta, timezone

from jose import jwt
import bcrypt

_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-super-secret")
_ALGORITHM = "HS256"
_TOKEN_EXPIRE_HOURS = 24


def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=10)
    hashed = bcrypt.hashpw(pwd_bytes, salt)

    return hashed.decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))


def create_token(doctor_serial_number: str, doctor_name: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=_TOKEN_EXPIRE_HOURS)
    payload = {"sub": doctor_serial_number, "name": doctor_name, "exp": expire}
    
    return jwt.encode(payload, _SECRET_KEY, algorithm=_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, _SECRET_KEY, algorithms=[_ALGORITHM])