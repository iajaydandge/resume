import time
import uuid

from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from joserfc import jwk, jwt
from joserfc.errors import JoseError
from sqlalchemy.ext.asyncio import AsyncSession

from server.config import settings
from server.database import get_db
from server.services.db import (
    get_or_create_profile,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

oauth = OAuth()
if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
    oauth.register(
        name="google",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        server_metadata_url=settings.GOOGLE_CONF_URL,
        client_kwargs={"scope": "openid email profile"},
    )


def create_access_token(
    user_id: str, email: str, name: str | None = None
) -> str:
    """Generates a secure signed JWT token valid for 30 minutes using joserfc."""
    header = {"alg": "HS256"}
    payload = {
        "sub": user_id,
        "email": email,
        "name": name or "",
        "iat": int(time.time()),
        "exp": int(time.time()) + (60 * 30),
    }
    key = jwk.import_key(settings.SESSION_SECRET_KEY, "oct")
    return jwt.encode(header, payload, key)


async def get_current_user_id(request: Request) -> uuid.UUID:
    """Dependency to retrieve user UUID from Bearer token header or session cookie."""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        try:
            key = jwk.import_key(settings.SESSION_SECRET_KEY, "oct")
            decoded = jwt.decode(token, key)
            registry = jwt.JWTClaimsRegistry()
            registry.validate(decoded.claims)
            user_id_str = decoded.claims.get("sub")
            if user_id_str:
                return uuid.UUID(str(user_id_str))
        except (JoseError, ValueError, Exception):  # noqa: BLE001
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token.",
            )

    user_session = request.session.get("user")
    if user_session and "id" in user_session:
        return uuid.UUID(user_session["id"])

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated. Please log in with Google.",
    )


@router.get("/google/authorize")
async def google_authorize(request: Request):
    """Initiates Google OAuth2 Authorization Code Flow."""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
        )
    redirect_uri = request.url_for("google_callback")
    return await oauth.google.authorize_redirect(request, str(redirect_uri))


@router.get("/google/callback", name="google_callback")
async def google_callback(
    request: Request, db: AsyncSession = Depends(get_db)  # noqa: B008
):
    """Receives callback from Google, exchanges auth code for token, and redirects to frontend with JWT."""
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google OAuth failed: {e!s}",
        )

    user_info = token.get("userinfo")
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to retrieve user info from Google token.",
        )

    google_sub = user_info.get("sub")
    email = user_info.get("email")
    display_name = user_info.get("name")
    avatar_url = user_info.get("picture")

    if not google_sub or not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Google profile data.",
        )

    profile = await get_or_create_profile(
        db,
        google_sub=google_sub,
        email=email,
        display_name=display_name,
        avatar_url=avatar_url,
    )

    request.session["user"] = {
        "id": str(profile.id),
        "email": profile.email,
        "name": profile.display_name,
    }

    return RedirectResponse(url="/")


@router.post("/logout")
async def logout(request: Request):
    """Clears user session cookie."""
    request.session.clear()
    return {"message": "Logged out successfully."}
