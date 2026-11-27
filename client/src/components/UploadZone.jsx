import { useRef, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';

export default function UploadZone({ file, onFileSelect, onClear, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files) => {
    const selected = files?.[0];
    if (!selected) return;
    if (selected.type !== 'application/pdf') return;
    onFileSelect(selected);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (file) {
    return (
      <div className="group flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-3 transition-all duration-200 hover:border-indigo-200 hover:bg-white hover:shadow-xs sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 ring-1 ring-gray-200 transition-transform duration-200 group-hover:scale-105">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-500">{formatSize(file.size)} · PDF Document</p>
          </div>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={onClear}
          title="Remove file"
          className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => !disabled && e.key === 'Enter' && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-all duration-200 sm:px-6 sm:py-10 ${
        dragging
          ? 'scale-[1.01] border-indigo-500 bg-indigo-50/50'
          : 'border-gray-200 bg-gray-50/40 hover:border-indigo-300 hover:bg-indigo-50/20'
      } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-600 shadow-2xs ring-1 ring-gray-200 transition-all duration-200 group-hover:-translate-y-1 group-hover:text-indigo-600 group-hover:ring-indigo-200 group-hover:shadow-sm">
        <Upload className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-medium text-gray-800">
        Drop your PDF here, or{' '}
        <span className="text-indigo-600 underline decoration-indigo-300 underline-offset-4 transition group-hover:decoration-indigo-600">
          browse
        </span>
      </p>
      <p className="mt-1 text-xs text-gray-500">Supports text-based PDFs up to 10MB</p>
    </div>
  );
}
