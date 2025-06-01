import { json } from "@sveltejs/kit";
import { adminDb } from "$lib/server/firebase";
// API GET: ดึงข้อมูลผู้ใช้

export async function GET({ url }) {
  try {
    const roleQueryParam = url.searchParams.get('role');
    console.log("Received role query param:", roleQueryParam);

    let q = adminDb.collection('users');
    let rolesToFilter = [];

    if (roleQueryParam) {
      if (roleQueryParam.toLowerCase() === 'teachersubject_teacher') {
        rolesToFilter = ['teacher', 'subject_teacher'];
      } else {
        // If the param is not the special 'teachersubject_teacher' string,
        // treat it as a single role to filter by.
        rolesToFilter = [roleQueryParam];
      }
    }

    if (rolesToFilter.length > 0) {
      q = q.where('role', 'in', rolesToFilter).select('email', 'name', 'role');
      console.log("Applying Firestore filter for roles:", rolesToFilter);
    } else {
      console.log("No role filter applied, fetching all users.");
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
