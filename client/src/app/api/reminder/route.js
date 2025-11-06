import { Resend } from "resend";
import admin from "firebase-admin";

// initialize firebase admin once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}
const db = admin.firestore();
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  try {
    // get today's 00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const users = await db.collection("users").get();
    for (const user of users.docs) {
      const { email, uid } = user.data();

      // skip if user has no email
      if (!email) continue;

      // check if they have an entry today
      const entries = await db
        .collection("journalEntries")
        .where("uid", "==", uid)
        .where("timestamp", ">=", today)
        .get();

      if (entries.empty) {
        await resend.emails.send({
          from: "Daily Journal <reminder@resend.dev>",
          to: email,
          subject: "Don't forget your journal entry today ✍️",
          text:
            "Hey! Just a reminder to write your journal entry for today before the day ends.",
        });
        console.log(`sent reminder to ${email}`);
      }
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}
