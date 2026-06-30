import httpx
import os
from urllib.parse import urlencode


class LinkedInService:
    AUTH_URL    = "https://www.linkedin.com/oauth/v2/authorization"
    TOKEN_URL   = "https://www.linkedin.com/oauth/v2/accessToken"
    PROFILE_URL = "https://api.linkedin.com/v2/userinfo"
    POST_URL    = "https://api.linkedin.com/v2/ugcPosts"
    ASSET_URL   = "https://api.linkedin.com/v2/assets"

    def __init__(self):
        self.client_id     = os.getenv("LINKEDIN_CLIENT_ID")
        self.client_secret = os.getenv("LINKEDIN_CLIENT_SECRET")
        self.redirect_uri  = os.getenv("LINKEDIN_REDIRECT_URI", "http://localhost:8000/api/linkedin/callback")

    def get_auth_url(self, state: str) -> str:
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": "openid profile email w_member_social",
            "state": state,
        }
        return f"{self.AUTH_URL}?{urlencode(params)}"

    async def exchange_code(self, code: str) -> dict:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                self.TOKEN_URL,
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": self.redirect_uri,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                },
            )
            r.raise_for_status()
            return r.json()

    async def get_profile(self, access_token: str) -> dict:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.get(self.PROFILE_URL, headers={"Authorization": f"Bearer {access_token}"})
            r.raise_for_status()
            return r.json()

    async def create_post(self, access_token: str, person_id: str, content: str, image_url: str = None) -> str:
        """Create a LinkedIn UGC post. Returns the LinkedIn post ID."""
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
        }

        body = {
            "author": f"urn:li:person:{person_id}",
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {"text": content},
                    "shareMediaCategory": "NONE",
                }
            },
            "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
        }

        if image_url:
            try:
                asset_urn = await self._upload_image(access_token, person_id, image_url)
                body["specificContent"]["com.linkedin.ugc.ShareContent"]["shareMediaCategory"] = "IMAGE"
                body["specificContent"]["com.linkedin.ugc.ShareContent"]["media"] = [
                    {"status": "READY", "media": asset_urn}
                ]
            except Exception:
                # If image upload fails, fall back to a text-only post rather than failing entirely
                pass

        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(self.POST_URL, json=body, headers=headers)
            r.raise_for_status()
            return r.headers.get("X-RestLi-Id", r.json().get("id", ""))

    async def _upload_image(self, access_token: str, person_id: str, image_url: str) -> str:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
        }
        async with httpx.AsyncClient(timeout=30) as client:
            reg = await client.post(
                f"{self.ASSET_URL}?action=registerUpload",
                headers=headers,
                json={
                    "registerUploadRequest": {
                        "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
                        "owner": f"urn:li:person:{person_id}",
                        "serviceRelationships": [
                            {"relationshipType": "OWNER", "identifier": "urn:li:userGeneratedContent"}
                        ],
                    }
                },
            )
            reg.raise_for_status()
            reg_data = reg.json()
            upload_url = reg_data["value"]["uploadMechanism"][
                "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
            ]["uploadUrl"]
            asset_urn = reg_data["value"]["asset"]

            # Handle both http(s) URLs and base64 data-URLs from file upload
            if image_url.startswith("data:"):
                import base64
                header, b64data = image_url.split(",", 1)
                img_bytes = base64.b64decode(b64data)
            else:
                img_resp = await client.get(image_url)
                img_bytes = img_resp.content

            await client.put(upload_url, content=img_bytes, headers={"Authorization": f"Bearer {access_token}"})

        return asset_urn
