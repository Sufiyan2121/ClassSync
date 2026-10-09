import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('/Users/Sufiyan-Mac/Downloads/classsync-83f62-firebase-adminsdk-fbsvc-733652676b.json', 'utf8'));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

async function checkTokens() {
  const users = await db.collection('users').get();
  let totalTokens = 0;
  users.forEach(doc => {
    const data = doc.data();
    console.log(`User ${data.email || doc.id}: ${data.fcmTokens?.length || 0} tokens`);
    totalTokens += data.fcmTokens?.length || 0;
  });
  console.log(`Total tokens in DB: ${totalTokens}`);
}

checkTokens();
