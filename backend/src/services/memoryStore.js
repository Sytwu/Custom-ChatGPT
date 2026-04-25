import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Render stores env vars as literal \n — restore actual newlines
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getFirestore();
}

function entriesRef(userId) {
  return getDb().collection("memories").doc(userId).collection("entries");
}

export async function getMemories(userId) {
  const snap = await entriesRef(userId).orderBy("createdAt", "asc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addMemoryEntry(userId, entry) {
  await entriesRef(userId).doc(entry.id).set({
    content: entry.content,
    createdAt: entry.createdAt,
    source: entry.source,
  });
}

export async function deleteMemoryEntry(userId, id) {
  await entriesRef(userId).doc(id).delete();
}
