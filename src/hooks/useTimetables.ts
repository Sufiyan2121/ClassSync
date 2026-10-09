"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { Timetable } from "@/types";

export function useTimetables() {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "timetables"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as Timetable[];
        setTimetables(fetched);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching timetables:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { timetables, loading, error };
}
