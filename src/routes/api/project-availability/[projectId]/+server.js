import { adminDb } from '$lib/server/firebase';
import { json } from '@sveltejs/kit';

export async function GET({ params }) {
    const { projectId } = params;
    //console.log('Checking availability for projectId:', projectId);
    try {
        // ตรวจสอบว่า projectId มีอยู่ในฐานข้อมูลหรือไม่
        const projectDoc = await adminDb.collection('project-availability').doc(projectId).get();
        if (!projectDoc.exists) {
            return json({ 
                error: 'Project not found',
            }, { status: 404 });
        }

        const projectData = await projectDoc.data();

        // ถ้า projectId มีอยู่ ให้ส่งกลับข้อมูลโปรเจกต์
        return json({ 
            projectData
        }, { status: 200 });

    } catch (error) {
        console.error('Error checking project availability:', error);
        return json({ 
            error: 'Internal Server Error',
        }, { status: 500 });
    }
}

export async function POST({ request, params }) {
    const { projectId } = params;
    let requestData;
    try {
        requestData = await request.json();
    } catch (e) {
        return json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { studentEmail, studentName, teacherEmail, slot , remarks} = requestData;
    //console.log('Updating availability for projectId:', projectId, 'by student:', studentEmail, 'for teacher:', teacherEmail, 'at slot:', slot);
    //console.log(typeof(slot))
    // Input validation
    if (!studentEmail || typeof studentEmail !== 'string' || studentEmail.trim() === '') {
        return json({ error: 'studentEmail is required and must be a non-empty string.' }, { status: 400 });
    }
    if (!studentName || typeof studentName !== 'string' || studentName.trim() === '') {
        return json({ error: 'studentName is required and must be a non-empty string.' }, { status: 400 });
    }
    if (!teacherEmail || typeof teacherEmail !== 'string' || teacherEmail.trim() === '') {
        return json({ error: 'teacherEmail is required and must be a non-empty string.' }, { status: 400 });
    }
    if (slot === undefined || slot === null) { // Basic check for slot presence
        return json({ error: 'slot is required.' }, { status: 400 });
    }

    try {
        // ตรวจสอบว่า projectId มีอยู่ในฐานข้อมูลหรือไม่
        const projectDocRef = adminDb.collection('project-availability').doc(projectId);
        const projectDoc = await projectDocRef.get();

        if (!projectDoc.exists) {
            return json({ 
                error: 'Project not found',
            }, { status: 404 });
        }

        const projectData = projectDoc.data();
        const studentSelections = projectData.studentSelections || {};

        let studentEntry = studentSelections[studentEmail];

        if (!studentEntry) {
            // This is the first time this student is making any appointment for this project
            studentEntry = {
                name: studentName,
                appointments: [] // Initialize an array to hold appointments with different teachers
            };
            studentSelections[studentEmail] = studentEntry;
        } else {
            // Student already has a record, update their name (in case it changed)
            // and ensure the appointments array exists
            studentEntry.name = studentName;
            if (!Array.isArray(studentEntry.appointments)) {
                studentEntry.appointments = [];
            }
        }

        const newAppointmentDetail = {
            teacherEmail,
            slot,
            remarks: remarks || '', // Student's remarks
            teacherRemarks: '' // Initialize teacher's remarks as empty
        };

        // Check if an appointment with this specific teacher already exists for this student
        const existingAppointmentIndex = studentEntry.appointments.findIndex(
            app => app.teacherEmail === teacherEmail
        );

        let message;
        if (existingAppointmentIndex !== -1) {
            // Update existing appointment for this teacher
            // Preserve existing teacherRemarks if any, unless this POST is meant to overwrite it (which is unlikely for student's action)
            const oldTeacherRemarks = studentEntry.appointments[existingAppointmentIndex].teacherRemarks || '';
            studentEntry.appointments[existingAppointmentIndex] = newAppointmentDetail;
            studentEntry.appointments[existingAppointmentIndex].teacherRemarks = oldTeacherRemarks; // Preserve old teacher remarks

            message = 'การนัดหมายกับอาจารย์ท่านนี้ได้รับการอัปเดตแล้ว';
        } else {
            // Add new appointment for this teacher
            studentEntry.appointments.push(newAppointmentDetail);
            message = 'เพิ่มการนัดหมายใหม่เรียบร้อยแล้ว';
        }

        await projectDocRef.update({
            studentSelections: studentSelections
        });

        return json({
            message: message,
            studentEmail: studentEmail,
            appointmentDetail: newAppointmentDetail // Details of the appointment just processed
        }, { status: 200 });

    } catch (error) {
        console.error('Error updating project availability:', error);
        return json({ 
            error: 'Internal Server Error',
        }, { status: 500 });
    }
}

export async function PUT({ request, params }) {
    const { projectId } = params;
    let requestData;
    try {
        requestData = await request.json();
    } catch (e) {
        return json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // studentEmail and teacherEmail are used to identify the specific appointment to update.
    // newSlot and newRemarks are the new values.
    const { studentEmail, teacherEmail, newSlot, newStudentRemarks, newTeacherRemarks } = requestData; // Added newStudentRemarks and newTeacherRemarks

    // Input validation
    if (!studentEmail || typeof studentEmail !== 'string' || studentEmail.trim() === '') {
        return json({ error: 'studentEmail is required to identify the appointment.' }, { status: 400 });
    }
    if (!teacherEmail || typeof teacherEmail !== 'string' || teacherEmail.trim() === '') {
        return json({ error: 'teacherEmail is required to identify the specific appointment within the student\'s record.' }, { status: 400 });
    }
    if (newSlot === undefined || newSlot === null) { // Basic check for newSlot presence
        return json({ error: 'newSlot data is required for the update.' }, { status: 400 });
    }
    // newStudentRemarks (from student) can be updated by teacher if needed, or kept as is.
    if (typeof newStudentRemarks !== 'string' && newStudentRemarks !== undefined) {
         return json({ error: 'newStudentRemarks must be a string if provided.' }, { status: 400 });
    }
    if (typeof newTeacherRemarks !== 'string' && newTeacherRemarks !== undefined) {
        return json({ error: 'newTeacherRemarks must be a string if provided.' }, { status: 400 });
    }

    try {
        const projectDocRef = adminDb.collection('project-availability').doc(projectId);
        const projectDoc = await projectDocRef.get();

        if (!projectDoc.exists) {
            return json({ error: 'Project not found' }, { status: 404 });
        }

        const projectData = projectDoc.data();
        const studentSelections = projectData.studentSelections || {};
        const studentEntry = studentSelections[studentEmail];

        if (!studentEntry || !Array.isArray(studentEntry.appointments)) {
            return json({ error: 'No appointments found for this student.' }, { status: 404 });
        }

        const appointmentIndex = studentEntry.appointments.findIndex(
            app => app.teacherEmail === teacherEmail
        );

        if (appointmentIndex === -1) {
            return json({ error: 'Appointment with the specified teacher not found for this student.' }, { status: 404 });
        }

        // Update the specific appointment
        studentEntry.appointments[appointmentIndex].slot = newSlot;
        // Update student's remarks if provided, otherwise keep existing
        if (newStudentRemarks !== undefined) {
            studentEntry.appointments[appointmentIndex].remarks = newStudentRemarks;
        }
        // Update teacher's remarks if provided, otherwise keep existing
        studentEntry.appointments[appointmentIndex].teacherRemarks = newTeacherRemarks === undefined ? (studentEntry.appointments[appointmentIndex].teacherRemarks || '') : newTeacherRemarks;

        await projectDocRef.update({
            studentSelections: studentSelections // Update the entire studentSelections map
        });

        return json({ message: 'Appointment updated successfully.', updatedAppointment: studentEntry.appointments[appointmentIndex] }, { status: 200 });

    } catch (error) {
        console.error('Error updating appointment:', error);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
}