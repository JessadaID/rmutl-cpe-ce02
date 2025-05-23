import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase'; // Import Firebase Admin instance

export async function GET({ url }) {
  if (!adminDb) {
    console.error("Firebase Admin DB not initialized. Ensure $lib/server/firebase.js (or similar) is set up correctly.");
    return json({ error: "Server configuration error: Firebase Admin not available." }, { status: 500 });
  }

  try {
    const dataCollectionRef = adminDb.collection("forms");
    let queryRef = dataCollectionRef; // Base query reference for Admin SDK

    const isOpenParam = url.searchParams.get('isOpen');
    const sortByCreatedAtDirection = url.searchParams.get('createdAt'); // Expects 'asc' or 'desc'

    // Fields to select based on the data transformation
    const fieldsToSelect = [
      'isOpen',
      'term',
      'createdAt',
      'updatedAt',
      'projectLimit'
    ];

    if (isOpenParam !== null) {
      const isOpen = isOpenParam === 'true';  // Convert to boolean
      queryRef = queryRef.where("isOpen", "==", isOpen);
    }

    // Apply orderBy if the parameter is provided and is a valid direction
    if (sortByCreatedAtDirection && (sortByCreatedAtDirection.toLowerCase() === 'asc' || sortByCreatedAtDirection.toLowerCase() === 'desc')) {
      queryRef = queryRef.orderBy("createdAt", sortByCreatedAtDirection.toLowerCase());
    }

    // Apply select() to the query and then get the documents
    const snapshot = await queryRef.select(...fieldsToSelect).get();

    if (snapshot.empty) {
      return json({ data: [] }, { status: 200 });
    }

    const data = snapshot.docs.map(doc => {
      const docData = doc.data();
      return {
        id: doc.id,
        isOpen: typeof docData?.isOpen === 'boolean' ? docData.isOpen : false,
        term: docData?.term || '',
        createdAt: convertFirestoreTimestamp(docData?.createdAt),
        updatedAt: convertFirestoreTimestamp(docData?.updatedAt),
        projectLimit: docData?.projectLimit || 0,
      };
    });

    return json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error processing GET request:', error);
    return json({ error: 'Failed to process request' }, { status: 500 });
  }
}

function convertFirestoreTimestamp(timestamp) {
  // Firestore Admin SDK returns a Timestamp object directly
  if (!timestamp || !timestamp.seconds) return null;
  const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
  const year = date.getFullYear();

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;

}

