import { useState, useEffect } from 'react';
import { getToken } from 'firebase/messaging';
import { messaging, db } from '@/lib/firebase/clientApp';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '@/components/providers/AuthProvider';
import toast from 'react-hot-toast';

export const usePushNotifications = () => {
  const { user, userData } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    try {
      const msg = await messaging();
      if (!msg) {
        toast.error('Push notifications are not supported on this browser.');
        return;
      }

      const currentPermission = await Notification.requestPermission();
      setPermission(currentPermission);

      if (currentPermission === 'granted' && user) {
        const token = await getToken(msg, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });
        
        if (token) {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            fcmTokens: arrayUnion(token),
            remindersEnabled: true
          });
          toast.success('Reminders enabled!');
        }
      } else {
        toast.error('Notification permission denied.');
      }
    } catch (error: any) {
      console.error('Error getting notification permission:', error);
      toast.error('Failed to enable notifications.');
    }
  };

  const toggleReminders = async () => {
    if (!user || !userData) return;
    const newState = !(userData as any).remindersEnabled;
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        remindersEnabled: newState
      });
      if (newState) {
        toast.success('Reminders turned ON');
        if (permission !== 'granted') {
          requestPermission();
        }
      } else {
        toast.success('Reminders turned OFF');
      }
    } catch (error) {
      toast.error('Failed to update reminder settings');
    }
  };

  const isEnabled = permission === 'granted' && (userData as any)?.remindersEnabled !== false;

  return { permission, isEnabled, requestPermission, toggleReminders };
};
