# Umurava AI-Powered Talent Screening Tool

> AI-powered candidate screening using Google Gemini — Umurava AI Hackathon 2026

---

## Quick Start (Step by Step)

### Prerequisites
- **Node.js v20+** — [download](https://nodejs.org)
- **Git** — [download](https://git-scm.com)
- **MongoDB Atlas** (free) — [sign up](https://cloud.mongodb.com)
- **Gemini API key** (free) — [get one](https://ai.google.dev)

---

### Step 1: Install dependencies
```bash
cd backend && npm install && cd ../frontend && npm install && cd ..
```

### Step 2: Set up MongoDB Atlas
1. Create a free cluster at cloud.mongodb.com
2. Click Connect → Connect your application
3. Copy the connection string

### Step 3: Get Gemini API key
1. Go to ai.google.dev → Get API Key → Create
2. Copy the key

### Step 4: Configure environment
```bash
cd backend && cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and Gemini key

cd ../frontend && cp .env.example .env.local
# Default: NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Step 5: Seed test data
```bash
cd backend && npx ts-node-dev src/seed.ts
```
Creates: recruiter account, 1 job, 15 applicants

### Step 6: Start backend
```bash
cd backend && npm run dev
# → http://localhost:5000/api/health
```

### Step 7: Start frontend (new terminal)
```bash
cd frontend && npm run dev
# → http://localhost:3000
```

### Step 8: Test the flow
1. Login: `recruiter@umurava.africa` / `password123`
2. Dashboard → Click the job → Applicants (15 preloaded)
3. AI Screening → Start → Wait 30-60s
4. View ranked results with AI reasoning

---

## Testing Each Phase

**Phase 1 — Backend API:**
```bash
curl http://localhost:5000/api/health
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"recruiter@umurava.africa","password":"password123"}'
```

**Phase 2 — Frontend UI:** Login, create job, upload CSV, verify applicants

**Phase 3 — AI Screening:** Trigger screening, verify ranked results with explanations

---

## Tech Stack
Frontend: Next.js 14 + TypeScript + Tailwind CSS + Redux Toolkit
Backend: Node.js + Express + TypeScript
Database: MongoDB Atlas
AI: Google Gemini API

## Deployment
- Frontend → Vercel
- Backend → Railway / Render
- Database → MongoDB Atlas

## Team
Butera Abdulaziz (Team-leader)
Ingabire Alain
Byiringiro Heritier
