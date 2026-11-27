import { FileText, ArrowUp, ShieldCheck, ExternalLink } from 'lucide-react';

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
          <div className="sm:col-span-2 lg:col-span-5">
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

            <p className="mt-3 max-w-sm text-sm leading-relaxed text-gray-500">
              AI-powered PDF intelligence that transforms dense contracts, notes, and reports
              into structured summaries, entities, emails, and voice-driven answers.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/70 px-3 py-1 text-xs font-medium text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Private per-browser session history</span>
            </div>
          </div>

          {/* Product Column */}
          <div className="lg:col-span-2">
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
          <div className="lg:col-span-2">
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

          {/* Project & Tech Column */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Project & Stack
            </h3>
            <ul className="mt-3.5 space-y-2.5 text-sm">
              <li>
                <a
                  href="https://github.com/ayushashish21/DocuSense"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-gray-600 transition-colors hover:text-indigo-600"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-1.93c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.58.24 2.75.12 3.04.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.39-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.66.79.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" /></svg>
                  <span>GitHub Repository</span>
                </a>
              </li>
              <li>
                <a
                  href="https://docusense-8qyp.onrender.com/api/health"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-gray-600 transition-colors hover:text-indigo-600"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>API Status</span>
                </a>
              </li>
            </ul>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {['React', 'Tailwind', 'Express', 'MongoDB', 'Gemini AI'].map((tech) => (
                <span
                  key={tech}
                  className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600"
                >
                  {tech}
                </span>
              ))}
            </div>
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
