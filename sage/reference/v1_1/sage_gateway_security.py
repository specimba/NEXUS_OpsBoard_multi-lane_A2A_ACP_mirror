"""Security primitives for the NEXUS SAGE REST façade.

Drop-in module. This does not modify the current repository automatically.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import os
import secrets
from typing import Any, Awaitable, Callable

ASGIApp = Callable[[dict[str, Any], Callable[..., Awaitable[Any]], Callable[..., Awaitable[Any]]], Awaitable[None]]


class ConfigurationError(RuntimeError):
    pass


class PayloadTooLarge(RuntimeError):
    pass


@dataclass(frozen=True)
class SecuritySettings:
    api_key: str
    max_body_bytes: int = 90_000

    @classmethod
    def from_environment(cls) -> "SecuritySettings":
        key = os.environ.get("NEXUS_SAGE_API_KEY", "").strip()
        if not key:
            raise ConfigurationError(
                "NEXUS_SAGE_API_KEY is required; production must fail closed."
            )
        if len(key) < 32:
            raise ConfigurationError("NEXUS_SAGE_API_KEY is too short.")
        max_bytes = int(os.environ.get("NEXUS_SAGE_MAX_BODY_BYTES", "90000"))
        if not 1_024 <= max_bytes <= 99_000:
            raise ConfigurationError("NEXUS_SAGE_MAX_BODY_BYTES is outside safe bounds.")
        return cls(api_key=key, max_body_bytes=max_bytes)

    @property
    def key_id(self) -> str:
        """Non-secret fingerprint suitable for receipts and audit logs."""
        return hashlib.sha256(self.api_key.encode("utf-8")).hexdigest()[:12]


def extract_bearer_token(headers: list[tuple[bytes, bytes]]) -> str | None:
    authorization = None
    for name, value in headers:
        if name.lower() == b"authorization":
            authorization = value.decode("latin-1")
            break
    if not authorization:
        return None
    scheme, separator, token = authorization.partition(" ")
    if not separator or scheme.lower() != "bearer":
        return None
    token = token.strip()
    return token or None


def authenticate(headers: list[tuple[bytes, bytes]], settings: SecuritySettings) -> bool:
    supplied = extract_bearer_token(headers)
    if supplied is None:
        return False
    return secrets.compare_digest(supplied, settings.api_key)


class BodySizeLimitMiddleware:
    """Counts actual ASGI body bytes, including chunked requests."""

    def __init__(self, app: ASGIApp, max_body_bytes: int) -> None:
        self.app = app
        self.max_body_bytes = max_body_bytes

    async def __call__(self, scope: dict[str, Any], receive: Callable[..., Awaitable[Any]], send: Callable[..., Awaitable[Any]]) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        seen = 0

        async def limited_receive() -> dict[str, Any]:
            nonlocal seen
            message = await receive()
            if message["type"] == "http.request":
                seen += len(message.get("body", b""))
                if seen > self.max_body_bytes:
                    raise PayloadTooLarge(
                        f"Request body exceeds {self.max_body_bytes} bytes."
                    )
            return message

        try:
            await self.app(scope, limited_receive, send)
        except PayloadTooLarge:
            body = (
                b'{"ok":false,"error":{"code":"PAYLOAD_TOO_LARGE",'
                b'"message":"Request body is too large.","retryable":false}}'
            )
            await send(
                {
                    "type": "http.response.start",
                    "status": 413,
                    "headers": [
                        (b"content-type", b"application/json"),
                        (b"content-length", str(len(body)).encode("ascii")),
                    ],
                }
            )
            await send({"type": "http.response.body", "body": body})
