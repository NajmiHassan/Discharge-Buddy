# Discharge Buddy

**Post-discharge recovery tracking with voice check-ins.**

Discharge Buddy turns the stack of paperwork a patient receives when leaving the hospital into a clear, structured recovery plan — medications, appointments, warning signs, restrictions — and then lets the patient talk to their phone for a daily check-in. The app listens, compares what the patient says against *their own* discharge instructions, and tells both the patient and their caregiver whether recovery is on track or something needs attention.

---

## Why

Roughly one in five patients is readmitted within 30 days of discharge, and a large share of those readmissions trace back to instructions that were never understood in the first place — handed over at a stressful moment, written in clinical language, and read once. Discharge Buddy targets the gap between *being given* instructions and *following* them.

---

## Features

### Structured intake from unstructured paperwork
- Paste discharge text, upload a PDF, or photograph the printout
- PDF text extraction runs **on-device** — the file never leaves the browser
- AI extracts medications (including *why* each one was prescribed), appointments, warning signs paired with the action each requires, emergency contacts, and care/dietary/activity restrictions
- **Human-in-the-loop review**: everything the AI extracts lands in a fully editable form before anything is saved. Add, edit, or remove any item.

### Two views of the same care plan
A role toggle switches the patient profile between two audiences:

| Caregiver view | Patient view |
| --- | --- |
| All seven sections, collapsible | Three calm sections |
| Medications with clinical purpose | Medications and timing only |
| Every appointment, full detail | Next appointment only |
| Warning signs paired with required actions | Warning signs only |
| Emergency contacts with tap-to-dial | — |
| Full check-in history | — |

### Voice check-in
- Live streaming transcription — words appear on screen as the patient speaks
- The transcript is analyzed **against that patient's specific care plan**, not against generic medical advice
- Returns a verdict (On Track / Mild Concern / Needs Attention), a plain-language summary, and categorized flags
- Urgent findings surface a red emergency panel with a tap-to-dial 911 button
- Safety disclaimers on both the pre-check-in and results screens

### Accessibility
Built for a 78-year-old with unsteady hands, not a product demo:
- **Read Aloud** speaks the entire care plan at a deliberately slowed pace
- Minimum 44px touch targets throughout
- `prefers-reduced-motion` honored for vestibular sensitivity
- Screen-reader labels on interactive controls
- Tap-to-dial on every phone number

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite 7 |
| Styling | Tailwind CSS v4 |
| Routing | React Router 7 |
| Backend | Supabase (Postgres + Edge Functions) |
| Speech-to-text | Speechmatics Real-Time API |
| Text-to-speech | Web Speech API (browser-native) |
| PDF parsing | pdf.js (client-side) |
| Icons | Lucide |

---

## Architecture

```
Browser (React SPA)
  │
  ├── pdf.js ─────────────── PDF text extraction (on-device, never uploaded)
  ├── Web Speech API ─────── Read Aloud (no network, no API key)
  │
  ├── Supabase Postgres ──── patients · discharge_summaries · check_ins
  │
  └── Supabase Edge Functions (all secrets held server-side)
        ├── extract-discharge-data ── unstructured text/image → structured care plan
        ├── speechmatics-token ────── issues short-lived transcription credentials
        └── checkin-analysis ──────── transcript + care plan → verdict, flags, alerts
```

**No API keys ship to the client.** Every third-party credential lives in a Supabase Edge Function. The browser requests a short-lived token for transcription rather than holding the Speechmatics account key.

---

## Data model

**`patients`** — name, discharge date, status (`on_track` / `needs_attention` / `overdue_checkin`), created timestamp

**`discharge_summaries`** — one per patient; original raw text plus extracted `medications`, `appointments`, `warning_signs`, `emergency_contacts` (stored as JSON), and free-text care, dietary, and activity instructions

**`check_ins`** — full transcript, AI analysis result (verdict, summary, flags, emergency determination), and duration in seconds

---

## Getting started

### Prerequisites
- Node.js 18+
- A Supabase project with the three tables above and the three Edge Functions deployed

### Install and run

```bash
npm install
```

```bash
npm run dev
```

### Required setup step: audio worklet

The voice check-in uses `PCMRecorder` from `@speechmatics/browser-audio-input`, which loads its audio worklet from the app's public directory at runtime. Copy the worklet out of the installed package into `public/` before running the check-in flow:

```bash
cp node_modules/@speechmatics/browser-audio-input/dist/pcm-audio-worklet.min.js public/
```

Without this file present at `public/pcm-audio-worklet.min.js`, recording fails immediately after the microphone permission prompt.

### Configuration

Supabase URL, anon key, and Edge Function names live in `src/lib/config.ts`. Point them at your own project to run against your own backend.

### Build

```bash
npm run build
```

---

## Project structure

```
src/
├── components/
│   ├── add-patient/    Intake: paste, upload, AI extraction, review form
│   ├── checkin/        Voice check-in: record, transcribe, analyze, results
│   ├── dashboard/      Patient list with status rollup
│   ├── layout/         Header and role switcher
│   └── patient/        Care plan profile (patient and caregiver views)
├── context/            Role state
├── lib/                Supabase client and configuration
└── types/              Shared types and status helpers
```

---

## Current status

**Working end to end**
- Dashboard with live status rollup
- Full intake flow: paste or upload → AI extraction → editable review → save
- On-device PDF text extraction, with a clear fallback message for scanned/image-only PDFs
- Patient profile in both roles, with the role toggle
- Read Aloud
- Voice check-in: streaming transcription, care-plan-aware analysis, verdict and flags, emergency panel
- Tap-to-dial on emergency contacts and the 911 button
- Loading, empty, and error states across every screen

**Partially built**
- **Check-in history** renders on the caregiver view, but individual history entries link to a detail route that is not yet implemented
- **Image/photo intake** posts correctly to the extraction function; OCR quality depends on the deployed function
- **Roles** are a view toggle, not access control — there is no authentication layer in this version
- **Discharge date** is stamped as the current date on save rather than parsed from the document

**Not yet built**
- Scheduling, reminders, and push/SMS notifications
- Write-back from a check-in verdict to the patient's dashboard status (the two are currently independent)
- Automatic computation of `overdue_checkin`
- Editing a discharge summary after it has been saved

---

## Roadmap

1. Wire check-in verdicts back to patient status so the dashboard reflects the latest result
2. Scheduled check-in reminders and caregiver notifications on a `needs_attention` result
3. Check-in detail route and recovery trend charts over time
4. Authentication and per-caregiver patient scoping
5. Persist the transcript before analysis so a network failure doesn't discard a recorded check-in
6. Multi-language support for transcription and the care plan

---

## Security and privacy notes

This is a prototype. Before using it with real patient information:

- The Supabase anon key is committed in `src/lib/config.ts` and row-level security is permissive — the database is readable by anyone holding that key. Lock down RLS and move configuration to environment variables first.
- There is no authentication; every user of the app sees every patient.
- No HIPAA/BAA controls, audit logging, or encryption-at-rest guarantees are in place.

Use seeded, fictional data for demos.

---

## Disclaimer

Discharge Buddy is not a medical device and does not provide medical advice, diagnosis, or treatment. Its analysis is a comparison of a patient's spoken responses against instructions they were given by their care team. Always follow your healthcare provider's guidance. **In an emergency, call 911.**
