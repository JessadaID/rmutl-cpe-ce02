// static/firebase-messaging-sw.js

// 1. Import Firebase Compat Scripts (อันนี้ถูกต้องแล้ว)
// ตรวจสอบให้แน่ใจว่าเวอร์ชันตรงกับที่ใช้ในแอปหลัก หรือเป็นเวอร์ชันล่าสุดที่รองรับ
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// 2. กำหนด Firebase Config โดยตรงใน Service Worker
// !!! สำคัญ: แทนที่ค่าเหล่านี้ด้วยค่าจริงจากโปรเจกต์ Firebase ของคุณ !!!
// !!! การใส่ค่า Config ตรงๆ แบบนี้ไม่แนะนำสำหรับ Production เพราะอาจเปิดเผยข้อมูลสำคัญ !!!
// พิจารณาวิธีอื่น เช่น การส่งค่าผ่าน Query Parameters ตอน register SW หรือใช้ Build Tool ช่วย

const firebaseConfig = {
  apiKey: import.meta.env.VITE_apiKey ,
  authDomain: import.meta.env.VITE_authDomain,
  projectId: import.meta.env.VITE_projectId,
  storageBucket: import.meta.env.VITE_storageBucket,
  messagingSenderId: import.meta.env.VITE_messagingSenderId,
  appId: import.meta.env.VITE_appId,
  //measurementId: import.meta.env.VITE_measurementId // Optional, but good to keep if defined
};

// 3. Initialize Firebase App
// ตรวจสอบก่อนว่ายังไม่มีการ initialize (เผื่อกรณี SW ถูกเรียกซ้ำ)
const app = initializeApp(firebaseConfig);

// 4. รับ Messaging Instance
const messaging = getMessaging(app); // ใช้ getMessaging จาก Firebase v9/v10
console.log('[firebase-messaging-sw.js] Messaging instance obtained.');

// 5. ตั้งค่า Background Message Handler
// ใช้ self ซึ่งเป็น global scope ของ Service Worker
onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);

  const notificationTitle = payload.notification?.title || 'ข้อความใหม่';
  const notificationOptions = {
    body: payload.notification?.body || 'คุณได้รับข้อความใหม่',
    icon: payload.notification?.icon || '/LOGO.png', // ใส่ path รูป default ของคุณจากโฟลเดอร์ static/
    data: payload.data // สามารถใส่ data เพิ่มเติมเพื่อใช้ตอนคลิก Notification ได้
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

console.log('[firebase-messaging-sw.js] Background message handler set.');

// (Optional) เพิ่ม event listeners อื่นๆ ของ Service Worker ถ้าต้องการ
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker installing.');
  // อาจใช้ self.skipWaiting() เพื่อให้ SW ใหม่ทำงานทันที
  // event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker activating.');
  // อาจใช้ self.clients.claim() เพื่อให้ SW ควบคุมหน้า client ทันที
  // event.waitUntil(self.clients.claim());
});
