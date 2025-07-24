import { json } from "@sveltejs/kit";
import { adminDb } from "$lib/server/firebase";


export async function PUT({ params , request }) {
    const id  = params.id; // Extracting the 'id' parameter from the URL
    const {title , description , dueDate , term} = await request.json(); // Assuming the request body contains the updated fields
    if (!adminDb) {
        console.error("Firebase Admin DB not initialized. Ensure $lib/server/firebase.js is set up correctly.");
        return json({ error: "Server configuration error: Firebase Admin not available." }, { status: 500 });
    }
    
    try {
        const taskDocRef = adminDb.collection("Task").doc(id);
        const docSnapshot = await taskDocRef.get();
    
        if (!docSnapshot.exists) {
        return json({ error: "Task not found." }, { status: 404 });
        }
    
        const updatedData = {
            title: title || docSnapshot.data().title,
            description: description || docSnapshot.data().description,
            dueDate: dueDate || docSnapshot.data().dueDate,
            index: index || docSnapshot.data().index,
            term: term || docSnapshot.data().term,
        };
    
        await taskDocRef.update(updatedData);
    
        return json({ message: "Task updated successfully." }, { status: 200 });
    } catch (error) {
        console.error("Error updating task data:", error);
        return json({ error: "Failed to update task data." }, { status: 500 });
    }
}

export async function DELETE({ params }) {
    const id  = params.id; // Extracting the 'id' parameter from the URL
    if (!adminDb) {
        console.error("Firebase Admin DB not initialized. Ensure $lib/server/firebase.js is set up correctly.");
        return json({ error: "Server configuration error: Firebase Admin not available." }, { status: 500 });
    }
    
    try {
        const taskDocRef = adminDb.collection("Task").doc(id);
        const docSnapshot = await taskDocRef.get();
    
        if (!docSnapshot.exists) {
            return json({ error: "Task not found." }, { status: 404 });
        }
    
        await taskDocRef.delete();
    
        return json({ message: "Task deleted successfully." }, { status: 200 });
    } catch (error) {
        console.error("Error deleting task data:", error);
        return json({ error: "Failed to delete task data." }, { status: 500 });
    }
}