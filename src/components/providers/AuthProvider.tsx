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
        
        // Retrieve explicit portal choice (STUDENT vs ADMIN) from storage
        const intendedRole = typeof window !== 'undefined' 
          ? (sessionStorage.getItem('classsync_intended_role') || localStorage.getItem('classsync_intended_role')) as "ADMIN" | "STUDENT" | null
          : null;
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('classsync_intended_role');
          localStorage.removeItem('classsync_intended_role');
        }

        if (userSnap.exists()) {
          const current = userSnap.data() as UserData;

          if (intendedRole === 'STUDENT') {
            // User explicitly logged in through Student Portal!
            // Respect their choice 100%. Set role to STUDENT.
            await setDoc(userRef, {
              role: 'STUDENT',
              requestedRole: 'STUDENT',
            }, { merge: true });
          } else if (intendedRole === 'ADMIN') {
            // User explicitly logged in through Teacher/Admin Portal!
            const isApproved = isDev || current.adminApprovalStatus === 'APPROVED';
            if (isApproved) {
              await setDoc(userRef, {
                role: 'ADMIN',
                requestedRole: 'ADMIN',
                adminApprovalStatus: 'APPROVED',
                isDeveloper: isDev || Boolean(current.isDeveloper),
              }, { merge: true });
            } else {
              // Not approved yet! Keep role strictly as STUDENT with PENDING request
              await setDoc(userRef, {
                role: 'STUDENT',
                requestedRole: 'ADMIN',
                adminApprovalStatus: current.adminApprovalStatus || 'PENDING',
                isDeveloper: false,
              }, { merge: true });
            }
          } else {
            // Regular session restore (no explicit portal clicked)
            // If they are an active ADMIN and recognized developer, ensure dev status is kept
            if (isDev && current.role === 'ADMIN' && (!current.isDeveloper || current.adminApprovalStatus !== 'APPROVED')) {
              await setDoc(userRef, {
                adminApprovalStatus: 'APPROVED',
                isDeveloper: true,
              }, { merge: true });
            }
          }
        } else {
          // New User Registration
          if (intendedRole === 'ADMIN') {
            // Registering as Teacher/Admin
            const isApproved = isDev;
            const newUserData: UserData = { 
              uid: firebaseUser.uid,
              role: isApproved ? 'ADMIN' : 'STUDENT',
              requestedRole: 'ADMIN',
              adminApprovalStatus: isApproved ? 'APPROVED' : 'PENDING',
              isDeveloper: isDev,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || (isDev ? 'Developer' : 'Teacher (Pending)'),
              createdAt: serverTimestamp() as any,
              fcmTokens: [],
              remindersEnabled: true
            };
            await setDoc(userRef, newUserData);
          } else {
            // Registering as Student (default)
            const newUserData: UserData = { 
              uid: firebaseUser.uid,
              role: 'STUDENT',
              requestedRole: 'STUDENT',
              isDeveloper: false,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || 'Student',
              createdAt: serverTimestamp() as any,
              fcmTokens: [],
              remindersEnabled: true
            };
            await setDoc(userRef, newUserData);
          }
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
        localStorage.setItem('classsync_intended_role', roleChoice);
      }
      await signInWithPopup(auth, googleProvider);
      toast.success('Successfully logged in!');
    } catch (error: any) {
      toast.error('Login failed: ' + error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message || 'Logout failed');
    }
  };

  const enrollInClass = async (code: string) => {
    if (!user) return;
    const cleanCode = code.toUpperCase().trim();
    const currentClasses = userData?.enrolledClasses || [];
    const updatedClasses = Array.from(new Set([...currentClasses, cleanCode]));

    await updateDoc(doc(db, 'users', user.uid), {
      enrolledClassCode: cleanCode,
      enrolledClasses: updatedClasses
    });
    setUserData(prev => prev ? ({ ...prev, enrolledClassCode: cleanCode, enrolledClasses: updatedClasses }) : null);
    toast.success(`Joined class ${cleanCode}`);
  };

  const switchClass = async (code: string) => {
    if (!user) return;
    const cleanCode = code.toUpperCase().trim();
    await updateDoc(doc(db, 'users', user.uid), {
      enrolledClassCode: cleanCode
    });
    setUserData(prev => prev ? ({ ...prev, enrolledClassCode: cleanCode }) : null);
    toast.success(`Switched to class ${cleanCode}`);
  };

  const leaveClass = async (code: string) => {
    if (!user) return;
    const cleanCode = code.toUpperCase().trim();
    const currentClasses = userData?.enrolledClasses || [];
    const updatedClasses = currentClasses.filter(c => c !== cleanCode);
    const nextActive = updatedClasses.length > 0 ? updatedClasses[0] : undefined;

    await updateDoc(doc(db, 'users', user.uid), {
      enrolledClassCode: nextActive || null,
      enrolledClasses: updatedClasses
    });
    setUserData(prev => prev ? ({ ...prev, enrolledClassCode: nextActive, enrolledClasses: updatedClasses }) : null);
    toast.success(`Left class ${cleanCode}`);
  };

  const updateUserProfile = async (updates: Partial<UserData>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), updates);
      setUserData(prev => prev ? ({ ...prev, ...updates }) : null);
      toast.success('Profile updated');
    } catch (error: any) {
      toast.error('Failed to update profile: ' + error.message);
    }
  };

  const refreshUserData = async () => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      setUserData(snap.data() as UserData);
    }
  };

  const requestAdminRole = async () => {
    if (!user) return;
    try {
      const isDev = isDeveloperEmail(user.email);
      await updateDoc(doc(db, 'users', user.uid), {
        requestedRole: 'ADMIN',
        role: isDev ? 'ADMIN' : 'STUDENT',
        adminApprovalStatus: isDev ? 'APPROVED' : 'PENDING',
        isDeveloper: isDev,
      });
      if (isDev) {
        toast.success('Developer verified! Admin access granted.');
      } else {
        toast.success('Admin privileges requested. Awaiting developer approval.');
      }
    } catch (error: any) {
      toast.error('Failed to request admin role: ' + error.message);
    }
  };

  const requestJoinClass = async (code: string, className?: string) => {
    if (!user) return;
    const cleanCode = code.toUpperCase().trim();
    const requestId = `${cleanCode}_${user.uid}`;
    
    await setDoc(doc(db, 'join_requests', requestId), {
      id: requestId,
      classCode: cleanCode,
      className: className || cleanCode,
      studentUid: user.uid,
      studentName: userData?.displayName || user.displayName || 'Student',
      studentEmail: user.email || '',
      studentPhoto: user.photoURL || undefined,
      status: 'PENDING',
      requestedAt: serverTimestamp(),
    });
    toast.success(`Join request sent for class ${cleanCode}. Awaiting teacher approval!`);
  };

  const cancelJoinRequest = async (code: string) => {
    if (!user) return;
    const cleanCode = code.toUpperCase().trim();
    const requestId = `${cleanCode}_${user.uid}`;
    await deleteDoc(doc(db, 'join_requests', requestId));
    toast.success(`Cancelled request for class ${cleanCode}`);
  };

  const approveStudentJoin = async (requestId: string, studentUid: string, classCode: string) => {
    const cleanCode = classCode.toUpperCase().trim();
    await updateDoc(doc(db, 'join_requests', requestId), {
      status: 'APPROVED',
      approvedAt: serverTimestamp(),
    });

    const studentRef = doc(db, 'users', studentUid);
    const studentSnap = await getDoc(studentRef);
    if (studentSnap.exists()) {
      const data = studentSnap.data() as UserData;
      const currentClasses = data.enrolledClasses || [];
      const updatedClasses = Array.from(new Set([...currentClasses, cleanCode]));
      await updateDoc(studentRef, {
        enrolledClassCode: cleanCode,
        enrolledClasses: updatedClasses,
      });
    }
    toast.success(`Student approved for class ${cleanCode}!`);
  };

  const rejectStudentJoin = async (requestId: string) => {
    await updateDoc(doc(db, 'join_requests', requestId), {
      status: 'REJECTED',
    });
    toast.success('Join request declined.');
  };

  const approveAdminRequest = async (targetUid: string) => {
    await updateDoc(doc(db, 'users', targetUid), {
      role: 'ADMIN',
      adminApprovalStatus: 'APPROVED',
    });
    toast.success('Admin approved successfully!');
  };

  const rejectAdminRequest = async (targetUid: string) => {
    await updateDoc(doc(db, 'users', targetUid), {
      role: 'STUDENT',
      adminApprovalStatus: 'REJECTED',
    });
    toast.success('Admin request declined.');
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
