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
  writeBatch,
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

  // Modify/Rename an existing class without creating duplicates
  const modifyClass = async (oldCode: string, newCode: string, newName: string) => {
    const rawOld = oldCode.trim();
    const cleanOld = rawOld.toUpperCase();
    const cleanNew = newCode.trim().toUpperCase();
    const cleanName = newName.trim();

    if (!cleanNew || !cleanName) return;

    if (rawOld !== cleanNew && cleanOld !== cleanNew) {
      const batch = writeBatch(db);

      // 1. Delete old class document (both raw and uppercase if different)
      batch.delete(doc(db, "classes", rawOld));
      if (rawOld !== cleanOld) {
        batch.delete(doc(db, "classes", cleanOld));
      }

      // 2. Set new class document
      const newDocRef = doc(db, "classes", cleanNew);
      batch.set(newDocRef, {
        code: cleanNew,
        name: cleanName,
        createdAt: serverTimestamp(),
        createdBy: user?.uid || null,
      });

      // 3. Update settings/class_config if this was the primary/active config
      if (classConfig.classCode === rawOld || classConfig.classCode.toUpperCase() === cleanOld) {
        const configRef = doc(db, "settings", "class_config");
        batch.set(configRef, {
          classCode: cleanNew,
          className: cleanName,
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid || null,
        }, { merge: true });
      }

      await batch.commit();

      // 4. Migrate enrolled students from cleanOld to cleanNew
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const studentBatch = writeBatch(db);
        let count = 0;

        usersSnap.forEach((uDoc) => {
          const u = uDoc.data() as UserData;
          let changed = false;
          let nextActive = u.enrolledClassCode;
          let nextClasses = u.enrolledClasses || (u.enrolledClassCode ? [u.enrolledClassCode] : []);

          if (u.enrolledClassCode && (u.enrolledClassCode === rawOld || u.enrolledClassCode.toUpperCase() === cleanOld)) {
            nextActive = cleanNew;
            changed = true;
          }

          if (nextClasses.some(c => c === rawOld || c.toUpperCase() === cleanOld)) {
            nextClasses = nextClasses.map(c => (c === rawOld || c.toUpperCase() === cleanOld) ? cleanNew : c);
            changed = true;
          }

          if (changed) {
            studentBatch.update(uDoc.ref, {
              enrolledClassCode: nextActive,
              enrolledClasses: Array.from(new Set(nextClasses)),
            });
            count++;
          }
        });

        if (count > 0) {
          await studentBatch.commit();
        }
      } catch (err) {
        console.warn("Could not migrate students:", err);
      }
    } else {
      // Same code, just updating the name
      await setDoc(doc(db, "classes", cleanNew), {
        name: cleanName,
      }, { merge: true });

      if (classConfig.classCode === rawOld || classConfig.classCode.toUpperCase() === cleanNew) {
        await setDoc(doc(db, "settings", "class_config"), {
          className: cleanName,
        }, { merge: true });
      }
    }
  };

  // Update existing active class config
  const updateClassConfig = async (newCode: string, newName?: string) => {
    return modifyClass(classConfig.classCode, newCode, newName || classConfig.className);
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
    const raw = code.trim();
    const cleanCode = raw.toUpperCase();
    await deleteDoc(doc(db, "classes", raw));
    if (raw !== cleanCode) {
      await deleteDoc(doc(db, "classes", cleanCode));
    }

    // If deleting the active classConfig, fallback to another class
    if (classConfig.classCode === raw || classConfig.classCode.toUpperCase() === cleanCode) {
      const remaining = classes.filter((c) => c.code !== raw && c.code.toUpperCase() !== cleanCode);
      if (remaining.length > 0) {
        await setDoc(doc(db, "settings", "class_config"), {
          classCode: remaining[0].code,
          className: remaining[0].name,
          updatedAt: serverTimestamp(),
        }, { merge: true });
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
    modifyClass,
    createClass,
    deleteClass,
    verifyCode,
    removeStudentFromClass,
  };
}
