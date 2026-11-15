# CampusConnect: AI-Powered Unified Campus Social and Career Network

[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?logo=socketdotio&logoColor=white)](https://socket.io/)
[![Groq](https://img.shields.io/badge/Groq-AI-F55036)](https://groq.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](#license)

**CampusConnect** is a full-stack campus social and career networking platform for peer collaboration, mentorship discovery, and team building. It combines social feeds, threaded discussions, squads, and real-time group chat with a **weighted graph-based AI matchmaker** and **Groq-powered AI assistance** served directly from the backend.

---

## Key Features

### 1. Unified Campus Social Ecosystem
* **Interactive Feed & Threads:** Create, comment, and discuss with rich-text support (Tiptap).
* **Project Squads:** Organize members into folders, send direct messages, and collaborate in **real-time squad group chats** (Socket.io + PostgreSQL persistence).
* **Profiles & Auth:** JWT authentication with customizable profiles (skills, interests, education, experience, projects).
* **Search & Discovery:** Global search across users, posts, and threads.

### 2. AI-Powered Matchmaker & Assistance (Groq)
* **Weighted Graph Matchmaking:** Compatibility scoring (0–100%) using weighted Jaccard similarity (skills/interests) plus context signals (same branch/campus, shared squad connections) with human-readable match reasons.
* **AI Filters & Suggestions:** Natural-language matchmaker filters and in-app assistant/chat endpoints.
* **Content Assistance:** AI drafting/icebreaker helpers for posts and squad conversations (Groq).

### 3. Production-Grade Architecture
* **Unified 2-Tier Backend:** Single Node.js + Express service with REST APIs, Socket.io realtime, Prisma/PostgreSQL, and Groq AI routes.
* **Security & Reliability:** Helmet, CORS allowlist, rate limiting, JWT-protected routes, and health checks.

---

## System Architecture

```text
CampusConnect/
├── frontend/      # React 19 + Vite + Tailwind CSS (SPA)
├── backend/       # Node.js + Express 5 + Socket.io + Prisma + Groq AI (REST + WS + AI)
└── ai-engine/     # Legacy Python AI experiments (optional; not required for unified deployment)
```

| Service | Default Port | Responsibility |
| :--- | :--- | :--- |
| **Frontend** | `5173` | SPA, feed, threads, matchmaker UI, squads UI, Socket.io client |
| **Backend API** | `5000` | Auth, profiles, posts, threads, squads, search, realtime chat, `/api/ai` (Groq + graph matchmaker) |

---

## Tech Stack

* **Frontend:** React 19, Vite 7, Tailwind CSS 4, Zustand, TanStack React Query, Tiptap, Socket.io Client
* **Backend:** Node.js, Express 5, Socket.io, Prisma ORM, PostgreSQL, JWT, Groq SDK
* **AI:** Groq (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`) for filters/chat/drafting; weighted graph scoring service for matchmaker

---

## Core API Endpoints

### Backend REST API (`/api`)
* `/api/auth` — Register, login, token verification
* `/api/profile` — Profile management and discovery
* `/api/posts`, `/api/comments` — Feed and interactions
* `/api/threads` — Threaded discussions
* `/api/squads` — Squad state/DM flows, requests, and group messages
  * `GET /api/squads/:squadId/messages` — Load persisted group messages
  * `POST /api/squads/:squadId/messages` — Persist (and broadcast) a group message
* `/api/search` — Global discovery
* `/api/ai` — Unified AI (Groq + graph matchmaker)
  * `POST /api/ai/matchmaker`, `POST /api/ai/matchmaker-filters`, `POST /api/ai/matchmaker/score`
  * `POST /api/ai/chat`, `POST /api/ai/draft`, `POST /api/ai/icebreaker`
  * `POST /api/ai/generate` — (stub; image captioning requires separate vision integration)

### Realtime (Socket.io)
* Auth: JWT (`handshake.auth.token` or `Authorization: Bearer`)
* Events: `join_squad` `{ squadId }`, `send_squad_message` `{ squadId, content }`, server emits `receive_squad_message`

---

## Local Setup & Installation

### Prerequisites
* Node.js 20+ & npm 9+
* PostgreSQL 15+
* Groq API key (for `/api/ai` features)

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env   # DATABASE_URL, JWT_SECRET, GROQ_API_KEY, CORS_ORIGINS, etc.
npx prisma generate
npx prisma migrate dev  # or deploy in production
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
# Set VITE_API_BASE_URL (e.g. http://localhost:5000 or your deployed backend origin; /api is normalized)
npm run dev
npm run build
```

---

## Academic Project Details

**Course:** B.Tech in Computer Science & Engineering (Major Project-I) at University Institute of Technology, RGPV, Bhopal

### Team Members
* **Gourav Makode**
* **Ankit Kumar Singh**
* **Deepanshika Agrahari**
* **Ayush Kumar Sahu**

### Project Guides
* **Prof. Manish Ahirwar**
* **Prof. Uday Chourasia**

---

## License

All Rights Reserved. Developed as an academic Major Project at UIT-RGPV, Bhopal.
