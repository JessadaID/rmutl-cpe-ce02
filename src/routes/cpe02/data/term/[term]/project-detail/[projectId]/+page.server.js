// +page.server.js
import { error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase.js';

function toISOIfTimestamp(value) {
  return value?.toDate ? value.toDate().toISOString() : value;
}

export async function load({ params }) {
  const { projectId } = params;

  try {
    const projectSnap = await adminDb.collection('project-approve').doc(projectId).get();

    if (!projectSnap.exists) {
      throw error(404, 'ไม่พบข้อมูลโครงงานที่ระบุ');
    }

    const project = projectSnap.data();

    // แปลง Timestamp เป็น ISO string
    ['lastModified', 'createdAt', 'lastUpdated'].forEach(
      (key) => (project[key] = toISOIfTimestamp(project[key]))
    );

    return { project, projectId, isNotFound: false };
  } catch (err) {
    console.error('Error fetching project:', err);

    // ถ้าเป็น error ของ SvelteKit ให้โยนต่อ
    if (err?.status && err?.body) throw err;

    throw error(500, 'เกิดข้อผิดพลาดในการดึงข้อมูล');
  }
}
