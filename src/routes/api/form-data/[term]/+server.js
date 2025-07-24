import { json } from "@sveltejs/kit";
import { adminDb } from "$lib/server/firebase";
import { convertToDate } from "$lib/convertToDate"; // Ensure this utility function is defined

export async function GET({ params }) {
    let term = params.term; // Assuming the term is passed as a parameter in the URL
    //console.log("Fetching data for term:", term);
    try {
        const dataCollectionRef = adminDb.collection("forms");
        let queryRef = dataCollectionRef.where("term", "==", term);
        const snapshot = await queryRef.get();
        if (snapshot.empty) {
            return json({ data: [] }, { status: 200 });
        }
        const data = snapshot.docs.map(doc => {
            const docData = doc.data();
            //console.log("Document data:", docData);
            return {
                id: doc.id,
                isOpen: typeof docData?.isOpen === 'boolean' ? docData.isOpen : false,
                term: docData?.term || '',
                createdAt: convertToDate(docData?.createdAt),
                updatedAt: convertToDate(docData?.updatedAt),
                projectLimit: docData?.projectLimit || 0,
                directorScoreLimit: docData?.directorScoreLimit || 0,
                adviserScoreLimit: docData?.adviserScoreLimit || 0,
                subjectScoreLimit: docData?.subjectScoreLimit || 0
            };
        });
        return json({ data }, { status: 200 });

        

    }catch (error) {
        console.error("Error fetching data:", error);
        return json({ error: "Failed to fetch data." }, { status: 500 });
    }

}