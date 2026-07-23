from typing import List, Dict, Any, Optional
from db.database import db_manager

class BaseRepository:
    def __init__(self, table_name: str):
        self.table_name = table_name
        self.db_manager = db_manager

    def _execute_query(self, query: str, params: tuple = (), conn=None) -> List[Dict[str, Any]]:
        """Execute a SELECT query and return results as list of dicts.

        Pass `conn` to enlist in a caller-managed transaction (see db_manager.transaction());
        otherwise a connection is taken from the pool for this call only.
        """
        if conn is not None:
            return self._run_query(conn, query, params)

        with db_manager.get_connection() as conn:
            return self._run_query(conn, query, params)

    def _execute_command(self, query: str, params: tuple = (), conn=None) -> int:
        """Execute an INSERT/UPDATE/DELETE command and return affected rows"""
        if conn is not None:
            with conn.cursor() as cur:
                cur.execute(query, params)

                return cur.rowcount

        with db_manager.get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, params)

                affected_rows = cur.rowcount

                conn.commit()

                return affected_rows

    def _execute_insert(self, query: str, params: tuple = (), conn=None) -> Optional[Any]:
        """Execute an INSERT command and return the inserted ID or row"""
        if conn is not None:
            return self._run_insert(conn, query, params)

        with db_manager.get_connection() as conn:
            result = self._run_insert(conn, query, params)
            conn.commit()

            return result

    def _run_query(self, conn, query: str, params: tuple) -> List[Dict[str, Any]]:
        with conn.cursor() as cur:
            cur.execute(query, params)

            if cur.description:
                columns = [desc[0] for desc in cur.description]

                return [dict(zip(columns, row)) for row in cur.fetchall()]

            return []

    def _run_insert(self, conn, query: str, params: tuple) -> Optional[Any]:
        with conn.cursor() as cur:
            cur.execute(query, params)

            try:
                return cur.fetchone()[0] if cur.description else None
            except (TypeError, IndexError):
                return None
