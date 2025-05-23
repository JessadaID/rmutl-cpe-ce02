import { json } from "@sveltejs/kit";
import { db } from "$lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// API GET: ดึงข้อมูลผู้ใช้ที่ล็อกอิน
export async function GET({ locals }) {
  const uid = locals.user?.uid;
  if (!uid) return json({ error: "Unauthorized" }, { status: 401 });

  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return json({ error: "User not found" }, { status: 404 });
  }

  return json({ user: userSnap.data() });
}
