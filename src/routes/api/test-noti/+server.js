import { json } from "@sveltejs/kit";
import { adminDb , admin} from "$lib/server/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { title, messageBody, userId } = body;
    //console.log("body", messageBody);

    if (!title || !messageBody) {
      return json(
        { error: "Title and body are required" },
        { status: 400 }
      );
    }

    let tokens = [];

    if (userId) {
      // ส่งไปยังผู้ใช้ที่ระบุ
      const userTokensRef = adminDb
        .collection("users")
        .doc(userId)
        .collection("fcmTokens");
      const snapshot = await userTokensRef.get();
      tokens = snapshot.docs.map((doc) => doc.data().token);
    } else {
      // ส่งไปยังทุกคน (ดึง tokens ทั้งหมดจาก users)
      const usersRef = adminDb.collection("users");
      const usersSnapshot = await usersRef.get();

      for (const userDoc of usersSnapshot.docs) {
        const fcmTokensRef = userDoc.ref.collection("fcmTokens");
        const tokensSnapshot = await fcmTokensRef.get();
        tokens.push(...tokensSnapshot.docs.map((doc) => doc.data().token));
      }
    }

    if (tokens.length > 0) {
      const message = {
        notification: { title, body: messageBody },
        tokens,
      };
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(response.successCount + " messages were sent successfully");
      return json({ success: true, response }, { status: 200 });
    } else {
      return json({ success: false, message: "No tokens found" }, { status: 200 });
    }
  } catch (error) {
    console.error("Error sending notification:", error);
    return json({ error: "Failed to send notification", details: error.message }, { status: 500 });
  }
}
