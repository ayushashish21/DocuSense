import { useState } from 'react';
import { Copy, Check, Code2, Sparkles, Tag, ListChecks } from 'lucide-react';

export default function ResultsView({ data }) {
  const [copiedType, setCopiedType] = useState('');
  const { result, fileName, mode } = data || {};
  if (!result) return null;

  const copyText = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(''), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
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
            <span className="truncate text-xs text-gray-400">{fileName}</span>
          </div>
          <h2 className="mt-2 break-words text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
            {result.title}
          </h2>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => copyText(result.summary || '', 'summary')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 hover:shadow-2xs active:translate-y-0"
          >
            {copiedType === 'summary' ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span>{copiedType === 'summary' ? 'Copied' : 'Copy Summary'}</span>
          </button>

          <button
            type="button"
            onClick={() => copyText(JSON.stringify(result, null, 2), 'json')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-gray-50 hover:shadow-2xs active:translate-y-0"
          >
            {copiedType === 'json' ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Code2 className="h-3.5 w-3.5" />
            )}
            <span>{copiedType === 'json' ? 'Copied JSON' : 'Copy JSON'}</span>
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
    </section>
  );
}
