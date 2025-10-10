"use client";

import "./login.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/journal"); // go to journals after login
    } catch (err) {
      setError(err.message);
    }
  }

  return (
  <div className="login-page">
    <div className="title">
      <h1>Daily Journal</h1>
    </div>
    <div className="login-container">
      <h1>{isRegister ? "Sign Up" : "Login"}</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">
          {isRegister ? "Sign Up" : "Login"}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      <p>
        {isRegister ? "Already have an account?" : "Need an account?"}{" "}
        <button onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "Login" : "Sign Up"}
        </button>
      </p>
    </div>
  </div>
);
}
