import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// Define interfaces for our data structures
interface Source {
    source: string; // Filename
    content: string; // Text chunk
}

interface QueryResponse {
    answer: string;
    sources: Source[];
}

// Define the API base URL (adjust if backend runs elsewhere)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
    const [availablePdfs, setAvailablePdfs] = useState<string[]>([]);
    const [query, setQuery] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<QueryResponse | null>(null);

    // Fetch available PDFs on component mount
    useEffect(() => {
        const fetchPdfs = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_BASE_URL}/api/pdf/list`);
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                const data = await res.json();
                setAvailablePdfs(data.pdfs || []);
            } catch (e: any) {
                console.error("Failed to fetch PDFs:", e);
                setError(`Failed to load available documents: ${e.message}`);
                setAvailablePdfs([]); // Clear list on error
            } finally {
                setIsLoading(false);
            }
        };

        fetchPdfs();
    }, []); // Empty dependency array means run once on mount

    // Handle form submission
    const handleQuerySubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // Prevent default form submission page reload
        if (!query.trim() || isLoading) {
            return; // Don't submit empty queries or while loading
        }

        setIsLoading(true);
        setError(null);
        setResponse(null); // Clear previous response

        try {
            const res = await fetch(`${API_BASE_URL}/api/literature/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: query }), // Send query in request body
            });

            if (!res.ok) {
                // Try to get error details from response body
                let errorDetail = `HTTP error! status: ${res.status}`;
                try {
                    const errorData = await res.json();
                    errorDetail = errorData.detail || errorDetail;
                } catch { /* Ignore if response body is not JSON */ }
                throw new Error(errorDetail);
            }

            const data: QueryResponse = await res.json();
            setResponse(data);
        } catch (e: any) {
            console.error("Failed to submit query:", e);
            setError(`Error getting answer: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [query, isLoading]); // Dependencies for useCallback

    return (
        <div className="App">
            <header className="App-header">
                <h1>Parkinson's Literature Query</h1>
            </header>

            <main className="App-main">
                <section className="pdf-list">
                    <h2>Available Research Papers</h2>
                    {isLoading && availablePdfs.length === 0 && <p>Loading documents...</p>}
                    {error && availablePdfs.length === 0 && <p className="error">{error}</p>}
                    {availablePdfs.length > 0 ? (
                        <ul>
                            {availablePdfs.map((pdf) => (
                                <li key={pdf}>{pdf}</li>
                            ))}
                        </ul>
                    ) : (
                        !isLoading && <p>No documents found or failed to load.</p>
                    )}
                </section>

                <section className="query-section">
                    <h2>Ask a Question</h2>
                    <form onSubmit={handleQuerySubmit}>
                        <textarea
                            rows={4}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Enter your question about the literature..."
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading || !query.trim()}>
                            {isLoading ? 'Processing...' : 'Submit Query'}
                        </button>
                    </form>
                </section>

                {isLoading && !response && <p>Fetching answer...</p>} {/* Show loading only when submitting query */}
                {error && !isLoading && <p className="error">{error}</p>} {/* Show query errors */}

                {response && (
                    <section className="response-section">
                        <h2>Answer</h2>
                        <p className="answer-text">{response.answer}</p>

                        <h3>Sources</h3>
                        {response.sources && response.sources.length > 0 ? (
                            <ul className="sources-list">
                                {response.sources.map((src, index) => (
                                    <li key={index} className="source-item">
                                        <strong>{src.source}</strong>
                                        <p>{src.content}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No specific sources were cited for this answer.</p>
                        )}
                    </section>
                )}
            </main>

            <footer className="App-footer">
                <p>RAG Application v0.1</p>
            </footer>
        </div>
    );
}

export default App;
