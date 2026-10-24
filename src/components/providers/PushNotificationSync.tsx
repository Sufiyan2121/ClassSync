"use client";

import { useEffect, useRef } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging, db } from "@/lib/firebase/clientApp";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import toast from "react-hot-toast";

export function PushNotificationSync() {
  const { user, userData } = useAuth();
  const isListenerAttached = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Build dynamic config query parameters for service worker
    const swParams = new URLSearchParams({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    });

    const swUrl = `/firebase-messaging-sw.js?${swParams.toString()}`;

    // Register service worker
    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => {
        reg.update().catch(() => {});
      })
      .catch((err) => {
        console.warn("[FCM] ServiceWorker registration failed:", err);
      });

    // Attach global foreground message listener once
    if (!isListenerAttached.current) {
      messaging().then((msg) => {
        if (msg) {
          isListenerAttached.current = true;
          onMessage(msg, (payload) => {
            console.log("[FCM Foreground Notification Received]:", payload);
            const title =
              payload.notification?.title ||
              payload.data?.title ||
              "New Announcement";
            const body =
              payload.notification?.body ||
              payload.data?.body ||
              "";
            const targetUrl =
              payload.data?.url ||
              payload.fcmOptions?.link ||
              "/student";

            toast(
              (t) => (
                <div
                  className="flex items-start gap-3 cursor-pointer py-1 select-none"
                  onClick={() => {
                    toast.dismiss(t.id);
                    if (targetUrl) {
                      window.location.href = targetUrl;
                    }
                  }}
                >
                  <span className="text-2xl shrink-0 mt-0.5">🔔</span>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-bold text-sm text-stone-900 dark:text-white leading-snug">
                      {title}
                    </p>
                    {body && (
                      <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 mt-1">
                        {body}
                      </p>
                    )}
                    <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Tap to open →
                    </span>
                  </div>
                </div>
              ),
              {
                duration: 8000,
                position: "top-center",
                style: {
                  borderRadius: "1rem",
                  background: "#121c16",
                  color: "#fff",
                  border: "1px solid #1e3025",
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.4)",
                  padding: "0.75rem 1rem",
                  maxWidth: "420px",
                },
              }
            );
          });
        }
      });
    }
  }, []);

  // Sync token whenever user or permission state changes
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !user ||
      Notification.permission !== "granted" ||
      userData?.remindersEnabled === false
    ) {
      return;
    }

    let isMounted = true;

    const syncToken = async () => {
      try {
        const msg = await messaging();
        if (!msg) return;

        const reg = await navigator.serviceWorker.ready;
        const currentToken = await getToken(msg, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: reg,
        });

        if (currentToken && isMounted) {
          const existingTokens = Array.isArray(userData?.fcmTokens) ? userData.fcmTokens : [];
          if (!existingTokens.includes(currentToken)) {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
              fcmTokens: arrayUnion(currentToken),
              remindersEnabled: true,
            });
            console.log("[FCM] Registered fresh token for user", user.uid);
          }
        }
      } catch (err) {
        console.warn("[FCM] Token sync warning:", err);
      }
    };

    const timer = setTimeout(syncToken, 1200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [user, userData?.remindersEnabled, userData?.fcmTokens]);

  return null;
}
