"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  getDoc,
  getDocs,
  serverTimestamp, 
  query, 
  orderBy, 
  where 
} from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { ClassConfig, ClassItem, UserData } from "@/types";
import { useAuth } from "@/components/providers/AuthProvider";

const DEFAULT_CONFIG: ClassConfig = {
  classCode: "MCA2026",
  className: "MCA 2026-27",
};

export function useClassConfig() {
  const { user } = useAuth();
  const [classConfig, setClassConfig] = useState<ClassConfig>(DEFAULT_CONFIG);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Listen to settings/class_config
    const configRef = doc(db, "settings", "class_config");
    const unsubConfig = onSnapshot(configRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data() as ClassConfig;
        setClassConfig(data);
      } else {
        try {
          await setDoc(configRef, {
            ...DEFAULT_CONFIG,
            updatedAt: serverTimestamp(),
          });
          setClassConfig(DEFAULT_CONFIG);
        } catch (e) {
          console.warn("Could not auto-initialize class_config:", e);
        }
      }
    });

    // 2. Listen to classes collection
    const classesQuery = query(collection(db, "classes"), orderBy("createdAt", "desc"));
    const unsubClasses = onSnapshot(classesQuery, async (snap) => {
      const list: ClassItem[] = [];
      snap.forEach((d) => {
        list.push({ ...d.data(), code: d.id } as ClassItem);
      });

      if (list.length === 0) {
        // Seed default class in classes collection if none exists
        try {
          await setDoc(doc(db, "classes", "MCA2026"), {
            code: "MCA2026",
            name: "MCA 2026-27",
            createdAt: serverTimestamp(),
          });
          setClasses([{ code: "MCA2026", name: "MCA 2026-27" }]);
        } catch (e) {
          console.warn("Could not seed default class:", e);
          setClasses([{ code: "MCA2026", name: "MCA 2026-27" }]);
        }
      } else {
        setClasses(list);
      }
      setLoading(false);
    });

    return () => {
      unsubConfig();
      unsubClasses();
    };
  }, []);

  // Update existing active class config
  const updateClassConfig = async (newCode: string, newName?: string) => {
    const cleanCode = newCode.trim().toUpperCase();
    const cleanName = newName?.trim() || classConfig.className;

    // Update settings/class_config
    await setDoc(
      doc(db, "settings", "class_config"),
      {
        classCode: cleanCode,
        className: cleanName,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid || null,
      },
      { merge: true }
    );

    // Also update or insert in classes collection
    await setDoc(
      doc(db, "classes", cleanCode),
      {
        code: cleanCode,
        name: cleanName,
        createdAt: serverTimestamp(),
        createdBy: user?.uid || null,
      },
      { merge: true }
    );
  };

  // Create a brand new class
  const createClass = async (code: string, name: string) => {
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();

    await setDoc(doc(db, "classes", cleanCode), {
      code: cleanCode,
      name: cleanName,
      createdAt: serverTimestamp(),
      createdBy: user?.uid || null,
    });
  };

  // Delete a class
  const deleteClass = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    await deleteDoc(doc(db, "classes", cleanCode));

    // If deleting the active classConfig, fallback to another class
    if (classConfig.classCode === cleanCode) {
      const remaining = classes.filter((c) => c.code !== cleanCode);
      if (remaining.length > 0) {
        await updateClassConfig(remaining[0].code, remaining[0].name);
      }
    }
  };

  // Verify if a code is valid for any registered class
  const verifyCode = (code: string): { valid: boolean; classItem?: ClassItem } => {
    if (!code) return { valid: false };
    const clean = code.trim().toUpperCase();

    // Check in classes array
    const found = classes.find((c) => c.code.toUpperCase() === clean);
    if (found) {
      return { valid: true, classItem: found };
    }

    // Fallback to active classConfig
    if (classConfig.classCode.toUpperCase() === clean) {
      return { valid: true, classItem: { code: classConfig.classCode, name: classConfig.className } };
    }

    return { valid: false };
  };

  // Remove a student from a particular class
  const removeStudentFromClass = async (studentUid: string, code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const userRef = doc(db, "users", studentUid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const studentData = snap.data() as UserData;
      const currentClasses = studentData.enrolledClasses || (studentData.enrolledClassCode ? [studentData.enrolledClassCode] : []);
      const updatedClasses = currentClasses.filter((c) => c !== cleanCode);

      const nextActive = studentData.enrolledClassCode === cleanCode
        ? (updatedClasses.length > 0 ? updatedClasses[0] : null)
        : (studentData.enrolledClassCode || null);

      await setDoc(
        userRef,
        {
          enrolledClasses: updatedClasses,
          enrolledClassCode: nextActive,
        },
        { merge: true }
      );
    }
  };

  return {
    classConfig,
    classes,
    loading,
    updateClassConfig,
    createClass,
    deleteClass,
    verifyCode,
    removeStudentFromClass,
  };
}
