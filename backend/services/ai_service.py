import httpx
import os


class AIService:
    """Unified interface for Claude / OpenAI / Gemini text generation, and
    DALL-E image generation."""

    async def generate(self, provider: str, prompt: str, api_key: str = "", system: str = "") -> dict:
        if provider == "claude":
            return await self._claude(prompt, system)
        elif provider == "openai":
            key = api_key or os.getenv("OPENAI_API_KEY", "")
            if not key:
                raise ValueError("OpenAI API key not configured")
            return await self._openai(prompt, system, key)
        elif provider == "gemini":
            key = api_key or os.getenv("GEMINI_API_KEY", "")
            if not key:
                raise ValueError("Gemini API key not configured")
            return await self._gemini(prompt, system, key)
        else:
            raise ValueError(f"Unknown AI provider: {provider}")

    async def _claude(self, prompt: str, system: str = "") -> dict:
        body = {"model": "claude-sonnet-4-6", "max_tokens": 2000, "messages": [{"role": "user", "content": prompt}]}
        if system:
            body["system"] = system
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": os.getenv("ANTHROPIC_API_KEY", ""),
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                },
                json=body,
            )
            r.raise_for_status()
            d = r.json()
            return {"text": d["content"][0]["text"], "tokens": d.get("usage", {}).get("output_tokens", 0)}

    async def _openai(self, prompt: str, system: str = "", api_key: str = "") -> dict:
        messages = ([{"role": "system", "content": system}] if system else []) + [{"role": "user", "content": prompt}]
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"model": "gpt-4o", "max_tokens": 2000, "messages": messages},
            )
            r.raise_for_status()
            d = r.json()
            return {"text": d["choices"][0]["message"]["content"], "tokens": d.get("usage", {}).get("completion_tokens", 0)}

    async def _gemini(self, prompt: str, system: str = "", api_key: str = "") -> dict:
        full = f"{system}\n\n{prompt}" if system else prompt
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={api_key}",
                headers={"Content-Type": "application/json"},
                json={"contents": [{"parts": [{"text": full}]}]},
            )
            r.raise_for_status()
            d = r.json()
            return {"text": d["candidates"][0]["content"]["parts"][0]["text"], "tokens": 0}

    async def generate_image(self, prompt: str, api_key: str = "") -> str:
        """
        Generate a real image using OpenAI's DALL-E 3.
        Requires an OpenAI API key (separate from text generation key if needed).
        Returns a URL to the generated image (hosted by OpenAI, valid for ~1 hour —
        download and re-host it if you need it to persist longer).
        """
        key = api_key or os.getenv("OPENAI_API_KEY", "")
        if not key:
            # Fallback: no image key configured, use a placeholder so the flow doesn't break
            import hashlib
            seed = int(hashlib.md5(prompt.encode()).hexdigest()[:6], 16) % 1000
            return f"https://picsum.photos/seed/{seed}/1024/576"

        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(
                "https://api.openai.com/v1/images/generations",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json={
                    "model": "dall-e-3",
                    "prompt": prompt,
                    "n": 1,
                    "size": "1024x1024",
                    "quality": "standard",
                },
            )
            r.raise_for_status()
            d = r.json()
            return d["data"][0]["url"]
