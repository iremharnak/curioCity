import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { fetchAirtable } from "@/lib/airtable";

type AirtableRecord = {
  id: string;
  fields: {
    Curiosity?: string | string[]; // linked record; may be ID array or slug text depending on setup
    "Curiosity Slug"?: string; // optional lookup field if available
    Type?: string;
    Title?: string;
    Description?: string;
    "Display Label"?: string;
    Partner?: string;
    URL?: string;
    "Is Affiliate"?: boolean;
    "Commission Rate"?: string | number;
    "Content Status"?: string;
  };
};

function assertCronAuth(req: Request) {
  const secret = process.env.CRON_SECRET;
  const hdr = req.headers.get("authorization") || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : new URL(req.url).searchParams.get("token");
  if (!secret || token !== secret) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  const unauth = assertCronAuth(req);
  if (unauth) return unauth;

  try {
    console.log("[Sync Extensions] Starting Airtable fetch...");

    // fetchAirtable handles encodeURIComponent for table names
    const data = await fetchAirtable<{ records: AirtableRecord[] }>(
      "Curiosity Extensions",
      "Published_Extensions"
    );

    const records = data.records || [];
    console.log(`[Sync Extensions] Fetched ${records.length} records from Airtable`);

    let wrote = 0;

    for (const rec of records) {
      const f = rec.fields || {};

      // Resolve curiositySlug from either an explicit lookup field or a text field
      let curiositySlug: string | undefined = (f as any)["Curiosity Slug"];
      if (!curiositySlug) {
        if (typeof f.Curiosity === "string") {
          curiositySlug = f.Curiosity;
        } else if (Array.isArray(f.Curiosity) && f.Curiosity.length > 0) {
          // Likely linked record IDs; cannot infer slug reliably
          console.warn(
            `[Sync Extensions] Record ${rec.id} has linked Curiosity IDs without a slug lookup; skipping`
          );
          continue;
        }
      }

      curiositySlug = curiositySlug?.toString().trim();
      if (!curiositySlug) {
        console.warn(`[Sync Extensions] Skipping record ${rec.id} - missing curiositySlug`);
        continue;
      }

      const docId = rec.id; // Use Airtable Record ID as the Firestore doc id per spec

      const commissionRateRaw = f["Commission Rate"];
      const commissionRate =
        typeof commissionRateRaw === "string"
          ? parseFloat(commissionRateRaw)
          : typeof commissionRateRaw === "number"
          ? commissionRateRaw
          : undefined;

      const docData = {
        curiositySlug,
        type: f.Type || "",
        title: f.Title || "",
        description: f.Description || "",
        displayLabel: f["Display Label"] || "",
        partner: f.Partner || "",
        url: f.URL || "",
        isAffiliate: Boolean(f["Is Affiliate"]),
        commissionRate: typeof commissionRate === "number" && !Number.isNaN(commissionRate) ? commissionRate : null,
        status: f["Content Status"] || "Draft",
        _airtableId: rec.id,
        updatedAt: new Date(),
      };

      console.log(
        `[Sync Extensions] Writing: curiosities_global/${curiositySlug}/extensions/${docId}`
      );

      await adminDb
        .collection("curiosities_global")
        .doc(curiositySlug)
        .collection("extensions")
        .doc(docId)
        .set(docData, { merge: true });

      wrote += 1;
    }

    console.log(`[Sync Extensions] ✅ Wrote ${wrote} records`);
    return NextResponse.json({ ok: true, wrote });
  } catch (error) {
    console.error("[Sync Extensions] ❌ Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
