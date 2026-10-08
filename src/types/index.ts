import { Timestamp } from "firebase/firestore";

export type UserRole = "ADMIN" | "STUDENT";

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  fcmTokens: string[];
  remindersEnabled?: boolean;
  createdAt: Timestamp;
  lastActive?: Timestamp;
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
