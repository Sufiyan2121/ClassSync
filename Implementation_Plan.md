# ClassSync - Implementation Plan

This document breaks down the development of ClassSync into actionable, sequential phases. In each phase, the responsibilities are clearly divided between you (**🧑‍💻 Human**) and me (**🤖 AI**). We will complete this project one phase at a time.

---

## Phase 1: Project Initialization & Architecture Setup
**Goal:** Have a running Next.js application with all dependencies and environment variables ready.

- **🧑‍💻 Human (You):**
  1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
  2. Register a web app and copy the Firebase configuration keys (`apiKey`, `authDomain`, `projectId`, etc.).
  3. Create a `.env.local` file in the project root and add the keys (or share them with me to add).
- **🤖 AI (Me):**
  1. Run the `pnpm create next-app` command with the exact flags from the Blueprint.
  2. Install all required dependencies (`firebase`, `@ducanh2912/next-pwa`, `date-fns`, `lucide-react`, `zod`, etc.).
  3. Set up the exact strict folder structure specified in the Blueprint.

---

## Phase 2: Firebase Auth & Database Configuration
**Goal:** Users can log in via Google, and the strict Firestore database structure is secure.

- **🧑‍💻 Human:**
  1. In the Firebase Console, go to **Authentication** -> **Sign-in method** and enable **Google**.
  2. Go to **Firestore Database**, create a database (in Production mode).
  3. Copy the Security Rules from the Blueprint (`Phase 2.3`) and paste them into the Firestore Rules tab in the console.
- **🤖 AI:**
  1. Create the Firebase client initialization file (`src/lib/firebase/clientApp.ts`).
  2. Implement the `AuthProvider.tsx` (React Context) for global state management and login logic.
  3. Create the `AdminRoute.tsx` Higher-Order Component to protect admin-only dashboard routes.

---

## Phase 3: Core UI & Dashboard Development
**Goal:** Build out the frontend interfaces for both Students and Admins.

- **🤖 AI:**
  1. **Admin Dashboard:** Build the `ComposerForm` to allow admins to post Assignments, Exams, Announcements, and Resources.
  2. **Student Dashboard:** Build the `UrgencyList`, `CategoryTabs`, and `PostCard` components to display data beautifully.
  3. Write the custom hooks (`usePosts.ts`, `useUser.ts`) to fetch real-time data from Firestore.
- **🧑‍💻 Human:**
  1. Review the UI locally on your browser.
  2. Provide feedback on aesthetics, padding, and layout so I can refine it.

---

## Phase 4: PWA Transformation & Offline Mode
**Goal:** Turn the web app into an installable Progressive Web App (PWA).

- **🤖 AI:**
  1. Update `next.config.ts` to configure `@ducanh2912/next-pwa`.
  2. Set up `manifest.json` and ensure all required icons are mapped correctly in the `public` folder.
- **🧑‍💻 Human:**
  1. Provide the necessary app icons (192x192 and 512x512) for the `public/icons` folder.
  2. Test the "Install App" prompt locally or on a mobile device (via local network).

---

## Phase 5: Notification Engine & Vercel Automation
**Goal:** Enable push notifications and set up the automated daily cron jobs.

- **🧑‍💻 Human:**
  1. In Firebase Console, go to **Project Settings -> Cloud Messaging** and generate a Web Push certificate (VAPID key).
  2. Go to **Project Settings -> Service Accounts** and generate a new private key (Admin SDK JSON).
  3. Add these new credentials to our environment variables.
- **🤖 AI:**
  1. Write the Service Worker (`public/firebase-messaging-sw.js`) to handle background push notifications.
  2. Set up the Vercel cron configuration (`vercel.json`).
  3. Develop the API route (`/api/cron/daily-notifications/route.ts`) to calculate due dates and dispatch notifications.

---

## Phase 6: Deployment & Final QA
**Goal:** Deploy ClassSync to production for real-world usage.

- **🧑‍💻 Human:**
  1. Push the final codebase to GitHub.
  2. Connect the repository to [Vercel](https://vercel.com/) and import the project.
  3. Add all production environment variables to the Vercel dashboard.
  4. Ensure Vercel Cron Jobs are active in the deployment settings.
  5. Do a final test on your physical mobile phone (iOS/Android) to verify PWA installation and Push Notifications.
- **🤖 AI:**
  1. Fix any final build errors or deployment bugs that Vercel might throw.
  2. Polish any remaining UI imperfections.
