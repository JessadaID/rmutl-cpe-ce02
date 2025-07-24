import { json } from "@sveltejs/kit";
import { adminDb } from "$lib/server/firebase";

export async function PUT({ params , request }) {
    const id  = params.id; // Extracting the 'id' parameter from the URL
    const { name, email } = await request.json();
    if (!adminDb) {
        console.error("Firebase Admin DB not initialized. Ensure $lib/server/firebase.js is set up correctly.");
        return json({ error: "Server configuration error: Firebase Admin not available." }, { status: 500 });
    }

    try {
        const teacherDocRef = adminDb.collection("teacher").doc(id);
        const docSnapshot = await teacherDocRef.get();

        if (!docSnapshot.exists) {
            return json({ error: "Teacher not found." }, { status: 404 });
        }

        const updatedData = {
            email: email ,
            name: name ,
            // Add any other fields you might need to update
        };

        await teacherDocRef.update(updatedData);
        const newdata = {
            id: docSnapshot.id,
            ...updatedData
        }
        return json({ data : newdata }, { status: 200 });
    } catch (error) {
        console.error("Error updating teacher data:", error);
        return json({ error: "Failed to update teacher data." }, { status: 500 });
    }
}

export async function DELETE({ params }) {
    const id  = params.id; // Extracting the 'id' parameter from the URL
    if (!adminDb) {
        console.error("Firebase Admin DB not initialized. Ensure $lib/server/firebase.js is set up correctly.");
        return json({ error: "Server configuration error: Firebase Admin not available." }, { status: 500 });
    }

    try {
        const teacherDocRef = adminDb.collection("teacher").doc(id);
        const docSnapshot = await teacherDocRef.get();

        if (!docSnapshot.exists) {
            return json({ error: "Teacher not found." }, { status: 404 });
        }

        await teacherDocRef.delete();

        return json({ message: "Teacher deleted successfully." }, { status: 200 });
    } catch (error) {
        console.error("Error deleting teacher data:", error);
        return json({ error: "Failed to delete teacher data." }, { status: 500 });
    }
}