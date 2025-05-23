import { json } from "@sveltejs/kit";
import { adminDb, admin } from "$lib/server/firebase";

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { title, messageBody, userId } = body;

    if (!title || !messageBody) {
      return json(
        { error: "Title and body are required" },
        { status: 400 }
      );
    }

    let tokens = [];

    if (userId) {
      // ส่งเฉพาะผู้ใช้คนเดียว
      const userDoc = await adminDb.collection("users").doc(userId).get();
      const userData = userDoc.data();

      if (userDoc.exists && userData?.fcmToken) {
        tokens.push(userData.fcmToken);
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
      return json({ success: true, response }, { status: 200 });
    } else {
      return json({ success: false, message: "No tokens found" }, { status: 200 });
    }

  } catch (error) {
    console.error("Error sending notification:", error);
    return json({
      error: "Failed to send notification",
      details: error.message,
    }, { status: 500 });
  }
}
