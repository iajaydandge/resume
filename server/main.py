from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware

from server.config import settings
from server.database import Base, engine
from server.routers.auth import router as auth_router
from server.routers.resumes import router as resumes_router
from server.routers.users import router as users_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="Resume",
    description="ATS Resume Alignment & PDF Generation API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET_KEY,
    session_cookie="resume_session",
    max_age=60 * 60 * 24 * 7,
    same_site="lax",
    https_only=settings.is_production,
)

# 2. Mount API Routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(resumes_router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


@app.get("/.well-known/jwks.json")
async def get_jwks():
    """Exposes standard JWKS key sets for client-side encryption (RFC 7517)."""
    try:
        from joserfc import jwk

        from server.services.encryption import get_public_key_pem

        pem_content = get_public_key_pem()
        key = jwk.import_key(pem_content)
        jwk_dict = key.as_dict()
        jwk_dict.update({
            "use": "enc",
            "alg": "RSA-OAEP-256",
            "kid": "system-encryption-key"
        })
        return {"keys": [jwk_dict]}
    except Exception as e:  # noqa: BLE001
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate JWKS: {e!s}",
        )


client_dist_path = Path(__file__).resolve().parent / "client" / "dist"
if client_dist_path.exists():
    app.frontend("/", directory=str(client_dist_path))
