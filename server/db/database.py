import os
import psycopg
from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row
from dotenv import load_dotenv
from contextlib import contextmanager
from typing import Generator, Optional


load_dotenv()

class DatabaseManager:
    _instance: Optional['DatabaseManager'] = None
    _pool: Optional[ConnectionPool] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize_pool()
        return cls._instance
    
    def _initialize_pool(self):
        """Initialize the database connection pool"""
        db_config = (
            f"host={os.getenv('POSTGRES_HOST', 'localhost')}"
            f" port={os.getenv('POSTGRES_PORT', '5432')}"
            f" dbname={os.getenv('POSTGRES_DB', 'healthcare_agent')}"
            f" user={os.getenv('POSTGRES_USER', 'postgres')}"
            f" password={os.getenv('POSTGRES_PASSWORD', 'postgres')}"
        )
        
        self._pool = ConnectionPool(
            conninfo=db_config,
            min_size=1,
            max_size=20,
            open=False,
        )
        self._pool.open()
    
    @contextmanager
    def get_connection(self) -> Generator:
        """Get a connection from the pool"""
        if self._pool is None:
            raise RuntimeError("Database pool not initialized")
        
        with self._pool.connection() as conn:
            yield conn
    
    def close(self):
        """Close all connections in the pool"""
        if self._pool:
            self._pool.close()

db_manager = DatabaseManager()

def get_db_connection():
    """Dependency for getting database connection"""
    return db_manager.get_connection()
