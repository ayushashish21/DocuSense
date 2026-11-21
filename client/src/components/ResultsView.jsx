import { useState } from 'react';
import { Copy, Check, FileCheck2, ListChecks, Tags, Download, FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function ResultsView({ data }) {
  const [copiedType, setCopiedType] = useState(null);

  if (!data?.result) return null;
  const { title, summary, keyPoints = [], entities = [] } = data.result;

  const safeFileName = (title || data.fileName || 'docusense-report')
    .replace(/\.pdf$/i, '')
    .replace(/[^a-z0-9]+/gi, '_')
    .toLowerCase();

  const copyText = async (text, type) => {
    await navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1800);
  };

  const downloadMarkdown = () => {
    const lines = [
      `# ${title}`,
      '',
      `- **Source File:** ${data.fileName}`,
      `- **Workflow Mode:** ${data.mode}`,
      `- **Generated:** ${new Date(data.createdAt || Date.now()).toLocaleString()}`,
      '',
      '## Executive Summary',
      summary,
      '',
    ];

    if (keyPoints.length > 0) {
      lines.push('## Key Points');
      keyPoints.forEach((pt) => lines.push(`- ${pt}`));
      lines.push('');
    }

    if (entities.length > 0) {
      lines.push('## Extracted Entities');
      lines.push('| Category | Value |');
      lines.push('| --- | --- |');
      entities.forEach((item) => {
        const label = String(item.label).replace(/\|/g, '\\|');
        const value = String(item.value).replace(/\|/g, '\\|');
        lines.push(`| ${label} | ${value} |`);
      });
      lines.push('');
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeFileName}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 16;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    const checkPageBreak = (heightNeeded = 10) => {
      if (y + heightNeeded > 280) {
        doc.addPage();
        y = 20;
      }
    };

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(17, 24, 39);
    const titleLines = doc.splitTextToSize(title || 'Document Analysis', maxWidth);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 7 + 2;

    // Metadata
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(`Source: ${data.fileName}  |  Mode: ${data.mode}  |  DocuSense`, margin, y);
    y += 8;

    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Executive Summary
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text('Executive Summary', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    const summaryLines = doc.splitTextToSize(summary || '', maxWidth);
    summaryLines.forEach((line) => {
      checkPageBreak(6);
      doc.text(line, margin, y);
      y += 5.5;
    });
    y += 6;

    // Key Points
    if (keyPoints.length > 0) {
      checkPageBreak(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(17, 24, 39);
      doc.text('Key Points', margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      keyPoints.forEach((point) => {
        const ptLines = doc.splitTextToSize(`•  ${point}`, maxWidth);
        checkPageBreak(ptLines.length * 5.5 + 2);
        doc.text(ptLines, margin, y);
        y += ptLines.length * 5.5 + 2;
      });
      y += 4;
    }

    // Extracted Entities
    if (entities.length > 0) {
      checkPageBreak(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(17, 24, 39);
      doc.text('Extracted Entities', margin, y);
      y += 6;

      doc.setFontSize(10);
      entities.forEach((item) => {
        const lineText = `${item.label}: ${item.value}`;
        const entLines = doc.splitTextToSize(lineText, maxWidth);
        checkPageBreak(entLines.length * 5.5 + 2);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        doc.text(entLines, margin, y);
        y += entLines.length * 5.5 + 2;
      });
    }

    doc.save(`${safeFileName}.pdf`);
  };

  return (
    <div className="space-y-5">
      {/* Result Header & Action Buttons */}
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-400">
            <FileCheck2 className="h-3.5 w-3.5" />
            <span>{data.fileName}</span>
            <span>·</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
              {data.mode}
            </span>
          </div>
          <h2 className="mt-1.5 text-xl font-semibold text-gray-900">{title}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => copyText(summary, 'summary')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
          >
            {copiedType === 'summary' ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copiedType === 'summary' ? 'Copied' : 'Copy Summary'}
          </button>

          <button
            type="button"
            onClick={() => copyText(JSON.stringify(data.result, null, 2), 'json')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
          >
            {copiedType === 'json' ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copiedType === 'json' ? 'Copied' : 'Copy JSON'}
          </button>

          <button
            type="button"
            onClick={downloadMarkdown}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <Download className="h-3.5 w-3.5" />
            .MD
          </button>

          <button
            type="button"
            onClick={downloadPDF}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-800"
          >
            <FileDown className="h-3.5 w-3.5" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Executive Summary Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Executive Summary
        </h3>
        <p className="mt-2.5 text-sm leading-relaxed text-gray-700">{summary}</p>
      </div>

      {/* Key Points Card */}
      {keyPoints.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <ListChecks className="h-4 w-4" />
            <span>Key Points</span>
          </div>
          <ul className="mt-3 space-y-2.5">
            {keyPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Extracted Entities Table */}
      {entities.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <Tags className="h-4 w-4" />
            <span>Extracted Entities</span>
          </div>
          <div className="divide-y divide-gray-100">
            {entities.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 gap-1 px-5 py-3 text-sm sm:grid-cols-3"
              >
                <span className="font-medium text-gray-500">{item.label}</span>
                <span className="text-gray-900 sm:col-span-2">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
