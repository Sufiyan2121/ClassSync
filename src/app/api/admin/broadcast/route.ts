import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { buildWebpushPayload, pruneDeadTokens } from "@/lib/firebase/notificationUtils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, type = "ANNOUNCEMENT", dueDate, createdBy } = body;

    if (!title || !description || !createdBy) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Create the post in Firestore
    const postData: any = {
      title,
      description,
      type,
      createdBy,
      status: "ACTIVE",
      createdAt: FieldValue.serverTimestamp(),
    };

    if (dueDate) {
      postData.dueDate = new Date(dueDate);
    }

    const docRef = await adminDb.collection("posts").add(postData);

    // 2. Fetch all users who have FCM tokens
    let usersSnapshot = await adminDb
      .collection("users")
      .where("fcmTokens", "!=", [])
      .get();

    // Fallback if empty to catch any missed indexes
    if (usersSnapshot.empty) {
      usersSnapshot = await adminDb.collection("users").get();
    }

    const allTokens: string[] = [];
    usersSnapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      if (Array.isArray(data.fcmTokens) && data.remindersEnabled !== false) {
        allTokens.push(...data.fcmTokens);
      }
    });

    // Remove duplicates
    const uniqueTokens = [...new Set(allTokens)];

    // 3. Send Push Notifications via FCM
    let successCount = 0;
    let failureCount = 0;

    if (uniqueTokens.length > 0) {
      const formattedType = type ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() : "Announcement";
      const notifTitle = `New ${formattedType}: ${title}`;
      const notifBody = description.length > 120 ? description.substring(0, 117) + "..." : description;

      const origin = req.headers.get("origin") || req.nextUrl?.origin;
      const baseUrl = origin && !origin.includes("localhost")
        ? origin
        : (process.env.NEXT_PUBLIC_APP_URL || "https://classsync-kohl.vercel.app");

      const destinationUrl = `${baseUrl}/student`;
      const iconUrl = `${baseUrl}/icons/icon-192x192.png`;

      const payloadConfig = buildWebpushPayload({
        title: notifTitle,
        body: notifBody,
        url: destinationUrl,
        icon: iconUrl,
        data: {
          postId: String(docRef.id),
          type: String(type),
        },
      });

      const message = {
        ...payloadConfig,
        tokens: uniqueTokens,
      };

      // sendEachForMulticast can take up to 500 tokens at once
      const response = await adminMessaging.sendEachForMulticast(message);
      successCount = response.successCount;
      failureCount = response.failureCount;

      // Automatically clean up invalid/expired tokens so future broadcasts stay healthy
      await pruneDeadTokens(uniqueTokens, response);
    }

    return NextResponse.json({
      success: true,
      postId: docRef.id,
      notifications: {
        sent: successCount,
        failed: failureCount,
        totalTargeted: uniqueTokens.length,
      },
    });
  } catch (error: any) {
    console.error("Error broadcasting post:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

