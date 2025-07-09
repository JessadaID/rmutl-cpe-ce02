import { adminDb } from "$lib/server/firebase"; 
import { json } from "@sveltejs/kit";

export async function GET({ params }) {
    let projectid =  params.id; // Assuming the ID is passed as a parameter in the URL
    
    try {
        const projectCollectionRef = adminDb.collection("project-approve");
        const docRef = projectCollectionRef.doc(projectid);
        const doc = await docRef.get();
        const data = doc.data();  
        const id = doc.id;
        
        return json({ data , id }, { status: 200 }) 
    } catch (error) {
        return json({ error: "Failed to fetch project data" }, { status: 500 })
    }
}

export async function POST({  params , request}) {
    try {
        let projectid =  params.id; // Assuming the ID is passed as a parameter in the URL
        let { score_from_subject_teacher } = await request.json();
        const projectCollectionRef = adminDb.collection("project-approve");
        const docRef = projectCollectionRef.doc(projectid);
        await docRef.update({ score_from_subject_teacher });
        const id = docRef.id;
        return json({ id , status: 200 })
    } catch (error) {
        return json({ error: "Failed to update project data" }, { status: 500 })
    }
}

//export async function PUT({ params }) {
//    let id =  params.id; // Assuming the ID is passed as a parameter in the URL
//    return json({ id }, { status: 200 })
//}
//
//export async function DELETE({ request }) {
//
//}