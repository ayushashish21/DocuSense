import { FileText, ArrowUp, ShieldCheck } from 'lucide-react';

const WORKFLOW_LINKS = [
  { id: 'summarize', label: 'Summarize' },
  { id: 'extract', label: 'Extract Entities' },
  { id: 'bullets', label: 'Actionable Bullets' },
  { id: 'email', label: 'Draft Email' },
  { id: 'custom', label: 'Ask PDF (Voice)' },
];

export default function Footer({ onSelectMode, onNewDocument }) {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleModeClick = (modeId) => {
    if (onSelectMode) onSelectMode(modeId);
    scrollToTop();
  };

  return (
    <footer className="mt-16 border-t border-gray-200 bg-white sm:mt-20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 2xl:max-w-[1440px]">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-6">
            <button
              type="button"
              onClick={scrollToTop}
              className="group inline-flex items-center gap-2.5 text-left"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 text-white shadow-xs transition-all duration-200 group-hover:scale-105 group-hover:bg-indigo-600">
                <FileText className="h-4 w-4" />
              </span>
              <span className="text-lg font-bold tracking-tight text-gray-900 transition-colors group-hover:text-indigo-600">
                DocuSense
              </span>
            </button>

            <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-500">
              AI-powered PDF intelligence that transforms dense contracts, notes, and reports
              into structured summaries, entities, emails, and voice-driven answers.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/70 px-3 py-1 text-xs font-medium text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Private per-browser session history</span>
            </div>
          </div>

          {/* Product Column */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Product
            </h3>
            <ul className="mt-3.5 space-y-2.5 text-sm">
              <li>
                <a
                  href="#workspace"
                  className="text-gray-600 transition-colors hover:text-indigo-600"
                >
                  Workspace
                </a>
              </li>
              <li>
                <a
                  href="#history"
                  className="text-gray-600 transition-colors hover:text-indigo-600"
                >
                  Recent History
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="text-gray-600 transition-colors hover:text-indigo-600"
                >
                  How It Works
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onNewDocument}
                  className="text-gray-600 transition-colors hover:text-indigo-600"
                >
                  New Document
                </button>
              </li>
            </ul>
          </div>

          {/* Workflows Column */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Workflows
            </h3>
            <ul className="mt-3.5 space-y-2.5 text-sm">
              {WORKFLOW_LINKS.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleModeClick(item.id)}
                    className="text-gray-600 transition-colors hover:text-indigo-600"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-6 text-xs text-gray-500 sm:flex-row">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} DocuSense. Built by{' '}
            <a
              href="https://github.com/ayushashish21"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-gray-700 transition-colors hover:text-indigo-600"
            >
              Ayush
            </a>
            .
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-600"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            <span>Back to top</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
