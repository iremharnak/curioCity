import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { fetchAirtable } from "@/lib/airtable";

// Airtable record typing based on provided field mapping
// Note: Attachment fields are arrays with { url } objects

type AirtableAttachment = { url: string };

type AirtableRecord = {
  id: string;
  fields: {
    City?: string;
    Keyword?: string;
    Title?: string;
    "Action Text"?: string;
    Lat?: number | string;
    Lng?: number | string;
    Address?: string;
    Neighborhood?: string;
    "Maps URL"?: string;
    Free?: boolean;
    Type?: string;
    Image?: AirtableAttachment[];
    "Content Status"?: string;
    Slug?: string;
  };
};

export async function GET() {
  try {
    console.log("[Sync Hooks] Starting Airtable fetch...");

    // fetchAirtable handles encodeURIComponent for table names
    const data = await fetchAirtable<{ records: AirtableRecord[] }>(
      "Local Hooks",
      "Published_Hooks"
    );

    const records = data.records || [];
    console.log(`[Sync Hooks] Fetched ${records.length} records from Airtable`);

    let wrote = 0;

    for (const rec of records) {
      const f = rec.fields || {};

      const cityKey = f.City?.toString().trim();
      if (!cityKey) {
        console.warn(`[Sync Hooks] Skipping record ${rec.id} - missing City`);
        continue;
      }

      const title = f.Title?.toString() || "";
      const slug = (f.Slug && f.Slug.toString()) || title.toLowerCase().replace(/\s+/g, "-");
      if (!slug) {
        console.warn(`[Sync Hooks] Skipping record ${rec.id} - missing Slug and Title`);
        continue;
      }

      const latRaw = f.Lat;
      const lngRaw = f.Lng;
      const lat = typeof latRaw === "string" ? parseFloat(latRaw) : latRaw ?? null;
      const lng = typeof lngRaw === "string" ? parseFloat(lngRaw) : lngRaw ?? null;

      const docData = {
        cityKey,
        keyword: f.Keyword || "",
        title,
        actionText: f["Action Text"] || "",
        location: {
          lat: typeof lat === "number" && !Number.isNaN(lat) ? lat : null,
          lng: typeof lng === "number" && !Number.isNaN(lng) ? lng : null,
          address: f.Address || "",
          neighborhood: f.Neighborhood || "",
          mapsUrl: f["Maps URL"] || "",
          free: Boolean(f.Free),
        },
        type: f.Type || "",
        image: f.Image?.[0]?.url || "",
        status: f["Content Status"] || "Draft",
        slug,
        _airtableId: rec.id,
        updatedAt: new Date(),
      };

      console.log(`[Sync Hooks] Writing: cities/${cityKey}/local_hooks/${slug}`);
      await adminDb
        .collection("cities")
        .doc(cityKey)
        .collection("local_hooks")
        .doc(slug)
        .set(docData, { merge: true });

      wrote += 1;
    }

    console.log(`[Sync Hooks] ✅ Wrote ${wrote} records`);
    return NextResponse.json({ ok: true, wrote });
  } catch (error) {
    console.error("[Sync Hooks] ❌ Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}