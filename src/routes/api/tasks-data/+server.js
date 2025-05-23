// src/routes/api/project-data/+server.js
import {  json } from "@sveltejs/kit";
import { adminDb } from "$lib/server/firebase"; 

// ฟังก์ชันสำหรับ format ข้อมูลให้อยู่ในรูปแบบที่ต้องการ (ลดการทำซ้ำ)
function formatDocData(doc) {
  const docData = doc.data();
  return {
    id: doc.id,
    term: docData?.term || "",
    title: docData?.title || "",
    index: docData?.index || "",
    dueDate: docData?.dueDate || "",
    description: docData?.description || "",
  };
}

// GET: ดึงข้อมูลโปรเจคทั้งหมด
export async function GET({ url }) {
  if (!adminDb) {
    console.error("Firebase Admin DB not initialized. Ensure $lib/server/firebaseAdmin.js is set up correctly.");
    return json({ error: "Server configuration error: Firebase Admin not available." }, { status: 500 });
  }

  try {
    // เพิ่มการกรองด้วย query parameters (เช่น ?term=2023)
    const term = url.searchParams.get("term");

    const projectCollectionRef = adminDb.collection("Task");
    let queryRef = projectCollectionRef; // Base query reference for Admin SDK

    // Fields to select based on formatDocData function
    // This reduces the amount of data fetched from Firestore.
    const fieldsToSelect = [
      'term',
      'title',
      'index',
      'dueDate',
      'description',
    ];

    if (term) {
      queryRef = queryRef.where("term", "==", term);
    }
 

    // Apply select() to the query and then get the documents
    const snapshot = await queryRef.select(...fieldsToSelect).get();
    
    if (snapshot.empty) {
      return json({ data: [] }, { status: 200 });
    }

    const data = snapshot.docs.map(formatDocData);

    return json({ data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching projects:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch project data";
    return json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST({ request }) {
    const data = await request.json();
    const { term, title, index, dueDate, description } = data;
    try {
        const projectCollectionRef = adminDb.collection("Task");
        const newProjectRef = projectCollectionRef.doc(); // Create a new document reference
        await newProjectRef.set({
            term,
            title,
            index,
            dueDate,
            description,
        });
        return json({ success: true, id: newProjectRef.id }, { status: 201 });
    } catch (error) {
        console.error("Error creating project:", error);
        return json({ error: "Failed to create project" }, { status: 500 });
    }
}

export async function PUT ({ request }) {
    const data = await request.json();
    const { id, term, title, index, dueDate, description } = data;
    try {
        const projectCollectionRef = adminDb.collection("Task");
        const projectRef = projectCollectionRef.doc(id); // Get the document reference by ID
        await projectRef.update({
            term,
            title,
            index,
            dueDate,
            description,
        });
        return json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error updating project:", error);
        return json({ error: "Failed to update project" }, { status: 500 });
    }
}

export async function DELETE({ request }) {
    const data = await request.json();
    const { id } = data;
    try {
        const projectCollectionRef = adminDb.collection("Task");
        const projectRef = projectCollectionRef.doc(id); // Get the document reference by ID
        await projectRef.delete();
        return json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error deleting project:", error);
        return json({ error: "Failed to delete project" }, { status: 500 });
    }
}