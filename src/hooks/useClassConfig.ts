"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { ClassConfig } from "@/types";
import { useAuth } from "@/components/providers/AuthProvider";

const DEFAULT_CONFIG: ClassConfig = {
  classCode: "MCA2026",
  className: "MCA 2026-27",
};

export function useClassConfig() {
  const { user } = useAuth();
  const [config, setConfig] = useState<ClassConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const configRef = doc(db, "settings", "class_config");

    const unsub = onSnapshot(
      configRef,
      async (snap) => {
        if (snap.exists()) {
          setConfig(snap.data() as ClassConfig);
        } else {
          // Initialize default config if not present
          try {
            await setDoc(configRef, {
              ...DEFAULT_CONFIG,
              updatedAt: serverTimestamp(),
            });
            setConfig(DEFAULT_CONFIG);
          } catch (e) {
            console.warn("Could not auto-initialize class_config:", e);
          }
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching class config:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const updateClassConfig = async (newCode: string, newName?: string) => {
    const configRef = doc(db, "settings", "class_config");
    const cleanCode = newCode.trim().toUpperCase();
    const cleanName = newName?.trim() || config.className;

    await setDoc(
      configRef,
      {
        classCode: cleanCode,
        className: cleanName,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid || null,
      },
      { merge: true }
    );
  };

  const verifyCode = (code: string) => {
    if (!code) return false;
    return code.trim().toUpperCase() === config.classCode.toUpperCase();
  };

  return {
    classConfig: config,
    loading,
    updateClassConfig,
    verifyCode,
  };
}
