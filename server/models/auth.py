from pydantic import BaseModel, Field


class SignUpRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    specialty: str
    license_number: str
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    serial_number: str
    password: str = Field(min_length=1)


class AuthResponse(BaseModel):
    doctor_serial_number: str
    doctor_name: str


class MeResponse(BaseModel):
    doctor_serial_number: str
    doctor_name: str
