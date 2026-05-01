import admin from "firebase-admin";

const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GCLOUD_PROJECT ||
  "examsprepzambia";

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    "\n❌ GOOGLE_APPLICATION_CREDENTIALS is missing. Point it to your Firebase service-account JSON.",
  );
  process.exit(1);
}

admin.initializeApp({projectId});
const db = admin.firestore();

function pct(n, total) {
  if (!total) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

function tally(items, getKey) {
  const counts = new Map();
  for (const item of items) {
    const key = getKey(item);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

async function snapshotCount(collectionName) {
  const snap = await db.collection(collectionName).count().get();
  return snap.data().count;
}

async function sampleDocs(collectionName, limit) {
  const snap = await db.collection(collectionName).limit(limit).get();
  return snap.docs.map((doc) => ({id: doc.id, ...doc.data()}));
}

async function main() {
  console.log(`\n🔎 Checking project: ${projectId}\n`);

  const [curriculumCount, ragChunkCount] = await Promise.all([
    snapshotCount("curriculum"),
    snapshotCount("rag_chunks"),
  ]);

  console.log("📚 curriculum/*");
  console.log(`   docs: ${curriculumCount}`);
  if (curriculumCount > 0) {
    const sample = await sampleDocs("curriculum", 5);
    console.log(`   sample ids: ${sample.map((d) => d.id).join(", ")}`);
  }

  console.log("\n🧩 rag_chunks/*");
  console.log(`   docs: ${ragChunkCount}`);

  if (ragChunkCount === 0) {
    console.log(
      "\n⚠️  rag_chunks is empty — teacher tools are running on seed-data fallback only.",
    );
    console.log(
      "    Run `npm --prefix functions run cbc:ingest -- --source <path>` to populate.",
    );
    return;
  }

  const sample = await sampleDocs("rag_chunks", 200);
  const withEmbedding = sample.filter(
    (d) => Array.isArray(d.embedding) && d.embedding.length > 0,
  ).length;
  const withTags = sample.filter(
    (d) => Array.isArray(d.tags) && d.tags.length > 0,
  ).length;

  console.log(
    `   sample size: ${sample.length} | with tags: ${withTags} (${pct(withTags, sample.length)}) | with embeddings: ${withEmbedding} (${pct(withEmbedding, sample.length)})`,
  );

  const subjects = tally(sample, (d) => d.subject);
  const grades = tally(sample, (d) => (d.grade ? `G${d.grade}` : ""));
  const forms = tally(sample, (d) => (d.form ? `Form ${d.form}` : ""));

  if (subjects.length) {
    console.log("\n   top subjects (sample):");
    subjects
      .slice(0, 10)
      .forEach(([k, v]) => console.log(`     - ${k}: ${v}`));
  }
  if (grades.length) {
    console.log("\n   grades (sample):");
    grades.forEach(([k, v]) => console.log(`     - ${k}: ${v}`));
  }
  if (forms.length) {
    console.log("\n   forms (sample):");
    forms.forEach(([k, v]) => console.log(`     - ${k}: ${v}`));
  }

  console.log(
    "\n✅ rag_chunks is populated. Teacher tools will use it whenever a request matches by tags + grade/form.",
  );
}

main().catch((err) => {
  console.error("\n❌ Check failed:", err?.message || err);
  process.exit(1);
});
