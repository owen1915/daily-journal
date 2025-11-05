import OpenAI from 'openai';
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

async function loadEntries() {
  const user = auth.currentUser;
  if (!user) return [];
  const q = query(collection(db, "journalEntries"), where("uid", "==", user.uid));
  const querySnapshot = await getDocs(q);
  const entries: { id: string; text: string; timestamp: Date }[] = [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const date = data.timestamp.toDate();
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      entries.push({ id: doc.id, text: data.text, timestamp: date });
    }
  });
  return entries;
}

export const generateSummary = async () => {
  const entries = await loadEntries();
  if (!entries.length) return "No entries found for this month.";
  const combinedText = entries.map((e) => e.text).join("\n\n");
  const client = new OpenAI({ apiKey: process.env.OPEN_AI_KEY});
  const response = await client.responses.create({
    model: "gpt-4o-mini",
    input: `Write a 1-2 paragraph report summarizing the following journal entries:\n\n${combinedText}`,
  });
  const output = response.output_text || "";
  return output;
};


