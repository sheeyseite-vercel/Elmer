# ELMER Business Intelligence

Next.js (App Router) + TypeScript + Tailwind CSS web app, installable as a PWA, backed by Firebase (Auth, Firestore, Storage), deployable on Vercel. One codebase, no native mobile app.

> **Status: Phase 1 (foundation) written but NOT yet installed, built or tested.** Dependencies could not be installed in the authoring environment, so `npm install`, `npm run typecheck`, `npm run lint` and `npm run build` have never been run. Run them first and fix any issue (dependency version ranges in `package.json` also need verification against the current stable releases).

## What exists (Phase 1)

- Config: Next.js, strict TypeScript, Tailwind v4, ESLint, security headers.
- Design tokens (dark default + light, semantic colours, focus rings, reduced-motion support) in `src/app/globals.css`; base UI components in `src/components/ui`.
- App shell: desktop sidebar, mobile bottom navigation with "More" sheet.
- Auth: Firebase Auth (email/password and Google) on the client, exchanged for an httpOnly session cookie by `/api/auth/session`; all protected pages call `requireUser()`. Access limited to `OWNER_EMAILS`.
- Onboarding wizard: explains what the app can and cannot measure, then collects business details. Nothing is pre-filled except the business name.
- Firestore Security Rules (`firestore.rules`): members read-only, **all client writes denied**; writes go through server actions using the Admin SDK with Zod validation and an audit log entry. `storage.rules` denies all client access. Indexes in `firestore.indexes.json`.
- PWA: `src/app/manifest.ts`, icons in `public/icons`, `public/sw.js` (caches only static assets and `/offline`; never pages, `/api` or business data), offline page.
- All 13 module routes exist as honest "No data yet / Planned" placeholders (`src/lib/modules.ts`). They are **not** finished features.

## Not built yet

Phase 2 CSV import and manual entry; Phase 3 analytics modules; Phase 4 AI analyst and PDF/CSV export; Phase 5 Google Business Profile API and rank provider (needs verified access and credentials); Phase 6 tests (unit, rules, authorization, accessibility) and Vercel config; Spanish UI translations and RTL; Motion transitions; map and chart libraries (to be chosen after checking licences and pricing); privacy and terms drafts.

## Setup

Prerequisites: Node.js LTS, a Firebase project (the free Spark plan is enough for Phase 1; do not enable Blaze without deciding to), Firebase CLI (`npm i -g firebase-tools`).

1. `npm install`
2. In the Firebase console: enable **Authentication** (Email/Password and, optionally, Google), create a **Firestore** database, and add a **Web app** to get the `NEXT_PUBLIC_FIREBASE_*` values.
3. Project settings → Service accounts → generate a private key. Put its `project_id`, `client_email`, `private_key` into `FIREBASE_ADMIN_*`. Never commit it.
4. `cp .env.example .env.local`, fill the required values and set `OWNER_EMAILS` to your sign-in email.
5. Create your user in Authentication → Users (or sign in with Google).
6. `firebase login && firebase use <project-id> && firebase deploy --only firestore:rules,firestore:indexes,storage`
7. `npm run dev`, open http://localhost:3000, sign in, complete onboarding.

## Environment variables

| Variable | Required | Without it |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` (6) | Yes | Login shows a configuration message |
| `FIREBASE_ADMIN_*` (3) | Yes | Server cannot authenticate or read data |
| `OWNER_EMAILS` | Yes in production | Production sign-in is refused for everyone |
| `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI` | Optional | Google Business Profile integration stays disabled |
| `AI_PROVIDER`, `AI_API_KEY` | Optional | AI analyst unavailable |
| `RANK_TRACKER_PROVIDER`, `RANK_TRACKER_API_KEY` | Optional | Only manual rank checks |

Only variables prefixed `NEXT_PUBLIC_` reach the browser. Never prefix a secret.

## Vercel deployment

1. Push to GitHub, then import the repository in Vercel (framework preset: Next.js; build `npm run build`).
2. Add the variables above separately for Development, Preview and Production. Store `FIREBASE_ADMIN_PRIVATE_KEY` with its `\n` sequences.
3. In Firebase Authentication → Settings → Authorized domains, add your Vercel and custom domains.
4. Each push to the main branch deploys to Production; roll back from the Vercel Deployments list. Logs: Vercel → Logs.

## Installing as an app (PWA)

- Android Chrome / desktop Chrome or Edge: use the browser's "Install app" prompt.
- iPhone: open in Safari → Share → **Add to Home Screen**. iOS limits background and push features for web apps.
- Offline: only the app shell and an offline notice are available; business data is never cached.

## Data model

Top-level collections, each business-scoped by `businessId`: `business_profiles` (with `ownerUid`, `memberUids`), `data_sources`, `performance_metrics`, `search_terms`, `tracked_keywords`, `rank_checks`, `competitors`, `competitor_snapshots`, `reviews`, `profile_tasks`, `lead_aggregates`, `ai_reports`, `imports`, `audit_logs`. Only `business_profiles` and `audit_logs` are written in Phase 1. Audit logs store field names, never values or secrets. No patient or health data is collected.

## Map data

The geographic visibility page uses Leaflet with OpenStreetMap tiles (no account, no cost, attribution shown on the map).
OpenStreetMap's public tile servers have a usage policy meant for light use, which fits a single-owner app. If traffic grows,
switch to a tile provider with a plan that allows it and update the URL in `src/components/map/geo-map.tsx`.

## Troubleshooting

- "Firebase Admin is not configured": check the three `FIREBASE_ADMIN_*` values and that the private key keeps its `\n` sequences.
- Redirected back to login: your email is missing from `OWNER_EMAILS`, or the session cookie was rejected.
- Permission errors in the browser: expected for writes; mutations are server-only by design.
