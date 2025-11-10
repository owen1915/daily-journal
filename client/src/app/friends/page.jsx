"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
  addDoc,
  arrayUnion,
} from "firebase/firestore";
import "./friends.css";
import { signOut } from "firebase/auth";

export default function FriendsPage() {
  const router = useRouter();
  const [searchEmail, setSearchEmail] = useState("");
  const [friends, setFriends] = useState([]); // [{id, email}]
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [friendEntries, setFriendEntries] = useState([]);
  const [user, setUser] = useState(null);

  function handleLogout() {
    signOut(auth);
    router.push("/login");
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (!u) router.push("/login");
      else {
        setUser(u);
        loadFriends(u.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  async function loadFriends(uid) {
    setLoading(true);
    try {
      // load accepted friends
      const friendDoc = await getDoc(doc(db, "friends", uid));
      let friendIds = [];
      if (friendDoc.exists()) {
        friendIds = friendDoc.data().friendIds || [];
      }

      const friendData = [];
      for (const fid of friendIds) {
        try {
          const uDoc = await getDoc(doc(db, "users", fid));
          if (uDoc.exists()) {
            friendData.push({ id: fid, email: uDoc.data().email || fid });
          } else {
            friendData.push({ id: fid, email: fid });
          }
        } catch {
          friendData.push({ id: fid, email: fid });
        }
      }
      setFriends(friendData);

      // load pending requests sent TO this user
      const pq = query(
        collection(db, "friendRequests"),
        where("to", "==", uid),
        where("status", "==", "pending")
      );
      const snap = await getDocs(pq);
      const pendingRequests = [];

      for (const docu of snap.docs) {
        const data = docu.data();
        const fromUser = await getDoc(doc(db, "users", data.from));
        pendingRequests.push({
          id: docu.id,
          from: data.from,
          fromEmail: fromUser.exists() ? fromUser.data().email : data.from,
        });
      }

      setPending(pendingRequests);
    } catch (err) {
      console.error("Error loading friends:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!searchEmail.trim()) return;
    setLoading(true);
    try {
      const q = query(collection(db, "users"), where("email", "==", searchEmail.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const friend = snap.docs[0];
        setSearchResult({ id: friend.id, ...friend.data() });
      } else {
        setSearchResult("not-found");
      }
    } catch (err) {
      console.error("Error searching:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddFriend(friendId) {
    if (!user || !friendId) return;
    try {
      // check if request already exists
      const q = query(
        collection(db, "friendRequests"),
        where("from", "==", user.uid),
        where("to", "==", friendId)
      );
      const existing = await getDocs(q);
      if (!existing.empty) {
        alert("Friend request already sent!");
        return;
      }

      await addDoc(collection(db, "friendRequests"), {
        from: user.uid,
        to: friendId,
        status: "pending",
        timestamp: new Date(),
      });
      alert("Friend request sent!");
      setSearchResult(null);
    } catch (err) {
      console.error("Error sending friend request:", err);
    }
  }

  async function handleAccept(req) {
    if (!user) return;
    try {
      await setDoc(
        doc(db, "friends", user.uid),
        { friendIds: arrayUnion(req.from) },
        { merge: true }
      );
      await setDoc(
        doc(db, "friends", req.from),
        { friendIds: arrayUnion(user.uid) },
        { merge: true }
      );

      await setDoc(
        doc(db, "friendRequests", req.id),
        { status: "accepted" },
        { merge: true }
      );

      loadFriends(user.uid);
    } catch (err) {
      console.error("Error accepting friend:", err);
    }
  }

  async function handleViewFriendEntries(friendId) {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "journalEntries"),
        where("uid", "==", friendId),
        where("privacy", "==", "public")
      );
      const snap = await getDocs(q);
      const entries = [];
      snap.forEach((d) =>
        entries.push({ id: d.id, ...d.data(), timestamp: d.data().timestamp.toDate() })
      );
      setFriendEntries(entries);
    } catch (err) {
      console.error("Error loading friend entries:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="friends-page">
      <div className="button-container">
        <button onClick={() => router.push("/journal")} className="transport">
          Journal
        </button>
        <button onClick={() => router.push("/stats")} className="transport">
          Stats
        </button>
        <button onClick={handleLogout} className="logout">Logout</button>
      </div>

      <h1 className="title">Friends</h1>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search by email..."
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
        />
        <button onClick={handleSearch} disabled={loading}>
          Search
        </button>
      </div>

      {searchResult === "not-found" && <p>No user found.</p>}
      {searchResult && searchResult.id && (
        <div className="search-result">
          <p>Found: {searchResult.email}</p>
          <button onClick={() => handleAddFriend(searchResult.id)}>Send Friend Request</button>
        </div>
      )}

      {!loading && pending.length > 0 && (
        <>
        <h2>Pending Requests</h2>
        <ul className="friends-list">
        {pending.map((req) => (
            <li key={req.id}>
            <span>{req.fromEmail}</span>
            <button onClick={() => handleAccept(req)}>Accept</button>
            </li>
        ))}
        </ul>
        </>
     )}

      <h2>Your Friends</h2>
      {!loading && friends.length === 0 && <p>No friends yet.</p>}
      {!loading && friends.length > 0 && (
        <ul className="friends-list">
          {friends.map((f, i) => (
            <li key={i}>
              <span>{f.email}</span>
              <button onClick={() => handleViewFriendEntries(f.id)}>View Public Entries</button>
            </li>
          ))}
        </ul>
      )}

      {friendEntries.length > 0 && (
        <div className="friend-entries">
          <h3>Friend's Public Entries</h3>
          {friendEntries.map((entry) => (
            <div key={entry.id} className="entry-card">
              <div className="entry-date">
                {entry.timestamp.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <div className="entry-mood">Mood: {entry.mood}/10</div>
              <div
                className="entry-text"
                dangerouslySetInnerHTML={{ __html: entry.htmlContent || entry.text }}
              ></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
