import { goto } from '$app/navigation';
import { createJWT , verifyJWT } from './jwt.ts';
import { warningToast, dangerToast } from './customtoast.js';


export async function goToProject_Details(projectId) {
        try {
			const payload = { projectId };
			const token = await createJWT(payload);
			//console.log('Token:', token);
			goto(`/cpe02/data/term/project-detail?token=${token}`);
		} catch (err) {
			console.error('Error creating JWT:', err);
            dangerToast('สร้าง Token ไม่สำเร็จ');
			// Handle error appropriately, e.g., display an error message to the user
		}
    }
