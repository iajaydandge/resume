import io
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def generate_resume_pdf(identity: dict[str, Any], resume_data: dict[str, Any]) -> bytes:
    """Generates a professional, ATS-compliant single-page resume PDF using ReportLab."""
    buffer = io.BytesIO()

    # 0.5 inch margins (36 points)
    margin = 0.5 * inch
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=margin,
        bottomMargin=margin,
    )

    styles = getSampleStyleSheet()

    # Define custom typography styles
    primary_color = colors.HexColor("#0f172a")  # Slate 900
    muted_color = colors.HexColor("#475569")  # Slate 600

    name_style = ParagraphStyle(
        "ResumeName",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=primary_color,
        alignment=1,  # Center
    )

    contact_style = ParagraphStyle(
        "ResumeContact",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=muted_color,
        alignment=1,  # Center
    )

    section_header_style = ParagraphStyle(
        "ResumeSectionHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=13,
        textColor=primary_color,
        spaceBefore=6,
        spaceAfter=2,
    )

    entry_title_style = ParagraphStyle(
        "EntryTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=12,
        textColor=primary_color,
    )

    entry_date_style = ParagraphStyle(
        "EntryDate",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=muted_color,
        alignment=2,  # Right
    )

    bullet_style = ParagraphStyle(
        "ResumeBullet",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11.5,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=2,
        textColor=colors.HexColor("#1e293b"),
    )

    skill_text_style = ParagraphStyle(
        "SkillText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#1e293b"),
    )

    story = []

    # --- 1. Header (Name & Contact) ---
    name_obj = identity.get("name", {})
    display_name = name_obj.get("display") or "Candidate Name"
    story.append(Paragraph(f"<b>{display_name.upper()}</b>", name_style))
    story.append(Spacer(1, 3))

    contact_items: list[str] = []
    contact_obj = identity.get("contact", {})
    if contact_obj.get("email"):
        contact_items.append(contact_obj["email"])
    if contact_obj.get("phone"):
        contact_items.append(contact_obj["phone"])
    if contact_obj.get("location"):
        contact_items.append(contact_obj["location"])

    online_obj = identity.get("online", {})
    if online_obj.get("github"):
        github_clean = (
            online_obj["github"].replace("https://", "").replace("http://", "")
        )
        contact_items.append(github_clean)
    if online_obj.get("portfolio"):
        port_clean = (
            online_obj["portfolio"].replace("https://", "").replace("http://", "")
        )
        contact_items.append(port_clean)
    if online_obj.get("linkedin"):
        li_clean = (
            online_obj["linkedin"].replace("https://", "").replace("http://", "")
        )
        contact_items.append(li_clean)

    if contact_items:
        contact_line = " &nbsp;&bull;&nbsp; ".join(contact_items)
        story.append(Paragraph(contact_line, contact_style))

    story.append(Spacer(1, 6))

    # Helper for adding section dividers
    def add_section_header(title: str):
        story.append(Paragraph(f"<b>{title.upper()}</b>", section_header_style))
        story.append(
            HRFlowable(
                width="100%",
                thickness=0.75,
                color=colors.HexColor("#94a3b8"),
                spaceBefore=1,
                spaceAfter=4,
            )
        )

    # --- 2. Summary (Optional) ---
    summary = resume_data.get("summary")
    if summary:
        add_section_header("Summary")
        story.append(Paragraph(summary, bullet_style))
        story.append(Spacer(1, 4))

    # --- 3. Education ---
    education = resume_data.get("education", [])
    if education:
        add_section_header("Education")
        for edu in education:
            inst = edu.get("institution", "")
            degree = edu.get("degree", "")
            dates = edu.get("dates", "")
            loc = edu.get("location", "")

            # Two-column layout for Degree & Dates
            left_col = Paragraph(
                f"<b>{inst}</b> &mdash; <i>{degree}</i>", entry_title_style
            )
            right_text = f"{dates}" + (f" | {loc}" if loc else "")
            right_col = Paragraph(right_text, entry_date_style)

            edu_table = Table([[left_col, right_col]], colWidths=["70%", "30%"])
            edu_table.setStyle(
                TableStyle(
                    [
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 0),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                        ("TOPPADDING", (0, 0), (-1, -1), 0),
                    ]
                )
            )
            story.append(edu_table)

            for hl in edu.get("highlights", []):
                story.append(Paragraph(f"&bull; {hl}", bullet_style))
        story.append(Spacer(1, 4))

    # --- 4. Experience ---
    experience = resume_data.get("experience", [])
    if experience:
        add_section_header("Experience")
        for exp in experience:
            title = exp.get("title", "")
            org = exp.get("organization", "")
            dates = exp.get("dates", "")
            loc = exp.get("location", "")

            left_content = Paragraph(
                f"<b>{title}</b> &mdash; <i>{org}</i>", entry_title_style
            )
            right_content = Paragraph(
                f"{dates}" + (f" | {loc}" if loc else ""), entry_date_style
            )

            exp_table = Table([[left_content, right_content]], colWidths=["70%", "30%"])
            exp_table.setStyle(
                TableStyle(
                    [
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 0),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                        ("TOPPADDING", (0, 0), (-1, -1), 0),
                    ]
                )
            )
            story.append(exp_table)

            for bullet in exp.get("highlights", []):
                story.append(Paragraph(f"&bull; {bullet}", bullet_style))
            story.append(Spacer(1, 3))
        story.append(Spacer(1, 2))

    # --- 5. Projects ---
    projects = resume_data.get("projects", [])
    if projects:
        add_section_header("Projects")
        for proj in projects:
            title = proj.get("title", "")
            org = proj.get("organization", "")
            dates = proj.get("dates", "")

            title_str = f"<b>{title}</b>"
            if org:
                title_str += f" &mdash; <i>{org}</i>"

            left_content = Paragraph(title_str, entry_title_style)
            right_content = Paragraph(dates or "", entry_date_style)

            proj_table = Table(
                [[left_content, right_content]], colWidths=["75%", "25%"]
            )
            proj_table.setStyle(
                TableStyle(
                    [
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 0),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                        ("TOPPADDING", (0, 0), (-1, -1), 0),
                    ]
                )
            )
            story.append(proj_table)

            for bullet in proj.get("highlights", []):
                story.append(Paragraph(f"&bull; {bullet}", bullet_style))
            story.append(Spacer(1, 3))
        story.append(Spacer(1, 2))

    # --- 6. Technical Skills ---
    skills = resume_data.get("skills", [])
    if skills:
        add_section_header("Technical Skills")
        for skill_cat in skills:
            cat_name = skill_cat.get("name", "")
            skill_list = ", ".join(skill_cat.get("skills", []))

            skill_p = Paragraph(f"<b>{cat_name}:</b> {skill_list}", skill_text_style)
            story.append(skill_p)
            story.append(Spacer(1, 1))

    # Build the document
    doc.build(story)

    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
