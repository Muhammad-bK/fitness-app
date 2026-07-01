"""Caching utilities for external API responses."""

import hashlib
import json
import logging
from typing import Any

from django.core.cache import cache

logger = logging.getLogger(__name__)

DEFAULT_TTL = 3600  # 1 hour
SEARCH_TTL = 1800  # 30 minutes


def _cache_key(prefix: str, *parts: Any) -> str:
    raw = f"{prefix}:{':'.join(str(p) for p in parts)}"
    return f"intel:{hashlib.md5(raw.encode()).hexdigest()}"


def get_cached(prefix: str, *parts: Any) -> Any | None:
    key = _cache_key(prefix, *parts)
    value = cache.get(key)
    if value is not None:
        logger.debug("Cache hit: %s", key)
    return value


def set_cached(prefix: str, data: Any, ttl: int, *parts: Any) -> None:
    key = _cache_key(prefix, *parts)
    cache.set(key, data, ttl)
    logger.debug("Cache set: %s (ttl=%ds)", key, ttl)


def cache_or_fetch(prefix: str, ttl: int, fetch_fn, *parts: Any) -> Any:
    cached = get_cached(prefix, *parts)
    if cached is not None:
        return cached
    result = fetch_fn()
    set_cached(prefix, result, ttl, *parts)
    return result


def stable_json_key(data: dict) -> str:
    return hashlib.md5(json.dumps(data, sort_keys=True).encode()).hexdigest()
