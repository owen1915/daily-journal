"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import "./stats.css";



export default function StatsPage() {
    const router = useRouter();

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

                </div>
            </div>
        </div>
    );
}