import { NextResponse } from 'next/server';
import { adminDb, adminMessaging } from '@/lib/firebase/adminApp';
import { differenceInDays } from 'date-fns';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const today = new Date();
    const postsSnapshot = await adminDb.collection('posts')
      .where('status', '==', 'ACTIVE')
      .where('type', 'in', ['ASSIGNMENT', 'EXAM'])
      .get();

    let urgentPostsCount = 0;
    
    // We can't easily filter by date in Firestore without composite indexes for every combination,
    // so we fetch all active assignments/exams and filter them by date in memory.
    postsSnapshot.forEach((doc: any) => {
      const data = doc.data();
      if (!data.dueDate) return;
      
      const dueDate = data.dueDate.toDate();
      const daysLeft = differenceInDays(dueDate, today);
      
      if (daysLeft === 1 || daysLeft === 3 || daysLeft === 7) {
        urgentPostsCount++;
      }
    });

    if (urgentPostsCount === 0) {
      return NextResponse.json({ message: "No urgent posts found today." });
    }

    // Get all students who have reminders enabled
    const studentsSnapshot = await adminDb.collection('users')
      .where('role', '==', 'STUDENT')
      .where('remindersEnabled', '==', true)
      .get();

    const allTokens: string[] = [];
    studentsSnapshot.forEach((doc: any) => {
      const tokens = doc.data().fcmTokens || [];
      allTokens.push(...tokens);
    });

    if (allTokens.length === 0) {
      return NextResponse.json({ message: "No students have tokens or reminders enabled." });
    }

    const message = {
      notification: { 
        title: "ClassSync Daily Digest", 
        body: `You have ${urgentPostsCount} urgent task(s) approaching deadlines! Log in to check.` 
      },
      data: { url: "/student" },
      tokens: allTokens,
    };

    const response = await adminMessaging.sendEachForMulticast(message);
    
    return NextResponse.json({ 
      success: true, 
      sentCount: response.successCount,
      failedCount: response.failureCount,
      urgentPostsCount
    });
    
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
