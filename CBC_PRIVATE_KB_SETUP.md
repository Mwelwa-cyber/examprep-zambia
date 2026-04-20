# Private CBC Curriculum Setup

This project can now use a hidden CBC curriculum corpus to ground teacher-tool generations. The raw curriculum is stored in Firestore collections that the browser cannot read directly:

- `curriculum/*`
- `rag_chunks/*`

The teacher tools keep the same UI. Lesson plans, worksheets, flashcards, schemes of work, and rubrics simply get better server-side grounding once the data is ingested.

## 1. Verify the source bundle

From the repo root:

```powershell
npm --prefix functions run cbc:verify -- --source "C:\Users\mahen\Downloads\editor\cbc-curriculum"
```

You can also point to the deploy bundle root and the script will auto-detect its `data/` folder:

```powershell
npm --prefix functions run cbc:verify -- --source "C:\Users\mahen\Downloads\editor\cbc-deploy"
```

## 2. Ingest the private curriculum

Set your Firebase service account path for the one-time write:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\firebase-service-account.json"
npm --prefix functions run cbc:ingest -- --source "C:\Users\mahen\Downloads\editor\cbc-curriculum"
```

This writes:

- taxonomy docs into `curriculum/*`
- retrieval chunks into `rag_chunks/*`

## 3. Optional: store embeddings too

The live retrieval works without embeddings. If you want to enrich the chunk documents with OpenAI embeddings for future upgrades, add `OPENAI_API_KEY` and pass `--with-embeddings`:

```powershell
$env:OPENAI_API_KEY="sk-..."
npm --prefix functions run cbc:ingest -- --source "C:\Users\mahen\Downloads\editor\cbc-curriculum" --with-embeddings
```

## 4. Deploy

After ingesting, deploy Firestore rules and Functions:

```powershell
npx -y firebase-tools@latest deploy --only firestore:rules
npx -y firebase-tools@latest deploy --only functions
```

## Notes

- The new curriculum collections are server-only by Firestore rules.
- If the private curriculum is missing or a topic is not covered, the app still falls back to the existing seeded CBC knowledge.
- Grades `G8`–`G11` are internally mapped to O-Level `Form 1`–`Form 4` when matching the private syllabus corpus.
