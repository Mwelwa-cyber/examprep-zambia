import fs from "node:fs";
import path from "node:path";
import admin from "firebase-admin";

const args = new Set(process.argv.slice(2));
const sourceArgIndex = process.argv.findIndex((arg) => arg === "--source");
const sourceArg = sourceArgIndex >= 0 ? process.argv[sourceArgIndex + 1] : "";
const verifyOnly = args.has("--verify");
const withEmbeddings = args.has("--with-embeddings");
const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GCLOUD_PROJECT ||
  "examsprepzambia";

const EMBED_MODEL = "text-embedding-3-small";
const EMBED_BATCH = 100;
const WRITE_BATCH = 400;

function fail(message) {
  console.error(`\n❌ ${message}`);
  process.exit(1);
}

function resolveSourceDir() {
  const raw = sourceArg || process.env.CBC_SOURCE_DIR || "";
  if (!raw) {
    fail(
      "No curriculum source directory provided. Pass --source <path> or set CBC_SOURCE_DIR.",
    );
  }
  const root = path.resolve(raw);
  if (!fs.existsSync(root)) {
    fail(`Source path does not exist: ${root}`);
  }
  const nestedData = path.join(root, "data");
  if (fs.existsSync(path.join(root, "curriculum-taxonomy.json"))) return root;
  if (fs.existsSync(path.join(nestedData, "curriculum-taxonomy.json"))) return nestedData;
  fail(
    `Could not find curriculum-taxonomy.json in ${root} or ${nestedData}.`,
  );
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonl(filePath) {
  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

function safeDirEntries(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath, {withFileTypes: true});
}

function cleanText(value, max = 8000) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function deriveDocId(filename) {
  return filename
    .replace(/^syllabus-/, "")
    .replace(/-chunks\.jsonl$/, "")
    .replace(/\.json$/, "");
}

async function embedBatch(texts) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    fail("OPENAI_API_KEY is required when --with-embeddings is used.");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    fail(`OpenAI embeddings request failed (${response.status}): ${body}`);
  }

  const payload = await response.json();
  return (payload.data || []).map((item) => item.embedding);
}

async function writeInBatches(collectionRef, docs) {
  for (let i = 0; i < docs.length; i += WRITE_BATCH) {
    const batch = admin.firestore().batch();
    const slice = docs.slice(i, i + WRITE_BATCH);
    slice.forEach(({id, data}) => {
      batch.set(collectionRef.doc(id), data, {merge: true});
    });
    await batch.commit();
    process.stdout.write(`\r  wrote ${Math.min(i + WRITE_BATCH, docs.length)}/${docs.length}`);
  }
  process.stdout.write("\n");
}

function collectSourceFiles(sourceDir) {
  const fileGroups = [];
  const rootFiles = [
    {
      taxonomy: path.join(sourceDir, "curriculum-taxonomy.json"),
      chunks: path.join(sourceDir, "curriculum-chunks.jsonl"),
      sourceGroup: "framework",
      id: "framework",
    },
  ];
  rootFiles.forEach((group) => fileGroups.push(group));

  ["syllabi", "tier1"].forEach((subdir) => {
    const dirPath = path.join(sourceDir, subdir);
    safeDirEntries(dirPath).forEach((entry) => {
      if (!entry.isFile()) return;
      if (entry.name.startsWith("syllabus-") && entry.name.endsWith(".json")) {
        const id = deriveDocId(entry.name);
        fileGroups.push({
          taxonomy: path.join(dirPath, entry.name),
          chunks: path.join(dirPath, `${id}-chunks.jsonl`),
          sourceGroup: subdir,
          id,
        });
      }
    });
  });

  const schemesPath = path.join(sourceDir, "schemes", "sow-chunks.jsonl");
  if (fs.existsSync(schemesPath)) {
    fileGroups.push({
      taxonomy: "",
      chunks: schemesPath,
      sourceGroup: "schemes",
      id: "schemes_of_work",
    });
  }

  return fileGroups;
}

function loadCurriculum(sourceDir) {
  const groups = collectSourceFiles(sourceDir);
  const taxonomyDocs = [];
  const chunkDocs = [];

  for (const group of groups) {
    if (group.taxonomy && fs.existsSync(group.taxonomy)) {
      taxonomyDocs.push({
        id: group.id,
        data: readJson(group.taxonomy),
      });
    }

    if (group.chunks && fs.existsSync(group.chunks)) {
      const chunks = readJsonl(group.chunks).map((chunk) => ({
        id: chunk.id,
        data: {
          ...chunk,
          syllabus_id:
            chunk.syllabus_id ||
            (group.id === "framework" || group.id === "schemes_of_work" ? "" : group.id),
          source_group: chunk.source_group || group.sourceGroup,
        },
      }));
      chunkDocs.push(...chunks);
    }
  }

  return {taxonomyDocs, chunkDocs};
}

async function main() {
  const sourceDir = resolveSourceDir();
  const {taxonomyDocs, chunkDocs} = loadCurriculum(sourceDir);

  console.log("\n📚 CBC private curriculum ingest");
  console.log(`   source: ${sourceDir}`);
  console.log(`   curriculum docs: ${taxonomyDocs.length}`);
  console.log(`   chunk docs: ${chunkDocs.length}`);
  console.log(`   embeddings: ${withEmbeddings ? "enabled" : "disabled"}`);

  if (verifyOnly) {
    console.log("\n✅ Verify-only mode complete. No writes performed.");
    return;
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    fail(
      "GOOGLE_APPLICATION_CREDENTIALS is missing. Point it to your Firebase service-account JSON.",
    );
  }

  admin.initializeApp({projectId});

  const db = admin.firestore();

  console.log("\n📝 Writing curriculum taxonomies...");
  await writeInBatches(
    db.collection("curriculum"),
    taxonomyDocs.map((doc) => ({
      id: doc.id,
      data: {
        ...doc.data,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      },
    })),
  );

  let readyChunks = chunkDocs;
  if (withEmbeddings) {
    console.log("\n🧮 Generating embeddings...");
    readyChunks = [];
    for (let i = 0; i < chunkDocs.length; i += EMBED_BATCH) {
      const slice = chunkDocs.slice(i, i + EMBED_BATCH);
      const inputs = slice.map(({data}) =>
        cleanText(`${data.title || ""}\n\n${data.text || ""}`),
      );
      const embeddings = await embedBatch(inputs);
      slice.forEach((item, index) => {
        readyChunks.push({
          id: item.id,
          data: {
            ...item.data,
            embedding: embeddings[index],
          },
        });
      });
      process.stdout.write(
        `\r  embedded ${Math.min(i + EMBED_BATCH, chunkDocs.length)}/${chunkDocs.length}`,
      );
    }
    process.stdout.write("\n");
  }

  console.log("\n📝 Writing curriculum chunks...");
  await writeInBatches(
    db.collection("rag_chunks"),
    readyChunks.map((doc) => ({
      id: doc.id,
      data: {
        ...doc.data,
        ingested_at: admin.firestore.FieldValue.serverTimestamp(),
      },
    })),
  );

  console.log("\n✅ Ingest complete.");
  console.log(`   curriculum/: ${taxonomyDocs.length} docs`);
  console.log(`   rag_chunks/: ${readyChunks.length} docs`);
}

main().catch((error) => {
  console.error("\n❌ Ingest failed.");
  console.error(error);
  process.exit(1);
});
