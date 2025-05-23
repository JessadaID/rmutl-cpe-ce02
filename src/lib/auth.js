import { setCookie, deleteCookie,getCookie } from 'cookies-next';
import { getAuth, signOut} from 'firebase/auth';
import { auth } from "$lib/firebase"; // นำเข้า Firebase Auth ที่ตั้งค่าไว้
import { goto } from '$app/navigation';

/**
 * ตั้งค่า Cookies หลังจากล็อกอินสำเร็จ
 * @param {string} email - อีเมลของผู้ใช้
 * @param {string} role - บทบาทของผู้ใช้
 * @param {string} name - ชื่อของผู้ใช้
 */
export function setLoginCookies(email, role,name) {
    setCookie('email', email, {
        path: '/',
        //httpOnly: true,
        maxAge: 60 * 60 * 3, // อายุ Cookies 3 ชม.
        secure: true,
        sameSite: 'strict',
    });

    setCookie('role', role, {
        path: '/',
        //httpOnly: true,
        maxAge: 60 * 60 * 3,
        secure: true,
        sameSite: 'strict',
    });
      setCookie('name', name, {
        path: '/',
        //httpOnly: true,
        //maxAge: 60 * 60 * 3,
        maxAge: 60 * 60 * 3,
        secure: true,
        sameSite: 'strict',
    });

    //console.log('Cookies have been set:', { email, role , name });

}

/**
 * ลบ Cookies เมื่อล็อกเอาท์
 */
export function clearLoginCookies() {
    deleteCookie('email', { path: '/' });
    deleteCookie('role', { path: '/' });
    deleteCookie('name', { path: '/' });
    //console.log('Cookies have been clear');
}

/**
 * ตรวจสอบสถานะการล็อกอิน
 * @returns {boolean} - คืนค่า true ถ้าผู้ใช้ล็อกอิน, false ถ้าไม่ได้ล็อกอิน
 */

export async function isUserLoggedIn() {
  const auth = getAuth();
  await auth.authStateReady; // รอ Firebase โหลดข้อมูล
  return !!auth.currentUser; // true = ล็อกอิน, false = ไม่ได้ล็อกอิน
}

export function checkAuthStatus() {
    const email = getCookie("email");
    const role = getCookie("role");

    //console.log("Checking cookies:", { email, role });

    if (!email || !role) {
      console.warn("Missing cookies. Logging out.");
      //console.log(email, role);
      logout();
      return false;
    }
    return true;
  }

  export async function logout() {
    try {
      await signOut(auth);
      // ลบ cookies
      clearLoginCookies();
      goto("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }
