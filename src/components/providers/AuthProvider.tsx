"use client";
import { useEffect, useState, createContext, useContext } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase/clientApp';
import { useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';

export interface UserData {
  role: 'ADMIN' | 'STUDENT';
  email: string;
  displayName: string;
  enrolledClassCode?: string;
  enrolledClasses?: string[];
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  enrollInClass: (code: string) => Promise<void>;
  leaveClass: (code: string) => Promise<void>;
  switchClass: (code: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
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
  refreshUserData: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUserData(userSnap.data() as UserData);
        } else {
          // Auto-register as student initially
          const newUserData = { 
            role: 'STUDENT', 
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || 'Student',
            createdAt: serverTimestamp(),
            fcmTokens: [],
            remindersEnabled: true
          };
          await setDoc(userRef, newUserData);
          setUserData(newUserData as UserData);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
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

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, logout, enrollInClass, leaveClass, switchClass, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
