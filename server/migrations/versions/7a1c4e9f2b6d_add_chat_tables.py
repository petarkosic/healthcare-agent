"""add chat tables

Revision ID: 7a1c4e9f2b6d
Revises: 4f8a2c1d9b3e
Create Date: 2026-10-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = '7a1c4e9f2b6d'
down_revision: Union[str, Sequence[str], None] = '4f8a2c1d9b3e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE chat_conversations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            patient_serial VARCHAR(8) NOT NULL REFERENCES patients(patient_serial_number) ON DELETE CASCADE,
            doctor_id VARCHAR(20) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            last_message_at TIMESTAMPTZ,
            deleted_at TIMESTAMPTZ
        )
    """)
    op.execute("CREATE INDEX chat_conversations_patient_idx ON chat_conversations(patient_serial, deleted_at)")

    op.execute("""
        CREATE TABLE chat_messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
            role VARCHAR(10) NOT NULL,
            content TEXT NOT NULL,
            tool_calls JSONB NOT NULL DEFAULT '[]'::jsonb,
            chart_data JSONB,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX chat_messages_conversation_idx ON chat_messages(conversation_id, created_at)")

    op.execute("""
        CREATE OR REPLACE FUNCTION chat_messages_deny_mutation()
        RETURNS TRIGGER LANGUAGE plpgsql AS $$
        BEGIN
            RAISE EXCEPTION 'chat_messages is append-only — UPDATE/DELETE forbidden';
        END;
        $$
    """)
    op.execute("CREATE TRIGGER chat_messages_no_update BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE FUNCTION chat_messages_deny_mutation()")
    op.execute("CREATE TRIGGER chat_messages_no_delete BEFORE DELETE ON chat_messages FOR EACH ROW EXECUTE FUNCTION chat_messages_deny_mutation()")

    op.execute("""
        CREATE OR REPLACE FUNCTION chat_conversations_guard_mutation()
        RETURNS TRIGGER LANGUAGE plpgsql AS $$
        BEGIN
            IF TG_OP = 'DELETE' THEN
                RAISE EXCEPTION 'chat_conversations is soft-delete only — hard DELETE forbidden';
            END IF;

            IF TG_OP = 'UPDATE' THEN
                IF OLD.id IS DISTINCT FROM NEW.id
                   OR OLD.patient_serial IS DISTINCT FROM NEW.patient_serial
                   OR OLD.doctor_id IS DISTINCT FROM NEW.doctor_id
                   OR OLD.created_at IS DISTINCT FROM NEW.created_at
                THEN
                    RAISE EXCEPTION 'chat_conversations UPDATE may only change deleted_at/last_message_at';
                END IF;

                IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
                    RAISE EXCEPTION 'chat_conversations — only deleted_at may transition, and only once';
                END IF;
            END IF;

            RETURN NEW;
        END;
        $$
    """)
    op.execute("CREATE TRIGGER chat_conversations_guard BEFORE UPDATE OR DELETE ON chat_conversations FOR EACH ROW EXECUTE FUNCTION chat_conversations_guard_mutation()")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS chat_messages")
    op.execute("DROP TABLE IF EXISTS chat_conversations")
    op.execute("DROP FUNCTION IF EXISTS chat_messages_deny_mutation()")
    op.execute("DROP FUNCTION IF EXISTS chat_conversations_guard_mutation()")
