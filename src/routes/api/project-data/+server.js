// src/routes/api/project-data/+server.js
import {  json } from "@sveltejs/kit";
import { adminDb } from "$lib/server/firebase"; 

// ฟังก์ชันสำหรับ format ข้อมูลให้อยู่ในรูปแบบที่ต้องการ (ลดการทำซ้ำ)
function formatDocData(doc) {
  const docData = doc.data();
  return {
    id: doc.id,
    project_name_th: docData?.project_name_th || "",
    project_name_en: docData?.project_name_en || "",
    status: docData?.status || "",
    members: Array.isArray(docData?.members) ? docData.members : [],
    Tasks: docData?.Tasks || {},
    term: docData?.term || "",
    adviser: Array.isArray(docData?.adviser) ? docData.adviser : [],
    directors: docData?.directors || [],
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
    const status = url.searchParams.get("status");
    const email = url.searchParams.get("email");

    const projectCollectionRef = adminDb.collection("project-approve");
    let queryRef = projectCollectionRef; // Base query reference for Admin SDK

    // Fields to select based on formatDocData function
    // This reduces the amount of data fetched from Firestore.
    const fieldsToSelect = [
      'project_name_th',
      'project_name_en',
      'status',
      'members',
      'Tasks',
      'term',
      'adviser',
      'directors'
    ];

    if (term) {
      queryRef = queryRef.where("term", "==", term);
    }
    if (status) {
      queryRef = queryRef.where("status", "==", status);
    }
    if (email) {
      // Ensure an index exists in Firestore for this query if combining with other filters.
      queryRef = queryRef.where("email", "==", email);
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
