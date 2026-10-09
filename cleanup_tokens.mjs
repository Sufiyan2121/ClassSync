import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('/Users/Sufiyan-Mac/Downloads/classsync-83f62-firebase-adminsdk-fbsvc-733652676b.json', 'utf8'));

const app = initializeApp({
  credential: cert(serviceAccount)
});

const adminDb = getFirestore(app);
const adminMessaging = getMessaging(app);

async function cleanup() {
  const usersSnapshot = await adminDb.collection("users").get();
  let removedCount = 0;

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    if (!Array.isArray(data.fcmTokens) || data.fcmTokens.length === 0) continue;

    const validTokens = [];
    
    // Check tokens in batches of 500
    const message = {
      data: { test: "test" },
      tokens: data.fcmTokens
    };
    
    try {
      // dryRun = true means it won't actually send a notification, just check validity!
      const response = await adminMessaging.sendEachForMulticast(message, true);
      
      response.responses.forEach((res, idx) => {
        if (res.success || (res.error && res.error.code !== 'messaging/registration-token-not-registered')) {
          validTokens.push(data.fcmTokens[idx]);
        } else {
          removedCount++;
        }
      });

      if (validTokens.length !== data.fcmTokens.length) {
        await doc.ref.update({ fcmTokens: validTokens });
        console.log(`Removed ${data.fcmTokens.length - validTokens.length} invalid tokens for ${data.email}`);
      }
    } catch (e) {
      console.error(`Error checking tokens for ${data.email}:`, e);
    }
  }
  
  console.log(`Cleanup complete! Removed ${removedCount} invalid/expired tokens across all users.`);
}

cleanup().catch(console.error);
