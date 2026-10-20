/**
 * Live App Context Builder for ClassSync AI
 * Injects verified real-time class data (timetable, deadlines, syllabus, birthdays)
 * into the AI's system instruction so it provides 100% accurate, personalized academic answers.
 */

import { Post, Birthday, Subject, Material, Timetable, UserData } from "@/types";

export interface AppContextData {
  user?: UserData | null;
  className?: string;
  classCode?: string;
  posts: Post[];
  birthdays: Birthday[];
  subjects: Subject[];
  materials: Material[];
  timetables: Timetable[];
}

export function buildSystemInstruction(data: AppContextData): string {
  const now = new Date();
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const currentDayName = daysOfWeek[now.getDay()];
  const currentMonthName = months[now.getMonth()];
  const currentDateFormatted = `${currentDayName}, ${currentMonthName} ${now.getDate()}, ${now.getFullYear()} at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const studentName = data.user?.displayName || "Student";
  const studentEmail = data.user?.email || "";
  const studentRole = data.user?.role || "STUDENT";
  const classCode = data.classCode || data.user?.enrolledClassCode || "General";
  const className = data.className || classCode;

  // 1. Format Posts (Assignments, Exams, Announcements)
  const activePosts = data.posts.slice(0, 15);
  const assignments = activePosts.filter(p => p.type === "ASSIGNMENT");
  const exams = activePosts.filter(p => p.type === "EXAM");
  const announcements = activePosts.filter(p => p.type === "ANNOUNCEMENT");

  const formatPostLine = (p: Post) => {
    let dueStr = "No deadline specified";
    if (p.dueDate) {
      try {
        const d = p.dueDate.toDate();
        dueStr = `${daysOfWeek[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } catch {
        dueStr = "Specified in post";
      }
    }
    return `- [${p.type}] "${p.title}": ${p.description || "No description"} (Due: ${dueStr})`;
  };

  const assignmentsBlock = assignments.length > 0 
    ? assignments.map(formatPostLine).join("\n")
    : "No pending assignments currently posted.";

  const examsBlock = exams.length > 0 
    ? exams.map(formatPostLine).join("\n")
    : "No upcoming exams currently posted.";

  const announcementsBlock = announcements.length > 0 
    ? announcements.map(formatPostLine).join("\n")
    : "No recent announcements.";

  // 2. Format Subjects & Materials
  const subjectsBlock = data.subjects.length > 0
    ? data.subjects.map(s => {
        const mats = data.materials.filter(m => m.subjectId === s.id);
        const matTitles = mats.map(m => m.fileName || m.title).join(", ");
        return `- ${s.name} ${matTitles ? `(Available materials: ${matTitles})` : ""}`;
      }).join("\n")
    : "No subjects registered yet.";

  // 3. Format Timetable
  const timetableBlock = data.timetables.length > 0
    ? data.timetables.map(t => `- ${t.title}`).join("\n")
    : "No timetable schedules uploaded yet.";

  // 4. Format Upcoming Birthdays
  const birthdaysBlock = data.birthdays.length > 0
    ? data.birthdays.slice(0, 10).map(b => {
        const bMonthName = months[(b.month || 1) - 1];
        let diffText = "";
        const target = new Date(now.getFullYear(), b.month - 1, b.day);
        if (target < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
          target.setFullYear(now.getFullYear() + 1);
        }
        const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) diffText = "Today! 🎉";
        else if (diffDays === 1) diffText = "Tomorrow! 🎈";
        else diffText = `in ${diffDays} days`;

        return `- ${b.name}: ${bMonthName} ${b.day} (${diffText})${b.rollNo ? ` [Roll: ${b.rollNo}]` : ""}`;
      }).join("\n")
    : "No upcoming birthdays recorded.";

  return `You are ClassSync AI, the intelligent, encouraging, and highly capable academic AI companion for "${className}" (Class Code: ${classCode}).
You are built into ClassSync, a progressive web application designed for students and educators.

=== LIVE REAL-TIME APP CONTEXT ===
- CURRENT TIME: ${currentDateFormatted}
- CURRENT USER: ${studentName} (${studentRole}, ${studentEmail})
- CURRENT CLASS: ${className} [Code: ${classCode}]

=== CLASS DEADLINES & ASSIGNMENTS ===
${assignmentsBlock}

=== UPCOMING EXAMS & TESTS ===
${examsBlock}

=== IMPORTANT ANNOUNCEMENTS ===
${announcementsBlock}

=== REGISTERED SUBJECTS & STUDY RESOURCES ===
${subjectsBlock}

=== TIMETABLE & LECTURE SCHEDULES ===
${timetableBlock}

=== CLASS BIRTHDAYS ===
${birthdaysBlock}

=== CONVERSATION STYLE & GUIDELINES ===
1. TALK LIKE A REAL HUMAN: You are an intelligent, supportive, and friendly university peer and tutor for ${className}. Speak naturally, warmly, and conversationally. Avoid sounding like a corporate chatbot, robot, or bureaucrat.
2. CASUAL GREETINGS ('Hi', 'Hello', 'Hey', etc.):
   - Keep your response warm, friendly, and natural in just 1 to 2 sentences (e.g., "Hey ${studentName}! Great to see you. How's your day going? Need a hand with today's lectures or any assignments?").
   - NEVER dump long lists, unprompted announcements, or feature menus on a simple hello! Wait for the student to ask.
3. CONCISE & CONTEXT-AWARE: Only bring up timetables, assignments, or announcements when the student asks for them or when directly relevant to their question.
4. ACCURACY: When asked about class dates, timetables, homework, exams, or birthdays, rely strictly on the verified context above.
5. FORMATTING: Use Markdown naturally—bold important terms, use bullet points for lists, and code blocks for programming code, but keep the flow easy to read on mobile.
6. ZERO INTERNAL SCRATCHPADS: NEVER output internal planning notes, thinking steps, prompt checklists, or lines like "* User says: ...". Speak directly to ${studentName}.`;
}
