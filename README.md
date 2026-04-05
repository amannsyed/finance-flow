# 💸 Finance Flow

A personal finance tracker built with React and TypeScript. Track income and expenses, visualise spending trends, and plan budgets — all in a clean, responsive interface with dark mode support.

---

## ✨ Features

- **Dashboard** — Overview of income, expenses, and net balance
- **Transactions** — Log and manage income/expense entries with categories and dates
- **Analytics** — Visual spending breakdowns and trend charts powered by Recharts
- **Planning** — Budget planning and financial goal tracking
- **Google Sheets Sync** — Seamlessly backup and sync your transactions with a Google Sheet
- **Dark Mode** — Persistent light/dark theme toggle
- **Profile** — Customise your display name and currency

---

## 🛠 Tech Stack

| Layer      | Technology                           |
| ---------- | ------------------------------------ |
| Framework  | React 19 + Vite 6                    |
| Backend    | Python FastAPI (`convert_transaction` service) |
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

- [Node.js](https://nodejs.org/) (v18 or later recommended)

### Installation

1. **Clone the repo:**

   ```bash
   git clone https://github.com/amannsyed/finance-flow.git
   cd finance-flow
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Backend Configuration:**
   The frontend is decoupled and strictly configured to hit the external Python back-end service hosted on Render at `https://convert-transaction.onrender.com`.

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173/finance-flow/`.

---

## 📜 Available Scripts

| Script            | Description                                                           |
| ----------------- | --------------------------------------------------------------------- |
| `npm run dev`     | Start the local Vite development server                               |
| `npm run build`   | Build the production bundle to `dist/`                                |
| `npm run preview` | Preview the production build locally                                  |
| `npm run deploy`  | Deploy to GitHub Pages via `gh-pages`                                 |
| `npm run lint`    | Type-check with TypeScript (`tsc --noEmit`)                           |
| `npm run clean`   | Remove the `dist/` directory                                          |

---

## 📁 Project Structure

```
finance-flow/
├── public/                  # Static assets
├── src/
│   ├── components/
│   │   ├── AddTransactionModal.tsx
│   │   ├── Analytics.tsx
│   │   ├── BottomNav.tsx
│   │   ├── ConfirmModal.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Planning.tsx
│   │   ├── ProfileModal.tsx
│   │   └── Transactions.tsx
│   ├── store/
│   │   └── FinanceContext.tsx  # Global state via React Context
│   ├── utils/
│   │   ├── colors.ts           # Category colour utilities
│   │   └── currency.ts         # Currency formatting helpers
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🌍 Deployment

This project is configured for [GitHub Pages](https://pages.github.com/) deployment:

```bash
npm run deploy
```

This will build the project and push the `dist/` output to the `gh-pages` branch.

---

## 📄 License

Apache 2.0
