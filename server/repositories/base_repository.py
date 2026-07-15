from typing import List, Dict, Any, Optional
from db.database import db_manager

class BaseRepository:
    def __init__(self, table_name: str):
        self.table_name = table_name
        self.db_manager = db_manager

    def _execute_query(self, query: str, params: tuple = ()) -> List[Dict[str, Any]]:
        """Execute a SELECT query and return results as list of dicts"""
        with db_manager.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, params)

                if cur.description:
                    columns = [desc[0] for desc in cur.description]

                    return [dict(zip(columns, row)) for row in cur.fetchall()]

                return []

    def _execute_command(self, query: str, params: tuple = ()) -> int:
        """Execute an INSERT/UPDATE/DELETE command and return affected rows"""
        with db_manager.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, params)

                affected_rows = cur.rowcount

                conn.commit()

                return affected_rows

    def _execute_insert(self, query: str, params: tuple = ()) -> Optional[Any]:
        """Execute an INSERT command and return the inserted ID or row"""
        with db_manager.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, params)

                try:
                    result = cur.fetchone()[0] if cur.description else None
                except (TypeError, IndexError):
                    result = None

                conn.commit()

                return result
