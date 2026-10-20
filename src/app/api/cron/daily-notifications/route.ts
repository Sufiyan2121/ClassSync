import { NextResponse } from 'next/server';
import { adminDb, adminMessaging } from '@/lib/firebase/admin';
import { differenceInDays } from 'date-fns';
import { buildWebpushPayload, pruneDeadTokens } from '@/lib/firebase/notificationUtils';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  // Allow execution if CRON_SECRET matches, or in development / manual admin call
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();

    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowMonth = tomorrow.getMonth() + 1;
    const tomorrowDay = tomorrow.getDate();

    // 1. Fetch active assignments / exams
    const postsSnapshot = await adminDb.collection('posts')
      .where('status', '==', 'ACTIVE')
      .where('type', 'in', ['ASSIGNMENT', 'EXAM'])
      .get();

    let urgentPostsCount = 0;
    postsSnapshot.forEach((doc: any) => {
      const data = doc.data();
      if (!data.dueDate) return;
      
      const dueDate = data.dueDate.toDate();
      const daysLeft = differenceInDays(dueDate, today);
      
      if (daysLeft === 1 || daysLeft === 3 || daysLeft === 7) {
        urgentPostsCount++;
      }
    });

    // 2. Fetch Birthdays for Today and Tomorrow (1 day prior)
    const birthdaysSnapshot = await adminDb.collection('birthdays').get();
    const todaysBirthdays: any[] = [];
    const tomorrowsBirthdays: any[] = [];

    birthdaysSnapshot.forEach((doc: any) => {
      const b = { id: doc.id, ...doc.data() };
      if (b.month === todayMonth && b.day === todayDay) {
        todaysBirthdays.push(b);
      } else if (b.month === tomorrowMonth && b.day === tomorrowDay) {
        tomorrowsBirthdays.push(b);
      }
    });

    // 3. Get all students who have reminders enabled
    const studentsSnapshot = await adminDb.collection('users')
      .where('role', '==', 'STUDENT')
      .get();

    const allTokens: string[] = [];
    const userTokensMap: { [classCode: string]: string[] } = {};

    studentsSnapshot.forEach((doc: any) => {
      const u = doc.data();
      if (u.remindersEnabled === false) return;
      const tokens = Array.isArray(u.fcmTokens) ? u.fcmTokens : [];
      if (tokens.length === 0) return;

      allTokens.push(...tokens);

      const enrolledCodes: string[] = [
        ...(u.enrolledClassCode ? [u.enrolledClassCode.toUpperCase()] : []),
        ...(Array.isArray(u.enrolledClasses) ? u.enrolledClasses.map((c: string) => c.toUpperCase()) : [])
      ];

      enrolledCodes.forEach((code) => {
        if (!userTokensMap[code]) userTokensMap[code] = [];
        userTokensMap[code].push(...tokens);
      });
    });

    const uniqueTokens = [...new Set(allTokens)];

    let totalNotificationsSent = 0;
    let totalNotificationsFailed = 0;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://classsync-kohl.vercel.app";
    const studentUrl = `${baseUrl}/student`;
    const birthdayUrl = `${baseUrl}/student/birthdays`;
    const iconUrl = `${baseUrl}/icons/icon-192x192.png`;

    // 4. Send Urgent Posts Digest (if any)
    if (urgentPostsCount > 0 && uniqueTokens.length > 0) {
      const payloadConfig = buildWebpushPayload({
        title: "ClassSync Daily Digest",
        body: `You have ${urgentPostsCount} urgent task(s) approaching deadlines! Log in to check.`,
        url: studentUrl,
        icon: iconUrl,
        data: {
          type: "DIGEST",
        },
      });

      const message = {
        ...payloadConfig,
        tokens: uniqueTokens,
      };

      const response = await adminMessaging.sendEachForMulticast(message);
      totalNotificationsSent += response.successCount;
      totalNotificationsFailed += response.failureCount;

      await pruneDeadTokens(uniqueTokens, response);
    }

    // 5. Send Today's Birthday Notifications: "its ______ birthday today"
    for (const b of todaysBirthdays) {
      const targetTokens = (b.classCode && b.classCode !== "ALL" && userTokensMap[b.classCode.toUpperCase()])
        ? [...new Set(userTokensMap[b.classCode.toUpperCase()])]
        : uniqueTokens;

      if (targetTokens.length > 0) {
        const payloadConfig = buildWebpushPayload({
          title: `🎉 It's ${b.name}'s Birthday Today!`,
          body: `Today is ${b.name}'s birthday! Wish them a very Happy Birthday! 🎂🥳`,
          url: birthdayUrl,
          icon: iconUrl,
          data: {
            type: "BIRTHDAY_TODAY",
            birthdayId: String(b.id),
          },
        });

        const message = {
          ...payloadConfig,
          tokens: targetTokens,
        };

        const res = await adminMessaging.sendEachForMulticast(message);
        totalNotificationsSent += res.successCount;
        totalNotificationsFailed += res.failureCount;

        await pruneDeadTokens(targetTokens, res);
      }
    }

    // 6. Send Tomorrow's Birthday Notifications (1 day prior): "its xxx birthday tomorrow"
    for (const b of tomorrowsBirthdays) {
      const targetTokens = (b.classCode && b.classCode !== "ALL" && userTokensMap[b.classCode.toUpperCase()])
        ? [...new Set(userTokensMap[b.classCode.toUpperCase()])]
        : uniqueTokens;

      if (targetTokens.length > 0) {
        const payloadConfig = buildWebpushPayload({
          title: `🎂 Birthday Tomorrow!`,
          body: `It's ${b.name}'s birthday tomorrow! Don't forget to wish them! 🎈🎁`,
          url: birthdayUrl,
          icon: iconUrl,
          data: {
            type: "BIRTHDAY_TOMORROW",
            birthdayId: String(b.id),
          },
        });

        const message = {
          ...payloadConfig,
          tokens: targetTokens,
        };

        const res = await adminMessaging.sendEachForMulticast(message);
        totalNotificationsSent += res.successCount;
        totalNotificationsFailed += res.failureCount;

        await pruneDeadTokens(targetTokens, res);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      sentCount: totalNotificationsSent,
      failedCount: totalNotificationsFailed,
      urgentPostsCount,
      todaysBirthdaysCount: todaysBirthdays.length,
      tomorrowsBirthdaysCount: tomorrowsBirthdays.length,
    });
    
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

