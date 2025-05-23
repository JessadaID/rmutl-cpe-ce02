import { getToken } from 'firebase/messaging';
import { browser } from '$app/environment';
import { getMessagingIfSupported, db, auth } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { successToast, warningToast, dangerToast } from './customtoast';

export async function requestNotificationPermissionAndSaveToken() {
  if (!browser) {
    console.log('[FCM] Not running in browser.');
    return null;
  }

  const messaging = await getMessagingIfSupported();
  if (!messaging) {
    console.warn('[FCM] Messaging not supported.');
    return null;
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.warn('[FCM] User not logged in.');
    return null;
  }

  const permission =
    Notification.permission === 'default'
      ? await Notification.requestPermission()
      : Notification.permission;

  if (permission !== 'granted') {
    warningToast('คุณยังไม่ได้อนุญาตการแจ้งเตือน');
    return null;
  }

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    dangerToast('VAPID Key ไม่ได้ตั้งค่า');
    return null;
  }

  try {
    const token = await getToken(messaging, { vapidKey });

    if (token) {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, {
        fcmToken: token,
        fcmTokenUpdatedAt: serverTimestamp(),
      }, { merge: true });

      //successToast('เปิดใช้งานการแจ้งเตือนเรียบร้อย');
      return token;
    } else {
      warningToast('ไม่สามารถรับ Token ได้');
      return null;
    }
  } catch (error) {
    console.error('[FCM] Error getting token:', error);
    dangerToast('เกิดข้อผิดพลาดในการรับ Token');
    return null;
  }
}
