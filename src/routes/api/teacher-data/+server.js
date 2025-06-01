// src/routes/api/teacher-data/+server.js
import { error, json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase'; // Import Firebase Admin instance

export async function GET() {
  if (!adminDb) {
    console.error("Firebase Admin DB not initialized. Ensure $lib/server/firebase.js (or similar) is set up correctly.");
    return json({ error: "Server configuration error: Firebase Admin not available." }, { status: 500 });
  }

  try {
    // const approval = url.searchParams.get('approval'); // ไม่ได้ใช้แล้ว

    const teacherCollectionRef = adminDb.collection("teacher"); // เปลี่ยนเป็น collection "teacher"
    let queryRef = teacherCollectionRef;

    // Fields to select based on the data transformation
    const fieldsToSelect = [
      'email',
      'name',
      // Add any other fields you might need from the teacher document
    ];

    // ไม่จำเป็นต้อง filter by role หรือ Approval อีกต่อไป
    // if (approval) {
    //   queryRef = queryRef.where("Approval", "==", false);
    // }

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
        name: docData.name || '',
        // Add any other fields you might need from the teacher document
      };
    });
    return json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error processing GET request:', error); // Updated error message context
    const errorMessage = error instanceof Error ? error.message : "Failed to process request";
    return json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST({ request }) {
  try {
    const { email, name } = await request.json();
    if (!email || !name) {
      return json({ error: 'Email and name are required' }, { status: 400 });
    }
    //add teacher
    const teacherCollectionRef = adminDb.collection("teacher");

    const newTeacher = {
      email,name
    }
    const projectid = await teacherCollectionRef.add(newTeacher);
    const teacher = {
      id : projectid.id,
      email,
      name,
    }
    return json({ data : teacher }, { status: 201 });

  }catch(errorMessage){
    console.error('Error processing POST request:', error); // Updated error message context
    return json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT({ request }) {
  try {
    const { id , email, name } = await request.json();
    if (!id || !email || !name) {
      return json({ error: 'ID, email, and name are required' }, { status: 400 });
    }
    const teacherCollectionRef = adminDb.collection("teacher");
    const teacherDocRef = teacherCollectionRef.doc(id);
    const data = {
      email,
      name
    };
    await teacherDocRef.update(data);
    const newdata = {
      id,
      ...data
    }
    return json({data : newdata , status: 201 });

  }catch(errorMessage){
    console.error('Error processing PUT request');
    return json({error : errorMessage},{status: 500});
  }
}

export async function DELETE({ request }) {
  try {
    const { id } = await request.json();
    if (!id) {
      return json({ error: 'ID is required' }, { status: 400 });
    }
    const teacherCollectionRef = adminDb.collection("teacher");
    const teacherDocRef = teacherCollectionRef.doc(id);
    await teacherDocRef.delete();
    return json({ status: 201 });
    } catch (errorMessage) {
    console.error('Error processing DELETE request');
    return json({ error: errorMessage }, { status: 500 });
  }
}
