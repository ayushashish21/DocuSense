import { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle, Clock, Trash2, Sparkles, X, Mic, Square } from 'lucide-react';
import Navbar from './components/Navbar';
import UploadZone from './components/UploadZone';
import ResultsView from './components/ResultsView';
import Footer from './components/Footer';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const getSessionId = () => {
  let id = localStorage.getItem('docusense_session_id');
  if (!id) {
    id = crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now() + '-' + Math.random().toString(36).slice(2);
    localStorage.setItem('docusense_session_id', id);
  }
  return id;
};
const SESSION_ID = getSessionId();

const MODES = [
  { id: 'summarize', label: 'Summarize' },
  { id: 'extract', label: 'Extract Entities' },
  { id: 'bullets', label: 'Actionable Bullets' },
  { id: 'email', label: 'Draft Email' },
  { id: 'custom', label: 'Ask PDF' },
];

export default function App() {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('summarize');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const [currentResult, setCurrentResult] = useState(null);
  const [history, setHistory] = useState([]);

  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const fileRef = useRef(file);
  fileRef.current = file;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/documents`, {
          headers: { 'x-session-id': SESSION_ID },
        });
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

  const handleAnalyze = async (promptOverride) => {
    const activeFile = fileRef.current;
    const activePrompt = typeof promptOverride === 'string' ? promptOverride : customPrompt;
    if (!activeFile) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', activeFile);
      formData.append('mode', mode);
      if (mode === 'custom') formData.append('customPrompt', activePrompt.trim());

      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'x-session-id': SESSION_ID },
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
        err.message || 'Could not reach the server. Make sure the backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    transcriptRef.current = '';

    recognition.onstart = () => {
      setIsListening(true);
      setError('');
    };
    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('');
      transcriptRef.current = text;
      setCustomPrompt(text);
    };
    recognition.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError('Voice input error: ' + event.error);
      }
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      const finalPrompt = transcriptRef.current.trim();
      if (finalPrompt && fileRef.current) {
        handleAnalyze(finalPrompt);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleDeleteOne = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/documents/${id}`, {
        method: 'DELETE',
        headers: { 'x-session-id': SESSION_ID },
      });
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
      const res = await fetch(`${API_BASE}/documents`, {
        method: 'DELETE',
        headers: { 'x-session-id': SESSION_ID },
      });
      if (res.ok) {
        setHistory([]);
        setCurrentResult(null);
      }
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar onNewDocument={handleReset} />

      <main
        id="workspace"
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12 2xl:max-w-[1440px]"
      >
        {/* Hero Header */}
        <section className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-1 text-xs font-medium text-gray-600 shadow-2xs transition-all duration-200 hover:border-indigo-200 hover:shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600" />
            </span>
            AI-Powered Document Workflow
          </span>

          <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-gray-900 sm:mt-5 sm:text-4xl md:text-5xl lg:text-[54px] lg:leading-[1.1] 2xl:text-6xl">
            Turn dense PDFs into{' '}
            <span className="bg-linear-to-r from-indigo-600 via-violet-600 to-blue-600 bg-clip-text text-transparent">
              clear, structured insights
            </span>
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-500 sm:mt-4 sm:text-base lg:text-lg">
            Upload contracts, invoices, or reports to generate executive summaries,
            actionable bullet points, and structured entity extractions in seconds.
          </p>
        </section>

        {/* Main Workspace Grid */}
        <div className="mt-8 grid grid-cols-1 items-start gap-6 sm:mt-10 lg:grid-cols-12 xl:gap-8">
          {/* Left Column: Upload & Results */}
          <div className="space-y-6 lg:col-span-8">
            <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs transition-all duration-200 hover:border-gray-300/80 hover:shadow-md sm:p-6">
              {/* Mode Selector */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Workflow Mode
                </label>
                <div className="flex flex-wrap gap-1.5 rounded-xl bg-gray-100 p-1.5 sm:grid sm:grid-cols-3 md:flex md:flex-wrap lg:grid lg:grid-cols-5">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      disabled={loading}
                      onClick={() => setMode(m.id)}
                      className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-center text-xs font-medium transition-all duration-200 sm:text-[13px] ${
                        mode === m.id
                          ? 'bg-white text-gray-900 shadow-xs ring-1 ring-gray-200/70'
                          : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt + Voice Command */}
              {mode === 'custom' && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Your Question / Prompt
                    </label>
                    {isListening && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600">
                        <span className="h-2 w-2 animate-ping rounded-full bg-red-500" />
                        Listening... speak now
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={customPrompt}
                      onChange={(e) => {
                        setCustomPrompt(e.target.value);
                        setError('');
                      }}
                      disabled={loading}
                      maxLength={500}
                      placeholder="e.g. What is the cancellation notice period? or tap the mic to speak"
                      className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-3.5 pr-12 text-sm text-gray-900 transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:outline-none disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={toggleVoiceInput}
                      disabled={loading}
                      title={isListening ? 'Stop & Analyze' : 'Ask with voice'}
                      className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 disabled:opacity-50 ${
                        isListening
                          ? 'animate-pulse bg-red-600 text-white shadow-sm hover:bg-red-700'
                          : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:scale-105 hover:bg-indigo-50 hover:text-indigo-600 hover:ring-indigo-200'
                      }`}
                    >
                      {isListening ? (
                        <Square className="h-3.5 w-3.5 fill-current" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

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
                  <span className="min-w-0 break-words">{error}</span>
                </div>
              )}

              {/* Analyze CTA Button */}
              <button
                type="button"
                onClick={() => handleAnalyze()}
                disabled={!file || loading || (mode === 'custom' && !customPrompt.trim())}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-md active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
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

          {/* Right Column: Recent History */}
          <aside id="history" className="lg:sticky lg:top-24 lg:col-span-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs transition-all duration-200 hover:border-gray-300/80 hover:shadow-md sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Recent Documents</span>
                </div>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-gray-400 transition hover:bg-red-50 hover:text-red-600"
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
                <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-0.5">
                  {history.map((item) => (
                    <li key={item._id}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setCurrentResult(item)}
                        onKeyDown={(e) => e.key === 'Enter' && setCurrentResult(item)}
                        className={`group flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs ${
                          currentResult?._id === item._id
                            ? 'border-gray-900 bg-gray-50 shadow-2xs'
                            : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50/70'
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
                          className="shrink-0 rounded-md p-1.5 text-gray-400 opacity-100 transition hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"
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

        {/* How It Works Strip */}
        <section id="how-it-works" className="mt-14 border-t border-gray-200 pt-10 sm:mt-16">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Upload any PDF',
                desc: 'Drag and drop contracts, invoices, or study notes up to 10MB.',
              },
              {
                step: '02',
                title: 'Pick a workflow mode',
                desc: 'Summarize, extract entities, draft emails, or ask anything by typing or voice.',
              },
              {
                step: '03',
                title: 'Export clean insights',
                desc: 'Review structured cards and copy plain summaries or raw JSON with one click.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group rounded-xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
              >
                <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600">
                  {item.step}
                </span>
                <h3 className="mt-3 text-sm font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer onSelectMode={setMode} onNewDocument={handleReset} />
    </div>
  );
}
