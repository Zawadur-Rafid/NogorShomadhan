from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "NogorShomadhan_Final_Presentation_Workflow_Guideline.pdf"

NAVY = colors.HexColor("#102A43")
BLUE = colors.HexColor("#2563EB")
INDIGO = colors.HexColor("#4F46E5")
TEAL = colors.HexColor("#0F766E")
GREEN = colors.HexColor("#15803D")
AMBER = colors.HexColor("#B45309")
RED = colors.HexColor("#B91C1C")
SLATE = colors.HexColor("#475569")
LIGHT = colors.HexColor("#F8FAFC")
LINE = colors.HexColor("#CBD5E1")
PALE_BLUE = colors.HexColor("#EFF6FF")
PALE_GREEN = colors.HexColor("#F0FDF4")
PALE_AMBER = colors.HexColor("#FFFBEB")
PALE_RED = colors.HexColor("#FEF2F2")


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="CoverTitle", fontName="Helvetica-Bold", fontSize=27, leading=32,
    textColor=colors.white, alignment=TA_LEFT, spaceAfter=10,
))
styles.add(ParagraphStyle(
    name="CoverSub", fontName="Helvetica", fontSize=12.5, leading=18,
    textColor=colors.HexColor("#DBEAFE"), spaceAfter=9,
))
styles.add(ParagraphStyle(
    name="H1Custom", fontName="Helvetica-Bold", fontSize=20, leading=24,
    textColor=NAVY, spaceAfter=7,
))
styles.add(ParagraphStyle(
    name="H2Custom", fontName="Helvetica-Bold", fontSize=13.5, leading=17,
    textColor=INDIGO, spaceBefore=5, spaceAfter=5,
))
styles.add(ParagraphStyle(
    name="BodyCustom", fontName="Helvetica", fontSize=9.3, leading=13.2,
    textColor=NAVY, spaceAfter=5,
))
styles.add(ParagraphStyle(
    name="Small", fontName="Helvetica", fontSize=8.2, leading=11.4,
    textColor=SLATE,
))
styles.add(ParagraphStyle(
    name="StepTitle", fontName="Helvetica-Bold", fontSize=10.2, leading=13,
    textColor=NAVY, spaceAfter=2,
))
styles.add(ParagraphStyle(
    name="StepBody", fontName="Helvetica", fontSize=8.8, leading=12.1,
    textColor=SLATE,
))
styles.add(ParagraphStyle(
    name="Callout", fontName="Helvetica", fontSize=9, leading=12.5,
    textColor=NAVY,
))
styles.add(ParagraphStyle(
    name="Flow", fontName="Helvetica-Bold", fontSize=10, leading=15,
    textColor=INDIGO, alignment=TA_CENTER,
))


def p(text, style="BodyCustom"):
    return Paragraph(text, styles[style])


def bullet(text):
    return Paragraph(f"<font color='#2563EB'>-</font> {text}", styles["StepBody"])


def section_header(number, title, subtitle):
    badge = Table([[p(str(number), "H2Custom")]], colWidths=[12 * mm], rowHeights=[12 * mm])
    badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), INDIGO),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOX", (0, 0), (-1, -1), 0, INDIGO),
    ]))
    title_block = [p(title, "H1Custom"), p(subtitle, "Small")]
    t = Table([[badge, title_block]], colWidths=[16 * mm, 164 * mm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def step_card(number, actor, title, items, accent=BLUE, background=colors.white):
    num = Table([[p(str(number), "StepTitle")]], colWidths=[10 * mm], rowHeights=[10 * mm])
    num.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), accent),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    body = [p(f"<font color='{accent.hexval()}'>{actor}</font>  |  {title}", "StepTitle")]
    body.extend(bullet(item) for item in items)
    table = Table([[num, body]], colWidths=[14 * mm, 166 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), background),
        ("BOX", (0, 0), (-1, -1), 0.7, LINE),
        ("LINEBEFORE", (0, 0), (0, -1), 3, accent),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return KeepTogether([table, Spacer(1, 4 * mm)])


def callout(title, body, color=AMBER, background=PALE_AMBER):
    table = Table([[p(title, "StepTitle"), p(body, "Callout")]], colWidths=[39 * mm, 141 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), background),
        ("BOX", (0, 0), (-1, -1), 0.8, color),
        ("LINEBEFORE", (0, 0), (0, -1), 3, color),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return KeepTogether([table, Spacer(1, 4 * mm)])


class GuidelineDoc(BaseDocTemplate):
    def __init__(self, filename):
        super().__init__(
            filename,
            pagesize=A4,
            rightMargin=15 * mm,
            leftMargin=15 * mm,
            topMargin=18 * mm,
            bottomMargin=17 * mm,
            title="NogorShomadhan Final Presentation Workflow Guideline",
            author="NogorShomadhan Team",
        )
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="normal")
        self.addPageTemplates(PageTemplate(id="main", frames=[frame], onPage=self.decorate_page))

    def decorate_page(self, canvas, doc):
        if doc.page == 1:
            canvas.saveState()
            canvas.setFillColor(NAVY)
            canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
            canvas.setFillColor(BLUE)
            canvas.circle(A4[0] - 22 * mm, A4[1] - 24 * mm, 48 * mm, fill=1, stroke=0)
            canvas.setFillColor(INDIGO)
            canvas.circle(A4[0] - 3 * mm, 7 * mm, 60 * mm, fill=1, stroke=0)
            canvas.restoreState()
            return
        canvas.saveState()
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.5)
        canvas.line(15 * mm, 12 * mm, A4[0] - 15 * mm, 12 * mm)
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(SLATE)
        canvas.drawString(15 * mm, 7.5 * mm, "NogorShomadhan - Final Presentation Workflow Guideline")
        canvas.drawRightString(A4[0] - 15 * mm, 7.5 * mm, f"Page {doc.page}")
        canvas.restoreState()


def build_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = GuidelineDoc(str(OUTPUT))
    story = []

    story.extend([
        Spacer(1, 31 * mm),
        p("NOGORSHOMADHAN", "CoverSub"),
        p("Final Presentation<br/>Workflow Guideline", "CoverTitle"),
        Spacer(1, 6 * mm),
        p("A single resident complaint story from registration to resolution, community discussion and authority feedback.", "CoverSub"),
        Spacer(1, 13 * mm),
        Table([
            [p("PRESENTATION", "Small"), p("FINAL PRESENTATION - WEEK 13", "StepTitle")],
            [p("DURATION", "Small"), p("12 minutes per group", "StepTitle")],
            [p("FORMAT", "Small"), p("Story-driven mobile application demonstration", "StepTitle")],
        ], colWidths=[32 * mm, 105 * mm], style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#DBEAFE")),
            ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
            ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#93C5FD")),
            ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#60A5FA")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ])),
        Spacer(1, 21 * mm),
        p("CORE STORY", "CoverSub"),
        p("Registration  >  Verification  >  Complaint  >  AI  >  Action  >  Forum  >  Resolution  >  Feedback", "CoverSub"),
        PageBreak(),
    ])

    story.extend([
        section_header(1, "The presentation approach", "Present one complete case, then briefly show the important alternative outcomes."),
        Spacer(1, 5 * mm),
        callout("MAIN STORY", "A resident reports a large pothole near the community school. The report passes through AI analysis, admin verification, authority action, community discussion, resolution and feedback.", BLUE, PALE_BLUE),
        p("Why this structure works", "H2Custom"),
        bullet("The audience follows one recognizable problem from beginning to end."),
        bullet("Every role has a clear purpose: Resident, Admin and Authority."),
        bullet("AI categorization and duplicate detection appear naturally inside the story."),
        bullet("The forum is shown as a transparency and communication tool, not an unrelated feature."),
        bullet("Analytics and additional notifications are presented after the main story as supporting features."),
        Spacer(1, 6 * mm),
        p("Recommended role handoff", "H2Custom"),
        Table([
            [p("RESIDENT", "StepTitle"), p("ADMIN", "StepTitle"), p("AUTHORITY", "StepTitle"), p("RESIDENT", "StepTitle")],
            [p("Register and report", "Small"), p("Verify account and report", "Small"), p("Start, update and resolve", "Small"), p("Discuss and give feedback", "Small")],
        ], colWidths=[45 * mm] * 4, style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), INDIGO),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("BACKGROUND", (0, 1), (-1, 1), LIGHT),
            ("BOX", (0, 0), (-1, -1), 0.7, LINE),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ])),
        Spacer(1, 7 * mm),
        callout("PRESENTATION RULE", "Keep registration and sign-in brief. Spend most of the available time on complaint handling, AI decisions, authority work, community communication and the resolution loop.", AMBER, PALE_AMBER),
        PageBreak(),
    ])

    story.extend([
        section_header(2, "Phase 1 - Account onboarding", "Introduce the Resident and Admin roles without spending too much demonstration time on authentication."),
        Spacer(1, 5 * mm),
        step_card(1, "RESIDENT", "Registers an account", [
            "Completes the registration form.",
            "The account is created with Unverified status.",
        ], BLUE),
        step_card(2, "ADMIN", "Verifies the account", [
            "Opens Pending Accounts and reviews the resident's information.",
            "Approves the account so the resident can use the protected features.",
        ], INDIGO),
        step_card(3, "RESIDENT", "Signs in", [
            "Signs in after approval and opens the resident area.",
            "Briefly mention that rejected or unverified accounts cannot proceed.",
        ], BLUE),
        callout("KEEP IT SHORT", "Authentication is necessary for the story, but it is not the main feature. Use it to establish the Resident and Admin roles, then move immediately to issue reporting.", AMBER, PALE_AMBER),
        PageBreak(),
    ])

    story.extend([
        section_header(3, "Phase 2 - Complaint and AI processing", "Show how the system turns a resident's report into structured information and checks existing cases."),
        Spacer(1, 5 * mm),
        step_card(4, "RESIDENT", "Submits a complaint", [
            "Opens Report an Issue.",
            "Adds a title, description, location information and photographic evidence.",
            "Example: Large pothole near the community school.",
        ], BLUE),
        step_card(5, "SYSTEM", "Automatically categorizes the complaint", [
            "Analyzes the title and description.",
            "Assigns the most suitable category, such as Roads and Infrastructure.",
            "If classification is uncertain, the complaint can use Other for later review.",
        ], TEAL, PALE_GREEN),
        step_card(6, "SYSTEM", "Checks for possible duplicates", [
            "Compares the report with recent complaints using category, location information, title, description, issue type and current status.",
            "If a strong match is found, the possible duplicate is sent to the admin for review.",
        ], TEAL, PALE_GREEN),
        PageBreak(),
    ])

    story.extend([
        section_header(4, "Phase 3 - Admin decisions", "Use the false-positive duplicate route in the main story so the same report can continue to resolution."),
        Spacer(1, 5 * mm),
        step_card(7, "ADMIN", "Reviews the possible duplicate", [
            "Confirmed duplicate: the newly submitted copy is removed and the original complaint remains the main case.",
            "Not a duplicate: the admin rejects the AI duplicate suggestion and keeps the report as an independent complaint.",
        ], INDIGO),
        callout("IMPORTANT WORDING", "Reject duplicate suggestion means the complaint is NOT considered a duplicate. Avoid saying only 'admin rejects it,' because the audience may think the complaint itself was rejected.", RED, PALE_RED),
        step_card(8, "ADMIN", "Verifies the complaint", [
            "Reviews the description, location information and evidence.",
            "Confirms that the complaint is genuine and relevant.",
            "Approved complaints move to Pending; invalid complaints can be rejected.",
        ], INDIGO),
        step_card(9, "AUTHORITY", "Receives the verified complaint", [
            "The complaint appears in the authority's pending queue.",
            "The resident can see that the report has passed verification.",
        ], GREEN),
        PageBreak(),
    ])

    story.extend([
        section_header(5, "Phase 4 - Work begins", "Demonstrate the transition from a verified report to an accountable authority work item."),
        Spacer(1, 5 * mm),
        step_card(10, "AUTHORITY", "Reviews and plans the work", [
            "Checks the images, description and community activity.",
            "Assigns a contractor if necessary.",
            "Adds an estimated deadline, budget or work note.",
        ], GREEN),
        step_card(11, "AUTHORITY", "Starts the work", [
            "Changes the status from Pending to In Progress.",
            "The action is recorded in the complaint history.",
        ], GREEN),
        step_card(12, "RESIDENT", "Receives the status update", [
            "Sees that work has started.",
            "Opens the complaint to review the deadline and progress details.",
        ], BLUE),
        callout("SHOW ACCOUNTABILITY", "Point out the status, deadline, work notes and history. These details show that the report is not disappearing after submission.", TEAL, PALE_GREEN),
        PageBreak(),
    ])

    story.extend([
        section_header(6, "Phase 5 - Forum discussion and response", "Show how residents raise concerns publicly while the complaint page remains the official work record."),
        Spacer(1, 5 * mm),
        step_card(13, "RESIDENT", "Raises a deadline concern", [
            "Feels that the proposed deadline is too far away.",
            "Creates a forum discussion mentioning the complaint title or ID.",
            "Other residents can comment and share similar concerns.",
        ], BLUE),
        callout("FEATURE BOUNDARY", "The forum discussion and complaint record are separate features. The resident should mention the complaint title or ID so the connection is clear.", AMBER, PALE_AMBER),
        step_card(14, "AUTHORITY", "Responds to the community", [
            "Opens the forum and reviews the residents' concerns.",
            "Posts an official reply explaining the situation.",
            "If appropriate, separately opens the complaint and changes its deadline or adds a progress update.",
        ], GREEN),
        step_card(15, "RESIDENT", "Sees the updated information", [
            "The revised deadline, note or evidence appears in the complaint's work history.",
            "Relevant complaint updates appear in the resident's notification or activity view when supported by the configured notification event.",
        ], BLUE),
        PageBreak(),
    ])

    story.extend([
        section_header(7, "Phase 5 continued - Progress accountability", "Use a second concern to demonstrate continued communication during a longer repair."),
        Spacer(1, 5 * mm),
        step_card(16, "RESIDENTS", "Report that progress still feels slow", [
            "Continue the existing forum discussion instead of creating many disconnected posts.",
            "Add comments, questions or supporting information.",
        ], BLUE),
        step_card(17, "AUTHORITY", "Responds with verified evidence", [
            "Posts an official forum response.",
            "Adds a work update such as contractor assigned, materials acquired, partial completion, a new photograph or a revised completion date.",
        ], GREEN),
        callout("KEY MESSAGE", "The forum provides public communication and transparency. The complaint page remains the official record for status, evidence, deadline and work history.", TEAL, PALE_GREEN),
        Spacer(1, 6 * mm),
        p("Suggested narration", "H2Custom"),
        p("Residents are not limited to passively waiting for a status change. They can raise concerns, see official responses and return to the complaint record to review verified operational updates.", "BodyCustom"),
        PageBreak(),
    ])

    story.extend([
        section_header(8, "Phase 6 - Resolution and feedback", "Complete the accountability loop by showing final evidence, resident feedback and an authority response."),
        Spacer(1, 5 * mm),
        step_card(18, "AUTHORITY", "Completes the work", [
            "Uploads final evidence and completion notes.",
            "Changes the status from In Progress to Resolved.",
        ], GREEN),
        step_card(19, "RESIDENT", "Receives the resolution update", [
            "Opens the resolved complaint.",
            "Reviews the final evidence and complete status history.",
        ], BLUE),
        step_card(20, "RESIDENT", "Submits feedback", [
            "Gives a rating from 1 to 5.",
            "Adds a comment about the result or service quality.",
        ], BLUE),
        step_card(21, "AUTHORITY", "Replies to the feedback", [
            "Opens the Feedback Center.",
            "Reviews the rating and comment, then posts an official reply.",
        ], GREEN),
        step_card(22, "ALL ROLES", "Closes the story", [
            "Recap how one issue moved from a resident report to an accountable and reviewed resolution.",
        ], INDIGO),
        PageBreak(),
    ])

    story.extend([
        section_header(9, "Main flow and alternative cases", "Keep the live demonstration linear; mention the other branches briefly as system safeguards."),
        Spacer(1, 5 * mm),
        Table([[p("Registration  >  Account Verification  >  Complaint  >  AI Category  >  Duplicate Check  >  Admin Verification  >  Pending  >  In Progress  >  Forum Discussion  >  Progress Updates  >  Resolved  >  Feedback  >  Authority Reply", "Flow")]], colWidths=[180 * mm], style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), PALE_BLUE),
            ("BOX", (0, 0), (-1, -1), 1, BLUE),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 11),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 11),
        ])),
        Spacer(1, 7 * mm),
        p("What-if cases to mention", "H2Custom"),
        bullet("Admin rejects an account."),
        bullet("AI finds no duplicate."),
        bullet("Admin confirms a true duplicate."),
        bullet("Admin rejects a false duplicate suggestion."),
        bullet("Admin rejects an invalid complaint."),
        bullet("Authority changes the deadline or contractor."),
        bullet("Residents support an existing complaint or discussion."),
        bullet("AI cannot classify confidently and uses Other."),
        bullet("Authority provides several progress updates before resolution."),
        Spacer(1, 5 * mm),
        callout("DEMO CHOICE", "Use the false-positive duplicate branch in the main story: AI identifies a possible match, but the admin decides it is a separate issue. Mention the confirmed-duplicate outcome separately.", INDIGO, PALE_BLUE),
        PageBreak(),
    ])

    story.extend([
        section_header(10, "Additional features after the story", "Use the final minutes to show the broader system without interrupting the main narrative."),
        Spacer(1, 5 * mm),
        p("Forum", "H2Custom"),
        bullet("Resident discussions, comments and replies."),
        bullet("Official authority responses, community announcements and work updates."),
        p("Analytics", "H2Custom"),
        bullet("Resident complaint overview."),
        bullet("Authority workload and resolution performance."),
        bullet("Admin system-wide statistics, including category, status and trend information."),
        p("Role-specific notifications", "H2Custom"),
        bullet("Resident: complaint status and community updates."),
        bullet("Authority: verified complaints and relevant activity."),
        bullet("Admin: account, complaint and duplicate-review tasks."),
        bullet("Community announcements, alerts and updates."),
        p("Supporting features", "H2Custom"),
        bullet("Complaint history and evidence."),
        bullet("Contractor, budget and deadline information."),
        bullet("Ratings and feedback management."),
        PageBreak(),
    ])

    timing = [
        ("0:00 - 0:45", "Problem and actors"),
        ("0:45 - 1:30", "Registration and account verification"),
        ("1:30 - 3:15", "Complaint submission and AI category"),
        ("3:15 - 4:30", "Duplicate and admin verification"),
        ("4:30 - 6:15", "Authority starts work"),
        ("6:15 - 8:15", "Forum concerns and authority response"),
        ("8:15 - 9:30", "Progress update and resolution"),
        ("9:30 - 10:30", "Feedback and authority reply"),
        ("10:30 - 11:30", "Analytics, notifications and extra forum features"),
        ("11:30 - 12:00", "Final workflow recap"),
    ]
    story.extend([
        section_header(11, "Twelve-minute run of show", "Practice role switching and prepare stable data so the group can finish comfortably."),
        Spacer(1, 5 * mm),
        Table(
            [[p("TIME", "StepTitle"), p("DEMONSTRATION FOCUS", "StepTitle")]] +
            [[p(t, "Small"), p(item, "BodyCustom")] for t, item in timing],
            colWidths=[38 * mm, 142 * mm],
            repeatRows=1,
            style=TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), INDIGO),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
                ("BOX", (0, 0), (-1, -1), 0.7, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ])),
        Spacer(1, 7 * mm),
        callout("PREPARE BEFOREHAND", "Keep Resident, Admin and Authority accounts ready on separate devices or sessions. Preload complaints at different stages in case AI processing, internet access or live data takes too long during the demonstration.", AMBER, PALE_AMBER),
        callout("FINAL MESSAGE", "NogorShomadhan does more than collect complaints. It creates a transparent path from reporting to verification, action, public discussion, evidence-based resolution and accountable feedback.", GREEN, PALE_GREEN),
    ])

    doc.build(story)
    print(OUTPUT)


if __name__ == "__main__":
    build_pdf()
