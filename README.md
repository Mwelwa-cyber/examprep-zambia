# ZedExams

Zambian exam prep platform for all grades.

## Hosting setup

- `https://zedexams.com` is the live frontend and is deployed on Netlify.
- Firebase is still used for Auth, Firestore, Storage, and Cloud Functions.
- Netlify forwards `/api/*` requests to Firebase Functions using [netlify.toml](./netlify.toml).
- Firebase Hosting at `examsprepzambia.web.app` is not the live custom domain.

## Deploy commands

- `npm run deploy`
  Deploy the current frontend build to Netlify production for `zedexams.com`.
- `npm run deploy:netlify:preview`
  Create a Netlify preview deploy from the current frontend build.
- `npm run deploy:firebase:functions`
  Deploy Firebase Cloud Functions only.
- `npm run deploy:firebase:firestore`
  Deploy Firestore rules and indexes.
- `npm run deploy:firebase:hosting`
  Deploy the static app to Firebase Hosting only. This updates `examsprepzambia.web.app`, not `zedexams.com`.

## First-time Netlify CLI auth

Before using the Netlify deploy scripts locally, sign in once:

```bash
npx -y netlify-cli login
```
