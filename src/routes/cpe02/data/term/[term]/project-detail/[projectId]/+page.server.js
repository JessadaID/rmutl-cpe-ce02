// +page.server.js
import { error, redirect } from '@sveltejs/kit';
import { adminDb } from "$lib/server/firebase.js";

export async function load({ params }) {
  // Get projectId from URL parameter or route parameter
  const projectId = params.projectId ;

  try {
    // Fetch project data using Firebase Admin
    const projectRef = adminDb.collection("project-approve").doc(projectId);
    const projectSnap = await projectRef.get();

    if (!projectSnap.exists) {
      console.error("Project not found in project-approve");
      throw error(404, "ไม่พบข้อมูลโครงงานที่ระบุ");
    }

    const project = projectSnap.data();

    // Convert Firestore Timestamp to a serializable format (e.g., ISO string).
    // SvelteKit cannot serialize Firestore Timestamp objects directly.
    if (project.lastModified && typeof project.lastModified.toDate === 'function') {
      project.lastModified = project.lastModified.toDate().toISOString();
    }
    if (project.createdAt && typeof project.createdAt.toDate === 'function') {
      project.createdAt = project.createdAt.toDate().toISOString();
    }
    if (project.lastUpdated && typeof project.lastUpdated.toDate === 'function') {
      project.lastUpdated = project.lastUpdated.toDate().toISOString();
    }

    //console.log("Fetched project data:", {project, projectId, isNotFound: false}); // Log fetched project data for debugging
    return {
      project,
      projectId,
      isNotFound: false
    };

  } catch (err) {
    console.error("Error fetching data:", err);
    throw error(500, "เกิดข้อผิดพลาดในการดึงข้อมูล");
  }
}