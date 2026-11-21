import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Clock, Trash2, Sparkles, X } from 'lucide-react';
import Navbar from './components/Navbar';
import UploadZone from './components/UploadZone';
import ResultsView from './components/ResultsView';

const API_BASE = 'http://localhost:5001/api';

const MODES = [
  { id: 'summarize', label: 'Summarize' },
  { id: 'extract', label: 'Extract Entities' },
  { id: 'bullets', label: 'Actionable Bullets' },
];

export default function App() {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('summarize');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const [currentResult, setCurrentResult] = useState(null);
  const [history, setHistory] = useState([]);

  // Load saved documents from MongoDB on page load
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/documents`);
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (err) {
        console.error('Failed to fetch history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  const handleReset = () => {
    setFile(null);
    setError('');
    setCurrentResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', mode);

      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze document.');
      }

      setCurrentResult(data);
      setHistory((prev) => [data, ...prev].slice(0, 20));
    } catch (err) {
      setError(
        err.message || 'Could not reach the server. Make sure the backend is running on port 5001.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOne = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item._id !== id));
        if (currentResult?._id === id) setCurrentResult(null);
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      const res = await fetch(`${API_BASE}/documents`, { method: 'DELETE' });
      if (res.ok) {
        setHistory([]);
        setCurrentResult(null);
      }
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased">
      <Navbar onNewDocument={handleReset} />

      <main id="workspace" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Minimal Hero Header */}
                {/* Minimal Hero Header */}
        <section className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-1 text-xs font-medium text-gray-600 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600" />
            </span>
            AI-Powered Document Workflow
          </span>

          <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-[54px] lg:leading-[1.1]">
            Turn dense PDFs into{' '}
            <span className="bg-linear-to-r from-indigo-600 via-violet-600 to-blue-600 bg-clip-text text-transparent">
              clear, structured insights
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg">
            Upload contracts, invoices, or reports to generate executive summaries,
            actionable bullet points, and structured entity extractions in seconds.
          </p>
        </section>

        {/* Main Workspace Grid */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Upload & Results */}
          <div className="space-y-6 lg:col-span-8">
            <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs sm:p-6">
              {/* Mode Selector */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Workflow Mode
                </label>
                <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-gray-100 p-1">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      disabled={loading}
                      onClick={() => setMode(m.id)}
                      className={`rounded-lg px-3 py-2 text-xs font-medium transition sm:text-sm ${
                        mode === m.id
                          ? 'bg-white text-gray-900 shadow-2xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drag & Drop PDF Upload */}
              <UploadZone
                file={file}
                onFileSelect={(selected) => {
                  setFile(selected);
                  setError('');
                }}
                onClear={() => setFile(null)}
                disabled={loading}
              />

              {/* Error Alert */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Analyze CTA Button */}
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!file || loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Extracting text & analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Analyze Document</span>
                  </>
                )}
              </button>
            </section>

            {/* AI Results */}
            {currentResult && <ResultsView data={currentResult} />}
          </div>

          {/* Right Column: Recent History (MongoDB) */}
          <aside id="history" className="lg:col-span-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Recent Documents</span>
                </div>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="inline-flex items-center gap-1 text-xs text-gray-400 transition hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear
                  </button>
                )}
              </div>

              {loadingHistory ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              ) : history.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-400">
                  Analyzed PDFs will appear here and stay saved in MongoDB.
                </p>
              ) : (
                <ul className="space-y-2">
                  {history.map((item) => (
                    <li key={item._id}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setCurrentResult(item)}
                        onKeyDown={(e) => e.key === 'Enter' && setCurrentResult(item)}
                        className={`group flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left transition ${
                          currentResult?._id === item._id
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50/60'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {item.result?.title || item.fileName}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-gray-500">
                            {item.fileName} · {item.mode}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteOne(e, item._id)}
                          className="shrink-0 rounded-md p-1 text-gray-300 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                          title="Delete document"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>

        {/* Simple How It Works Strip */}
        <section id="how-it-works" className="mt-16 border-t border-gray-200 pt-10">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Upload any PDF',
                desc: 'Drag and drop contracts, invoices, or study notes up to 10MB.',
              },
              {
                step: '02',
                title: 'Pick a workflow mode',
                desc: 'Choose between Executive Summary, Entity Extraction, or Actionable Bullets.',
              },
              {
                step: '03',
                title: 'Export clean insights',
                desc: 'Review structured cards and copy plain summaries or raw JSON with one click.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-gray-200 bg-white p-5"
              >
                <span className="text-xs font-semibold text-gray-400">{item.step}</span>
                <h3 className="mt-2 text-sm font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 text-xs text-gray-500 sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} DocuSense</span>
          <span>Built with React, Express, MongoDB & Gemini API</span>
        </div>
      </footer>
    </div>
  );
}
