import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('/Users/Sufiyan-Mac/Downloads/classsync-83f62-firebase-adminsdk-fbsvc-733652676b.json', 'utf8'));

const app = initializeApp({
  credential: cert(serviceAccount)
});

const adminDb = getFirestore(app);
const adminMessaging = getMessaging(app);

async function testPush() {
  const usersSnapshot = await adminDb
    .collection("users")
    .where("email", "==", "sakmaurya96@gmail.com")
    .get();

  const allTokens = [];
  usersSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (Array.isArray(data.fcmTokens)) {
      allTokens.push(...data.fcmTokens);
    }
  });

  if (allTokens.length === 0) {
    console.log("No tokens found for friend.");
    return;
  }

  const uniqueTokens = [...new Set(allTokens)];
  console.log(`Sending to ${uniqueTokens.length} tokens...`);

  const message = {
    data: {
      title: "Test Notification",
      body: "This is a test notification to see if Android receives it.",
      postId: "test-id",
      url: "https://classsync-kohl.vercel.app/",
      icon: "https://classsync-kohl.vercel.app/icons/icon-192x192.png",
      image: "https://classsync-kohl.vercel.app/icons/icon-512x512.png"
    },
    tokens: uniqueTokens,
  };

  const response = await adminMessaging.sendEachForMulticast(message);
  console.log(`Sent ${response.successCount} successfully, ${response.failureCount} failed.`);
  if (response.failureCount > 0) {
    response.responses.forEach((res, idx) => {
      if (!res.success) {
        console.error(`Error for token ${idx}:`, res.error);
      }
    });
  }
}

testPush().catch(console.error);
