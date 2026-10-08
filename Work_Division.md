# ClassSync - Division of Labor (Human vs. AI)

This document outlines the clear division of responsibilities between you (the Human) and me (the AI Coding Agent) to effectively build the ClassSync project according to the Master Blueprint.

## 🧑‍💻 Your Responsibilities (The Human)
As an AI, I do not have access to your personal Google accounts, billing information, or UI testing across your physical devices. You will act as the **Project Manager, DevOps Lead, and QA Tester**.

1. **Firebase Console Configuration:**
   - Create the Firebase Project.
   - Enable Google Sign-In in Firebase Authentication.
   - Initialize the Firestore Database.
   - Generate Web Push Certificates (VAPID key) in Firebase Cloud Messaging (FCM).
   - Generate a Firebase Admin Service Account JSON for server-side auth.

2. **Environment Variables Setup:**
   - Retrieve all Firebase API keys and VAPID keys.
   - Provide these keys to me or paste them directly into the `.env.local` file when instructed.

3. **Vercel Deployment & Infrastructure:**
   - Connect the GitHub repository to Vercel.
   - Paste the production environment variables into the Vercel dashboard.
   - Ensure the Vercel Cron Job settings are activated in the dashboard.

4. **Testing & QA:**
   - Test the PWA installation on your actual mobile devices (iOS/Android).
   - Verify that push notifications are successfully received on your device.
   - Provide feedback on the UI/UX design (colors, spacing, layout).

---

## 🤖 My Responsibilities (The AI Agent)
I will act as your **Senior Full-Stack Developer**. I will write the code, configure the architecture, and troubleshoot errors.

1. **Project Initialization:**
   - Run the exact Next.js setup commands, install all dependencies (`next-pwa`, `firebase`, `date-fns`, etc.), and structure the folders exactly as the Blueprint demands.

2. **Frontend Development (Next.js & Tailwind):**
   - Build all UI components (Cards, Modals, Forms, Navigation).
   - Implement the responsive layouts for Mobile and Desktop.
   - Create the Admin Dashboard and Student Dashboard views.

3. **Backend & Firebase Integration:**
   - Implement the Firebase Client initialization (`clientApp.ts`).
   - Build the React Context for Authentication (`AuthProvider.tsx`) and route protection (`AdminRoute.tsx`).
   - Write all Firestore read/write logic for Users, Posts, and Read Receipts.
   - Apply the strict Firestore Security Rules to lock down the database.

4. **PWA & Notification Engine:**
   - Configure the `next.config.ts` for PWA capabilities and offline caching.
   - Write the Service Worker (`firebase-messaging-sw.js`) for background push notifications.
   - Develop the Vercel Cron Job API route (`/api/cron/daily-notifications/route.ts`) to automate due-date notifications.

5. **Debugging & Refactoring:**
   - Fix any build errors, dependency conflicts, or styling issues that arise during development.

---

## 🚀 How We Work Together
1. **You** handle the third-party platforms (Firebase/Vercel) and give me the green light (or the keys).
2. **I** write the code and set up the files.
3. **You** test it and tell me what needs adjusting.
4. We iterate until the project is 100% production-ready.
