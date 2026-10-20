import { adminDb } from './admin';
import { FieldValue } from 'firebase-admin/firestore';
import { BatchResponse } from 'firebase-admin/messaging';

/**
 * Prunes dead, invalid, or expired FCM tokens from all users in Firestore.
 */
export async function pruneDeadTokens(tokens: string[], response: BatchResponse): Promise<number> {
  const badTokens: string[] = [];

  response.responses.forEach((res, idx) => {
    if (!res.success) {
      const code = res.error?.code;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        badTokens.push(tokens[idx]);
      }
    }
  });

  if (badTokens.length === 0) return 0;

  console.log(`[FCM] Pruning ${badTokens.length} dead/unregistered tokens from Firestore...`);

  let prunedCount = 0;
  for (const token of badTokens) {
    try {
      const snap = await adminDb
        .collection('users')
        .where('fcmTokens', 'array-contains', token)
        .get();

      if (!snap.empty) {
        const batch = adminDb.batch();
        snap.docs.forEach((d) => {
          batch.update(d.ref, {
            fcmTokens: FieldValue.arrayRemove(token),
          });
        });
        await batch.commit();
        prunedCount++;
      }
    } catch (err) {
      console.warn('[FCM] Error pruning token:', token, err);
    }
  }

  return prunedCount;
}

interface WebpushPayloadOptions {
  title: string;
  body: string;
  url: string;
  icon?: string;
  data?: Record<string, string>;
}

/**
 * Generates an FCM multicast payload formatted for WebPush, Android PWA, iOS PWA, and desktop browsers.
 */
export function buildWebpushPayload(options: WebpushPayloadOptions) {
  const {
    title,
    body,
    url,
    icon = 'https://classsync-kohl.vercel.app/icons/icon-192x192.png',
    data = {},
  } = options;

  return {
    notification: {
      title,
      body,
    },
    data: {
      title,
      body,
      url,
      ...data,
    },
    webpush: {
      headers: {
        Urgency: 'high',
      },
      notification: {
        title,
        body,
        icon,
        badge: icon,
        vibrate: [200, 100, 200],
        requireInteraction: false,
        actions: [
          { action: 'open_app', title: 'Open App' },
        ],
        data: {
          url,
          ...data,
        },
      },
      fcmOptions: {
        link: url,
      },
    },
  };
}
