// src/routes/api/project-data/+server.js
import { json } from "@sveltejs/kit";
import { adminDb } from "$lib/server/firebase"; 

// ฟังก์ชันสำหรับ format ข้อมูลให้อยู่ในรูปแบบที่ต้องการ
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
    email: docData?.email || "",
    score_from_subject_teacher: docData?.score_from_subject_teacher || 0,
  };
}

// GET: ดึงข้อมูลโปรเจค
export async function GET({ url }) {
  if (!adminDb) {
    console.error("Firebase Admin DB not initialized.");
    return json({ error: "Server configuration error: Firebase Admin not available." }, { status: 500 });
  }

  try {
    const searchParams = url.searchParams;
    const term = searchParams.get("term");
    const status = searchParams.get("status");
    const email = searchParams.get("email");
    const projectid = searchParams.get("projectid");
    
    const projectCollectionRef = adminDb.collection("project-approve");
    
    // ถ้ามี projectid ให้ดึงข้อมูล project นั้นโดยตรง
    if (projectid) {
      const docRef = projectCollectionRef.doc(projectid);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return json({ data: [] }, { status: 200 });
      }
      
      const data = [formatDocData(doc)];
      return json({ data }, { status: 200 });
    }
    
    // ถ้าไม่มี projectid ให้ดึงข้อมูลตาม query conditions
    let queryRef = projectCollectionRef;
    
    const fieldsToSelect = [
      'project_name_th',
      'project_name_en', 
      'status',
      'members',
      'Tasks',
      'term',
      'adviser',
      'directors',
      'email',
      'score_from_subject_teacher'
    ];

    // สร้าง query conditions
    const conditions = [
      { field: 'term', value: term },
      { field: 'status', value: status },
      { field: 'email', value: email }
    ];

    // Apply filters
    conditions.forEach(condition => {
      if (condition.value) {
        queryRef = queryRef.where(condition.field, "==", condition.value);
      }
    });

    // Execute query with field selection
    const snapshot = await queryRef.select(...fieldsToSelect).get();
    
    if (snapshot.empty) {
      return json({ data: [] }, { status: 200 });
    }

    const data = snapshot.docs.map(doc => formatDocData(doc));
    
    return json({ data }, { status: 200 });
    
  } catch (error) {
    console.error("Error fetching projects:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch project data";
    return json({ error: errorMessage }, { status: 500 });
  }
}