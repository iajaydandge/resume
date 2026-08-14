import uuid
from typing import Any

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from server.models import Profile, Resume


async def get_or_create_profile(
    db: AsyncSession,
    google_sub: str,
    email: str,
    display_name: str | None = None,
    avatar_url: str | None = None,
) -> Profile:
    """Finds an existing user profile by google_sub or creates a new one."""
    stmt = select(Profile).where(Profile.google_sub == google_sub)
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()

    if not profile:
        # Check by email as secondary match
        stmt_email = select(Profile).where(Profile.email == email)
        result_email = await db.execute(stmt_email)
        profile = result_email.scalar_one_or_none()

    if profile:
        # Update details if changed
        if display_name and profile.display_name != display_name:
            profile.display_name = display_name
        if avatar_url and profile.avatar_url != avatar_url:
            profile.avatar_url = avatar_url
        await db.commit()
        await db.refresh(profile)
        return profile

    # Create new profile
    new_profile = Profile(
        google_sub=google_sub,
        email=email,
        display_name=display_name,
        avatar_url=avatar_url,
    )
    db.add(new_profile)
    await db.commit()
    await db.refresh(new_profile)
    return new_profile


async def get_profile_by_id(db: AsyncSession, profile_id: uuid.UUID) -> Profile | None:
    """Retrieves profile by ID."""
    stmt = select(Profile).where(Profile.id == profile_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_source_resume(db: AsyncSession, profile_id: uuid.UUID) -> Resume | None:
    """Retrieves the user's primary source resume (is_source = True)."""
    stmt = (
        select(Resume)
        .where(Resume.profile_id == profile_id, Resume.is_source.is_(True))
        .limit(1)
    )
    result = await db.execute(stmt)
    resume = result.scalar_one_or_none()
    if resume and "master" in resume.name.lower():
        resume.name = "Source Resume"
        await db.commit()
        await db.refresh(resume)
    return resume


async def list_user_resumes(db: AsyncSession, profile_id: uuid.UUID) -> list[Resume]:
    """Lists all resumes for a user, sorted with source resume first, then by updated_at descending."""
    stmt = (
        select(Resume)
        .where(Resume.profile_id == profile_id)
        .order_by(Resume.is_source.desc(), Resume.updated_at.desc())
    )
    result = await db.execute(stmt)
    resumes = list(result.scalars().all())
    changed = False
    for r in resumes:
        if r.is_source and "master" in r.name.lower():
            r.name = "Source Resume"
            changed = True
    if changed:
        await db.commit()
    return resumes


async def get_resume_by_id(
    db: AsyncSession, resume_id: uuid.UUID, profile_id: uuid.UUID
) -> Resume | None:
    """Retrieves a specific resume belonging to the user."""
    stmt = select(Resume).where(Resume.id == resume_id, Resume.profile_id == profile_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def create_resume(
    db: AsyncSession,
    profile_id: uuid.UUID,
    name: str,
    is_source: bool,
    identity: dict[str, Any],
    resume_data: dict[str, Any],
    job_description: str | None = None,
) -> Resume:
    """Creates a new resume."""
    if is_source:
        # If this is marked as source, unset any existing source resume first
        stmt_unset = (
            update(Resume)
            .where(Resume.profile_id == profile_id, Resume.is_source.is_(True))
            .values(is_source=False)
        )
        await db.execute(stmt_unset)

    new_resume = Resume(
        profile_id=profile_id,
        name=name,
        is_source=is_source,
        identity=identity,
        resume_data=resume_data,
        job_description=job_description,
    )
    db.add(new_resume)
    await db.commit()
    await db.refresh(new_resume)
    return new_resume


async def update_resume(
    db: AsyncSession,
    resume_id: uuid.UUID,
    profile_id: uuid.UUID,
    name: str | None = None,
    identity: dict[str, Any] | None = None,
    resume_data: dict[str, Any] | None = None,
    job_description: str | None = None,
) -> Resume | None:
    """Updates an existing resume."""
    resume = await get_resume_by_id(db, resume_id, profile_id)
    if not resume:
        return None

    if name is not None:
        resume.name = name
    if identity is not None:
        resume.identity = identity
    if resume_data is not None:
        resume.resume_data = resume_data
    if job_description is not None:
        resume.job_description = job_description

    await db.commit()
    await db.refresh(resume)
    return resume


async def delete_resume(
    db: AsyncSession, resume_id: uuid.UUID, profile_id: uuid.UUID
) -> bool:
    """Deletes a resume."""
    stmt = delete(Resume).where(Resume.id == resume_id, Resume.profile_id == profile_id)
    result = await db.execute(stmt)
    await db.commit()
    return (result.rowcount or 0) > 0
