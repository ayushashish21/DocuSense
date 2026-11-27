import { useEffect, useRef, useState } from 'react';
import {
  Copy,
  Check,
  Code2,
  Sparkles,
  Tag,
  ListChecks,
  Download,
  Printer,
  Volume2,
  VolumeX,
  Send,
  MessageSquare,
  Mic,
  Square,
  Loader2,
} from 'lucide-react';

const hasSpeechSynthesis =
  typeof window !== 'undefined' && 'speechSynthesis' in window;
const hasSpeechRecognition =
  typeof window !== 'undefined' &&
  Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

const pickIndianFemaleVoice = () => {
  if (!hasSpeechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  const indianVoices = voices.filter((v) => {
    const lang = (v.lang || "").toLowerCase().replace("_", "-");
    const name = (v.name || "").toLowerCase();
    return lang.startsWith("en-in") || (lang.startsWith("en") && name.includes("india"));
  });
  const femaleRegex = /\b(neerja|heera|veena|isha|sangeeta|ananya|kavya|priya|female|woman)\b|en-in-x-(ena|enc|ene)/i;
  const maleRegex = /\b(rishi|ravi|prabhat|male|man)\b/i;
  return (
    indianVoices.find((v) => femaleRegex.test(v.name) && !maleRegex.test(v.name)) ||
    indianVoices.find((v) => !maleRegex.test(v.name)) ||
    indianVoices[0] ||
    voices.find((v) => (v.lang || "").toLowerCase().startsWith("en") && /\b(samantha|zira|victoria|karen|female|woman)\b/i.test(v.name)) ||
    null
  );
};

export default function ResultsView({ data, apiBase, sessionId, onDocumentUpdate }) {
  const [copiedType, setCopiedType] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');

  const { _id, result, fileName, mode, ocrUsed, qaHistory = [] } = data || {};

  // Preload browser speech voices (needed on Chrome/Safari)
  useEffect(() => {
    if (!hasSpeechSynthesis) return;
    window.speechSynthesis.getVoices();
    const onVoicesChanged = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", onVoicesChanged);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", onVoicesChanged);
  }, []);

  // Stop speech when switching documents or unmounting
  useEffect(() => {
    setQuestion('');
    setAskError('');
    if (hasSpeechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    return () => {
      if (hasSpeechSynthesis) window.speechSynthesis.cancel();
      recognitionRef.current?.stop();
    };
  }, [_id]);

  if (!result) return null;

  const copyText = async (text, type) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedType(type);
      setTimeout(() => setCopiedType(''), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const toggleReadAloud = () => {
    if (!hasSpeechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const parts = [
      result.title,
      result.summary,
      result.keyPoints?.length ? 'Key points: ' + result.keyPoints.join('. ') : '',
    ].filter(Boolean);
    const utterance = new SpeechSynthesisUtterance(parts.join('. '));
    utterance.lang = 'en-IN';
    utterance.rate = 0.98;
    const preferredVoice = pickIndianFemaleVoice();
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const downloadMarkdown = () => {
    const lines = [
      `# ${result.title || fileName}`,
      '',
      `**File:** ${fileName} | **Mode:** ${mode}${ocrUsed ? ' | **OCR:** Scanned PDF' : ''}`,
      '',
      `## ${mode === 'email' ? 'Drafted Email' : 'Executive Summary'}`,
      result.summary || '',
      '',
    ];

    if (result.keyPoints?.length) {
      lines.push('## Key Points');
      result.keyPoints.forEach((pt) => lines.push(`- ${pt}`));
      lines.push('');
    }

    if (result.entities?.length) {
      lines.push('## Extracted Entities');
      result.entities.forEach((ent) => lines.push(`- **${ent.label}:** ${ent.value}`));
      lines.push('');
    }

    if (qaHistory.length) {
      lines.push('## Follow-Up Q&A');
      qaHistory.forEach((qa) => {
        lines.push(`**Q:** ${qa.question}`);
        lines.push(`**A:** ${qa.answer}`);
        lines.push('');
      });
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (fileName || 'docusense-report').replace(/\.pdf$/i, '');
    a.href = url;
    a.download = `${safeName}-docusense.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFollowUp = async (promptOverride) => {
    const q = (typeof promptOverride === 'string' ? promptOverride : question).trim();
    if (!q || !_id || asking) return;
    setAsking(true);
    setAskError('');
    try {
      const res = await fetch(`${apiBase}/documents/${_id}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ question: q }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to get answer.');

      const updatedDoc = { ...data, qaHistory: payload.qaHistory };
      onDocumentUpdate?.(updatedDoc);
      setQuestion('');
    } catch (err) {
      setAskError(err.message || 'Could not reach the server.');
    } finally {
      setAsking(false);
    }
  };

  const toggleFollowUpVoice = () => {
    if (!hasSpeechRecognition) return;
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    transcriptRef.current = '';

    recognition.onstart = () => {
      setIsListening(true);
      setAskError('');
    };
    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('');
      transcriptRef.current = text;
      setQuestion(text);
    };
    recognition.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setAskError('Voice error: ' + event.error);
      }
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      const finalQ = transcriptRef.current.trim();
      if (finalQ) handleFollowUp(finalQ);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <section className="space-y-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs transition-all duration-200 hover:border-gray-300/80 hover:shadow-md sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
              <Sparkles className="h-3 w-3" />
              {mode}
            </span>
            {ocrUsed && (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200/70">
                Scanned PDF · OCR
              </span>
            )}
            <span className="truncate text-xs text-gray-400">{fileName}</span>
          </div>
          <h2 className="mt-2 break-words text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
            {result.title}
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="no-print flex shrink-0 flex-wrap items-center gap-1.5">
          {hasSpeechSynthesis && (
            <button
              type="button"
              onClick={toggleReadAloud}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
                isSpeaking
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {isSpeaking ? (
                <VolumeX className="h-3.5 w-3.5" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
              <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => copyText(result.summary || '', 'summary')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 active:translate-y-0"
          >
            {copiedType === 'summary' ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span>{copiedType === 'summary' ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={() => copyText(JSON.stringify(result, null, 2), 'json')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 active:translate-y-0"
          >
            {copiedType === 'json' ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Code2 className="h-3.5 w-3.5" />
            )}
            <span>{copiedType === 'json' ? 'Copied' : 'JSON'}</span>
          </button>

          <button
            type="button"
            onClick={downloadMarkdown}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 active:translate-y-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>.md</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 active:translate-y-0"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {mode === 'email' ? 'Drafted Email' : 'Executive Summary'}
        </h3>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700 sm:text-[15px]">
          {result.summary}
        </p>
      </div>

      {/* Key Points */}
      {result.keyPoints?.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <ListChecks className="h-3.5 w-3.5" />
            <span>Key Points</span>
          </div>
          <ul className="mt-2.5 space-y-2">
            {result.keyPoints.map((point, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-gray-50/60 px-3.5 py-2.5 text-sm leading-relaxed text-gray-700 transition-all duration-200 hover:border-gray-200 hover:bg-white hover:shadow-2xs"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                <span className="min-w-0 break-words">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Entities */}
      {result.entities?.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <Tag className="h-3.5 w-3.5" />
            <span>Extracted Entities</span>
          </div>
          <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {result.entities.map((entity, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-gray-100 bg-gray-50/70 px-3.5 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:shadow-xs"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {entity.label}
                </p>
                <p className="mt-0.5 break-words text-sm font-medium text-gray-900">
                  {entity.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Follow-Up Q&A (No Re-Upload Needed) */}
      <div className="border-t border-gray-100 pt-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Follow-Up Q&A</span>
          </div>
          {isListening && (
            <span className="no-print inline-flex items-center gap-1.5 text-xs font-medium text-red-600">
              <span className="h-2 w-2 animate-ping rounded-full bg-red-500" />
              Listening...
            </span>
          )}
        </div>

        {qaHistory.length > 0 && (
          <div className="mt-3 space-y-3">
            {qaHistory.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5 text-sm"
              >
                <p className="font-semibold text-gray-900">Q: {item.question}</p>
                <p className="mt-1.5 whitespace-pre-line leading-relaxed text-gray-700">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleFollowUp();
          }}
          className="no-print mt-3 flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                setAskError('');
              }}
              disabled={asking}
              maxLength={500}
              placeholder="Ask a follow-up about this PDF without re-uploading..."
              className={`w-full rounded-xl border border-gray-200 bg-gray-50/60 py-2.5 pl-3.5 text-base text-gray-900 transition placeholder:text-gray-400 hover:border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:outline-none disabled:opacity-60 sm:text-sm ${
                hasSpeechRecognition ? 'pr-11' : 'pr-3.5'
              }`}
            />
            {hasSpeechRecognition && (
              <button
                type="button"
                onClick={toggleFollowUpVoice}
                disabled={asking}
                title={isListening ? 'Stop & Ask' : 'Ask with voice'}
                className={`absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg transition ${
                  isListening
                    ? 'animate-pulse bg-red-600 text-white hover:bg-red-700'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                {isListening ? (
                  <Square className="h-3 w-3 fill-current" />
                ) : (
                  <Mic className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!question.trim() || asking}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-gray-900 px-3.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {asking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>

        {askError && <p className="no-print mt-2 text-xs text-red-600">{askError}</p>}
      </div>
    </section>
  );
}
