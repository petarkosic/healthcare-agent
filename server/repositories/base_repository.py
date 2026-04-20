from typing import List, Dict, Any, Optional, TypeVar, Generic
from psycopg import sql
from db.database import db_manager

T = TypeVar('T')

class BaseRepository(Generic[T]):
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
                    return cur.fetchone()[0] if cur.description else None
                except (TypeError, IndexError):
                    return None
                finally:
                    conn.commit()
    
    def find_by_id(self, id_field: str, id_value: Any) -> Optional[Dict[str, Any]]:
        """Find a record by ID"""
        query = sql.SQL("SELECT * FROM {table} WHERE {id_field} = %s").format(
            table=sql.Identifier(self.table_name),
            id_field=sql.Identifier(id_field)
        )

        results = self._execute_query(query, (id_value,))

        return results[0] if results else None
    
    def find_all(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Find all records with pagination"""
        query = sql.SQL("SELECT * FROM {table} LIMIT %s OFFSET %s").format(
            table=sql.Identifier(self.table_name)
        )

        return self._execute_query(query, (limit, offset))
    
    def create(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Create a new record"""
        if not data:
            return None
            
        columns = list(data.keys())
        placeholders = ['%s'] * len(columns)
        values = list(data.values())
        
        query = sql.SQL("INSERT INTO {table} ({columns}) VALUES ({placeholders}) RETURNING *").format(
            table=sql.Identifier(self.table_name),
            columns=sql.SQL(', ').join(map(sql.Identifier, columns)),
            placeholders=sql.SQL(', ').join(sql.SQL(p) for p in placeholders)
        )
        
        result = self._execute_insert(query, tuple(values))

        if result:
            return self.find_by_id(list(data.keys())[0], result)  # Assuming first column is ID
        return None
    
    def update(self, id_field: str, id_value: Any, data: Dict[str, Any]) -> bool:
        """Update a record by ID"""
        if not data:
            return False
            
        set_clauses = [sql.SQL("{} = %s").format(sql.Identifier(k)) for k in data.keys()]
        values = list(data.values()) + [id_value]
        
        query = sql.SQL("UPDATE {table} SET {set_clause} WHERE {id_field} = %s").format(
            table=sql.Identifier(self.table_name),
            set_clause=sql.SQL(', ').join(set_clauses),
            id_field=sql.Identifier(id_field)
        )
        
        affected_rows = self._execute_command(query, tuple(values))

        return affected_rows > 0
    
    def delete(self, id_field: str, id_value: Any) -> bool:
        """Delete a record by ID"""
        query = sql.SQL("DELETE FROM {table} WHERE {id_field} = %s").format(
            table=sql.Identifier(self.table_name),
            id_field=sql.Identifier(id_field)
        )
        
        affected_rows = self._execute_command(query, (id_value,))

        return affected_rows > 0