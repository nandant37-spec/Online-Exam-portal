# Online Exam Portal

A full-stack MERN web application for creating and taking timed online exams with automatic evaluation.
Built for the **Software Engineering (CMCA0303)** project. Domain: Education — **SDG 4: Quality Education**.

**Stack:** MongoDB · Express.js · React (Vite) · Node.js · Tailwind CSS · JWT authentication

---

## Features

| Role | What they can do |
|------|------------------|
| **Admin** | Dashboard with platform stats, add/delete users (teachers, students, admins), view all exams, questions and results |
| **Teacher** | Build a question bank (MCQ), create/edit/delete exams, set duration, window and pass %, view per-exam results with scores and tab-switch counts |
| **Student** | Register/login, see live/upcoming/ended exams, attempt a timed exam, get instant score, review correct answers, see result history |

**Exam engine**
- Countdown timer driven by the **server deadline** (refreshing the page cannot reset it)
- One question at a time with Next / Previous and a question palette
- Answers are saved to the server as the student clicks; resuming restores them
- **Auto-submit** when time runs out
- **Auto-evaluation** with score, percentage and pass/fail
- **Anti-cheating basics:** question order randomised per student, one attempt per exam (enforced by a unique DB index), tab-switch warning and counter shown to the teacher, leave-page warning, correct answers never sent to the browser during the exam

## Project structure

```
online-exam-portal/
├── client/                 React + Vite + Tailwind frontend
│   └── src/
│       ├── pages/          Login, Dashboard, Exams, ExamForm, Attempt, Results...
│       ├── components/     Layout, shared UI helpers
│       ├── api.js          Axios instance (reads VITE_API_URL)
│       └── auth.jsx        Auth context (JWT in localStorage)
├── server/                 Express + Mongoose backend
│   ├── src/
│   │   ├── models/         User, Question, Exam, Attempt
│   │   ├── routes/         auth, users, questions, exams, attempts, stats
│   │   ├── middleware/     JWT auth, role check, error handler
│   │   ├── utils/          evaluate.js (scoring + shuffle)
│   │   ├── app.js / index.js
│   │   └── seed.js         Demo data
│   └── test/               Unit tests for the evaluation logic
└── render.yaml             Optional Render blueprint
```

## Database design (Mongoose models)

```
User      { name, email (unique), password (bcrypt hash), role: admin|teacher|student }
Question  { subject, topic, text, options[4], correctIndex, marks, createdBy -> User }
Exam      { title, subject, description, durationMinutes, startTime, endTime,
            passPercent, questions[] -> Question, totalMarks, createdBy -> User }
Attempt   { exam -> Exam, student -> User, questionOrder[], answers[{question, selected}],
            startedAt, deadline, submittedAt, status, autoSubmitted, tabSwitches,
            score, totalMarks, percentage, passed }      unique(exam, student)
```

## Run it locally

Requirements: Node.js 18+ and either a local MongoDB or a free MongoDB Atlas cluster.

```bash
# 1. Backend
cd server
cp .env.example .env        # then edit MONGO_URI and JWT_SECRET
npm install
npm run seed                # creates demo users, 20 questions, 2 exams
npm run dev                 # API on http://localhost:5000

# 2. Frontend (new terminal)
cd client
cp .env.example .env        # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                 # app on http://localhost:5173
```

**Demo logins (created by the seed script)**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@exam.com | admin123 |
| Teacher | teacher@exam.com | teacher123 |
| Student | student1@exam.com | student123 |

> Change or delete these demo accounts before sharing the live site publicly.

Run the unit tests: `cd server && npm test`

## API overview

All routes are under `/api`. Protected routes need the header `Authorization: Bearer <token>`.

| Method | Route | Access | Purpose |
|--------|-------|--------|---------|
| POST | `/auth/register` | public | Register (always creates a student) |
| POST | `/auth/login` | public | Login, returns JWT |
| GET | `/auth/me` | any | Current user |
| GET/POST/DELETE | `/users`, `/users/:id` | admin | Manage users |
| GET/POST/PUT/DELETE | `/questions`, `/questions/:id` | teacher, admin | Question bank |
| GET | `/exams` | any | List exams (students get status + own attempt) |
| POST/PUT/DELETE | `/exams`, `/exams/:id` | teacher, admin | Manage exams |
| GET | `/exams/:id/results` | teacher, admin | Results table for an exam |
| POST | `/attempts/start/:examId` | student | Start or resume an exam |
| PUT | `/attempts/:id/answer` | student | Save one answer |
| PUT | `/attempts/:id/tab-switch` | student | Record a tab switch |
| POST | `/attempts/:id/submit` | student | Submit and evaluate |
| GET | `/attempts/mine` | student | Result history |
| GET | `/attempts/:id` | student | One result with answer review |
| GET | `/stats` | any | Dashboard numbers and chart data |

---

## Deployment (free tier): MongoDB Atlas + Render + Vercel

You need free accounts on **GitHub**, **MongoDB Atlas**, **Render** and **Vercel**. Do the steps in this order.

### 1. Put the code on GitHub
```bash
cd online-exam-portal
git init
git add .
git commit -m "Online Exam Portal"
git branch -M main
git remote add origin https://github.com/<your-username>/online-exam-portal.git
git push -u origin main
```

### 2. Create the database (MongoDB Atlas)
1. Atlas → **Create** a free **M0** cluster.
2. **Database Access** → add a database user (username + password). Avoid special characters in the password.
3. **Network Access** → **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`), because Render's IP changes.
4. **Connect → Drivers** → copy the connection string and add the database name before the `?`:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/online_exam_portal?retryWrites=true&w=majority`

### 3. Load the demo data into Atlas (run once, from your computer)
```bash
cd server
npm install
MONGO_URI="<your Atlas connection string>" JWT_SECRET=anything npm run seed
```
On Windows PowerShell:
```powershell
$env:MONGO_URI="<your Atlas connection string>"; $env:JWT_SECRET="anything"; npm run seed
```
> The seed script **wipes** the users/questions/exams collections first. Only run it on a fresh database.

### 4. Deploy the backend on Render
1. Render → **New → Web Service** → connect your GitHub repo.
2. Settings:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Free
3. **Environment variables:**
   | Key | Value |
   |-----|-------|
   | `MONGO_URI` | your Atlas connection string |
   | `JWT_SECRET` | a long random string (e.g. from https://generate-secret.vercel.app/48) |
   | `CLIENT_ORIGIN` | leave a placeholder for now, set in step 6 |
   | `NODE_VERSION` | `20` |
4. Deploy. When it is live, open `https://<your-service>.onrender.com/api/health` and check it says `{"status":"ok"}`.

(Alternative: Render → **New → Blueprint** picks up `render.yaml` automatically.)

### 5. Deploy the frontend on Vercel
1. Vercel → **Add New → Project** → import the same repo.
2. Settings:
   - **Root Directory:** `client`
   - **Framework Preset:** Vite (build `npm run build`, output `dist`)
3. **Environment variable:** `VITE_API_URL` = `https://<your-service>.onrender.com/api`
4. Deploy. You get a URL like `https://online-exam-portal-xyz.vercel.app`.

### 6. Allow the frontend to call the backend (CORS)
In Render → your service → **Environment**, set
`CLIENT_ORIGIN` = `https://online-exam-portal-xyz.vercel.app` (your Vercel URL, no trailing slash; separate several with commas), then let it redeploy.

Open the Vercel URL and sign in with the demo accounts.

### Troubleshooting
- **Login shows "Cannot reach the server"**: wrong `VITE_API_URL`, or Render is waking up (free instances sleep after ~15 min of inactivity; the first request can take 30-60 s). Open the `/api/health` URL once before a demo. If you change `VITE_API_URL`, redeploy the frontend.
- **CORS error in the browser console**: `CLIENT_ORIGIN` does not exactly match the Vercel URL.
- **Backend crashes on start**: check Render logs. Usually a wrong `MONGO_URI`, a missing `JWT_SECRET`, or Atlas Network Access not allowing `0.0.0.0/0`.
- **Page refresh gives 404 on Vercel**: make sure `client/vercel.json` is in the repo (it is included).

## Team

Software Engineering (CMCA0303), MCA Batch 2025-2027, NIET Greater Noida. Group 22.
Faculty: Ms. Roshan Kumari.
