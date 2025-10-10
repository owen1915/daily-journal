"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase"; // only auth, no Firestore
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import "./journal.css";

export default function JournalPage() {
  const [entry, setEntry] = useState("");
  const [entries, setEntries] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) router.push("/login");
      else loadEntries(user.uid);
    });
    return () => unsubscribe();
  }, []);

  // --- Backend placeholder ---
  async function loadEntries(uid) {
    console.log("Fetching entries for user:", uid);
    // TODO: GET from your backend
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !entry.trim()) return;

    console.log("Submitting entry:", entry);
    // TODO: POST to your backend

    setEntry("");
    await loadEntries(user.uid);
  }

  function handleLogout() {
    signOut(auth);
    router.push("/login");
  }

  // --- UI ---
  return (
    <div className="journal-page">
      <button onClick={handleLogout} className="logout">Logout</button>

      <div className="title">
        <h1>Daily Journal</h1>
      </div>

      <div className="journal-container">
        <h1>Add Journal Entry</h1>
        <form onSubmit={handleSubmit}>
          <textarea
            placeholder="Write your thoughts..."
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            rows="4"
          ></textarea>
          <button type="submit">Add Entry</button>
        </form>
      </div>
    </div>
  );
}
