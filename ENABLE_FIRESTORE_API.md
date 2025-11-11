# Enable Firestore API

## The Issue

You have a **Firestore database** in Firebase Console, but the **Firestore API** in Google Cloud Console is not enabled.

These are two different things:
- ✅ **Firestore Database** (Firebase) - This is enabled ✅
- ❌ **Firestore API** (Google Cloud) - This needs to be enabled ❌

## How to Enable the Firestore API

### Option 1: Direct Link (Fastest)

Click this link and then click the "Enable" button:

```
https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=curiocity-mvp
```

### Option 2: Via Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Select project: **curiocity-mvp**
3. In the search bar at the top, type: **"Firestore API"**
4. Click on **"Cloud Firestore API"**
5. Click the **"Enable"** button
6. Wait 1-2 minutes for propagation

### Option 3: Using gcloud CLI

If you have `gcloud` CLI installed:

```bash
gcloud services enable firestore.googleapis.com --project=curiocity-mvp
```

## Verify It Worked

After enabling, wait about 2 minutes, then test:

```bash
curl http://localhost:3000/api/sync/test
```

Expected success response:
```json
{"ok":true,"wrote":1,"slug":"why-hawks-circle-before-diving"}
```

## Why This Is Needed

Firebase Admin SDK (used in your API routes) requires the **Google Cloud Firestore API** to be explicitly enabled, even if you've already created a Firestore database through Firebase Console.

This is a one-time setup step.

## Still Getting the Error?

If you just enabled it:
1. **Wait 2-3 minutes** for Google Cloud to propagate the change
2. **Restart your dev server**: 
   ```bash
   # Stop the server (Ctrl+C), then:
   npm run dev
   ```
3. Try the test endpoint again

If it's been more than 5 minutes and still not working:
- Double-check you're enabling it for the correct project (**curiocity-mvp**)
- Check the Firebase Admin credentials in `.env.local` are correct
- Verify the service account has Firestore permissions in Firebase Console
