import { json } from "@sveltejs/kit";
import { adminDb, admin } from "$lib/server/firebase";

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { title, messageBody, email } = body;

    if (!title || !messageBody) {
      return json(
        { error: "Title and body are required" },
        { status: 400 }
      );
    }

    let tokens = [];

    if (email) {
      // ส่งเฉพาะผู้ใช้คนเดียว
      const userSnapshot = await adminDb.collection("users").where("email", "==", email).limit(1).get();
      
      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();
        
        if (userData?.fcmToken) {
          tokens = [userData.fcmToken];
        }
      }
    } else {
      // ส่งหาทุกคน
      const usersSnapshot = await adminDb.collection("users").get();
      for (const doc of usersSnapshot.docs) {
        const data = doc.data();
        if (data.fcmToken) {
          tokens.push(data.fcmToken);
        }
      }
    }

    if (tokens.length > 0) {
      const message = {
        notification: { title, body: messageBody },
        tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`${response.successCount} messages were sent successfully`);
      
      return json({ 
        success: true, 
        response: {
          successCount: response.successCount,
          failureCount: response.failureCount
        }
      }, { status: 200 });
    } else {
      const message = email 
        ? `No FCM token found for email: ${email}` 
        : "No FCM tokens found for any users";
      
      return json({ 
        success: false, 
        message 
      }, { status: 200 });
    }

  } catch (error) {
    console.error("Error sending notification:", error);
    return json({
      error: "Failed to send notification",
      details: error.message,
    }, { status: 500 });
  }
}