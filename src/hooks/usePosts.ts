"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { Post } from "@/types";

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // We only want active posts. Sorting is done client-side to avoid needing a Firestore composite index.
    const q = query(
      collection(db, "posts"),
      where("status", "==", "ACTIVE")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedPosts: Post[] = [];
        snapshot.forEach((doc) => {
          fetchedPosts.push({ id: doc.id, ...doc.data() } as Post);
        });
        
        // Sort posts descending by createdAt (newest first)
        fetchedPosts.sort((a, b) => {
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });

        setPosts(fetchedPosts);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching posts:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { posts, loading, error };
}
