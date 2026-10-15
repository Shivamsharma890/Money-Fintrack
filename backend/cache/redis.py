import redis
from flask import current_app
import json

_client = None


def get_redis():
    global _client
    if _client is None:
        _client = redis.Redis.from_url(
            current_app.config["REDIS_URL"],
            decode_responses=True,
            socket_connect_timeout=2,
        )
    return _client


def check_login_rate_limit(
    identity: str, limit: int = 10, window_seconds: int = 300
) -> bool:
    """Return True when request is allowed. Redis failures fail closed for login safety."""
    key = f"money-fintrack:login:{identity}"
    try:
        client = get_redis()
        count = client.incr(key)
        if count == 1:
            client.expire(key, window_seconds)
        return count <= limit
    except redis.RedisError:
        return False


def clear_login_rate_limit(identity: str) -> None:
    """Reset failed-login counter after successful authentication."""
    key = f"money-fintrack:login:{identity.strip().lower()}"
    try:
        get_redis().delete(key)
    except redis.RedisError:
        pass


def get_json_cache(key: str):
    """Return cached JSON, or None when missing/unavailable."""
    try:
        raw = get_redis().get(key)
        if raw is None:
            return None
        return json.loads(raw)
    except (redis.RedisError, ValueError, TypeError):
        return None


def set_json_cache(key: str, value, ttl_seconds: int = 30) -> None:
    """Cache JSON temporarily. Cache failure must not break the API."""
    try:
        get_redis().setex(
            key,
            ttl_seconds,
            json.dumps(value),
        )
    except (redis.RedisError, ValueError, TypeError):
        pass


def delete_cache(key: str) -> None:
    """Delete a cache entry without breaking the application."""
    try:
        get_redis().delete(key)
    except redis.RedisError:
        pass
