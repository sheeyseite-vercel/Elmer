# ELMER BI – operations

## Deploy Firestore rules and indexes
Rules deny every client write; only server code (Firebase Admin) writes. Deploy them from a machine with the Firebase CLI signed in to the project:

    firebase deploy --only firestore:rules,firestore:indexes,storage

Check afterwards in the Firebase console (Firestore → Rules) that the published rules match `firestore.rules`.
Queries use equality filters and sort in memory, so the listed indexes are only for the metrics/search-term queries.

## Test the rules (needs the emulator)
    firebase emulators:start --only firestore
Expected: a signed-in member can read their business documents; no client can write any collection; `ai_providers` is unreadable by clients; a user who is not in `memberUids` reads nothing.

## Backups
Turn on scheduled Firestore backups (Firebase console → Firestore → Disaster recovery), daily, 7 to 14 days retention. Backups are a paid Google Cloud feature: enable them only with the owner's approval.
Free option: from the app, download each report as CSV/text; metric data can be re-imported from the original CSV exports.

## Access
Only emails in `OWNER_EMAILS` can sign in. Change the list in Vercel → Settings → Environment Variables, then redeploy.

## Not connected
The Google Business Profile API is not connected. It needs Google's approval and an OAuth setup. Until then, use CSV import or manual entry.
