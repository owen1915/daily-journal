"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import "./stats.css";



export default function StatsPage() {
    const router = useRouter();
    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pastEntries, setPastEntries] = useState([]);

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
        if (entries.length > 0) {
            let currentStreak = 1;
            for (let i = 1; i < entries.length; i++) {
                const prev = entries[i - 1].timestamp;
                const curr = entries[i].timestamp;
                const diffDays = Math.floor((prev - curr) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) currentStreak++;
                else if (diffDays > 1) break;
            }
            setStreak(currentStreak);
        } 
        else {
            setStreak(0);
        }
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
            <div className="stats-container">
                <div className="stats-content">
                    <div className="streak-box">
                        <h2>🔥 Current Streak: {streak} day{streak !== 1 ? "s" : ""}</h2>
                    </div>
                </div>
            </div>
        </div>
    );
}