"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { collection, addDoc } from "firebase/firestore";
import "./journal.css";

export default function JournalPage() {
  const [entry, setEntry] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) router.push("/login");
    });
    return () => unsubscribe();
  }, []);

  async function loadEntries() {
    // skeleton to load entries for showcasing
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !entry.trim()) return;

    try {
      await addDoc(collection(db, "journalEntries"), {
        uid: user.uid,
        text: entry.trim(),
        timestamp: new Date(),
      });

      console.log("Submitted entry:", entry);
      setEntry("");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000); // disappear after 2 seconds
    } catch (err) {
      console.error("Error submitting entry:", err);
    }
  }

  function handleLogout() {
    signOut(auth);
    router.push("/login");
  }

  return (
    <div className="journal-page">
      <button onClick={handleLogout} className="logout">Logout</button>

      {showSuccess && (
        <div className="success-popup">
          Submitted!
        </div>
      )}

      <div className="title">
        <h1>Daily Journal</h1>
      </div>

      <div className="journal-container">
        <h1>Add Journal Entry</h1>
        <form onSubmit={handleSubmit}>
          <textarea
            placeholder="Write how you feel..."
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
