"""
LiteLLM wrapper with automatic fallback chain:
  1. Groq (Llama 3.3 70B) — fast, 14,400 req/day free
  2. Google AI Studio (Gemini 2.0 Flash) — generous free quota
  3. OpenRouter (free models) — last resort
"""
import json
import logging
import time
from typing import Any

import litellm
from litellm import completion

from config import settings

logger = logging.getLogger(__name__)

litellm.set_verbose = False

SCORING_MODELS = [
    "groq/llama-3.3-70b-versatile",
    "gemini/gemini-2.0-flash",
    "openrouter/meta-llama/llama-3.3-70b-instruct:free",
]

DRAFTING_MODELS = [
    "gemini/gemini-2.0-flash",
    "groq/llama-3.3-70b-versatile",
    "openrouter/google/gemini-2.0-flash-exp:free",
]

PARSING_MODELS = [
    "groq/llama-3.3-70b-versatile",
    "gemini/gemini-2.0-flash",
    "openrouter/meta-llama/llama-3.3-70b-instruct:free",
]


def _set_api_keys() -> None:
    import os
    if settings.groq_api_key:
        os.environ["GROQ_API_KEY"] = settings.groq_api_key
    if settings.google_api_key:
        os.environ["GEMINI_API_KEY"] = settings.google_api_key
    if settings.openrouter_api_key:
        os.environ["OPENROUTER_API_KEY"] = settings.openrouter_api_key


_set_api_keys()


def _call_with_fallback(
    models: list[str],
    messages: list[dict],
    json_mode: bool = False,
    temperature: float = 0.2,
    max_tokens: int = 4096,
) -> tuple[str, dict]:
    """Try each model in order; return (content, metadata)."""
    last_error: Exception | None = None
    for model in models:
        try:
            start = time.monotonic()
            kwargs: dict[str, Any] = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            if json_mode and "gemini" not in model and "openrouter" not in model:
                kwargs["response_format"] = {"type": "json_object"}

            response = completion(**kwargs)
            elapsed_ms = int((time.monotonic() - start) * 1000)
            content = response.choices[0].message.content or ""
            usage = response.usage or {}
            metadata = {
                "model": model,
                "prompt_tokens": getattr(usage, "prompt_tokens", 0),
                "completion_tokens": getattr(usage, "completion_tokens", 0),
                "generation_time_ms": elapsed_ms,
            }
            logger.info("LLM call succeeded model=%s tokens=%s ms=%s", model, getattr(usage, "total_tokens", "?"), elapsed_ms)
            return content, metadata
        except Exception as exc:
            logger.warning("LLM call failed model=%s error=%s", model, exc)
            last_error = exc
            continue

    raise RuntimeError(f"All LLM providers failed. Last error: {last_error}")


def call_scoring_llm(messages: list[dict]) -> tuple[dict, dict]:
    """Call LLM for scoring; parse and return JSON + metadata."""
    content, metadata = _call_with_fallback(SCORING_MODELS, messages, json_mode=True)
    return _parse_json(content), metadata


def call_drafting_llm(messages: list[dict]) -> tuple[str, dict]:
    """Call LLM for creative drafting; return raw text + metadata."""
    content, metadata = _call_with_fallback(DRAFTING_MODELS, messages, temperature=0.7)
    return content.strip(), metadata


def call_parsing_llm(messages: list[dict]) -> tuple[dict, dict]:
    """Call LLM for structured extraction; parse and return JSON + metadata."""
    content, metadata = _call_with_fallback(PARSING_MODELS, messages, json_mode=True)
    return _parse_json(content), metadata


def call_tailoring_llm(messages: list[dict]) -> tuple[dict, dict]:
    """Call LLM for resume tailoring diff; parse and return JSON + metadata."""
    content, metadata = _call_with_fallback(SCORING_MODELS, messages, json_mode=True)
    return _parse_json(content), metadata


def _parse_json(content: str) -> dict:
    """Parse JSON from LLM response, stripping markdown fences if present."""
    content = content.strip()
    if content.startswith("```"):
        lines = content.split("\n")
        content = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
    return json.loads(content)
