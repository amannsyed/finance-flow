# 💸 Finance Flow

A personal finance tracker built with React 19 and TypeScript. Track income, expenses, and subscriptions, visualise spending trends, and plan budgets — all in a clean, responsive interface with dark mode support.

---

## ✨ Features

- **Dashboard** — Real-time overview of income, expenses, and net balance.
- **Transactions** — Comprehensive logging with categories, dates, merchants, and bank accounts.
- **Analytics** — Visual spending breakdowns and trend charts powered by Recharts.
- **Planning** — Budget management and subscription tracking with auto-logging.
- **Google Sheets Sync** — Backup and sync transactions with a Google Sheet for cross-platform access.
- **Multi-Currency** — Support for different currencies with automatic conversion rates.
- **Dark Mode** — Persistent light/dark theme toggle for comfortable viewing.
- **Privacy** — Data is stored locally in your browser and only synced to your personal Google Sheet.

---

## 🛠 Tech Stack

| Layer      | Technology                           |
| ---------- | ------------------------------------ |
| Framework  | React 19 + Vite 6                    |
| Backend    | Python FastAPI                       |
| Language   | TypeScript                           |
| Styling    | Tailwind CSS v4                      |
| Charts     | Recharts                             |
| Animations | Motion (Framer Motion)               |
| Icons      | Lucide React                         |
| State      | React Context API                    |
| Utilities  | `date-fns`, `clsx`, `tailwind-merge` |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) (v9 or later)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/amannsyed/finance-flow.git
   cd finance-flow
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Backend Service (Optional):**
   The application uses an external service at `https://convert-transaction.onrender.com` for Google Sheets integration. No local backend setup is required unless you are hosting your own instance.

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

---

## 📜 Available Scripts

| Script            | Description                             |
| ----------------- | --------------------------------------- |
| `npm run dev`     | Start the local Vite development server |
| `npm run build`   | Build the production bundle to `dist/`  |
| `npm run preview` | Preview the production build locally    |
| `npm run deploy`  | Deploy to GitHub Pages                  |
| `npm run lint`    | Type-check with TypeScript              |
| `npm run clean`   | Remove the `dist/` directory            |

---

## 📁 Project Structure

```
finance-flow/
├── public/                  # Static assets and manifest
├── src/
│   ├── components/          # Reusable UI components
│   ├── store/               # Global state (FinanceContext)
│   ├── utils/               # Formatting and color utilities
│   ├── App.tsx              # Main application entry
│   ├── main.tsx             # React DOM rendering
│   └── index.css            # Global styles and Tailwind imports
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🌍 Deployment

This project is configured for [GitHub Pages](https://pages.github.com/). To deploy your own instance:

1. Update the `base` in `vite.config.ts` if necessary.
2. Run the deploy script:
   ```bash
   npm run deploy
   ```

---

## 📄 License

Apache 2.0
