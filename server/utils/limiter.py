from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from middleware.audit import extract_doctor_from_request


def get_client_ip(request: Request) -> str:
    real_ip = request.headers.get("X-Real-IP")

    if real_ip:
        return real_ip

    return get_remote_address(request)


def get_rate_limit_key(request: Request) -> str:
    doctor_id, _ = extract_doctor_from_request(request)

    if doctor_id:
        return f"doctor:{doctor_id}"

    return get_client_ip(request)


limiter = Limiter(key_func=get_rate_limit_key)
