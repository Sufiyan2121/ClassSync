import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminMessaging } from '@/lib/firebase/admin';
import { buildWebpushPayload, pruneDeadTokens } from '@/lib/firebase/notificationUtils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { birthdayId, mode } = body; // mode: "TODAY" | "TOMORROW" | "ALL"

    const now = new Date();
    const todayMonth = now.getMonth() + 1;
    const todayDay = now.getDate();

    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowMonth = tomorrow.getMonth() + 1;
    const tomorrowDay = tomorrow.getDate();

    // 1. Fetch birthdays
    let birthdaysList: any[] = [];
    if (birthdayId) {
      const bSnap = await adminDb.collection('birthdays').doc(birthdayId).get();
      if (bSnap.exists) {
        birthdaysList = [{ id: bSnap.id, ...bSnap.data() }];
      }
    } else {
      const snap = await adminDb.collection('birthdays').get();
      snap.forEach((d: any) => {
        birthdaysList.push({ id: d.id, ...d.data() });
      });
    }

    if (birthdaysList.length === 0) {
      return NextResponse.json({ message: "No birthdays found." });
    }

    // Filter relevant birthdays
    let todaysBirthdays: any[] = [];
    let tomorrowsBirthdays: any[] = [];

    if (birthdayId) {
      // If triggered for a specific record
      if (mode === "TOMORROW") {
        tomorrowsBirthdays = birthdaysList;
      } else {
        todaysBirthdays = birthdaysList;
      }
    } else {
      todaysBirthdays = birthdaysList.filter(
        (b) => b.month === todayMonth && b.day === todayDay
      );
      tomorrowsBirthdays = birthdaysList.filter(
        (b) => b.month === tomorrowMonth && b.day === tomorrowDay
      );
    }

    // 2. Fetch users and their tokens
    const usersSnap = await adminDb.collection('users').get();
    const userTokensMap: { [classCode: string]: string[] } = {};
    const allTokens: string[] = [];

    usersSnap.forEach((d: any) => {
      const u = d.data();
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

    const uniqueAllTokens = [...new Set(allTokens)];
    let sentCount = 0;
    let failedCount = 0;

    const origin = req.headers.get("origin") || req.nextUrl?.origin;
    const baseUrl = origin && !origin.includes("localhost")
      ? origin
      : (process.env.NEXT_PUBLIC_APP_URL || "https://classsync-kohl.vercel.app");

    const birthdayUrl = `${baseUrl}/student/birthdays`;
    const iconUrl = `${baseUrl}/icons/icon-192x192.png`;

    // 3. Send notifications for TODAY's birthdays
    for (const b of todaysBirthdays) {
      const targetTokens = (b.classCode && b.classCode !== "ALL" && userTokensMap[b.classCode.toUpperCase()])
        ? [...new Set(userTokensMap[b.classCode.toUpperCase()])]
        : uniqueAllTokens;

      if (targetTokens.length > 0) {
        const payloadConfig = buildWebpushPayload({
          title: `🎉 It's ${b.name}'s Birthday Today!`,
          body: `Today is ${b.name}'s special day! Join everyone in wishing them a wonderful Happy Birthday! 🎂🥳`,
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
        sentCount += res.successCount;
        failedCount += res.failureCount;

        await pruneDeadTokens(targetTokens, res);
      }
    }

    // 4. Send notifications for TOMORROW's birthdays (one day prior)
    for (const b of tomorrowsBirthdays) {
      const targetTokens = (b.classCode && b.classCode !== "ALL" && userTokensMap[b.classCode.toUpperCase()])
        ? [...new Set(userTokensMap[b.classCode.toUpperCase()])]
        : uniqueAllTokens;

      if (targetTokens.length > 0) {
        const payloadConfig = buildWebpushPayload({
          title: `🎂 Birthday Tomorrow!`,
          body: `It's ${b.name}'s birthday tomorrow! Don't forget to wish them a Happy Birthday! 🎈🎁`,
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
        sentCount += res.successCount;
        failedCount += res.failureCount;

        await pruneDeadTokens(targetTokens, res);
      }
    }

    return NextResponse.json({
      success: true,
      todaysCount: todaysBirthdays.length,
      tomorrowsCount: tomorrowsBirthdays.length,
      notificationsSent: sentCount,
      notificationsFailed: failedCount,
      totalDevicesTargeted: uniqueAllTokens.length,
    });
  } catch (error: any) {
    console.error("Error sending birthday notification:", error);
    return NextResponse.json(
      { error: "Failed to broadcast birthday notifications", details: error.message },
      { status: 500 }
    );
  }
}

