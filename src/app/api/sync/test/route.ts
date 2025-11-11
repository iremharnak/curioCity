import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { fetchAirtable } from "@/lib/airtable";

type AirtableRecord = {
  id: string;
  fields: {
    "Title (Spark)": string;
    "Spark Text"?: string;
    Category?: string;
    Mood?: string;
    Keywords?: string; // "hawk, bird"
    Image?: Array<{ url: string }>;
    Author?: string;
    "Source URLs"?: string;
    "Publish Date"?: string;
    "Content Status"?: string;
    Slug?: string;
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
    console.log("[Sync Test] Starting Airtable fetch...");
    
    // 1) Pull up to 1 published curiosity from Airtable
    // Note: Don't encode here - fetchAirtable handles encoding
    const data = await fetchAirtable<{ records: AirtableRecord[] }>(
      "Table: Global Curiosities", // Actual table name from Airtable
      "Published_Curiosities"
    );

    console.log(`[Sync Test] Fetched ${data.records.length} records from Airtable`);

    const first = data.records[0];
    if (!first) {
      console.log("[Sync Test] No records found");
      return NextResponse.json({ ok: true, wrote: 0, reason: "no records" });
    }

    const f = first.fields;
    const slug = f.Slug || (f["Title (Spark)"] || "").toLowerCase().replace(/\s+/g, "-");
    const keywords = (f.Keywords || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    // 2) Upsert to Firestore
    console.log(`[Sync Test] Writing record to Firestore with slug: ${slug}`);
    
    await adminDb.collection("curiosities_global").doc(slug).set(
      {
        slug,
        title: f["Title (Spark)"],
        sparkText: f["Spark Text"] || "",
        categoryKey: f.Category || "",
        mood: f.Mood || "",
        keywords,
        image: f.Image?.[0]?.url || "",
        author: f.Author || "",
        sourceUrls: (f["Source URLs"] || "").split("\n").filter(Boolean),
        publishDate: f["Publish Date"] || null,
        status: f["Content Status"] || "Draft",
        _airtableId: first.id,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    console.log(`[Sync Test] ✅ Successfully wrote record: ${slug}`);
    return NextResponse.json({ ok: true, wrote: 1, slug });
  } catch (error) {
    console.error("[Sync Test] ❌ Error:", error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
