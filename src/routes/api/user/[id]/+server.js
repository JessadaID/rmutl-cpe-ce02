import { adminDb } from "$lib/server/firebase";
import { json } from "@sveltejs/kit";


export async function GET({ params }) {
  try {
    let id =  params.id; // Assuming the ID is passed as a parameter in the URL

    if (!id) {
      return json({ error: "ID parameter is required" }, { status: 400 });
    }

    let q = adminDb.collection('users').where('id', '==', id);
  
    const querySnapshot = await q.get();
    const users = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return json( {users}, { status: 200 });
  } catch (err) {
    console.error("Error in GET /api/user/id:", err);
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
    return json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT ({ params, request }) {
  try {
    let id = params.id; // Assuming the ID is passed as a parameter in the URL
    
    if (!id) {
      return json({ error: "ID parameter is required" }, { status: 400 });
    }

    const {role} = await request.json();
    const userRef = adminDb.collection('users').doc(id);

    await userRef.update({role:role});

    return json({ message: "User updated successfully" }, { status: 200 });
  } catch (err) {
    console.error("Error in PUT /api/user/id:", err);
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
    return json({ error: errorMessage }, { status: 500 });
  }
}