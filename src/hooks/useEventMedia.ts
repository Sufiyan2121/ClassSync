"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy 
} from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { EventMedia, EventMediaCategory } from "@/types";
import { useAuth } from "@/components/providers/AuthProvider";

export function useEventMedia() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Order by createdAt descending
    const q = query(collection(db, "event_media"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: EventMedia[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as EventMedia);
        });

        setEvents(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching event media:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addEventMedia = async (data: {
    title: string;
    driveUrl: string;
    description?: string;
    eventDate?: string;
    category?: EventMediaCategory;
    classCode?: string;
    isMasterDrive?: boolean;
    coverImageUrl?: string;
  }) => {
    let cleanUrl = data.driveUrl.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }

    const docRef = await addDoc(collection(db, "event_media"), {
      title: data.title.trim(),
      driveUrl: cleanUrl,
      description: data.description ? data.description.trim() : "",
      eventDate: data.eventDate || "",
      category: data.category || "FUNCTION",
      classCode: data.classCode ? data.classCode.trim().toUpperCase() : "ALL",
      isMasterDrive: !!data.isMasterDrive,
      coverImageUrl: data.coverImageUrl ? data.coverImageUrl.trim() : "",
      createdAt: serverTimestamp(),
      createdBy: user?.uid || null,
    });

    return docRef.id;
  };

  const updateEventMedia = async (
    id: string,
    data: {
      title: string;
      driveUrl: string;
      description?: string;
      eventDate?: string;
      category?: EventMediaCategory;
      classCode?: string;
      isMasterDrive?: boolean;
      coverImageUrl?: string;
    }
  ) => {
    let cleanUrl = data.driveUrl.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }

    const docRef = doc(db, "event_media", id);
    await updateDoc(docRef, {
      title: data.title.trim(),
      driveUrl: cleanUrl,
      description: data.description ? data.description.trim() : "",
      eventDate: data.eventDate || "",
      category: data.category || "FUNCTION",
      classCode: data.classCode ? data.classCode.trim().toUpperCase() : "ALL",
      isMasterDrive: !!data.isMasterDrive,
      coverImageUrl: data.coverImageUrl ? data.coverImageUrl.trim() : "",
      updatedAt: serverTimestamp(),
    });
  };

  const deleteEventMedia = async (id: string) => {
    const docRef = doc(db, "event_media", id);
    await deleteDoc(docRef);
  };

  const masterDrive = events.find((e) => e.isMasterDrive);

  return {
    events,
    masterDrive,
    loading,
    error,
    addEventMedia,
    updateEventMedia,
    deleteEventMedia,
  };
}
