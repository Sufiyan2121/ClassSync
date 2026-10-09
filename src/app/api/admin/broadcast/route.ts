import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, type, dueDate, createdBy } = body;

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
    const usersSnapshot = await adminDb
      .collection("users")
      .where("fcmTokens", "!=", [])
      .get();

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
      const message = {
        notification: {
          title: `New ${type.toLowerCase()}: ${title}`,
          body: description.length > 100 ? description.substring(0, 97) + "..." : description,
        },
        data: {
          postId: docRef.id,
          url: "/", // When clicked, it opens the app
        },
        tokens: uniqueTokens,
      };

      // sendEachForMulticast can take up to 500 tokens at once
      const response = await adminMessaging.sendEachForMulticast(message);
      successCount = response.successCount;
      failureCount = response.failureCount;

      // Optional: clean up invalid/expired tokens based on response.responses
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
