# 🔧 Airtable Sync Troubleshooting Guide

## Quick Start Commands

### 1. Verify Airtable Credentials
```bash
node scripts/verify-airtable.js
```

This will test your PAT and Base ID, checking:
- ✅ `schema.bases:read` scope
- ✅ `data.records:read` scope  
- ✅ Base, table, and view accessibility

### 2. Start Development Server
```bash
npm run dev
```

### 3. Test the Sync Endpoint
```bash
curl http://localhost:3000/api/sync/test
```

Expected success response:
```json
{"ok": true, "wrote": 1, "slug": "your-record-slug"}
```

### 4. View Synced Data
Open in browser: http://localhost:3000/test

Should display a list of document IDs from Firestore.

---

## Common Issues & Fixes

### ❌ Error: 403 INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND

**Cause:** Your PAT doesn't have the required scopes or access to the base.

**Fix:**
1. Go to https://airtable.com/create/tokens
2. Find your token and click **Edit**
3. Verify these scopes are enabled:
   - ✅ `data.records:read`
   - ✅ `schema.bases:read` (optional but helpful)
4. Under "Access", ensure your base is added with **Read** permissions
5. Click **Save**
6. If you regenerated the token, update `AIRTABLE_PAT` in `.env.local`

### ❌ Error: Table or View Not Found

**Cause:** The table/view name doesn't match exactly (Airtable is case-sensitive).

**Fix:**
1. Run verification script: `node scripts/verify-airtable.js`
2. Check the output for available tables and views
3. Update `TABLE_NAME` or `VIEW_NAME` in your code if needed
4. Common issues:
   - **Table prefixes**: Some Airtable tables are named like `"Table: Global Curiosities"` not just `"Global Curiosities"`
   - Extra spaces: `"Global Curiosities "` vs `"Global Curiosities"`
   - Underscores vs spaces: `"Published_Curiosities"` vs `"Published Curiosities"`

**Real example from this project:**
- ❌ Used: `"Global Curiosities"`
- ✅ Actual: `"Table: Global Curiosities"`

### ❌ Error: No Records Returned

**Possible causes:**
1. **View filter is too restrictive** - Check your "Published_Curiosities" view in Airtable
2. **No published records** - Ensure at least one record has `Content Status = Published`
3. **View name mismatch** - See "Table or View Not Found" above

**Fix:**
1. Open Airtable and navigate to your "Global Curiosities" table
2. Check the "Published_Curiosities" view
3. Verify records appear in that view
4. Try removing the view parameter temporarily to fetch all records:
   ```typescript
   const data = await fetchAirtable<{ records: AirtableRecord[] }>(
     "Global Curiosities"
     // No view parameter
   );
   ```

### ❌ Error: Firestore Permission Denied

**Cause:** Firebase Admin SDK credentials are invalid or missing.

**Fix:**
1. Verify `.env.local` has:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
2. Ensure `FIREBASE_PRIVATE_KEY` includes the full key with `\\n` (double backslash + n)
3. Check Firebase Console → Project Settings → Service Accounts
4. Regenerate a new private key if needed

---

## Debugging Tips

### View Detailed Logs
The code now includes extensive logging. Check your terminal running `npm run dev` for:
- `[Airtable] Fetching: <url>` - Shows the exact API request
- `[Sync Test] Starting Airtable fetch...` - Confirms the endpoint was hit
- `[Sync Test] Fetched X records from Airtable` - Shows how many records were retrieved
- `[Sync Test] Writing record to Firestore with slug: <slug>` - Shows what's being written
- `[Sync Test] ✅ Successfully wrote record: <slug>` - Confirms success

### Test Airtable API Directly with curl

```bash
# Replace with your actual values
BASE_ID="appdhN5zji57tCc4C"
PAT="patVWPKZ5pXbpHYxZ..."
TABLE="Global%20Curiosities"
VIEW="Published_Curiosities"

curl -H "Authorization: Bearer $PAT" \
  "https://api.airtable.com/v0/$BASE_ID/$TABLE?view=$VIEW&maxRecords=1"
```

If this works but your Next.js app doesn't, it's a code issue, not credentials.

### Check Environment Variables Are Loaded

Add this temporarily to `src/app/api/sync/test/route.ts`:
```typescript
console.log('Env check:', {
  hasAirtablePat: !!process.env.AIRTABLE_PAT,
  hasBaseId: !!process.env.AIRTABLE_BASE_ID,
  hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
});
```

### Inspect Firestore in Firebase Console

1. Go to https://console.firebase.google.com
2. Select your project: `curiocity-mvp`
3. Click **Firestore Database**
4. Look for the `curiosities_global` collection
5. Verify documents are being created

---

## Next Steps After Success

Once `GET /api/sync/test` returns `{ok: true, wrote: 1}`:

1. **View the data**: Visit http://localhost:3000/test
2. **Build the full sync**: Create `/api/sync/route.ts` to sync ALL records
3. **Add scheduling**: Use Vercel Cron Jobs or similar to run sync periodically
4. **Add error notifications**: Set up alerts for sync failures

---

## Still Having Issues?

Run the full diagnostic:
```bash
# 1. Verify Airtable access
node scripts/verify-airtable.js

# 2. Check environment variables
cat .env.local | grep -E "AIRTABLE|FIREBASE"

# 3. Start dev server with verbose output
npm run dev

# 4. Hit the endpoint
curl -v http://localhost:3000/api/sync/test

# 5. Check Firestore
open https://console.firebase.google.com/project/curiocity-mvp/firestore
```

Share the output from these commands for further debugging.
