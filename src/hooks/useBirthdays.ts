"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Birthday } from "@/types";
import { useAuth } from "@/components/providers/AuthProvider";

export function useBirthdays() {
  const { user } = useAuth();
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  // Safely initialize current date on client to avoid Next.js prerender error
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  useEffect(() => {
    const q = query(collection(db, "birthdays"), orderBy("month", "asc"));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Birthday[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Birthday);
        });
        
        // Sort by month and day
        list.sort((a, b) => {
          if (a.month !== b.month) return a.month - b.month;
          return a.day - b.day;
        });

        setBirthdays(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching birthdays:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Today's Date info
  const currentMonth = currentDate ? currentDate.getMonth() + 1 : 0;
  const currentDay = currentDate ? currentDate.getDate() : 0;

  // Tomorrow's Date info
  const tomorrowDate = useMemo(() => {
    if (!currentDate) return null;
    const t = new Date(currentDate);
    t.setDate(t.getDate() + 1);
    return t;
  }, [currentDate]);

  const tomorrowMonth = tomorrowDate ? tomorrowDate.getMonth() + 1 : 0;
  const tomorrowDay = tomorrowDate ? tomorrowDate.getDate() : 0;

  // Helper to add birthday
  const addBirthday = async (data: {
    name: string;
    birthDate: string; // "YYYY-MM-DD"
    classCode?: string;
    rollNo?: string;
    notes?: string;
  }) => {
    const parts = data.birthDate.split("-");
    const year = parts.length === 3 ? parseInt(parts[0], 10) : undefined;
    const month = parts.length === 3 ? parseInt(parts[1], 10) : parseInt(parts[0], 10);
    const day = parts.length === 3 ? parseInt(parts[2], 10) : parseInt(parts[1], 10);

    const docRef = await addDoc(collection(db, "birthdays"), {
      name: data.name.trim(),
      birthDate: data.birthDate,
      month,
      day,
      year: year || null,
      classCode: data.classCode ? data.classCode.trim().toUpperCase() : "ALL",
      rollNo: data.rollNo ? data.rollNo.trim() : null,
      notes: data.notes ? data.notes.trim() : null,
      createdAt: serverTimestamp(),
      createdBy: user?.uid || null,
    });

    return docRef.id;
  };

  // Helper to update birthday
  const updateBirthday = async (
    id: string,
    data: {
      name: string;
      birthDate: string;
      classCode?: string;
      rollNo?: string;
      notes?: string;
    }
  ) => {
    const parts = data.birthDate.split("-");
    const year = parts.length === 3 ? parseInt(parts[0], 10) : undefined;
    const month = parts.length === 3 ? parseInt(parts[1], 10) : parseInt(parts[0], 10);
    const day = parts.length === 3 ? parseInt(parts[2], 10) : parseInt(parts[1], 10);

    const docRef = doc(db, "birthdays", id);
    await updateDoc(docRef, {
      name: data.name.trim(),
      birthDate: data.birthDate,
      month,
      day,
      year: year || null,
      classCode: data.classCode ? data.classCode.trim().toUpperCase() : "ALL",
      rollNo: data.rollNo ? data.rollNo.trim() : null,
      notes: data.notes ? data.notes.trim() : null,
      updatedAt: serverTimestamp(),
    });
  };

  // Helper to delete birthday
  const deleteBirthday = async (id: string) => {
    const docRef = doc(db, "birthdays", id);
    await deleteDoc(docRef);
  };

  // Today's birthdays
  const todaysBirthdays = useMemo(() => {
    if (!currentMonth || !currentDay) return [];
    return birthdays.filter((b) => b.month === currentMonth && b.day === currentDay);
  }, [birthdays, currentMonth, currentDay]);

  // Tomorrow's birthdays (one day prior)
  const tomorrowsBirthdays = useMemo(() => {
    if (!tomorrowMonth || !tomorrowDay) return [];
    return birthdays.filter((b) => b.month === tomorrowMonth && b.day === tomorrowDay);
  }, [birthdays, tomorrowMonth, tomorrowDay]);

  // Helper to get birthdays for any specific calendar date
  const getBirthdaysForDate = (date: Date) => {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return birthdays.filter((b) => b.month === m && b.day === d);
  };

  // Upcoming birthdays sorted by how soon they occur
  const upcomingBirthdays = useMemo(() => {
    if (!currentDate) return [];
    const currentYear = currentDate.getFullYear();
    const startOfToday = new Date(currentYear, currentDate.getMonth(), currentDate.getDate());

    return birthdays
      .map((b) => {
        let nextBirthday = new Date(currentYear, b.month - 1, b.day);
        // If birthday has already passed this year, count for next year
        if (nextBirthday < startOfToday) {
          nextBirthday = new Date(currentYear + 1, b.month - 1, b.day);
        }

        const diffTime = nextBirthday.getTime() - startOfToday.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          ...b,
          daysUntil: diffDays,
          nextDate: nextBirthday,
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [birthdays, currentDate]);

  return {
    birthdays,
    loading,
    error,
    currentDate,
    addBirthday,
    updateBirthday,
    deleteBirthday,
    todaysBirthdays,
    tomorrowsBirthdays,
    upcomingBirthdays,
    getBirthdaysForDate,
  };
}
