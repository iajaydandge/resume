import re
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from server.database import get_db
from server.routers.auth import get_current_user_id
from server.schemas import (
    OnboardFormatRequest,
    OnboardFormatResponse,
    ResumeCreateRequest,
    ResumeResponse,
    ResumeSummaryItem,
    ResumeUpdateRequest,
)
from server.services.db import (
    create_resume,
    delete_resume,
    get_profile_by_id,
    get_resume_by_id,
    get_source_resume,
    list_user_resumes,
    update_resume,
)
from server.services.encryption import decrypt_api_key
from server.services.llm import format_onboarding_drafts, tailor_resume_for_job
from server.services.pdf import generate_resume_pdf

router = APIRouter(prefix="/api/resumes", tags=["Resumes"])


@router.get("", response_model=list[ResumeSummaryItem])
async def list_resumes(
    is_source: bool | None = None,
    user_id: uuid.UUID = Depends(get_current_user_id),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """List resumes for the authenticated user."""
    resumes = await list_user_resumes(db, user_id)
    if is_source is not None:
        resumes = [r for r in resumes if r.is_source == is_source]
    return resumes


@router.post("", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def create_new_resume(
    request: ResumeCreateRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """Create a new resume or derive/tailor an existing one."""
    if request.source_resume_id is not None or request.job_description is not None:
        source_id = request.source_resume_id
        if source_id:
            source_resume = await get_resume_by_id(db, source_id, user_id)
        else:
            source_resume = await get_source_resume(db, user_id)

        if not source_resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Source resume not found.",
            )

        if request.job_description:
            try:
                profile = await get_profile_by_id(db, user_id)
                api_key = (
                    decrypt_api_key(profile.encrypted_google_api_key)
                    if profile and profile.encrypted_google_api_key
                    else None
                )
                tailor_result = await tailor_resume_for_job(
                    source_resume_data=source_resume.resume_data,
                    job_description=request.job_description,
                    custom_name=request.name if not request.auto_generate_name else None,
                    api_key=api_key,
                )

                final_name = (
                    request.name
                    if (request.name and not request.auto_generate_name)
                    else tailor_result.derived_name
                )

                derived_resume = await create_resume(
                    db,
                    profile_id=user_id,
                    name=final_name,
                    is_source=False,
                    identity=source_resume.identity,
                    resume_data=tailor_result.tailored_resume_data.model_dump(),
                    job_description=request.job_description,
                )
                return derived_resume
            except ValueError as ve:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(ve),
                )
            except Exception as e:  # noqa: BLE001
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Resume tailoring failed: {e!s}",
                )
        else:
            final_name = request.name or f"Copy of {source_resume.name}"
            derived_resume = await create_resume(
                db,
                profile_id=user_id,
                name=final_name,
                is_source=False,
                identity=source_resume.identity,
                resume_data=source_resume.resume_data,
                job_description=None,
            )
            return derived_resume

    if not request.identity or not request.resume_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="identity and resume_data are required to create a new resume from scratch.",
        )

    return await create_resume(
        db,
        profile_id=user_id,
        name=request.name or "Untitled Resume",
        is_source=request.is_source,
        identity=request.identity.model_dump(),
        resume_data=request.resume_data.model_dump(),
        job_description=None,
    )


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """Retrieve a specific resume by ID."""
    resume = await get_resume_by_id(db, resume_id, user_id)
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found.",
        )
    return resume


@router.put("/{resume_id}", response_model=ResumeResponse)
async def update_existing_resume(
    resume_id: uuid.UUID,
    request: ResumeUpdateRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """Update an existing resume."""
    updated = await update_resume(
        db,
        resume_id=resume_id,
        profile_id=user_id,
        name=request.name,
        identity=request.identity.model_dump() if request.identity else None,
        resume_data=request.resume_data.model_dump() if request.resume_data else None,
        job_description=request.job_description,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or update failed.",
        )
    return updated


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_resume(
    resume_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """Delete a resume."""
    success = await delete_resume(db, resume_id, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found.",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{resume_id}/pdf")
async def download_resume_pdf(
    resume_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """Render and download the PDF for a stored resume."""
    resume = await get_resume_by_id(db, resume_id, user_id)
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found.",
        )

    try:
        pdf_bytes = generate_resume_pdf(
            identity=resume.identity,
            resume_data=resume.resume_data,
        )

        safe_name = (
            re.sub(r"[^a-zA-Z0-9_\- ]", "", resume.name).strip().replace(" ", "_")
        )
        filename = f"{safe_name or 'resume'}.pdf"

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    except Exception as e:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF compilation failed: {e!s}",
        )


@router.post("/{resume_id}/previews")
async def preview_resume_pdf(
    resume_id: uuid.UUID,
    payload: dict[str, Any],
    user_id: uuid.UUID = Depends(get_current_user_id),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """Generate PDF binary directly from live edited JSON in workspace preview."""
    resume = await get_resume_by_id(db, resume_id, user_id)
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found.",
        )

    identity = payload.get("identity", {})
    resume_data = payload.get("resume_data", {})
    filename = payload.get("filename", "resume_preview.pdf")

    try:
        pdf_bytes = generate_resume_pdf(
            identity=identity,
            resume_data=resume_data,
        )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    except Exception as e:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF preview compilation failed: {e!s}",
        )


@router.post("/formatted-drafts", response_model=OnboardFormatResponse)
async def format_raw_drafts(
    request: OnboardFormatRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    if not request.experiences and not request.projects and not request.raw_skills:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide at least one experience, project, or skill list to format.",
        )

    try:
        profile = await get_profile_by_id(db, user_id)
        api_key = (
            decrypt_api_key(profile.encrypted_google_api_key)
            if profile and profile.encrypted_google_api_key
            else None
        )
        return await format_onboarding_drafts(request, api_key=api_key)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LLM formatting failed: {e!s}",
        )
