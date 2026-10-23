# TidyByte

> **"Less clutter. More clarity."**  
> *Built for Hacktoberfest 2026 Week 3 DEV Challenge — "Slow and Steady"*

TidyByte is a minimal, private-by-design document organizer web application. It helps users organize batches of messy documents by suggesting meaningful filenames, categories, and descriptions with full human review before exporting an organized package.

---

## ✨ Features

- **Private & Client-Side:** All file processing and archive creation happen entirely inside the browser; documents are never transmitted to external servers.
- **Batch Upload Support:** Drag & drop or browse multiple documents (`.txt` and `.pdf` files up to **50 MB** each, up to 50 files per batch).
- **Duplicate Protection:** Stable composite fingerprinting (`name + size + lastModified`) detects true duplicate uploads without blocking distinct files sharing a name.
- **Deterministic Suggestions (MVP Demo):** Transparent rule-based suggestion engine generates clean filenames, categories, and descriptions without requiring API keys, paid credits, or local AI inference.
- **Review & Inline Editing:** Approve individual suggestions or use "Approve All"; inline editing allows fine-tuning suggested names and categories.
- **Search, Filter & Sort:** Search across original and suggested names; filter by category and status (All, Pending, Completed, Approved, Error); sort by Date, Name, Size, Category, or Status.
- **Structured ZIP Export:** Packages approved documents into categorized subdirectories (`organized/<category>/`) alongside pristine, unrenamed originals (`originals/`) and an export manifest (`README.txt`).
- **Timestamped File Naming:** Exports use the user's local timestamp:
  ```
  TidyByte_Organized_YYYY-MM-DD_HH-mm-ss.zip
  ```
  Repeated exports in the same second automatically append a collision-safe suffix (`_1`, `_2`).
- **One-Click Re-download:** Re-download the generated archive directly from the success toast or action bar without re-running document processing.
- **Mobile-First Responsive Design:** Fully accessible across screen widths from 320px mobile to desktop with generous touch targets (≥ 44px).

---

## 🛠 Tech Stack

- **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vite.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Archive Generation:** [JSZip](https://stuk.github.io/jszip/) & [FileSaver](https://github.com/eligrey/FileSaver.js)
- **Testing:** [Vitest](https://vitest.dev/)
- **Linting:** [Oxlint](https://oxc.rs/)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

```bash
git clone https://github.com/hrishu802/TidyByte.git
cd TidyByte
npm install
```

### Development Server

```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run Tests

```bash
npm test
```

### Type Checking & Linting

```bash
npx tsc -b --noEmit
npm run lint
```

### Production Build

```bash
npm run build
```

---

## 📄 License

MIT
