from pydantic import BaseModel

class SignUpRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    specialty: str
    license_number: str
    password: str


class LoginRequest(BaseModel):
    serial_number: str
    password: str


class AuthResponse(BaseModel):
    token: str
    doctor_serial_number: str
    doctor_name: str