import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const workspaceDir = "C:/NogorShomadhan";
const SKILL_DIR = "C:/Users/ASUS/.codex/plugins/cache/openai-primary-runtime/presentations/26.909.12148/skills/presentations";
const RUNTIME_PYTHON = "C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe";
const TMP_DIR = path.join(workspaceDir, ".codex-build/presentation");
const FINAL_PPTX = path.join(workspaceDir, "deliverables/NogorShomadhan_Final_Presentation_User_Manual_v5.pptx");
const screenshots = path.join(workspaceDir, ".codex-build/screens-hires");
const { finalizePresentation } = await import(
  pathToFileURL(path.join(SKILL_DIR, "container_tools/artifact_tool_utils.mjs")).href,
);

await fs.mkdir(TMP_DIR, { recursive: true });
await fs.mkdir(path.dirname(FINAL_PPTX), { recursive: true });
const fontFamily = "Arial";

const W = 1280;
const H = 720;
const C = {
  ink: "#173042",
  teal: "#00475E",
  teal2: "#0B7189",
  amber: "#F59E57",
  amberDark: "#B9681C",
  paper: "#F7FAFC",
  white: "#FFFFFF",
  line: "#D6E1E8",
  muted: "#607284",
  resident: "#176B74",
  residentBg: "#DDF3F0",
  admin: "#5B4CB8",
  adminBg: "#ECE9FF",
  authority: "#26734D",
  authorityBg: "#E1F3E8",
  system: "#9A5A18",
  systemBg: "#FFF0D8",
  red: "#B42318",
  green: "#16845B",
};

const p = Presentation.create({ slideSize: { width: W, height: H } });

function addText(slide, text, x, y, w, h, size = 20, color = C.ink, bold = false, align = "left") {
  const box = slide.shapes.add({
    geometry: "textbox",
    position: { left: x, top: y, width: w, height: h },
    fill: "none",
    line: { fill: "none", width: 0 },
  });
  box.text = text;
  box.text.style = {
    typeface: fontFamily,
    fontSize: size,
    color,
    bold,
    alignment: align,
    verticalAlignment: "middle",
    autoFit: "none",
    insets: { left: 0, right: 0, top: 0, bottom: 0 },
  };
  return box;
}

function addRolePill(slide, role) {
  const map = {
    Resident: [C.resident, C.residentBg],
    Admin: [C.admin, C.adminBg],
    Authority: [C.authority, C.authorityBg],
    "System + Admin": [C.system, C.systemBg],
    "Both roles": [C.teal, "#E4F0F3"],
  };
  const [fg, bg] = map[role] ?? [C.teal, "#E4F0F3"];
  const width = Math.max(118, role.length * 10 + 34);
  const pill = slide.shapes.add({
    geometry: "roundRect",
    position: { left: W - 62 - width, top: 30, width, height: 34 },
    fill: bg,
    line: { style: "solid", fill: bg, width: 1 },
    borderRadius: "rounded-full",
  });
  pill.text = role;
  pill.text.style = { typeface: fontFamily, fontSize: 15, bold: true, color: fg, alignment: "center", verticalAlignment: "middle", autoFit: "none" };
}

function addHeader(slide, number, title, role) {
  slide.background.fill = C.paper;
  const tile = slide.shapes.add({
    geometry: "roundRect",
    position: { left: 40, top: 28, width: 50, height: 46 },
    fill: C.teal,
    line: { style: "solid", fill: C.teal, width: 1 },
    borderRadius: 9,
  });
  tile.text = String(number);
  tile.text.style = { typeface: fontFamily, fontSize: number >= 10 ? 18 : 24, bold: true, color: C.white, alignment: "center", verticalAlignment: "middle", insets: { left: 0, right: 0, top: 0, bottom: 0 } };
  addText(slide, title, 104, 25, 870, 54, 31, C.ink, true);
  if (role) addRolePill(slide, role);
  slide.shapes.add({ geometry: "line", position: { left: 40, top: 92, width: 1200, height: 0 }, fill: "none", line: { style: "solid", fill: C.line, width: 1 } });
}

function addFooter(slide, pageNo) {
  addText(slide, "Nogor Shomadhan  •  Final user manual", 48, 688, 420, 18, 11, C.muted);
  addText(slide, String(pageNo), 1194, 686, 38, 20, 12, C.muted, true, "right");
}

function addSteps(slide, steps, x = 56, y = 124, w = 360, gap = 72, accent = C.teal) {
  steps.forEach((step, i) => {
    const cy = y + i * gap;
    const circle = slide.shapes.add({
      geometry: "ellipse",
      position: { left: x, top: cy + 2, width: 28, height: 28 },
      fill: accent,
      line: { style: "solid", fill: accent, width: 1 },
    });
    circle.text = String(i + 1);
    circle.text.style = { typeface: fontFamily, fontSize: 14, bold: true, color: C.white, alignment: "center", verticalAlignment: "middle" };
    addText(slide, step, x + 42, cy - 2, w - 42, 56, 17, C.ink, false);
  });
}

async function addShot(slide, filename, x, y, w, h, label, crop) {
  const frame = slide.shapes.add({
    geometry: "roundRect",
    position: { left: x - 8, top: y - 8, width: w + 16, height: h + 16 },
    fill: "#102A38",
    line: { style: "solid", fill: "#102A38", width: 1 },
    borderRadius: 25,
    shadow: "shadow-lg",
  });
  const blob = await fs.readFile(path.join(screenshots, filename));
  slide.images.add({
    blob,
    contentType: "image/png",
    alt: label,
    fit: "cover",
    position: { left: x, top: y, width: w, height: h },
    geometry: "roundRect",
    borderRadius: 18,
    ...(crop ? { crop } : {}),
  });
  addText(slide, label, x - 12, y + h + 14, w + 24, 24, 13, C.muted, true, "center");
  return frame;
}

function addTarget(slide, n, x, y, accent = C.teal, box) {
  if (box) {
    slide.shapes.add({
      geometry: "roundRect",
      position: box,
      fill: "none",
      line: { style: "solid", fill: accent, width: 3 },
      borderRadius: 8,
    });
  }
  const dot = slide.shapes.add({
    geometry: "ellipse",
    position: { left: x, top: y, width: 30, height: 30 },
    fill: accent,
    line: { style: "solid", fill: C.white, width: 2 },
  });
  dot.text = String(n);
  dot.text.style = { typeface: fontFamily, fontSize: 14, bold: true, color: C.white, alignment: "center", verticalAlignment: "middle" };
}

function setNotes(slide, text) {
  slide.speakerNotes.textFrame.setText(text);
}

console.log("stage 1");
// 1 — Cover
{
  const slide = p.slides.add();
  slide.background.fill = C.teal;
  const hero = await fs.readFile(path.join(workspaceDir, "assets/images/public/home/report-community-issue.png"));
  slide.images.add({ blob: hero, contentType: "image/png", alt: "Resident reporting a community issue", fit: "cover", position: { left: 560, top: 0, width: 720, height: 720 } });
  slide.shapes.add({ geometry: "rect", position: { left: 0, top: 0, width: 690, height: 720 }, fill: C.teal, line: { fill: C.teal, width: 0 } });
  const logo = await fs.readFile(path.join(workspaceDir, "assets/images/main_logo.png"));
  slide.images.add({ blob: logo, contentType: "image/png", alt: "Nogor Shomadhan logo", fit: "contain", position: { left: 70, top: 58, width: 72, height: 78 } });
  addText(slide, "Nogor Shomadhan", 70, 168, 540, 70, 48, C.white, true);
  addText(slide, "Application demonstration and user manual", 72, 246, 500, 62, 25, "#DCECF1", false);
  addText(slide, "Resident report / AI review / Authority resolution", 72, 330, 500, 40, 18, "#B8D8E0", true);
  const badge = slide.shapes.add({ geometry: "roundRect", position: { left: 72, top: 430, width: 250, height: 46 }, fill: C.amber, line: { fill: C.amber, width: 1 }, borderRadius: "rounded-full" });
  badge.text = "FINAL PRESENTATION · WEEK 13";
  badge.text.style = { typeface: fontFamily, fontSize: 15, bold: true, color: C.ink, alignment: "center", verticalAlignment: "middle" };
  addText(slide, "12-minute group presentation", 72, 500, 390, 34, 17, C.white, false);
  setNotes(slide, "Timing: 30 seconds. Introduce Nogor Shomadhan as a civic complaint platform connecting residents, administrators, and community authorities. State that the demonstration follows one complaint through its complete life cycle.");
}

console.log("stage 2");
// 2 — Full workflow
{
  const slide = p.slides.add();
  addHeader(slide, 1, "Complete complaint workflow", "Both roles");
  const stages = [
    ["Resident", "Report issue", "Photo, location, description", C.resident, C.residentBg],
    ["System", "Classify and compare", "AI category and duplicate check", C.system, C.systemBg],
    ["Admin", "Review and verify", "Approve, reject, or merge", C.admin, C.adminBg],
    ["Authority", "Work and document", "Budget, updates, evidence", C.authority, C.authorityBg],
    ["Resident", "Confirm outcome", "Track, rate, and comment", C.resident, C.residentBg],
  ];
  stages.forEach((s, i) => {
    const x = 48 + i * 246;
    const card = slide.shapes.add({ geometry: "roundRect", position: { left: x, top: 180, width: 208, height: 270 }, fill: s[4], line: { style: "solid", fill: s[3], width: 2 }, borderRadius: 18 });
    const num = slide.shapes.add({ geometry: "ellipse", position: { left: x + 72, top: 132, width: 64, height: 64 }, fill: s[3], line: { style: "solid", fill: C.white, width: 3 } });
    num.text = String(i + 1);
    num.text.style = { typeface: fontFamily, fontSize: 26, bold: true, color: C.white, alignment: "center", verticalAlignment: "middle" };
    addText(slide, s[0], x + 20, 224, 168, 28, 16, s[3], true, "center");
    addText(slide, s[1], x + 18, 275, 172, 58, 24, C.ink, true, "center");
    addText(slide, s[2], x + 20, 350, 168, 62, 16, C.muted, false, "center");
    if (i < stages.length - 1) {
      slide.shapes.add({ geometry: "rightArrow", position: { left: x + 210, top: 292, width: 34, height: 36 }, fill: C.line, line: { fill: C.line, width: 1 } });
    }
  });
  addText(slide, "Status sequence", 54, 510, 180, 28, 16, C.muted, true);
  const statuses = ["Unverified", "Pending", "In progress", "Resolved"];
  statuses.forEach((s, i) => {
    const x = 252 + i * 224;
    const chip = slide.shapes.add({ geometry: "roundRect", position: { left: x, top: 505, width: 170, height: 42 }, fill: i === 3 ? "#E3F5EC" : "#FFFFFF", line: { style: "solid", fill: i === 3 ? C.green : C.line, width: 1 }, borderRadius: "rounded-full" });
    chip.text = s;
    chip.text.style = { typeface: fontFamily, fontSize: 16, bold: true, color: i === 3 ? C.green : C.ink, alignment: "center", verticalAlignment: "middle" };
    if (i < statuses.length - 1) addText(slide, "›", x + 180, 505, 34, 42, 28, C.muted, true, "center");
  });
  addText(slide, "Notifications keep the resident and authority informed at each material status change.", 54, 590, 1120, 42, 18, C.ink, false);
  addFooter(slide, 2);
  setNotes(slide, "Timing: 50 seconds. Explain the handoff between roles. Emphasize that AI assists classification and duplicate detection, while the admin makes the final review decision. The authority owns execution and evidence. The resident sees the full history and submits feedback.");
}

console.log("stage 3");
// 3 — Resident dashboard
{
  const slide = p.slides.add();
  addHeader(slide, 2, "Resident dashboard and navigation", "Resident");
  addSteps(slide, [
    "Sign in with a verified resident account.",
    "Review total, pending, in-progress, and resolved counts.",
    "Tap a recent complaint to open its details.",
    "Use the bottom tabs for Complaints, Analytics, and Forum.",
  ], 56, 142, 410, 92, C.resident);
  await addShot(slide, "resident-dashboard-auth.png", 540, 116, 252, 546, "Resident dashboard");
  addTarget(slide, 2, 764, 197, C.resident, { left: 548, top: 183, width: 236, height: 142 });
  addTarget(slide, 3, 764, 373, C.resident, { left: 548, top: 350, width: 236, height: 170 });
  addTarget(slide, 4, 764, 620, C.resident, { left: 548, top: 608, width: 236, height: 44 });
  addText(slide, "Demo focus", 860, 170, 280, 28, 16, C.amberDark, true);
  addText(slide, "Open a complaint or start a new report. Skip profile editing during the live presentation.", 860, 208, 300, 100, 20, C.ink, false);
  addText(slide, "Resident can also browse all verified community complaints, raise urgency, comment, and follow progress.", 860, 352, 300, 126, 18, C.muted, false);
  addFooter(slide, 3);
  setNotes(slide, "Timing: 45 seconds. Show the four status cards and recent complaints. Mention the navigation tabs once, then move directly to the complaint form. Authentication is demonstrated only if the evaluator asks.");
}

console.log("stage 4");
// 4 — Submit report
{
  const slide = p.slides.add();
  addHeader(slide, 3, "Submitting a new community issue", "Resident");
  addSteps(slide, [
    "Open Complaints and select New Complaint.",
    "Enter a clear title and description.",
    "Provide road and avenue; add a landmark when useful.",
    "Attach photo evidence from the camera or gallery.",
    "Review the entries and tap Submit Complaint.",
  ], 44, 122, 338, 90, C.resident);
  await addShot(slide, "resident-create-top.png", 426, 116, 226, 490, "Issue details");
  await addShot(slide, "resident-create-lower.png", 732, 116, 226, 490, "Evidence and submission");
  addTarget(slide, 2, 624, 206, C.resident, { left: 434, top: 185, width: 210, height: 132 });
  addTarget(slide, 3, 624, 352, C.resident, { left: 434, top: 330, width: 210, height: 170 });
  addTarget(slide, 4, 930, 310, C.resident, { left: 740, top: 280, width: 210, height: 100 });
  addTarget(slide, 5, 930, 530, C.resident, { left: 740, top: 503, width: 210, height: 55 });
  addText(slide, "Automatic after submission", 1010, 170, 220, 28, 15, C.system, true);
  addText(slide, "The system assigns a category, stores the report as Unverified, and starts duplicate screening.", 1010, 210, 220, 150, 18, C.ink, false);
  addFooter(slide, 4);
  setNotes(slide, "Timing: 70 seconds. Enter only enough data to demonstrate the required fields. Use a prepared photo to avoid camera delay. After submission, explain that classification and duplicate checking run automatically.");
}

console.log("stage 5");
// 5 — AI duplicate review
{
  const slide = p.slides.add();
  addHeader(slide, 4, "AI categorization and duplicate review", "System + Admin");
  addSteps(slide, [
    "AI selects one complaint category from the system list.",
    "It compares recent reports in the same category.",
    "Location and the real-world issue carry more weight than wording.",
    "A score of 80% or higher creates an admin warning.",
    "Admin compares both reports and makes the final decision.",
  ], 46, 120, 410, 94, C.system);
  await addShot(slide, "admin-duplicate.png", 560, 116, 252, 546, "Admin duplicate comparison");
  addTarget(slide, 4, 784, 112, C.system, { left: 718, top: 116, width: 86, height: 68 });
  addTarget(slide, 5, 784, 516, C.system, { left: 568, top: 490, width: 236, height: 128 });
  addText(slide, "Decision meaning", 870, 158, 290, 28, 16, C.admin, true);
  addText(slide, "Accept as duplicate removes the newly submitted copy. Reject as duplicate keeps it as a separate complaint.", 870, 196, 300, 138, 19, C.ink, false);
  addText(slide, "Stored confidence: 98.5%. The screen rounds it to 99%.", 870, 392, 300, 58, 18, C.system, true);
  addFooter(slide, 5);
  setNotes(slide, "Timing: 60 seconds. Explain that the AI does not delete complaints. It produces a confidence score and reason. The admin retains control. In the live dataset, the road-hole reports show a 98.5 percent match.");
}

console.log("stage 6");
// 6 — Admin verification
{
  const slide = p.slides.add();
  addHeader(slide, 5, "Admin verification and routing", "Admin");
  addSteps(slide, [
    "Open Review Complaints from the admin dashboard.",
    "Inspect the report title, location, category, and submitted evidence.",
    "Open any possible-duplicate warning before deciding.",
    "Verify a valid report or reject an invalid submission.",
    "Verified complaints enter the authority workflow.",
  ], 44, 122, 350, 93, C.admin);
  await addShot(slide, "admin-dashboard.png", 432, 116, 226, 490, "Admin dashboard");
  await addShot(slide, "admin-review.png", 744, 116, 226, 490, "Review queue");
  addTarget(slide, 1, 630, 510, C.admin, { left: 440, top: 495, width: 210, height: 62 });
  addTarget(slide, 3, 942, 230, C.admin, { left: 752, top: 205, width: 210, height: 95 });
  addTarget(slide, 4, 942, 496, C.admin, { left: 752, top: 465, width: 210, height: 98 });
  addText(slide, "Result", 1020, 220, 160, 28, 16, C.admin, true);
  addText(slide, "The review step protects the authority queue from unverified or duplicate reports.", 1020, 258, 200, 150, 18, C.ink, false);
  addFooter(slide, 6);
  setNotes(slide, "Timing: 55 seconds. Open the review queue, select one complaint, and point to the evidence and decision controls. Do not spend time on account verification unless the evaluator asks about onboarding governance.");
}

console.log("stage 7");
// 7 — Authority dashboard
{
  const slide = p.slides.add();
  addHeader(slide, 6, "Authority dashboard and complaint queue", "Authority");
  addSteps(slide, [
    "Sign in with a verified authority account.",
    "Review workload counts by current status.",
    "Open All Complaints or use the Complaints tab.",
    "Filter the queue and select the next issue to handle.",
  ], 44, 136, 350, 100, C.authority);
  await addShot(slide, "authority-dashboard.png", 432, 116, 226, 490, "Authority dashboard");
  await addShot(slide, "authority-complaints.png", 744, 116, 226, 490, "Complaint queue");
  addTarget(slide, 2, 630, 214, C.authority, { left: 440, top: 190, width: 210, height: 145 });
  addTarget(slide, 3, 630, 118, C.authority, { left: 575, top: 116, width: 75, height: 38 });
  addTarget(slide, 4, 942, 318, C.authority, { left: 752, top: 288, width: 210, height: 180 });
  addText(slide, "Recommended live demo", 1010, 180, 210, 30, 15, C.amberDark, true);
  addText(slide, "Open one In Progress complaint with evidence already loaded.", 1010, 220, 210, 110, 18, C.ink, false);
  addFooter(slide, 7);
  setNotes(slide, "Timing: 45 seconds. Use the workload cards to explain prioritization, then open the complaint queue. Choose an existing in-progress complaint so progress history and evidence are immediately visible.");
}

console.log("stage 8");
// 8 — Authority detail
{
  const slide = p.slides.add();
  addHeader(slide, 7, "Reviewing an assigned complaint", "Authority");
  addSteps(slide, [
    "Confirm the status, category, and complaint description.",
    "Check the address and nearby location details.",
    "Review the resident’s original evidence.",
    "Verify assignment, estimated budget, and deadline.",
    "Use the work history to understand earlier actions.",
  ], 46, 120, 400, 93, C.authority);
  await addShot(slide, "authority-inprogress-top.png", 548, 116, 252, 546, "Complaint overview");
  addTarget(slide, 1, 772, 134, C.authority, { left: 556, top: 124, width: 236, height: 105 });
  addTarget(slide, 2, 772, 320, C.authority, { left: 556, top: 290, width: 236, height: 172 });
  addTarget(slide, 3, 772, 507, C.authority, { left: 556, top: 480, width: 236, height: 150 });
  addText(slide, "Before updating status", 860, 172, 280, 30, 16, C.authority, true);
  addText(slide, "Confirm that the report and location describe the same issue shown in the evidence photo.", 860, 214, 300, 126, 19, C.ink, false);
  addFooter(slide, 8);
  setNotes(slide, "Timing: 55 seconds. Point out the status badge, complaint metadata, location, and resident evidence. Explain that these checks reduce mistaken assignments before work starts.");
}

console.log("stage 9");
// 9 — Work update
{
  const slide = p.slides.add();
  addHeader(slide, 8, "Recording work progress", "Authority");
  addSteps(slide, [
    "Open the action area for the in-progress complaint.",
    "Select Update, Contractor, or Completed.",
    "Enter a new amount or deadline when either changes.",
    "Add a concise work note and attach progress photos.",
    "Save the update; it becomes part of the visible history.",
  ], 44, 122, 348, 92, C.authority);
  await addShot(slide, "authority-action-form.png", 424, 116, 226, 490, "Progress controls");
  await addShot(slide, "authority-action-form-lower.png", 734, 116, 226, 490, "Update details");
  addTarget(slide, 2, 622, 304, C.authority, { left: 432, top: 278, width: 210, height: 74 });
  addTarget(slide, 3, 932, 364, C.authority, { left: 742, top: 334, width: 210, height: 74 });
  addTarget(slide, 4, 932, 470, C.authority, { left: 742, top: 432, width: 210, height: 120 });
  addText(slide, "Transparency rule", 1010, 196, 190, 28, 15, C.amberDark, true);
  addText(slide, "Budget, deadline, notes, and evidence changes remain visible in the complaint history.", 1010, 236, 205, 150, 18, C.ink, false);
  addFooter(slide, 9);
  setNotes(slide, "Timing: 70 seconds. Demonstrate one progress update. Add either a note, a photo, or a changed amount or deadline. Mention that any one change is enough to save an update, and the resident can see it afterward.");
}

console.log("stage 10");
// 10 — Resolution
{
  const slide = p.slides.add();
  addHeader(slide, 9, "Completing and documenting the resolution", "Both roles");
  addSteps(slide, [
    "Select Completed in the authority action area.",
    "Enter the final resolution note.",
    "Confirm the final budget and attach completion evidence.",
    "Submit the resolution to close the complaint.",
    "The record becomes read-only and the resident receives an update.",
  ], 44, 122, 370, 92, C.authority);
  await addShot(slide, "resident-resolved-top.png", 500, 116, 252, 546, "Resolved complaint and work history");
  addTarget(slide, 4, 724, 192, C.authority, { left: 508, top: 170, width: 236, height: 106 });
  addTarget(slide, 5, 724, 338, C.authority, { left: 508, top: 312, width: 236, height: 146 });

  addText(slide, "Resolved record", 830, 160, 320, 30, 16, C.green, true);
  addText(slide, "Residents can review the resolved status, complaint details, final proof, and every recorded work update.", 830, 202, 330, 142, 20, C.ink, false);
  addText(slide, "This closes the operational loop before feedback begins.", 830, 410, 320, 72, 18, C.muted, false);
  addFooter(slide, 10);
  setNotes(slide, "Timing: 55 seconds. Show the final evidence and work history. Explain that the closed record is read-only for the authority and remains visible to residents for accountability.");
}

console.log("stage 11");
// 11 — Resident feedback
{
  const slide = p.slides.add();
  addHeader(slide, 10, "Resident confirmation and feedback", "Resident");
  addSteps(slide, [
    "Open My Complaints and choose a resolved report.",
    "Review the resolution evidence and work history.",
    "Scroll to Resident Feedback.",
    "Choose a rating from one to five stars.",
    "Write a short comment and submit feedback.",
  ], 44, 122, 348, 92, C.resident);
  await addShot(slide, "resident-my-complaints.png", 424, 116, 226, 490, "My complaints");
  await addShot(slide, "resident-feedback.png", 734, 116, 226, 490, "Feedback section");
  addTarget(slide, 1, 622, 286, C.resident, { left: 432, top: 255, width: 210, height: 178 });
  addTarget(slide, 3, 932, 326, C.resident, { left: 742, top: 300, width: 210, height: 86 });
  addTarget(slide, 4, 932, 405, C.resident, { left: 742, top: 385, width: 210, height: 60 });
  addTarget(slide, 5, 932, 500, C.resident, { left: 742, top: 455, width: 210, height: 108 });
  addText(slide, "Outcome", 1010, 205, 170, 30, 16, C.resident, true);
  addText(slide, "Feedback gives authorities a visible quality signal after the technical work is complete.", 1010, 245, 205, 150, 18, C.ink, false);
  addFooter(slide, 11);
  setNotes(slide, "Timing: 50 seconds. Open My Complaints, select a resolved item, and jump to the feedback section. If time is tight, show the rating controls without submitting a new review.");
}

console.log("stage 12");
// 12 — Notifications and analytics
{
  const slide = p.slides.add();
  addHeader(slide, 11, "Notifications, analytics, and PDF reports", "Resident");
  addSteps(slide, [
    "Open Notifications to review status and community updates.",
    "Tap an actionable alert to return to its complaint.",
    "Open Analytics and choose All Complaints or My Complaints.",
    "Select a reporting period to refresh the metrics.",
    "Download a PDF report when a shareable summary is needed.",
  ], 44, 122, 350, 92, C.resident);
  await addShot(slide, "resident-notifications-auth.png", 426, 116, 226, 490, "Notifications");
  await addShot(slide, "resident-analytics.png", 738, 116, 226, 490, "Complaint analytics");
  addTarget(slide, 2, 624, 282, C.resident, { left: 434, top: 240, width: 210, height: 210 });
  addTarget(slide, 3, 936, 185, C.resident, { left: 746, top: 160, width: 210, height: 100 });
  addTarget(slide, 4, 936, 275, C.resident, { left: 746, top: 255, width: 210, height: 72 });
  addTarget(slide, 5, 936, 115, C.resident, { left: 815, top: 116, width: 141, height: 50 });
  addText(slide, "Use in the demo", 1010, 205, 185, 30, 15, C.amberDark, true);
  addText(slide, "Show one notification and one analytics filter. Mention PDF export without waiting for the share sheet.", 1010, 245, 205, 170, 18, C.ink, false);
  addFooter(slide, 12);
  setNotes(slide, "Timing: 50 seconds. Open one actionable notification, then show the analytics scope and period controls. Mention that the app generates resident, authority, and admin PDF summaries. Avoid waiting for the operating system share dialog during the presentation.");
}

console.log("stage 13");
// 13 — Demo runbook and code map
{
  const slide = p.slides.add();
  addHeader(slide, 12, "12-minute demonstration runbook", "Both roles");
  const times = [
    ["0:00–1:00", "Problem and workflow", "Slides 1–2"],
    ["1:00–3:20", "Resident dashboard and report", "Slides 3–4"],
    ["3:20–5:10", "AI check and admin decision", "Slides 5–6"],
    ["5:10–8:30", "Authority triage, update, and resolution", "Slides 7–10"],
    ["8:30–10:10", "Resident feedback", "Slide 11"],
    ["10:10–11:10", "Notifications and analytics", "Slide 12"],
    ["11:10–12:00", "Summary and transition to Q&A", "Close"],
  ];
  addText(slide, "Live sequence", 54, 116, 520, 34, 20, C.teal, true);
  times.forEach((row, i) => {
    const y = 160 + i * 58;
    addText(slide, row[0], 54, y, 132, 36, 16, C.teal, true);
    addText(slide, row[1], 198, y, 300, 36, 17, C.ink, i === 0);
    addText(slide, row[2], 500, y, 100, 36, 14, C.muted, false, "right");
    slide.shapes.add({ geometry: "line", position: { left: 54, top: y + 43, width: 546, height: 0 }, fill: "none", line: { style: "solid", fill: C.line, width: 1 } });
  });
  slide.shapes.add({ geometry: "line", position: { left: 640, top: 120, width: 0, height: 470 }, fill: "none", line: { style: "solid", fill: C.line, width: 2 } });
  addText(slide, "Q&A code map", 690, 116, 430, 34, 20, C.admin, true);
  const codeItems = [
    ["Report form", "src/app/(resident)/complaints/create.tsx"],
    ["AI categorization", "src/services/ai.service.ts"],
    ["Duplicate detection", "src/services/duplicate.service.ts"],
    ["Authority workflow", "src/components/authority/authority-complaint-detail-screen.tsx"],
    ["Notifications", "src/store/notification-store.ts"],
    ["PDF analytics", "src/services/*-analytics-report.service.ts"],
  ];
  codeItems.forEach((row, i) => {
    const y = 170 + i * 68;
    addText(slide, row[0], 690, y, 190, 26, 15, C.ink, true);
    addText(slide, row[1], 690, y + 27, 490, 30, 14, C.muted, false);
  });
  const tip = slide.shapes.add({ geometry: "roundRect", position: { left: 690, top: 594, width: 490, height: 62 }, fill: C.systemBg, line: { style: "solid", fill: "#E7C48F", width: 1 }, borderRadius: 12 });
  tip.text = "Prepare the app on the resident and authority screens before the timer starts.";
  tip.text.style = { typeface: fontFamily, fontSize: 16, bold: true, color: C.system, alignment: "center", verticalAlignment: "middle", insets: { left: 14, right: 14, top: 6, bottom: 6 } };
  addFooter(slide, 13);
  setNotes(slide, "Use this slide during rehearsal, not necessarily during the live demonstration. Keep two devices or browser sessions ready: one resident and one authority. Keep the admin duplicate review open in a third tab. During Q&A, use the code map to jump directly to the relevant implementation.");
}

console.log("exporting");
const stagingDir = path.join(workspaceDir, ".codex-finalizer");
await fs.mkdir(stagingDir, { recursive: true });
const candidatePath = path.join(stagingDir, "NogorShomadhan_Final_Presentation_User_Manual_v5.candidate.pptx");
await (await PresentationFile.exportPptx(p)).save(candidatePath);

const result = await finalizePresentation({
  explicitTotalSlideCount: 13,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
  workspaceDir,
  candidatePath,
  finalPath: FINAL_PPTX,
  pythonExecutable: RUNTIME_PYTHON,
  integrityValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_layout_geometry.py"),
  layoutArgs: ["--expected-slide-size-emu", "12192000,6858000", "--validate-heading-fit"],
  fontPolicy: { basis: "design", families: [fontFamily] },
  verifyArtifactToolImport: true,
  receiptPath: path.join(stagingDir, "NogorShomadhan_Final_Presentation_User_Manual_v5.validation.json"),
});

console.log(JSON.stringify({ final: FINAL_PPTX, fontFamily, result }, null, 2));
