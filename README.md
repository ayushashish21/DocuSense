# DocuSense

An AI-powered document workflow web application that transforms dense PDFs—such as contracts, invoices, reports, and study notes—into structured executive summaries, actionable bullet points, and extracted entities.

**Live Demo:** [https://your-vercel-url.vercel.app](https://your-vercel-url.vercel.app)

---

## Features

- **Three AI Workflow Modes:** Switch between **Summarize**, **Extract Entities**, and **Actionable Bullets** depending on the document type.
- **PDF Processing Pipeline:** Drag-and-drop PDF uploads (up to 10MB) parsed in memory via `multer` and `pdf-parse`.
- **Resilient Gemini Integration:** Uses `@google/genai` with strict JSON output, automatic retry logic, and model fallback (`gemini-3.5-flash-lite` → `gemini-3.8-flash`) to handle temporary traffic spikes.
- **Cloud Persistence:** Saves analyzed documents to **MongoDB Atlas** with full history browsing, single-item deletion, and bulk clear.
- **One-Click Export:** Copy plain summaries or raw JSON, or download formatted **Markdown (`.md`)** and multi-page **PDF (`.pdf`)** reports.
- **Production Security:** Protected with `helmet` HTTP headers, restricted CORS, MongoDB ObjectId validation, and `express-rate-limit` on AI endpoints.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS, Lucide React, jsPDF |
| **Backend** | Node.js, Express, Multer, pdf-parse |
| **AI & Data** | Google Gemini API (`@google/genai`), MongoDB Atlas, Mongoose |
| **Security** | Helmet, Express Rate Limit, CORS |
| **Deployment** | Vercel (Frontend), Render (Backend) |

---

## Project Structure

```text
DocuSense/
├── client/                 # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── UploadZone.jsx
│   │   │   └── ResultsView.jsx
│   │   └── App.jsx
│   └── package.json
├── server/                 # Express + MongoDB + Gemini backend
│   ├── models/
│   │   └── Document.js
│   ├── index.js
│   └── package.json
└── .gitignore
