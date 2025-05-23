// src/routes/api/teacher-data/+server.js
import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase'; // Import Firebase Admin instance

export async function GET({url}) {
  if (!adminDb) {
    console.error("Firebase Admin DB not initialized. Ensure $lib/server/firebase.js (or similar) is set up correctly.");
    return json({ error: "Server configuration error: Firebase Admin not available." }, { status: 500 });
  }

  try {
    const approval = url.searchParams.get('approval'); // ดึง approval ถ้ามี

    const usersCollectionRef = adminDb.collection("users");
    let queryRef = usersCollectionRef;

    // Fields to select based on the data transformation
    const fieldsToSelect = [
      'email',
      'role',
      'name',
      'Approval'
      // Add any other fields you might need from the user document
    ];

    // Always filter by role
    queryRef = queryRef.where("role", "in", ["teacher", "subject_teacher"]);

    if (approval) {
      queryRef = queryRef.where("Approval", "==", false);
    }

    // Execute the query with select
    const snapshot = await queryRef.select(...fieldsToSelect).get();

    if (snapshot.empty) {
      return json({ data: [] }, { status: 200 });
    }

    // Map the results
    const data = snapshot.docs.map(doc => {
      const docData = doc.data();
      return {
        id: doc.id,
        email: docData.email || '', // Fields from select are guaranteed to exist if docData is not null
        role: docData.role || '',
        name: docData.name || '',
        Approval: typeof docData.Approval === 'boolean' ? docData.Approval : false,
        // Add any other fields you might need from the user document
      };
    });
    return json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error processing GET request:', error); // Updated error message context
    const errorMessage = error instanceof Error ? error.message : "Failed to process request";
    return json({ error: errorMessage }, { status: 500 });
  }
}
