"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import "./stats.css";
import MoodCalendar from "./components/calender";


export default function StatsPage() {
    const router = useRouter();
    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pastEntries, setPastEntries] = useState([]);

    const [summary, setSummary] = useState("");

    useEffect(() => {
    async function fetchSummary() {
        const user = auth.currentUser;
        if (!user) return;

        // load entries client-side (you already have permission)
        const q = query(collection(db, "journalEntries"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const entries = [];
        querySnapshot.forEach((doc) => {
        entries.push({ id: doc.id, ...doc.data(), timestamp: doc.data().timestamp.toDate() });
        });

        try {
        const res = await fetch("/api/summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ entries }),
        });
        const data = await res.json();
        setSummary(data.summary || "No summary available.");
        } catch (err) {
        console.error("Error fetching summary:", err);
        setSummary("Error generating summary.");
        }
    }

    fetchSummary();
    }, []);


    useEffect( () => {
        console.log(summary);
    }, [summary])


    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user) router.push("/login");
            else loadEntries();
        });
        return () => unsubscribe();
    }, []);

    async function loadEntries() {
        const user = auth.currentUser;
        if (!user) return;

        setLoading(true);
        try {
            const q = query(
            collection(db, "journalEntries"),
            where("uid", "==", user.uid)
            );
            const querySnapshot = await getDocs(q);
            const entries = [];
            querySnapshot.forEach((doc) => {
            entries.push({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp.toDate()
            });
            });

            // sort newest first
            entries.sort((a, b) => b.timestamp - a.timestamp);

            // calculate streak right here using entries
            calculateStreak(entries);
            setPastEntries(entries);
        } catch (err) {
            console.error("Error loading entries:", err);
        } finally {
            setLoading(false);
        }
    }

    function calculateStreak(entries) {
        if (entries.length === 0) return setStreak(0);

        entries.sort((a, b) => a.timestamp - b.timestamp);

        let currentStreak = 1;
        for (let i = entries.length - 1; i > 0; i--) {
            const curr = entries[i].timestamp;
            const prev = entries[i - 1].timestamp;
            const diffDays = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) currentStreak++;
            else if (diffDays > 1) break;
        }

        const last = entries[entries.length - 1].timestamp;
        const now = new Date();
        const daysSinceLast = Math.floor((now - last) / (1000 * 60 * 60 * 24));
        if (daysSinceLast > 1) currentStreak = 0;

        setStreak(currentStreak);
    }
    
    function handleLogout() {
        signOut(auth);
        router.push("/login");
    }

    function handleTransport() {
        router.push("/journal");
    }

    return (
    <div className="stats-page">
        <div className="button-container">
        <button onClick={handleTransport} className="transport">Journal</button>
        <button onClick={handleLogout} className="logout">Logout</button>
        </div>

        <h1 className="title">Daily Journal</h1>

        <div className="stats-content">

        <div className="left-container">
            <div className="stats-container">
                <div className="streak-box">
                    <h2>🔥 Current Streak: {streak} day{streak !== 1 ? "s" : ""}</h2>
                </div>
            </div>
            <MoodCalendar entries={pastEntries} />
        </div>
        


        <div className="summary-container">
            <h2 className="summary-title">🧠 Monthly Summary</h2>
            <p className="summary-text">{summary || "Generating summary..."}</p>
        </div>

        </div>
    </div>
    );

}