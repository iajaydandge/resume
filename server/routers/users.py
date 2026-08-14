import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from server.database import get_db
from server.routers.auth import get_current_user_id
from server.schemas import UpdateProfileRequest, UserProfileResponse
from server.services.db import get_profile_by_id, get_source_resume
from server.services.encryption import decrypt_api_key

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me", response_model=UserProfileResponse)
async def get_me(
    request: Request,
    user_id: uuid.UUID = Depends(get_current_user_id),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    profile = await get_profile_by_id(db, user_id)
    if not profile:
        request.session.clear()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User profile not found.",
        )

    source_resume = await get_source_resume(db, user_id)
    return UserProfileResponse(
        id=profile.id,
        email=profile.email,
        display_name=profile.display_name,
        avatar_url=profile.avatar_url,
        source_resume_id=source_resume.id if source_resume else None,
        has_custom_api_key=profile.encrypted_google_api_key is not None,
    )


@router.patch("/me", response_model=UserProfileResponse)
async def update_profile(
    request: UpdateProfileRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    profile = await get_profile_by_id(db, user_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found.",
        )

    update_data = request.model_dump(exclude_unset=True)

    if "display_name" in update_data:
        profile.display_name = update_data["display_name"]
    if "avatar_url" in update_data:
        profile.avatar_url = update_data["avatar_url"]
    if "google_api_key" in update_data:
        key_val = update_data["google_api_key"]
        if key_val:
            ciphertext = key_val.strip()
            try:
                decrypt_api_key(ciphertext)
            except Exception as e:  # noqa: BLE001
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid encrypted API key format: {e!s}",
                )
            profile.encrypted_google_api_key = ciphertext
        else:
            profile.encrypted_google_api_key = None

    await db.commit()
    await db.refresh(profile)

    source_resume = await get_source_resume(db, user_id)
    return UserProfileResponse(
        id=profile.id,
        email=profile.email,
        display_name=profile.display_name,
        avatar_url=profile.avatar_url,
        source_resume_id=source_resume.id if source_resume else None,
        has_custom_api_key=profile.encrypted_google_api_key is not None,
    )
