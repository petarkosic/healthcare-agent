import json
from typing import Any, Optional
from .base_repository import BaseRepository


class ChatRepository(BaseRepository):
    def __init__(self):
        super().__init__("chat_conversations")

    def create_conversation(self, patient_serial: str, doctor_id: str) -> str:
        conversation_id = self._execute_insert(
            "INSERT INTO chat_conversations (patient_serial, doctor_id) "
            "VALUES (%s, %s) RETURNING id",
            (patient_serial, doctor_id),
        )

        return str(conversation_id)

    def list_conversations(self, patient_serial: str) -> list[dict[str, Any]]:
        return self._execute_query(
            "SELECT id, created_at, last_message_at FROM chat_conversations "
            "WHERE patient_serial = %s AND deleted_at IS NULL "
            "ORDER BY COALESCE(last_message_at, created_at) DESC",
            (patient_serial,),
        )

    def get_conversation(self, patient_serial: str, conversation_id: str) -> Optional[dict[str, Any]]:
        results = self._execute_query(
            "SELECT id, patient_serial, doctor_id, created_at, last_message_at FROM chat_conversations "
            "WHERE id = %s AND patient_serial = %s AND deleted_at IS NULL",
            (conversation_id, patient_serial),
        )

        return results[0] if results else None

    def soft_delete_conversation(self, patient_serial: str, conversation_id: str) -> bool:
        affected = self._execute_command(
            "UPDATE chat_conversations SET deleted_at = NOW() "
            "WHERE id = %s AND patient_serial = %s AND deleted_at IS NULL",
            (conversation_id, patient_serial),
        )

        return affected > 0

    def count_messages(self, conversation_id: str) -> int:
        results = self._execute_query(
            "SELECT COUNT(*) AS count FROM chat_messages WHERE conversation_id = %s",
            (conversation_id,),
        )
        
        return results[0]["count"] if results else 0

    def list_messages(self, conversation_id: str) -> list[dict[str, Any]]:
        return self._execute_query(
            "SELECT id, role, content, tool_calls, chart_data, created_at FROM chat_messages "
            "WHERE conversation_id = %s ORDER BY created_at ASC",
            (conversation_id,),
        )

    def add_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        tool_calls: list,
        chart_data: Optional[dict],
    ) -> str:
        with self.db_manager.transaction() as conn:
            message_id = self._execute_insert(
                "INSERT INTO chat_messages (conversation_id, role, content, tool_calls, chart_data) "
                "VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (conversation_id, role, content, json.dumps(tool_calls), json.dumps(chart_data) if chart_data else None),
                conn=conn,
            )

            self._execute_command(
                "UPDATE chat_conversations SET last_message_at = NOW() WHERE id = %s",
                (conversation_id,),
                conn=conn,
            )

        return str(message_id)


chat_repository = ChatRepository()
