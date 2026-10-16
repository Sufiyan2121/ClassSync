import { Timestamp } from "firebase/firestore";

export type UserRole = "ADMIN" | "STUDENT";

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  fcmTokens: string[];
  remindersEnabled?: boolean;
  enrolledClassCode?: string;
  enrolledClasses?: string[];
  createdAt: Timestamp;
  lastActive?: Timestamp;
}

export interface ClassConfig {
  classCode: string;
  className: string;
  updatedAt?: Timestamp;
  updatedBy?: string;
}

export interface ClassItem {
  code: string;
  name: string;
  createdAt?: Timestamp;
  createdBy?: string;
}

export type PostType = "ASSIGNMENT" | "EXAM" | "ANNOUNCEMENT" | "RESOURCE";
export type PostStatus = "ACTIVE" | "ARCHIVED";

export interface Post {
  id: string; // The Firestore document ID
  title: string;
  description: string;
  type: PostType;
  dueDate: Timestamp | null;
  createdAt: Timestamp;
  createdBy: string;
  status: PostStatus;
}

export interface Subject {
  id: string;
  name: string;
  createdAt: Timestamp;
  createdBy: string;
}

export type MaterialCategory = "SYLLABUS" | "PRACTICAL" | "NOTES" | "PDF" | "OTHER";

export interface Material {
  id: string;
  subjectId: string;
  title: string;
  category: MaterialCategory;
  fileUrl: string;
  fileName: string;
  createdAt: Timestamp;
  createdBy: string;
}

export interface Timetable {
  id: string;
  title: string;
  imageUrl: string;
  createdAt: Timestamp;
  createdBy: string;
}

export interface Birthday {
  id: string; // The Firestore document ID
  name: string; // Student or person name
  birthDate: string; // "YYYY-MM-DD" format
  month: number; // 1 to 12
  day: number; // 1 to 31
  year?: number; // Optional birth year
  classCode?: string; // Class code e.g. "MCA2026" or "ALL"
  rollNo?: string; // Optional roll or PRN number
  notes?: string; // Optional note or message
  createdAt?: Timestamp;
  createdBy?: string;
}

export type EventMediaCategory = 
  | "ALL"
  | "FEST" 
  | "FUNCTION" 
  | "SPORTS" 
  | "FAREWELL" 
  | "SEMINAR" 
  | "TRIP" 
  | "CELEBRATION" 
  | "OTHER";

export interface EventMedia {
  id: string;
  title: string;
  description?: string;
  driveUrl: string; // Google Drive folder or file link
  eventDate?: string; // "YYYY-MM-DD" or text
  category: EventMediaCategory;
  classCode: string; // "ALL" or specific class e.g. "MCA2026"
  isMasterDrive?: boolean; // Pinned master drive for all class events
  coverImageUrl?: string;
  createdAt?: Timestamp;
  createdBy?: string;
}


