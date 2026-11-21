import { useState } from 'react';
import { FileText, Menu, X } from 'lucide-react';

export default function Navbar({ onNewDocument }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white">
            <FileText className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-gray-900">
            DocuSense
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
          <a href="#workspace" className="transition hover:text-gray-900">
            Workspace
          </a>
          <a href="#history" className="transition hover:text-gray-900">
            History
          </a>
          <a href="#how-it-works" className="transition hover:text-gray-900">
            How it works
          </a>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={onNewDocument}
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 active:scale-[0.98]"
          >
            New Document
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          aria-label="Toggle Menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium text-gray-600">
            <a
              href="#workspace"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-2 py-1.5 hover:bg-gray-50 hover:text-gray-900"
            >
              Workspace
            </a>
            <a
              href="#history"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-2 py-1.5 hover:bg-gray-50 hover:text-gray-900"
            >
              History
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-2 py-1.5 hover:bg-gray-50 hover:text-gray-900"
            >
              How it works
            </a>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onNewDocument?.();
              }}
              className="mt-1 w-full rounded-full bg-gray-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-gray-800"
            >
              New Document
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
