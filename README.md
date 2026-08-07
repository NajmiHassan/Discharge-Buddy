# Discharge Buddy

Your post-discharge care companion — a React app that turns a hospital discharge summary into a care plan patients and caregivers can actually follow: medication schedules, appointments, daily check-ins, and warning-sign alerts.

**Status: early prototype.** Authentication is real and working. Everything after login runs on mock data held in memory — see [Current state](#current-state) before assuming a feature works.

---

## Tech stack

| | |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) |
| Routing | React Router 7 |
| Auth / backend | Supabase (`@supabase/supabase-js` v2) |

---

## Getting started

```bash
npm install
```

```bash
npm run dev
```

The app runs at **http://localhost:5173**.

Other scripts: `npm run build`, `npm run preview`.

---

## Demo credentials

A pre-made account for the hosted Supabase dev project, so you can skip signup:

| Field | Value |
|---|---|
| Email | `n45902134@gmail.com` |
| Password | `TestPass12345` |

> **These are published deliberately for demo access, and are safe only because this is a throwaway development project.** Never commit credentials for anything that holds real data. Anyone reading this repo can sign into this account — treat it as fully public. If this project ever takes real users, rotate this password, remove this section, and note that the credential stays in git history forever unless the history is rewritten.

Once signed in you'll land on **Get Started** → click **Load Sample Data** to populate the care plan.

---

## Routes

| Path | Screen | Access |
|---|---|---|
| `/login` | Sign in / sign up | Public |
| `/upload` | Get Started — upload or load sample data | Protected |
| `/plan` | Care plan overview | Protected + tab bar |
| `/medications` | Medication schedule | Protected + tab bar |
| `/check-in` | Daily check-in | Protected + tab bar |
| `/alerts` | Alerts and warning signs | Protected + tab bar |

Unmatched paths redirect to `/login`. `ProtectedRoute` gates everything else on an active Supabase session.

---

## Current state

### Working

- **Email/password auth** against Supabase — sign up, sign in, sign out, session persistence across reloads, and route protection.
- **Care plan UI** — all five screens render and are interactive: mark medications taken, submit a daily check-in, toggle between patient and caregiver views, dismiss alerts.
- **Patient / caregiver role toggle**, which changes what the plan and alerts screens surface.

### Mock or stubbed

- **Nothing persists.** `CarePlanContext` is a `useReducer` store in memory. Every medication marked taken, check-in submitted, and alert dismissed is gone on refresh.
- **The care plan is hardcoded** in `src/data/mockCarePlan.ts`. Every user sees the same fictional patient.
- **File upload does nothing.** `UploadPage` accepts a drop or file pick and silently discards it — there is no parsing. `handleDrop` and `handleFileChange` are deliberate no-ops. **Load Sample Data** is the only working path into the app.
- **Supabase is used for authentication only.** There are no tables, no row-level security policies, and no queries anywhere outside `AuthContext`.

### Not built

- Password reset (`resetPasswordForEmail` is never called)
- Any database schema or RLS policies
- Real discharge-summary parsing
- Notifications or reminders

---

## Auth notes

Two fixes worth knowing about, both in `src/contexts/AuthContext.tsx`:

**Duplicate signup no longer reports false success.** When an email is already registered, Supabase GoTrue does *not* return an error — it returns a decoy user object with a random `id` and an empty `identities` array, so the endpoint can't be used to discover who has an account. The password is left untouched. The app previously read `error === null` as success and told the user "Account created!", after which sign-in failed with `Invalid login credentials`. Signup now checks for the empty `identities` array and says the email is already registered.

**Network failures explain themselves.** A blocked request surfaced as a bare `Failed to fetch` from the browser. It's now reported as a connectivity problem, with ad blockers and VPNs called out — those block `*.supabase.co` often enough to be the first thing to check.

### Supabase project configuration

The project currently has **email confirmation enabled** (`mailer_autoconfirm: false`), so a new account cannot sign in until its confirmation link is clicked. To disable this for local development: **Supabase dashboard → Authentication → Providers → Email → uncheck "Confirm email"**.

Note also that the project validates email deliverability — invented addresses are rejected with `email_address_invalid`, so signup testing needs a real inbox. Default Supabase SMTP is rate-limited to a few messages per hour; wire up your own SMTP provider before relying on confirmation emails.

---

## Configuration

The Supabase URL and anon key are hardcoded in `src/lib/supabase.ts`.

The anon key is designed to be public — it ships in every client bundle, and moving it to a `.env` file would not hide it, since Vite inlines `VITE_*` variables at build time. What actually protects a Supabase project is **row-level security**, which this project has not set up yet because it has no tables. Define RLS policies alongside the first table; until then the anon key grants only auth access, and signup is open to anyone.

---

## Project structure

```
src/
├── components/
│   ├── layout/          # AuthenticatedLayout, Header, TabBar
│   ├── ui/              # Badge, Button, Card, EmojiScale, StatusIndicator, Toggle
│   └── ProtectedRoute.tsx
├── contexts/
│   ├── AuthContext.tsx      # Supabase auth — the only backend integration
│   └── CarePlanContext.tsx  # In-memory reducer for all care plan state
├── data/mockCarePlan.ts     # Hardcoded sample patient
├── lib/supabase.ts          # Supabase client
├── pages/                   # One file per route
└── types/index.ts           # CarePlan, Medication, Alert, CheckInEntry, ...
```

---

## Roadmap

The single biggest gap is persistence. Making this real means:

1. Design tables for care plans, medications, check-ins, and alerts, keyed to `auth.users`.
2. Enable row-level security so a patient can only read their own plan, and caregivers only the plans shared with them.
3. Replace the `CarePlanContext` reducer's local writes with Supabase queries.
4. Implement discharge-summary parsing so `UploadPage` does something.
5. Add password reset.
