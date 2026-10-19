"use client";
import { useEffect, useState, createContext, useContext } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase/clientApp';
import { useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';

import { UserData, ClassJoinRequest } from '@/types';
import { isDeveloperEmail } from '@/lib/developer';
export type { UserData };

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  login: (roleChoice?: "ADMIN" | "STUDENT") => Promise<void>;
  logout: () => Promise<void>;
  enrollInClass: (code: string) => Promise<void>;
  leaveClass: (code: string) => Promise<void>;
  switchClass: (code: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserData>) => Promise<void>;
  refreshUserData: () => Promise<void>;
  requestAdminRole: () => Promise<void>;
  requestJoinClass: (code: string, className?: string) => Promise<void>;
  cancelJoinRequest: (code: string) => Promise<void>;
  approveStudentJoin: (requestId: string, studentUid: string, classCode: string) => Promise<void>;
  rejectStudentJoin: (requestId: string) => Promise<void>;
  approveAdminRequest: (targetUid: string) => Promise<void>;
  rejectAdminRequest: (targetUid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  enrollInClass: async () => {},
  leaveClass: async () => {},
  switchClass: async () => {},
  updateUserProfile: async () => {},
  refreshUserData: async () => {},
  requestAdminRole: async () => {},
  requestJoinClass: async () => {},
  cancelJoinRequest: async () => {},
  approveStudentJoin: async () => {},
  rejectStudentJoin: async () => {},
  approveAdminRequest: async () => {},
  rejectAdminRequest: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let userDocUnsub: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (userDocUnsub) {
        userDocUnsub();
        userDocUnsub = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        const isDev = isDeveloperEmail(firebaseUser.email);
        
        const intendedRole = typeof window !== 'undefined' 
          ? (sessionStorage.getItem('classsync_intended_role') as "ADMIN" | "STUDENT") || null
          : null;
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('classsync_intended_role');
        }

        if (userSnap.exists()) {
          const current = userSnap.data() as UserData;
          // Auto-promote recognized developer if not already set
          if (isDev && (!current.isDeveloper || current.adminApprovalStatus !== 'APPROVED' || current.role !== 'ADMIN')) {
            await setDoc(userRef, {
              role: 'ADMIN',
              adminApprovalStatus: 'APPROVED',
              isDeveloper: true,
            }, { merge: true });
          } else if (intendedRole === 'ADMIN' && current.role !== 'ADMIN') {
            // User specifically signed in as Teacher/Admin
            await setDoc(userRef, {
              role: 'ADMIN',
              adminApprovalStatus: isDev ? 'APPROVED' : 'PENDING',
              requestedRole: 'ADMIN',
            }, { merge: true });
          }
        } else {
          // Auto-register: Developer gets immediate ADMIN approval, standard users get chosen role
          const wantsAdmin = intendedRole === 'ADMIN';
          const newUserData: UserData = { 
            uid: firebaseUser.uid,
            role: (isDev || wantsAdmin) ? ('ADMIN' as const) : ('STUDENT' as const), 
            adminApprovalStatus: isDev ? ('APPROVED' as const) : wantsAdmin ? ('PENDING' as const) : undefined,
            isDeveloper: isDev,
            requestedRole: wantsAdmin ? 'ADMIN' : 'STUDENT',
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || (isDev ? 'Developer' : wantsAdmin ? 'Teacher' : 'Student'),
            createdAt: serverTimestamp() as any,
            fcmTokens: [],
            remindersEnabled: true
          };
          await setDoc(userRef, newUserData);
        }

        // Real-time listener for live approval updates without needing a page refresh
        userDocUnsub = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            setUserData(snap.data() as UserData);
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (userDocUnsub) userDocUnsub();
    };
  }, []);

  const login = async (roleChoice?: "ADMIN" | "STUDENT") => {
    try {
      if (roleChoice && typeof window !== 'undefined') {
        sessionStorage.setItem('classsync_intended_role', roleChoice);
      }
      await signInWithPopup(auth, googleProvider);
      toast.success('Successfully logged in!');
    } catch (error: any) {
      toast.error('Login failed: ' + error.message);
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const refreshUserData = async () => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      setUserData(snap.data() as UserData);
    }
  };

  const enrollInClass = async (code: string) => {
    if (!user) return;
    const cleanCode = code.trim().toUpperCase();
    const currentClasses = userData?.enrolledClasses || (userData?.enrolledClassCode ? [userData.enrolledClassCode] : []);
    const updatedClasses = Array.from(new Set([...currentClasses, cleanCode]));

    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, { 
      enrolledClassCode: cleanCode,
      enrolledClasses: updatedClasses
    }, { merge: true });

    setUserData(prev => prev ? { 
      ...prev, 
      enrolledClassCode: cleanCode,
      enrolledClasses: updatedClasses
    } : null);
  };

  const leaveClass = async (code: string) => {
    if (!user) return;
    const cleanCode = code.trim().toUpperCase();
    const currentClasses = userData?.enrolledClasses || (userData?.enrolledClassCode ? [userData.enrolledClassCode] : []);
    const updatedClasses = currentClasses.filter(c => c !== cleanCode);
    
    const nextActiveClass = userData?.enrolledClassCode === cleanCode
      ? (updatedClasses.length > 0 ? updatedClasses[0] : null)
      : (userData?.enrolledClassCode || null);

    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, { 
      enrolledClassCode: nextActiveClass,
      enrolledClasses: updatedClasses
    }, { merge: true });

    setUserData(prev => prev ? { 
      ...prev, 
      enrolledClassCode: nextActiveClass || undefined,
      enrolledClasses: updatedClasses
    } : null);
  };

  const switchClass = async (code: string) => {
    if (!user) return;
    const cleanCode = code.trim().toUpperCase();
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, { enrolledClassCode: cleanCode }, { merge: true });
    setUserData(prev => prev ? { ...prev, enrolledClassCode: cleanCode } : null);
  };

  const updateUserProfile = async (updates: Partial<UserData>) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    // Protect core immutable fields so user never loses name, email, or role
    const sanitizedUpdates: Partial<UserData> = {
      ...updates,
      email: userData?.email || user.email || "",
      role: userData?.role || "STUDENT",
    };
    if (!sanitizedUpdates.displayName && userData?.displayName) {
      sanitizedUpdates.displayName = userData.displayName;
    }
    await setDoc(userRef, sanitizedUpdates, { merge: true });
    setUserData(prev => prev ? ({ ...prev, ...sanitizedUpdates } as UserData) : null);
  };

  // Submit student request to join a specific class
  const requestJoinClass = async (code: string, className?: string) => {
    if (!user) return;
    const cleanCode = code.trim().toUpperCase();
    const requestId = `${cleanCode}_${user.uid}`;
    const requestRef = doc(db, 'join_requests', requestId);
    
    await setDoc(requestRef, {
      id: requestId,
      classCode: cleanCode,
      className: className || cleanCode,
      studentUid: user.uid,
      studentName: userData?.displayName || user.displayName || 'Student',
      studentEmail: userData?.email || user.email || '',
      studentPhoto: userData?.photoURL || user.photoURL || '',
      status: 'PENDING',
      createdAt: serverTimestamp(),
    }, { merge: true });
  };

  // Cancel or withdraw a pending join request
  const cancelJoinRequest = async (code: string) => {
    if (!user) return;
    const cleanCode = code.trim().toUpperCase();
    const requestId = `${cleanCode}_${user.uid}`;
    await deleteDoc(doc(db, 'join_requests', requestId));
  };

  // Class Admin approves student join request
  const approveStudentJoin = async (requestId: string, studentUid: string, classCode: string) => {
    if (!user) return;
    const cleanCode = classCode.trim().toUpperCase();
    
    // 1. Mark request as APPROVED
    const reqRef = doc(db, 'join_requests', requestId);
    await updateDoc(reqRef, {
      status: 'APPROVED',
      reviewedAt: serverTimestamp(),
      reviewedBy: user.uid,
    });

    // 2. Add classCode to student's enrolledClasses
    const studentUserRef = doc(db, 'users', studentUid);
    const snap = await getDoc(studentUserRef);
    if (snap.exists()) {
      const sData = snap.data() as UserData;
      const currentClasses = sData.enrolledClasses || (sData.enrolledClassCode ? [sData.enrolledClassCode] : []);
      const updatedClasses = Array.from(new Set([...currentClasses, cleanCode]));
      
      await updateDoc(studentUserRef, {
        enrolledClassCode: cleanCode,
        enrolledClasses: updatedClasses,
      });
    }
  };

  // Class Admin rejects student join request
  const rejectStudentJoin = async (requestId: string) => {
    if (!user) return;
    const reqRef = doc(db, 'join_requests', requestId);
    await updateDoc(reqRef, {
      status: 'REJECTED',
      reviewedAt: serverTimestamp(),
      reviewedBy: user.uid,
    });
  };

  // User requests Teacher/Admin role (requires Developer approval unless user is Developer)
  const requestAdminRole = async () => {
    if (!user) return;
    const isDev = isDeveloperEmail(user.email);
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      role: 'ADMIN',
      adminApprovalStatus: isDev ? 'APPROVED' : 'PENDING',
      isDeveloper: isDev,
      requestedRole: 'ADMIN',
    });
  };

  // Developer approves an Admin account
  const approveAdminRequest = async (targetUid: string) => {
    if (!user) return;
    const targetRef = doc(db, 'users', targetUid);
    await updateDoc(targetRef, {
      role: 'ADMIN',
      adminApprovalStatus: 'APPROVED',
      reviewedBy: user.uid,
      reviewedAt: serverTimestamp(),
    });
  };

  // Developer rejects an Admin account
  const rejectAdminRequest = async (targetUid: string) => {
    if (!user) return;
    const targetRef = doc(db, 'users', targetUid);
    await updateDoc(targetRef, {
      role: 'STUDENT',
      adminApprovalStatus: 'REJECTED',
      reviewedBy: user.uid,
      reviewedAt: serverTimestamp(),
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      loading, 
      login, 
      logout, 
      enrollInClass, 
      leaveClass, 
      switchClass, 
      updateUserProfile, 
      refreshUserData,
      requestAdminRole,
      requestJoinClass,
      cancelJoinRequest,
      approveStudentJoin,
      rejectStudentJoin,
      approveAdminRequest,
      rejectAdminRequest,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
