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
          const data = doc.data();
          const post = { id: doc.id, ...data } as Post;
          
          // Auto-hide posts that have expired
          if (post.dueDate && post.dueDate.toMillis() < Date.now()) {
            return;
          }
          
          fetchedPosts.push(post);
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

    // Setup a timer to periodically check for expired posts in the current state
    // so they disappear in real-time even if the user just stares at the screen.
    const interval = setInterval(() => {
      setPosts((currentPosts) => {
        const now = Date.now();
        const validPosts = currentPosts.filter(post => {
          if (!post.dueDate) return true;
          return post.dueDate.toMillis() >= now;
        });
        
        // Only update state if something actually expired to prevent unnecessary re-renders
        if (validPosts.length !== currentPosts.length) {
          return validPosts;
        }
        return currentPosts;
      });
    }, 10000); // Check every 10 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return { posts, loading, error };
}
