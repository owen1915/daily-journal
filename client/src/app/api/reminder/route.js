import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  try {
    const { to, subject, message } = req.body;

    await resend.emails.send({
      from: "Daily Journal <reminder@resend.dev>",
      to,
      subject,
      text: message,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}
