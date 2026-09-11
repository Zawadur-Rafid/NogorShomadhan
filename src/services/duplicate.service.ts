import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "../lib/supabase";
import { formatLocation } from "../utils/formatters";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function findCandidateComplaints(newComplaint: any) {
  try {
    console.log(
      `[Duplicate Check] Finding candidates for complaint: ${newComplaint.title} (Category: ${newComplaint.category})`,
    );

    // Basic filtering: Same category, and status not verified or recently active
    // We fetch a few recent complaints in the same category
    const { data, error } = await supabase
      .from("complaints")
      .select(
        "comp_id, title, description, house, road, avenue, nearby_landmark, additional_location_details, status, timestamp, category",
      )
      .eq("category", newComplaint.category)
      .neq("comp_id", newComplaint.comp_id)
      .order("timestamp", { ascending: false })
      .limit(10);

    if (error) {
      console.error(
        "[Duplicate Check] Error finding candidate complaints from Supabase:",
        error,
      );
      return [];
    }

    console.log(
      `[Duplicate Check] Found ${data?.length || 0} candidate(s) in Supabase.`,
    );
    return data || [];
  } catch (err) {
    console.error("[Duplicate Check] Candidate fetch exception:", err);
    return [];
  }
}

export async function analyzeDuplicateWithGemini(
  newComplaint: any,
  candidates: any[],
) {
  if (!apiKey || candidates.length === 0) {
    if (!apiKey)
      console.warn("[Duplicate Check] Skipping AI check: No Gemini API Key.");
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    const newLoc = formatLocation(newComplaint);

    const candidatesStr = candidates
      .map(
        (c, idx) => `
Candidate ${idx + 1}:
- ID: ${c.comp_id}
- Title: ${c.title}
- Description: ${c.description}
- Location: ${formatLocation(c)}
- Status: ${c.status}
- Timestamp: ${c.timestamp}
    `,
      )
      .join("\n");

    const prompt = `You are a duplicate complaint detection assistant for Nogor Shomadhan, a civic complaint system.

Your task is to determine whether a newly submitted civic complaint describes the same real-world problem as any of the existing candidate complaints.

Do not decide based only on matching words.
Consider:
- Physical location (house, road, avenue, landmark)
- Complaint category
- Nature of the problem
- Title meaning
- Description meaning
- Existing complaint status and timestamp

Location and the underlying real-world issue are more important than identical wording.
Different problems at the same location are NOT duplicates (e.g. pothole vs broken streetlight).
Two residents reporting the same pothole near the same location ARE likely duplicates.

New Complaint:
- Title: ${newComplaint.title}
- Description: ${newComplaint.description}
- Category: ${newComplaint.category}
- Location: ${newLoc}

Candidates:
${candidatesStr}

Compare the New Complaint against each Candidate.
Return ONLY valid JSON using the following schema (no markdown formatting, no backticks, just the raw JSON object):
{
  "is_duplicate": boolean,
  "score": number, // between 0.00 and 100.00
  "matched_comp_id": "UUID or null",
  "reason": "Explanation string"
}

If multiple candidates match, return the strongest match.
If no candidate is a strong duplicate, return is_duplicate: false, score: low number, matched_comp_id: null.
`;

    console.log(`[Duplicate Check] Sending request to Gemini...`);
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    const cleanText = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    console.log(`[Duplicate Check] Gemini Raw Response:`, cleanText);
    const parsed = JSON.parse(cleanText);
    console.log(`[Duplicate Check] Gemini Parsed Result:`, parsed);

    return parsed;
  } catch (error) {
    console.error("[Duplicate Check] Gemini duplicate detection error:", error);
    return null;
  }
}

export async function runDuplicateCheckFlow(newCompId: string, accId: string) {
  console.log(
    `[Duplicate Check] Starting async duplicate flow for new complaint ID: ${newCompId}`,
  );
  try {
    // 1. Fetch the newly created complaint
    const { data: newComplaint, error: fetchErr } = await supabase
      .from("complaints")
      .select(
        "comp_id, title, description, house, road, avenue, nearby_landmark, additional_location_details, status, timestamp, category",
      )
      .eq("comp_id", newCompId)
      .single();

    if (fetchErr || !newComplaint) {
      console.error(
        "[Duplicate Check] Failed to fetch new complaint for duplicate check:",
        fetchErr,
      );
      return;
    }

    // 2. Find candidates
    const candidates = await findCandidateComplaints(newComplaint);
    if (candidates.length === 0) {
      console.log(`[Duplicate Check] Flow ended. No candidates found.`);
      return;
    }

    // 3. Gemini semantic analysis
    const aiResult = await analyzeDuplicateWithGemini(newComplaint, candidates);

    // 4. Threshold check
    if (
      aiResult &&
      aiResult.is_duplicate &&
      aiResult.score >= 80 &&
      aiResult.matched_comp_id
    ) {
      console.log(
        `[Duplicate Check] High score duplicate detected (${aiResult.score}%). Checking for existing warnings...`,
      );
      // 5. Prevent identical duplicate warnings
      const { data: existingDup } = await supabase
        .from("duplicate")
        .select("dup_id")
        .eq("comp_id", newCompId)
        .eq("matched_comp_id", aiResult.matched_comp_id)
        .eq("admin_status", "pending")
        .single();

      if (!existingDup) {
        // Insert into duplicate
        const { data: duplicateRow, error: insertErr } = await supabase
          .from("duplicate")
          .insert({
            comp_id: newCompId,
            matched_comp_id: aiResult.matched_comp_id,
            acc_id: accId,
            ai_score: aiResult.score,
            ai_reason: aiResult.reason,
            admin_status: "pending",
          })
          .select("dup_id");

        if (insertErr) {
          console.error(
            "[Duplicate Check] Failed to insert duplicate warning into Supabase:",
            insertErr,
          );
        } else {
          console.log(
            `[Duplicate Check] Successfully created duplicate warning in database!`,
          );

          const { data: admins, error: adminError } = await supabase
            .from("account")
            .select("acc_id")
            .eq("role", "admin")
            .eq("status", "verified");

          if (adminError) {
            console.warn(
              "[Duplicate Check] Could not load admins for notification:",
              adminError.message,
            );
          } else if (duplicateRow?.[0]?.dup_id) {
            const duplicateId = duplicateRow[0].dup_id;
            const candidateLabel = `Complaint ${newCompId.slice(0, 8)}`;
            const canonicalLabel = `Complaint ${aiResult.matched_comp_id.slice(0, 8)}`;
            const notificationRows = (admins ?? []).map((admin) => ({
              recipient_acc_id: admin.acc_id,
              actor_acc_id: accId,
              type: "duplicate_review_required",
              entity_type: "complaint",
              entity_id: newCompId,
              event_key: `duplicate:${duplicateId}:review`,
              title: "Possible duplicate complaint",
              body: `${candidateLabel} may be a duplicate of ${canonicalLabel}.`,
              action_path: `/(admin)/duplicates/${duplicateId}`,
              data: {
                duplicate_id: duplicateId,
                candidate_complaint_id: newCompId,
                canonical_complaint_id: aiResult.matched_comp_id,
                ai_score: aiResult.score,
                ai_reason: aiResult.reason,
              },
              priority: "high",
            }));

            if (notificationRows.length > 0) {
              const { error: notificationError } = await supabase
                .from("notifications")
                .upsert(notificationRows, {
                  onConflict: "recipient_acc_id,event_key",
                  ignoreDuplicates: true,
                });

              if (notificationError) {
                console.warn(
                  "[Duplicate Check] Could not create admin notification:",
                  notificationError.message,
                );
              }
            }
          }
        }
      } else {
        console.log(
          `[Duplicate Check] Warning already exists. Skipped insertion.`,
        );
      }
    } else {
      console.log(`[Duplicate Check] Flow ended. No strong duplicate found.`);
    }
  } catch (error) {
    console.error(
      "[Duplicate Check] Unexpected error in runDuplicateCheckFlow:",
      error,
    );
  }
}
