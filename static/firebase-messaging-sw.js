// static/firebase-messaging-sw.js

// 1. Import Firebase Compat Scripts (อันนี้ถูกต้องแล้ว)
// ตรวจสอบให้แน่ใจว่าเวอร์ชันตรงกับที่ใช้ในแอปหลัก หรือเป็นเวอร์ชันล่าสุดที่รองรับ
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// 2. กำหนด Firebase Config โดยตรงใน Service Worker
// !!! สำคัญ: แทนที่ค่าเหล่านี้ด้วยค่าจริงจากโปรเจกต์ Firebase ของคุณ !!!
// !!! การใส่ค่า Config ตรงๆ แบบนี้ไม่แนะนำสำหรับ Production เพราะอาจเปิดเผยข้อมูลสำคัญ !!!
// พิจารณาวิธีอื่น เช่น การส่งค่าผ่าน Query Parameters ตอน register SW หรือใช้ Build Tool ช่วย

const firebaseConfig = {
  apiKey: "AIzaSyBSL4HXr2IdQ_oSkMkcECF626HVfDzf52w",
  authDomain: "cpe02-4b991.firebaseapp.com",
  projectId: "cpe02-4b991",
  storageBucket: "cpe02-4b991.firebasestorage.app",
  messagingSenderId: "827303701453",
  appId: "1:827303701453:web:3a98898fb3865832403284",
  //measurementId: import.meta.env.VITE_measurementId // Optional, but good to keep if defined
};

// 3. Initialize Firebase App
// ตรวจสอบก่อนว่ายังไม่มีการ initialize (เผื่อกรณี SW ถูกเรียกซ้ำ)
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

console.log('[firebase-messaging-sw.js] Messaging instance obtained.');



messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'ข้อความใหม่';
  const options = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/LOGO.png'
  };
  self.registration.showNotification(title, options);
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
