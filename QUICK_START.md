# 🚀 Quick Start - Airtable → Firestore Sync

## ✅ What's Working Now
- Airtable API connection ✅
- PAT authentication ✅  
- Record fetching ✅
- URL encoding ✅
- Error logging ✅

## 🔧 One Step Remaining

**Enable Firestore API:**

Visit and click "Enable":
```
https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=curiocity-mvp
```

## 🧪 Test Commands

```bash
# 1. Verify Airtable works (should pass ✅)
node scripts/verify-airtable.js

# 2. Start dev server
npm run dev

# 3. Test sync (after enabling Firestore)
curl http://localhost:3000/api/sync/test

# 4. View synced data
open http://localhost:3000/test
```

## 📊 Expected Output

**Successful sync response:**
```json
{"ok": true, "wrote": 1, "slug": "why-hawks-circle-before-diving"}
```

**Successful test page:**
```
Firestore Connection Test
• why-hawks-circle-before-diving
```

## 📝 Key Details

- **Airtable Base**: CurioCity - Content
- **Table Name**: `Table: Global Curiosities` (note the "Table:" prefix!)
- **View Name**: `Published_Curiosities`
- **Firestore Collection**: `curiosities_global`
- **First Record**: "Why hawks circle before diving"

## 🐛 If Something's Wrong

1. **Check verification**: `node scripts/verify-airtable.js`
2. **Check logs**: Look at terminal running `npm run dev`
3. **Read guide**: See `AIRTABLE_TROUBLESHOOTING.md`
4. **Check status**: See `SYNC_STATUS.md`

## 🎯 Next Steps After Success

1. Build full sync to process all records
2. Add pagination for large datasets
3. Set up scheduled sync (cron job)
4. Add error monitoring
5. Build UI to trigger manual syncs

---

**That's it!** Once Firestore API is enabled, your sync is fully operational 🎉
