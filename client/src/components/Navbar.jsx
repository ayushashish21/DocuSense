import { useState } from 'react';
import { FileText, Menu, X, Plus } from 'lucide-react';

export default function Navbar({ onNewDocument }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: '#workspace', label: 'Workspace' },
    { href: '#history', label: 'History' },
    { href: '#how-it-works', label: 'How it works' },
  ];

  const handleNew = () => {
    setMenuOpen(false);
    onNewDocument();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 2xl:max-w-[1440px]">
        {/* Brand */}
        <a
          href="#workspace"
          onClick={(e) => {
            e.preventDefault();
            handleNew();
          }}
          className="group flex items-center gap-2.5"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 text-white shadow-xs transition-all duration-200 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:shadow-md">
            <FileText className="h-4 w-4" />
          </span>
          <span className="text-base font-bold tracking-tight text-gray-900 transition-colors group-hover:text-indigo-600 sm:text-lg">
            DocuSense
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative py-1 text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-gray-900 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-indigo-600 after:transition-all after:duration-200 hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA + Mobile Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleNew}
            className="hidden items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-xs font-medium text-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-md active:translate-y-0 sm:inline-flex sm:text-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Document</span>
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 hover:text-gray-900 md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Drawer */}
      {menuOpen && (
        <div className="border-t border-gray-200/80 bg-white/95 px-4 py-3 backdrop-blur-md md:hidden">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={handleNew}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 sm:hidden"
            >
              <Plus className="h-4 w-4" />
              <span>New Document</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
