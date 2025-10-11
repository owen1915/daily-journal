"use client";

import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { collection, addDoc, query, where, orderBy, getDocs } from "firebase/firestore";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import "./journal.css";

export default function JournalPage() {
  const [entry, setEntry] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [pastEntries, setPastEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const editorRef = useRef(null);
  const pdfRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) router.push("/login");
      else {
        loadEntries();
      }
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
      // Sort entries by timestamp in descending order (newest first) in JavaScript
      entries.sort((a, b) => b.timestamp - a.timestamp);
      setPastEntries(entries);
    } catch (err) {
      console.error("Error loading entries:", err);
    } finally {
      setLoading(false);
    }
  }

  // Simple rich text editor functions
  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleEditorChange = () => {
    if (editorRef.current) {
      setEntry(editorRef.current.innerHTML);
    }
  };

  const downloadPDF = async () => {
    if (pastEntries.length === 0) {
      alert('No entries to download');
      return;
    }

    setDownloading(true);
    try {
      // Create a temporary container for PDF content
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '800px';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.padding = '40px';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      tempContainer.style.color = 'black';
      document.body.appendChild(tempContainer);

      // Add title
      const title = document.createElement('h1');
      title.textContent = 'My Journal Entries';
      title.style.textAlign = 'center';
      title.style.color = '#0070f3';
      title.style.marginBottom = '30px';
      title.style.fontSize = '24px';
      title.style.borderBottom = '2px solid #0070f3';
      title.style.paddingBottom = '10px';
      tempContainer.appendChild(title);

      // Add entries
      pastEntries.forEach((entry, index) => {
        const entryDiv = document.createElement('div');
        entryDiv.style.marginBottom = '30px';
        entryDiv.style.pageBreakInside = 'avoid';
        entryDiv.style.border = '1px solid #e0e0e0';
        entryDiv.style.borderRadius = '8px';
        entryDiv.style.padding = '20px';
        entryDiv.style.backgroundColor = '#f8f9fa';

        // Add date
        const dateDiv = document.createElement('div');
        dateDiv.style.fontSize = '14px';
        dateDiv.style.color = '#666';
        dateDiv.style.fontWeight = 'bold';
        dateDiv.style.marginBottom = '10px';
        dateDiv.style.borderBottom = '1px solid #dee2e6';
        dateDiv.style.paddingBottom = '8px';
        dateDiv.textContent = entry.timestamp.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        entryDiv.appendChild(dateDiv);

        // Add content
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = entry.htmlContent || entry.text;
        contentDiv.style.fontSize = '16px';
        contentDiv.style.lineHeight = '1.6';
        contentDiv.style.color = '#333';
        entryDiv.appendChild(contentDiv);

        tempContainer.appendChild(entryDiv);
      });

      // Generate PDF
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: 'white'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Clean up
      document.body.removeChild(tempContainer);

      // Download
      const fileName = `journal-entries-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !entry.trim()) return;

    try {
      await addDoc(collection(db, "journalEntries"), {
        uid: user.uid,
        text: entry.trim(),
        htmlContent: entry.trim(),
        timestamp: new Date(),
      });

      console.log("Submitted entry:", entry);
      setEntry("");
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000); // disappear after 2 seconds
      loadEntries(); // Refresh the entries list
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

      <div className="journal-content">
        <div className="journal-container">
          <h1>Add Journal Entry</h1>
          <form onSubmit={handleSubmit}>
            {/* Simple Rich Text Editor Toolbar */}
            <div className="editor-toolbar">
              <button 
                type="button" 
                onClick={() => execCommand('bold')}
                className="toolbar-btn"
                title="Bold"
              >
                <strong>B</strong>
              </button>
              <button 
                type="button" 
                onClick={() => execCommand('italic')}
                className="toolbar-btn"
                title="Italic"
              >
                <em>I</em>
              </button>
              <button 
                type="button" 
                onClick={() => execCommand('underline')}
                className="toolbar-btn"
                title="Underline"
              >
                <u>U</u>
              </button>
              <button 
                type="button" 
                onClick={() => execCommand('strikeThrough')}
                className="toolbar-btn"
                title="Strikethrough"
              >
                <s>S</s>
              </button>
              <div className="toolbar-separator"></div>
              <button 
                type="button" 
                onClick={() => execCommand('fontSize', '7')}
                className="toolbar-btn"
                title="Large Text"
              >
                <span style={{fontSize: '1.2em', fontWeight: 'bold'}}>A+</span>
              </button>
              <button 
                type="button" 
                onClick={() => execCommand('fontSize', '3')}
                className="toolbar-btn"
                title="Small Text"
              >
                <span style={{fontSize: '0.8em'}}>A-</span>
              </button>
              <div className="toolbar-separator"></div>
              <button 
                type="button" 
                onClick={() => execCommand('foreColor', '#000000')}
                className="toolbar-btn"
                title="Black Text"
              >
                <span style={{color: '#000000', fontWeight: 'bold'}}>A</span>
              </button>
              <button 
                type="button" 
                onClick={() => execCommand('foreColor', '#FF0000')}
                className="toolbar-btn"
                title="Red Text"
              >
                <span style={{color: '#FF0000', fontWeight: 'bold'}}>A</span>
              </button>
              <button 
                type="button" 
                onClick={() => execCommand('foreColor', '#0000FF')}
                className="toolbar-btn"
                title="Blue Text"
              >
                <span style={{color: '#0000FF', fontWeight: 'bold'}}>A</span>
              </button>
            </div>
            
            {/* Simple Rich Text Editor */}
            <div
              ref={editorRef}
              className="rich-text-editor"
              contentEditable
              onInput={handleEditorChange}
              data-placeholder="Write how you feel..."
              suppressContentEditableWarning={true}
            ></div>
            
            <button type="submit">Add Entry</button>
          </form>
        </div>

        {/* Past Entries Section */}
        <div className="past-entries-container">
          <div className="past-entries-header">
            <h2>Past Entries</h2>
            {pastEntries.length > 0 && (
              <button 
                onClick={downloadPDF}
                disabled={downloading}
                className="download-btn"
                title="Download all entries as PDF"
              >
                {downloading ? 'Generating PDF...' : '📄 Download PDF'}
              </button>
            )}
          </div>
          {loading ? (
            <p className="loading">Loading entries...</p>
          ) : pastEntries.length === 0 ? (
            <p className="no-entries">No journal entries yet. Start writing!</p>
          ) : (
            <div className="entries-list">
              {pastEntries.map((entry) => (
                <div key={entry.id} className="entry-item">
                  <div className="entry-date">
                    {entry.timestamp.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div 
                    className="entry-text" 
                    dangerouslySetInnerHTML={{ __html: entry.htmlContent || entry.text }}
                  ></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
