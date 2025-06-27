import { json } from "@sveltejs/kit";
import { adminDb } from "$lib/server/firebase";
// API GET: ดึงข้อมูลผู้ใช้ทั้งหมด

export async function GET({ url }) {
  try {
    let email = url.searchParams.get('email') || '';
    let page = parseInt(url.searchParams.get('page')) || 1;
    let limit = parseInt(url.searchParams.get('limit')) || 10;
    let role = url.searchParams.get('role') || '';
    let q = adminDb.collection('users');  

    if (email) {
      q = q.where('email', '>=', email.toLowerCase());
      q = q.where('email', '<=', email.toLowerCase() + '\uf8ff');
    }
    if (page && limit) {
      const startAt = (page - 1) * limit;
      q = q.orderBy('email').offset(startAt).limit(limit);
    }
    if (role) {
      q = q.where('role', '==', role);
    }

  
    const querySnapshot = await q.get();
    const users = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return json({ data: users }, { status: 200 });
  } catch (err) {
    console.error("Error in GET /api/user:", err);
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
    return json({ error: errorMessage }, { status: 500 });
  }
}
