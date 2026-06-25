"""add dashboard indexes

Revision ID: 4f8a2c1d9b3e
Revises: b2f1c0a7d3e2
Create Date: 2026-06-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = '4f8a2c1d9b3e'
down_revision: Union[str, Sequence[str], None] = 'b2f1c0a7d3e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Composite index for dashboard schedule + stats queries:
    # filters on doctor_serial_number then ranges over visit_date
    op.execute(
        "CREATE INDEX idx_visits_doctor_date "
        "ON visits(doctor_serial_number, visit_date)"
    )

    # Index for active medications count by prescribing doctor
    op.execute(
        "CREATE INDEX idx_medications_doctor_status "
        "ON medications(doctor_serial_number, status, end_date)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_visits_doctor_date")
    op.execute("DROP INDEX IF EXISTS idx_medications_doctor_status")
