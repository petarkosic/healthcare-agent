import time
import hashlib
from typing import Any, Optional
from threading import Lock


class Cache:
    def __init__(self, default_ttl: int = 1800):
        self._cache: dict[str, tuple[Any, float]] = {}
        self._lock = Lock()
        self.default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            if key not in self._cache:
                return None

            value, expiry = self._cache[key]
            if time.time() > expiry:
                del self._cache[key]
                return None

            return value

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        with self._lock:
            expiry = time.time() + (ttl or self.default_ttl)
            self._cache[key] = (value, expiry)

    def delete(self, key: str) -> None:
        with self._lock:
            if key not in self._cache:
                return

            self._cache.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            if not self._cache:
                return

            self._cache.clear()

    def cleanup_expired(self) -> int:
        removed = 0
        current_time = time.time()
        
        with self._lock:
            expired_keys = [
                k for k, (_, expiry) in self._cache.items() if current_time > expiry
            ]

            for key in expired_keys:
                self.delete(key)
                removed += 1
                
        return removed


def hash_key(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:16]


cache = Cache(default_ttl=1800)
