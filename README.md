# Pantry

Live app: https://pantry-tracker-six-lime.vercel.app

A Next.js + React + Material UI kitchen inventory. Gemini powers photo identification and recipe suggestions; Firebase adds per-user cloud sync.

## Run

Use Node 22+: `npm ci`, copy `.env.example` to `.env.local`, then `npm run dev`. A clean checkout runs without credentials: the local demo starts with three sample ingredients and saves edits in this browser. `npm test` checks validation, quantities, request boundaries, and a mocked Gemini transport; `npm run build` checks production compilation.

## What works

- Add, search, category-filter, increment, decrement, and delete items; duplicate normalized names add quantities.
- Positive integer quantities with overflow protection; expiry dates and low-stock counts.
- Local persistence with storage-error feedback, or Firestore transactions under `users/{uid}/pantry`.
- Anonymous Firebase sessions and optional Google sign-in. Anonymous and Google accounts have separate inventories; Google sign-in does not silently merge anonymous records.
- Camera/file photo classification using Gemini; review suggested fields before saving. Photos are sent for analysis and not stored.
- Server-side Gemini recipe generation from the complete pantry, independent of search filters. Missing keys show an explicitly labeled curated demo recipe.

## Firebase

Set all four `NEXT_PUBLIC_FIREBASE_*` values. Enable Anonymous and Google in Firebase Authentication, authorize your host, create Firestore, and deploy `firestore.rules` with `firebase deploy --only firestore:rules`. Rules restrict reads and writes to the authenticated UID and validate stored fields. Test these rules against your project/emulator before public deployment; live anonymous-client read/write and access-restriction checks passed after cloud setup.

The legacy shared `inventory` collection is intentionally not read. Export/migrate old data into the correct user's collection rather than granting public access.

## Deploy

Import this repository into Vercel; use Next.js defaults, add environment variables, then deploy. Public Firebase configuration is baked into the client build, so rebuild after changing it. GitHub Actions runs tests and a production build on pushes and pull requests. For EC2/container hosting, build the included Dockerfile from this repository directory; provide public configuration through build args and server secrets at runtime. Terminate TLS at your load balancer/reverse proxy.

Gemini key: https://aistudio.google.com/apikey · Docs: https://ai.google.dev/gemini-api/docs

## Operational limits

Rate limiting is per process and assumes a trusted hosting proxy sets the client IP. Add an edge/shared limiter and provider spend limits before a public multi-instance launch. The former browser-embedded recipe key was removed from current source; revoke it at its provider because removing source does not remove Git history. Image storage, Vertex AutoML, and a live Vercel deployment are not completed by this code update.
