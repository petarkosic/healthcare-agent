import hashlib
from typing import Any, Optional
from threading import Lock

from cachetools import TTLCache


class Cache:
    def __init__(self, maxsize: int = 500, default_ttl: int = 1800):
        self._cache: TTLCache = TTLCache(maxsize=maxsize, ttl=default_ttl)
        self._lock = Lock()

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            return self._cache.get(key)

    def set(self, key: str, value: Any) -> None:
        with self._lock:
            self._cache[key] = value

    def delete(self, key: str) -> None:
        with self._lock:
            self._cache.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()


def hash_key(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:16]


cache = Cache(maxsize=500, default_ttl=1800)
