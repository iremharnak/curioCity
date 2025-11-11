const AIRTABLE_API = "https://api.airtable.com/v0";

export async function fetchAirtable<T>(table: string, view?: string) {
  // Encode table name for URL
  const encodedTable = encodeURIComponent(table);
  const url = new URL(`${AIRTABLE_API}/${process.env.AIRTABLE_BASE_ID}/${encodedTable}`);
  
  // Add view parameter if provided
  if (view) {
    url.searchParams.set("view", view);
  }

  const requestUrl = url.toString();
  console.log("[Airtable] Fetching:", requestUrl);

  const res = await fetch(requestUrl, {
    headers: { Authorization: `Bearer ${process.env.AIRTABLE_PAT}` },
    cache: "no-store",
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let errorMessage = text;
    
    try {
      const errorJson = JSON.parse(text);
      errorMessage = errorJson.error?.message || text;
    } catch {
      // text is not JSON, use as is
    }
    
    console.error(`[Airtable] ${res.status} error:`, {
      status: res.status,
      url: requestUrl,
      message: errorMessage,
      baseId: process.env.AIRTABLE_BASE_ID,
      table,
      view,
    });
    
    throw new Error(`Airtable ${res.status}: ${errorMessage}`);
  }
  
  return (await res.json()) as T;
}
