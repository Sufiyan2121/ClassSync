# ClassSync 📚⚡

> **A Production-Grade, Offline-First Progressive Web App (PWA) for Classroom Management & Real-Time Sync.**

[![Next.js](https://img.shields.io/badge/Next.js-16%20(App%20Router)-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore%20%7C%20FCM-FFA611?logo=firebase)](https://firebase.google.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline%20%26%20Installable-emerald?logo=pwa)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 Table of Contents
1. [Overview](#-overview)
2. [Design System & Aesthetics](#-design-system--aesthetics)
3. [Key Features & Modules](#-key-features--modules)
4. [System Architecture](#-system-architecture)
5. [Directory Structure](#-directory-structure)
6. [Data Models & Firestore Schema](#-data-models--firestore-schema)
7. [Progressive Web App (PWA) & Offline Capabilities](#-progressive-web-app-pwa--offline-capabilities)
8. [API Routes & Cron Automation](#-api-routes--cron-automation)
9. [Getting Started & Installation](#-getting-started--installation)
10. [Environment Variables](#-environment-variables)
11. [Deployment & Production Build](#-deployment--production-build)

---

## 🌟 Overview

**ClassSync** bridges the communication divide between educators, class representatives, and students. Built with an offline-first mindset, it eliminates missed announcements, lost syllabus links, and cluttered group chats by providing a single source of truth for all classroom operations.

- **For Students:** Instant access to announcements, assignments, exams, timetables, syllabus notes, birthday alerts, and shared cloud drives.
- **For Admins / Teachers:** Fast broadcast composition with auto-expiring posts, class code management, student rosters, subject resource uploads, and push notification broadcasting.

---

## 🎨 Design System & Aesthetics

ClassSync implements a bespoke dual-theme design system crafted for legibility, high visual engagement, and low eye fatigue.

### 1. Brand Logo & Typography
- **Signature Squircle Logo:** An emerald-to-teal gradient (`#047857` ➔ `#059669` ➔ `#0d9488`) rounded rectangle housing a crisp white `BookOpen` icon.
- **Software Name Typography:** Consistently rendered site-wide with strict weight hierarchy:
  ```html
  <span class="font-black tracking-tight text-stone-900 dark:text-white">
    Class<span class="text-emerald-700 dark:text-emerald-400">Sync</span>
  </span>
  ```

### 2. Midnight Forest Dark Theme (Active Default)
Inspired by minimalist dark aesthetics, avoiding harsh grays in favor of deep biological greens:
- **Canvas / Root Background:** `#09130e`
- **Elevated Cards & Containers:** `#121c16` (primary glass panels)
- **Nested Controls & Form Inputs:** `#16231b` with `#243a2c` borders
- **Border Accents:** `#1e3025`
- **Primary Text:** `#ffffff` (crisp white)
- **Secondary & Caption Text:** `#a8a29e` (`stone-400`)
- **Accent Glow:** Emerald-teal radiance (`emerald-500/20` & `emerald-400/30`)

### 3. Forest Sage Light Theme
A soothing, earthy sage palette replacing generic clinical whites:
- **Canvas Background:** `#dfe8df`
- **Frosted Glass Cards:** `rgba(255, 255, 255, 0.88)` with `backdrop-filter: blur(24px)`
- **Border Accents:** `#e7e5e4` (`stone-200`)
- **Primary Text:** `#1c1917` (`stone-900`)

---

## 🚀 Key Features & Modules

### 1. Student Dashboard (`/student`)
- **Live Feed with Pulsing Status:** Real-time Firestore stream with visual activity indicators.
- **Category Filter Tabs:** Fast switching between *All Updates*, *Announcements*, *Assignments*, and *Exams* with dynamic item counts.
- **Interactive Calendar Widget:** Visual grid highlighting broadcast deadlines, exam days, and active assignment targets.
- **Class Switcher Chip:** Modal allowing students to enroll in new class codes, view classmates, and toggle active classroom contexts.

### 2. Admin & Teacher Dashboard (`/admin`)
- **Broadcast Composer:**
  - Responsive 3-button type selector (**Announcement**, **Assignment**, **Exam**) with dedicated icons (`Bell`, `FileText`, `AlertCircle`) and anti-overflow wrapping.
  - Due date / expiration picker: Posts automatically disappear once the target time is reached.
  - Live broadcast trigger with optimistic UI.
- **Live Student Panel Preview:** Mirrors exactly what enrolled students see in real-time.
- **Broadcast Action Suite:** In-line post editing, updates, and instantaneous deletion.

### 3. Class Code Management (`ClassCodeManager`)
- Generate unique alphanumeric class enrollment codes (e.g. `MCA-2026`).
- Real-time student roster view with member counts and profile tags.
- Copy-to-clipboard invite tools.

### 4. Timetable & Schedule (`/student/timetable` & `/admin/timetable`)
- Day-of-the-week segmented lecture schedules (Monday through Saturday).
- Subject name, classroom/hall number, instructor name, and time slots.
- Downloadable official timetable PDF viewer with full-screen preview.

### 5. Resources & Subject Hub (`/student/resources` & `/admin/resources`)
- **Subject Directory:** Quick left-sidebar navigation for core subjects.
- **Resource Categories:** Syllabus, Lecture Notes, Reference Links, Question Banks.
- **Direct Material Links:** Instant external links to Google Drive, PDFs, and official university portals.
- **Admin CRUD:** Rename subjects, remove dead links, and add new resource URLs.

### 6. Events & Shared Media (`/student/events` & `/admin/events`)
- Categorized event cards: Tech Symposiums, Cultural Fests, Sports, and Workshops.
- Direct integration with Google Drive folders for high-resolution class photos and videos.
- Dynamic search and category filters.

### 7. Birthdays & Celebrations (`/student/birthdays` & `/admin/birthdays`)
- **Today's Birthday Spotlight:** Celebratory hero card with festive confetti and student initials.
- **Tomorrow's Alert Banner:** Proactive heads-up for upcoming celebrations.
- **Month-by-Month Directory:** Complete searchable calendar of classmate birthdays.
- **Broadcast Alert Button:** Allows admins to trigger instant class-wide push notification celebration alerts.

### 8. Slide-over App Menu & User Profile (`AppMenu`)
- **User Profile Card:** Displays avatar initial, email, role badge (`STUDENT` / `ADMIN`), class, and gender.
- **Profile Editor:** Modal to update display name, phone number, gender, and profile photo while safely locking immutable core credentials.
- **Segmented Theme Toggle:** One-tap toggle between **Light**, **Dark**, and **Auto (System)**.
- **Quick Shortcuts:** Direct 1-tap navigation to Subjects, Timetable, Media, and Birthdays.
- **PWA Service Worker Status:** Live indicator displaying offline readiness.
- **Sign Out:** Secure session termination and redirect to login.

---

## 🏗 System Architecture

```mermaid
graph TD
    Client[Next.js PWA Client] --> |Google Auth| FirebaseAuth[Firebase Authentication]
    Client --> |Real-time WebSockets| Firestore[Cloud Firestore]
    Client --> |Push Subscriptions| FCM[Firebase Cloud Messaging]
    
    subgraph Client Architecture
        AuthProvider[AuthProvider Context]
        ThemeProvider[ThemeProvider Context]
        PWA[Service Worker & Workbox Cache]
    end

    subgraph Server & Automation
        VercelCron[Vercel Cron Trigger] --> |Daily at 08:00 AM| CronAPI[/api/cron/daily-notifications]
        AdminPanel[Admin Dashboard] --> |Manual Trigger| NotifyAPI[/api/admin/birthdays/notify]
        CronAPI --> FCMAdmin[Firebase Admin SDK]
        NotifyAPI --> FCMAdmin
        FCMAdmin --> |Web Push Notification| UserDevices[Student Mobile & Desktop Devices]
    end
```

---

## 📁 Directory Structure

```
ClassSync/
├── public/
│   ├── icons/
│   │   ├── apple-touch-icon.png         # iOS Safari Home Screen icon (180x180)
│   │   ├── icon-192x192.png             # Standard PWA icon
│   │   ├── icon-192x192.svg             # Emerald gradient vector
│   │   ├── icon-512x512.png             # Splash & High-Res PWA icon
│   │   ├── icon-512x512.svg             # Emerald vector master
│   │   ├── icon-maskable-512x512.png    # Android adaptive safe-zone icon
│   │   └── icon-maskable-512x512.svg    # Full-bleed adaptive vector
│   ├── firebase-messaging-sw.js         # Background push notification service worker
│   ├── manifest.json                    # Web App Manifest config
│   └── apple-touch-icon.png             # Root iOS fallback icon
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── join-class/page.tsx      # Classroom enrollment page
│   │   │   └── login/page.tsx           # Google OAuth login portal
│   │   ├── (dashboard)/
│   │   │   ├── admin/
│   │   │   │   ├── birthdays/page.tsx   # Admin birthday management & push triggers
│   │   │   │   ├── events/page.tsx      # Admin event drive manager
│   │   │   │   ├── resources/page.tsx   # Subject resource manager
│   │   │   │   ├── timetable/page.tsx   # Admin timetable schedule editor
│   │   │   │   └── page.tsx             # Primary admin dashboard & composer
│   │   │   └── student/
│   │   │       ├── birthdays/page.tsx   # Student birthday celebrations
│   │   │       ├── events/page.tsx      # Event list & photo drives
│   │   │       ├── resources/page.tsx   # Subject notes & syllabus
│   │   │       ├── timetable/page.tsx   # Student lecture schedule
│   │   │       └── page.tsx             # Primary student feed & calendar
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── birthdays/notify/    # Birthday broadcast endpoint
│   │   │   │   └── broadcast/           # Emergency broadcast push endpoint
│   │   │   └── cron/
│   │   │       └── daily-notifications/ # Daily morning digest cron
│   │   ├── globals.css                  # Tailwind CSS & theme tokens
│   │   ├── layout.tsx                   # Master root layout, fonts, & metadata
│   │   └── page.tsx                     # Smart redirect splash screen
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── AppMenu.tsx              # Slide-over navigation & settings drawer
│   │   │   ├── CalendarWidget.tsx       # Interactive monthly schedule calendar
│   │   │   ├── ClassCodeManager.tsx     # Admin classroom code & roster tool
│   │   │   ├── ComposerForm.tsx         # Post composition with anti-overflow buttons
│   │   │   ├── EditProfileModal.tsx     # User profile details editor
│   │   │   ├── NotificationBell.tsx     # Push permission trigger & status
│   │   │   ├── PostCard.tsx             # Urgency-colored broadcast feed cards
│   │   │   └── StudentClassSwitcher.tsx # Student classroom switcher modal
│   │   ├── providers/
│   │   │   ├── AuthProvider.tsx         # Firebase Auth Context & role management
│   │   │   ├── PWAInstallPrompt.tsx     # Floating PWA install banner
│   │   │   └── ThemeProvider.tsx        # Light/Dark/Auto theme manager
│   │   ├── resources/
│   │   │   ├── StudentResources.tsx     # Student material explorer
│   │   │   └── SubjectManager.tsx       # Admin subject & link manager
│   │   └── ui/
│   │       └── BrandLogo.tsx            # Unified emerald squircle logo & wordmark
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── adminApp.ts              # Firebase Admin SDK initialization
│   │   │   └── clientApp.ts             # Firebase Client SDK initialization
│   └── types/
│       └── index.ts                     # TypeScript definitions & schemas
```

---

## 🗄 Data Models & Firestore Schema

### 1. `users` Collection
```typescript
interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: "STUDENT" | "ADMIN";
  photoURL?: string;
  phoneNumber?: string;
  gender?: "Male" | "Female" | "Other";
  enrolledClassCode?: string;       // Active selected classroom
  enrolledClasses?: string[];       // Array of all enrolled class codes
  fcmTokens?: string[];             // Registered Web Push device tokens
  remindersEnabled?: boolean;
  createdAt: Timestamp;
}
```

### 2. `posts` Collection
```typescript
interface Post {
  id: string;
  title: string;
  description: string;
  type: "ANNOUNCEMENT" | "ASSIGNMENT" | "EXAM" | "RESOURCE";
  classCode: string;
  createdAt: Timestamp;
  createdBy: string;                // Admin UID
  dueDate?: Timestamp;              // Auto-expiration date
}
```

### 3. `classes` Collection
```typescript
interface ClassRoom {
  code: string;                     // e.g. "MCA-2026"
  name: string;                     // e.g. "Master of Computer Applications"
  department: string;
  adminUid: string;
  createdAt: Timestamp;
}
```

### 4. `subjects` & `materials` Collections
```typescript
interface Subject {
  id: string;
  name: string;
  classCode: string;
  createdAt: Timestamp;
}

interface Material {
  id: string;
  subjectId: string;
  title: string;
  category: "SYLLABUS" | "NOTES" | "REFERENCE" | "PAPERS";
  fileUrl: string;
  createdAt: Timestamp;
  createdBy: string;
}
```

---

## 📲 Progressive Web App (PWA) & Offline Capabilities

ClassSync is 100% compliant with Progressive Web App standards:
1. **Offline Service Worker:** Handled by `@ducanh2912/next-pwa` with automatic runtime caching of CSS, JS bundles, and static assets.
2. **Push Notifications:** Handled by `firebase-messaging-sw.js` with background click-through listeners redirecting to active class updates.
3. **Adaptive Maskable Icons:** Full-bleed SVG and PNG icons allow Android devices to mask the app icon into circles, squircles, or rounded squares with zero visual degradation.
4. **Custom Install Prompt:** Built-in floating banner (`PWAInstallPrompt`) detects if the user is in a browser and offers a 1-tap native install experience.

---

## 🤖 API Routes & Cron Automation

### 1. Daily Morning Digest
- **Route:** `GET /api/cron/daily-notifications`
- **Schedule:** Automated via Vercel Cron (Runs every morning at `08:00 AM UTC`).
- **Functionality:** Scans active classes, aggregates assignments due within 24 hours and today's student birthdays, and dispatches a concise web push notification to enrolled device tokens.

### 2. Instant Birthday Broadcast
- **Route:** `POST /api/admin/birthdays/notify`
- **Functionality:** Triggered by admins to send an immediate celebration notification:
  > *"🎂 ClassSync Birthday Alert: It's [Name]'s Birthday today! Send them your warmest wishes!"*

---

## 💻 Getting Started & Installation

### Prerequisites
- Node.js `18.18+` or `20+`
- npm, pnpm, or bun

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Sufiyan2121/ClassSync.git
cd ClassSync
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```
Fill in your Firebase credentials (see details below).

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔑 Environment Variables

The following environment variables are required in `.env.local`:

```env
# Firebase Client Configuration (From Firebase Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Web Push Notifications (From Firebase Cloud Messaging -> Web Push certificates)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_public_vapid_key

# Firebase Admin SDK (For Server-Side API Routes & Cron Jobs)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk...\n-----END PRIVATE KEY-----\n"

# Cron Security (Optional Secret for securing cron endpoints)
CRON_SECRET=your_secure_cron_secret
```

---

## 🚀 Deployment & Production Build

### 1. Production Build
Verify TypeScript typechecking and bundle optimizations:
```bash
npm run build
```

### 2. Start Production Server
```bash
npm run start
```

### 3. Deploying to Vercel
1. Push your repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Configure the environment variables in the Vercel Project Settings.
4. Set up `vercel.json` for cron job registration:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/daily-notifications",
         "schedule": "0 8 * * *"
       }
     ]
   }
   ```
5. Deploy! Vercel handles SSL, Edge caching, and automated cron execution.

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
