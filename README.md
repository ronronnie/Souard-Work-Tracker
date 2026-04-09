# Freelance Work Tracker

A real-time work tracking web app built for the **Souard JJ** brand to manage freelancer work logs, owner confirmations, and monthly payment records.

---

## Features

### Admin
- Log work days on behalf of the owners or the freelancer
- Approve or reject pending work entries
- Record and delete payments per month
- Export monthly payment data as Excel (.xlsx)
- Manage project settings (freelancer name, remuneration, working days basis, owner names)
- Full access to all work log entries with edit and delete

### Freelancer
- Log daily work entries (today or past dates only)
- View approval status of submitted entries
- View monthly payment history (read-only)

### General
- Real-time sync across all users via Supabase
- Role-based access (Admin / Freelancer)
- Mobile-responsive UI
- Toast notifications for key actions
- Monthly pay summary with confirmed days, daily rate, and payment breakdown

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 |
| Icons | Lucide React |
| Database | Supabase (PostgreSQL) |
| Real-time | Supabase Realtime (postgres_changes) |
| Excel Export | SheetJS (xlsx) |

---

## Project Structure
src/
├── components/
│ ├── Dashboard.jsx # KPI overview + recent activity
│ ├── WorkLog.jsx # Entry log with filters
│ ├── ConfirmationFlow.jsx # Approve / reject pending entries
│ ├── MonthlySummary.jsx # Payment records + export
│ ├── Settings.jsx # Project & freelancer settings
│ ├── Sidebar.jsx # Navigation (desktop + mobile)
│ └── LoginPage.jsx # Auth screen
├── context/
│ ├── AppContext.jsx # Global state + Supabase mutations
│ └── AuthContext.jsx # Role-based auth
├── utils/
│ └── helpers.js # Date formatting, month stats
└── lib/
└── supabase.js # Supabase client

---

## Getting Started

### 1. Clone the repo

### ```bash
git clone https://github.com/ronronnie/Freelance-Work-Tracker.git
cd Freelance-Work-Tracker

2. Install dependencies
npm install

3. Set up environment variables}
Create a .env.local file in the root:

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

4. Run the development server
npm run dev

Database Schema (Supabase)
entries
Column	Type
id	uuid (PK)
date	date
logged_by	text
work_type	text
description	text
status	text
confirmed_by	text
confirmed_at	timestamptz
created_at	timestamptz
payments
Column	Type
id	uuid (PK)
month_key	text (e.g. 2025-04)
amount_paid	numeric
payment_date	date
notes	text
created_at	timestamptz
settings
Column	Type
id	int (PK = 1)
freelancer_name	text
monthly_remuneration	numeric
working_days_basis	int
owner_names	text[]
project_name	text

License
Private project — not open for public use.











