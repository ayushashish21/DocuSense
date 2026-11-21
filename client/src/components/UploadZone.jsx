import { useRef, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';

export default function UploadZone({ file, onFileSelect, onClear, disabled }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (selected) => {
    if (!selected) return;
    if (selected.type !== 'application/pdf') {
      alert('Please select a valid PDF file.');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      alert('File is too large. Maximum size is 10MB.');
      return;
    }
    onFileSelect(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFile(e.dataTransfer.files[0]);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (file) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-500">{formatSize(file.size)} · PDF Document</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="ml-3 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-200/70 hover:text-gray-700 disabled:opacity-50"
          title="Remove file"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
        isDragging
          ? 'border-gray-900 bg-gray-50'
          : 'border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50/60'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600">
        <Upload className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-gray-900">
        Drop your PDF here, or <span className="underline underline-offset-2">browse</span>
      </p>
      <p className="mt-1 text-xs text-gray-500">Supports text-based PDFs up to 10MB</p>
    </div>
  );
}
