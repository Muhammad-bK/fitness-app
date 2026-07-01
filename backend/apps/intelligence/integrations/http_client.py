"""HTTP client with retry and rate-limit awareness."""

import logging
import time
from typing import Any

import requests
from requests.exceptions import RequestException

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_BACKOFF = 0.5


class ExternalAPIError(Exception):
    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


def request_with_retry(
    method: str,
    url: str,
    *,
    headers: dict[str, str] | None = None,
    params: dict[str, Any] | None = None,
    json_body: dict | None = None,
    timeout: int = 15,
) -> Any:
    last_error: Exception | None = None

    for attempt in range(MAX_RETRIES):
        try:
            response = requests.request(
                method,
                url,
                headers=headers,
                params=params,
                json=json_body,
                timeout=timeout,
            )

            if response.status_code == 429:
                retry_after = int(response.headers.get("Retry-After", 2))
                logger.warning("Rate limited (429), waiting %ds", retry_after)
                time.sleep(retry_after)
                continue

            if response.status_code >= 500:
                logger.warning("Server error %d on attempt %d", response.status_code, attempt + 1)
                time.sleep(RETRY_BACKOFF * (attempt + 1))
                continue

            if not response.ok:
                raise ExternalAPIError(
                    f"API error {response.status_code}: {response.text[:200]}",
                    status_code=response.status_code,
                )

            return response.json()

        except RequestException as exc:
            last_error = exc
            logger.warning("Request failed attempt %d: %s", attempt + 1, exc)
            time.sleep(RETRY_BACKOFF * (attempt + 1))

    raise ExternalAPIError(f"Request failed after {MAX_RETRIES} retries: {last_error}")
