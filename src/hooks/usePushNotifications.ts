import { useState, useEffect } from 'react';
import { getToken } from 'firebase/messaging';
import { messaging, db } from '@/lib/firebase/clientApp';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '@/components/providers/AuthProvider';
import toast from 'react-hot-toast';

export const usePushNotifications = () => {
  const { user, userData, refreshUserData } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [localEnabled, setLocalEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    if (userData) {
      setLocalEnabled((userData as any)?.remindersEnabled !== false);
    }
  }, [userData]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        toast.error('Push notifications are not supported on this browser.');
        return;
      }

      const msg = await messaging();
      if (!msg) {
        toast.error('Push notifications are not supported on this browser.');
        return;
      }

      const currentPermission = await Notification.requestPermission();
      setPermission(currentPermission);

      if (currentPermission === 'granted' && user) {
        const reg = await navigator.serviceWorker.ready;
        const token = await getToken(msg, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: reg,
        });

        if (token) {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            fcmTokens: arrayUnion(token),
            remindersEnabled: true,
          });
          setLocalEnabled(true);
          if (refreshUserData) {
            await refreshUserData();
          }
          toast.success('Alerts enabled! You will receive class broadcasts.');
        }
      } else {
        toast.error('Notification permission was not granted.');
      }
    } catch (error: any) {
      console.error('Error getting notification permission:', error);
      toast.error('Failed to enable notifications.');
    }
  };

  const toggleReminders = async () => {
    if (!user) return;
    const current = localEnabled !== null ? localEnabled : (userData as any)?.remindersEnabled !== false;
    const newState = !current;
    setLocalEnabled(newState);

    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        remindersEnabled: newState,
      });
      if (refreshUserData) {
        await refreshUserData();
      }

      if (newState) {
        toast.success('Alerts turned ON');
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
          await requestPermission();
        }
      } else {
        toast.success('Alerts turned OFF');
      }
    } catch (error) {
      setLocalEnabled(current); // Rollback on error
      toast.error('Failed to update alert settings');
    }
  };

  const isEnabled = permission === 'granted' && (localEnabled !== null ? localEnabled : (userData as any)?.remindersEnabled !== false);

  return { permission, isEnabled, requestPermission, toggleReminders };
};

