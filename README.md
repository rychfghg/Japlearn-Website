<div align="center">

  # JapLearn Teacher Dashboard & Admin Portal

  **Manage classes, lessons, and game content, and follow student progress.**

  [![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=111827)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

  Live at [portal.japlearn.com](https://portal.japlearn.com)
</div>

---

## Overview

This web portal is used by **teachers** and **administrators**. It also hosts the public privacy, terms, accessibility, contact, and account-deletion pages, and relays API requests from the student app to the backend.

### Related repositories

| Repository | Contents |
|---|---|
| [Japlearn-Website](https://github.com/rychfghg/Japlearn-Website) | This portal |
| [JapLearn-2.0](https://github.com/rychfghg/JapLearn-2.0) | Student application |
| [JapLearn2.0](https://github.com/rychfghg/JapLearn2.0) | Spring Boot backend API |

## Teacher Dashboard (`/teacher`)

| Page | Purpose |
|---|---|
| Overview | Summary of classes and recent activity |
| Classes | Create classes, share class codes, and view each class |
| Students | Enrolled students and their progress |
| Lessons | Create lessons and follow lesson progress |
| Activities, QuackSlate | Assign activities and host QuackSlate code sessions |
| Communication | Communication practice results and assignments |
| Game Performance | Results per game |
| Reports | Exportable progress reports |
| Profile, Settings, Guide | Account settings and a teacher guide |

Teachers create an account at `/teacher/create-account` and sign in at `/teacher/login`.

## Admin Portal (`/admin`)

| Page | Purpose |
|---|---|
| Overview | Platform summary and registration settings (including auto-approval) |
| Students, Teachers | Manage accounts |
| **SMART Goals** | Evaluation dashboard (see below) |
| QuackSituate | Ahiru Rescue, Expression Match, and Politeness content |
| QuackSlate | Question bank |
| QuackResponse | Reply Coach, Response Rush, and Dialogue Relay content |
| QuackTalk | Speaking content |
| Quackman | Edit the Quackman word list |

The sidebar groups game content in a collapsible **Game content** section and scrolls on small screens, so **Sign out** stays visible.

### SMART Goals Validation Dashboard

Admin-only. It reads existing learning records and never changes them.

- Four goal cards: situational accuracy, conversational response accuracy, politeness recognition, and completion.
- A per-student table with filters, attempt-quality signals (incorrect, retries, assisted answers, hints, timeouts, incomplete activities), and a "Where students stopped" view.
- **Calculate for:** all eligible students, or only survey respondents matched by email.
- **Google Forms CSV upload:** respondents are matched to accounts by email only; unmatched rows are flagged, and survey answers are compared with actual performance.
- **Refactoring Priorities:** record the findings and actions after MVP validation.
- **Refresh, Export CSV, and Summary PDF**.

The calculation rules are listed on the page and in the backend README.

## Tech Stack

| Area | Technology |
|---|---|
| Framework | React + React Router |
| Build | Vite + TypeScript |
| Icons | Lucide |
| Hosting | Vercel |
| API relay | Vercel function [`api/proxy.ts`](./api/proxy.ts) |

## Setup

```bash
npm ci
npm run dev
```

Build and type-check (this is the check to run before committing; `tsc --noEmit -p .` alone checks nothing in this project):

```bash
npm run build
```

Preview the production build with `npm run preview`.

## API Relay

[`vercel.json`](./vercel.json) rewrites `/api/*` to [`api/proxy.ts`](./api/proxy.ts), which forwards requests to the backend. Some mobile networks cannot reach the backend host directly, while Vercel is reachable everywhere. The relay passes the real client IP with a shared secret so the backend's rate limits stay per user.

| Vercel environment variable | Purpose |
|---|---|
| `JAPLEARN_BACKEND_URL` | Backend base URL |
| `JAPLEARN_PROXY_SECRET` | Shared secret; must match the backend (**secret**, set in Vercel only) |

`vercel.json` also sets the security headers, including the Content-Security-Policy.

## Project Structure

```text
JapLearn_Admin/
├── api/              # Vercel relay function
├── public/           # Static files
├── src/
│   ├── features/
│   │   ├── admin/    # Admin layouts and pages (SMART Goals, content editors, accounts)
│   │   └── teacher/  # Teacher layouts, pages, services, and utilities
│   ├── components/   # Shared components
│   ├── pages/        # Landing, login, and public pages
│   ├── lib/          # API helpers
│   ├── App.tsx       # Routes
│   └── styles.css    # Global styles
├── vercel.json       # Rewrites and security headers
└── package.json
```

## Before Committing

1. Run `npm run build` with no errors.
2. Check the changed page on desktop and on a narrow screen.
3. Keep the privacy and terms pages identical to the versions shown in the student app.
4. Never commit secrets, `.env` files, or the `dist/` folder.
