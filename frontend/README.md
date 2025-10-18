# LMS Platform (Full‑Stack, Cloud Uploads, Serverless Ready)

A full‑stack Learning Management System with roles (Teacher/Student), courses, assignments, submissions, grading, live classes, email notifications, and cloud file uploads. Built with React (frontend), Node/Express (backend), MongoDB Atlas, and Cloudinary for file storage. Optimized for Vercel serverless deployment.

- Frontend: React (SPA), TailwindCSS UI, modals (no alerts), role‑based dashboards
- Backend: Express API, JWT auth, nodemailer emails, structured logging, request tracing
- Data: MongoDB Atlas (Courses, Assignments, Enrollments, Submissions, Users)
- Files: Cloudinary (resource_type: raw) with local fallback for development
- Live classes: Agora integration (configurable)
- Deploy: Vercel monorepo (frontend + serverless backend)

---

## Features

- Authentication with JWT, role‑based routes (Student, Teacher)
- Teacher dashboard: quick stats, quick actions, per‑assignment submission grids, modals
- Assignments: create, publish/draft, due dates, attachments (cloud), submission stats
- Submissions: text + files, late detection, grading with inline Grade button
- Email notifications: student gets an email when graded
- Student dashboard: view courses, submit, view grades
- Live classes: schedule and join (Agora)
- Cloud uploads: Cloudinary, direct link viewing/downloading (PDFs supported)
- Logging/Debugging: structured logs, request IDs, request timing
- UX: alert() removed—consistent modals for confirm/success/error

---

## Tech Stack

- Frontend: React, React Router, Axios, TailwindCSS
- Backend: Node.js, Express, Mongoose, Nodemailer
- DB: MongoDB Atlas
- File Storage: Cloudinary (resource_type: raw)
- Realtime/Live: Agora SDK
- Deploy: Vercel (monorepo, serverless functions), optional Render/Railway

---

## Monorepo Structure

```
Lms/
  backend/
    api/                # Vercel serverless entry (index.js)
    controllers/        # assignmentController, submissionController, etc.
    models/             # User, Course, Assignment, Enrollment, Submission
    utils/              # logger.js, emailService.js
    server.js           # Express app (exports app for serverless)
  frontend/
    src/
      components/       # TeacherDashboard, CourseDetail, SubmitAssignment, etc.
      api.js            # Axios client using REACT_APP_API_URL
    public/
```

---

## Environment Setup

Create and fill these env files:

- Backend (.env):

  - MONGO_URI or MONGODB_URI
  - JWT_SECRET
  - FRONTEND_URL (e.g., http://localhost:3000 or Vercel URL)
  - LOG_LEVEL=info
  - CLOUDINARY_CLOUD_NAME
  - CLOUDINARY_API_KEY
  - CLOUDINARY_API_SECRET
  - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM (for email)
  - AGORA_APP_ID, AGORA_APP_CERTIFICATE (if using live classes)

- Frontend (.env):
  - REACT_APP_API_URL=http://localhost:5001/api (dev) or /api (Vercel)

MongoDB: whitelist your IP or 0.0.0.0/0 for testing.

Cloudinary: ensure resource_type is raw for PDFs and non‑images; disable strict transformations for raw if needed (Dashboard → Settings → Security).

---

## Run Locally (macOS)

- Backend:

  ```
  cd backend
  npm i
  node server.js
  ```

  Backend runs at http://localhost:5001

- Frontend:
  ```
  cd frontend
  npm i
  npm start
  ```
  Frontend runs at http://localhost:3000

---

## File Uploads (Cloud + Local Fallback)

- New uploads go to Cloudinary when CLOUDINARY\_\* env vars are set.
- Stored file object includes:
  - provider: "cloudinary" | "local"
  - url (cloud direct link)
  - path (local relative path)
  - publicId (cloud)
- Frontend links prefer file.url; fallback to backend/local path.
- PDFs: upload with resource_type: raw and use secure_url for direct access.

Debugging:

- Backend logs “storage:cloudinary:enabled” or “storage:local:enabled”.
- On create: logs assignment:file:stored with provider and url.

---

## Logging & Debugging

- Structured logger with levels (LOG_LEVEL): error, warn, info, debug
- Request tracing: requestId, request:start/request:finish with duration
- Controllers log key steps (create, delete, grade, email send)

To see deep logs:

- Set LOG_LEVEL=debug in backend .env

---

## Vercel Deployment (Monorepo, Option B)

This repo is ready to deploy both apps under one Vercel project.

1. Ensure backend exports app and only listens locally

- server.js uses a require.main guard and module.exports = app

2. Serverless entry

- backend/api/index.js wraps the Express app with serverless-http

3. Monorepo routing (root vercel.json)

- Routes /api/\* to backend/api/index.js
- Serves frontend as static build

4. Install dependency for backend

```
cd backend
npm i serverless-http
```

5. Vercel Project settings

- Import the repo (root)
- Environment Variables:
  - Backend vars: MONGO*URI, JWT_SECRET, FRONTEND_URL, LOG_LEVEL, CLOUDINARY*\_, SMTP\_\_, etc.
  - Frontend vars: REACT_APP_API_URL=/api
- Deploy

6. Post‑deploy checks

- Visit https://your-project.vercel.app
- API test: https://your-project.vercel.app/api (or a health endpoint)
- Create assignment (with PDF) → confirm Cloudinary URL works
- Submit/grade → verify email and dashboard stats update

Note: Avoid local filesystem in serverless. This project uses Cloudinary for persistence.

---

## Core Flows

- Teacher

  - Create course, create assignment (attachments allowed)
  - View Assignments modal: per‑assignment stats (Total/Graded/Pending)
  - Grade Submissions quick card: Pending (not submitted), Late, Done
  - Click counts to open filtered modal; inline Grade
  - Delete assignment/course via modal confirmation

- Student

  - View course → submit assignment (text/files)
  - After submit, UI hides submit button on course page and shows “Submitted”
  - View Grades page fetches graded submissions (from Submission model)

- Emails
  - Student receives email upon grading (grade, percentage, feedback, late badge)

---

## CORS

- Backend should allow:
  - FRONTEND_URL (Vercel) and http://localhost:3000 for dev
- With unified Vercel deployment (same origin), CORS is simpler.

---

## Troubleshooting

- Cloudinary 401 or “Failed to load PDF document”

  - Ensure uploads use resource_type: raw
  - Use file.secure_url (direct link)
  - Disable strict transformations for raw if required

- Download button fails

  - Cloud files: open file.url in a new tab
  - Local fallback: backend download route streams file

- Counts not updating after grading

  - Dashboard refreshes on visibility; navigate back to dashboard or refocus tab
  - Ensure submissionStats.ungraded is used for “Submissions to Grade”

- “Pending” list empty
  - Pending shows students who haven’t submitted; it lists enrolled minus submitted per assignment

---

## API Notes (High Level)

- Auth: POST /api/auth/login
- Courses:
  - GET /api/courses/my-courses
  - DELETE /api/courses/:id
- Enrollments:
  - GET /api/enrollments/course/:courseId
  - DELETE /api/enrollments/:enrollmentId
- Assignments:
  - GET /api/assignments/my-assignments
  - GET /api/assignments/course/:courseId
  - POST /api/assignments (multipart; cloud uploads)
  - DELETE /api/assignments/:id
- Submissions:
  - GET /api/submissions/assignment/:assignmentId
  - POST /api/submissions (multipart; cloud uploads)
  - PATCH /api/submissions/:id/grade
  - GET /api/submissions/my-submissions (student)
  - GET /api/submissions/:id/download/:fileIndex (local fallback; cloud redirects)

---

## Scripts

- Frontend:
  - npm start
  - npm run build
- Backend:
  - node server.js (local dev)
  - serverless deployed via Vercel (backend/api/index.js)

---

## Security & Production

- Store secrets in Vercel env vars (never commit .env)
- Use strong JWT_SECRET
- Limit CORS origins to your frontend
- Use Cloudinary “raw” resources for docs; don’t expose private buckets/keys
- Optional: rate limiting and helmet for Express (serverless compatible)

---

## Contributing

- Use feature branches and PRs
- Add logs at info/debug for new flows
- Keep modals for UX (avoid alert/confirm)
- Prefer cloud URLs; keep local fallback only for dev

---
