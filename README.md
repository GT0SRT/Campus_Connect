# CampusConnect: AI-Powered Unified Campus Social and Career Network

<!-- [![Live Demo](https://img.shields.io/badge/Live_Demo-campusnet.vercel.app-000000?style=for-the-badge&logo=vercel)](https://campusnet.vercel.app/) -->
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-AI%20Engine-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Jest](https://img.shields.io/badge/Tests-Jest-C21325?logo=jest&logoColor=white)](https://jestjs.io/)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](#license)

**CampusConnect** is a full-stack unified campus social and career networking platform designed to streamline peer collaboration, mentorship discovery, and team building within a university ecosystem. It combines real-time social engagement (feeds, discussion threads, and project squads) with an **AI Matchmaker Engine** for intelligent peer, mentor, and hackathon teammate recommendations.

---

## Key Features

### 1. Unified Campus Social Ecosystem
* **Interactive Feed & Threads:** Create, comment, and participate in structured academic, placement, and technical discussions with rich-text support (Tiptap).
* **Project Squads & Communities:** Form and manage interest-based campus squads for hackathons, study groups, and collaborative engineering projects.
* **Student Profiles & Authentication:** Secure JWT-based authentication with customizable profiles highlighting technical skills, domains, and academic interests.
* **Unified Search & Discovery:** Fast cross-platform search across students, posts, threads, and active squads.

### 2. AI-Powered Matchmaker & Discovery
* **Intelligent Peer & Mentor Matchmaking:** Extracts structured skill, domain, and role filters from natural language queries to recommend compatible teammates, seniors, and mentors across campus.
* **Skill-Based Squad Recommendations:** Connects students with relevant communities and project teams aligned with their career goals and tech stack.
* **Smart Content Assistance:** Built-in AI assistance for drafting clear technical posts and project descriptions.

### 3. Production-Grade Architecture
* **Layered REST Backend:** Modular separation of routes, controllers, services, and validation middleware.
* **Type-Safe Data Layer:** PostgreSQL relational database managed via Prisma ORM with schema migrations.
* **Security & Reliability:** Built-in Helmet security headers, strict CORS policies, request rate limiting, and dedicated microservice health checks.

---

## System Architecture

The platform follows a decoupled multi-service monorepo architecture:

```text
CampusConnect/
├── frontend/      # React 19 + Vite + Tailwind CSS client (Deployed on Vercel)
├── backend/       # Node.js + Express 5 + Prisma REST API (PostgreSQL)
└── ai-engine/     # FastAPI AI Microservice (Matchmaker & NLP filter engine)
```

| Service | Default Port | Responsibility |
| :--- | :--- | :--- |
| **Frontend** | `5173` | Responsive SPA, state management, social feed, and Matchmaker UI |
| **Backend API** | `5000` | Auth, user profiles, posts, threads, squads, and search persistence |
| **AI Engine** | `8000` | Natural language matchmaker filter extraction and collaborator ranking |

---

## Tech Stack

* **Frontend:** React 19, Vite 7, Tailwind CSS 4, Zustand, TanStack React Query, Tiptap Editor
* **Backend:** Node.js, Express 5, Prisma ORM, PostgreSQL, JWT Authentication
* **AI Engine:** Python 3.10+, FastAPI, Uvicorn
* **DevOps & Testing:** Docker, Jest, Supertest

---

## Core API Endpoints

### Backend REST API (`/api`)
* `/api/auth` — User registration, login, and token verification
* `/api/profile` — Student profile management and skill tagging
* `/api/posts` & `/api/comments` — Campus social feed operations
* `/api/threads` — Threaded community discussions
* `/api/squads` — Project team and squad creation/membership
* `/api/search` — Global platform discovery

### AI Microservice (`/`)
* `POST /matchmaker` & `POST /matchmaker-filters` — NLP-based collaborator matching and query parsing
* `POST /generate` — Smart post and caption generation
* `GET /health` — Service availability check

---

## Local Setup & Installation

### Prerequisites
* Node.js 20+ & npm 9+
* Python 3.10+
* PostgreSQL 15+

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env   # Configure DATABASE_URL, JWT_SECRET, CORS_ORIGINS
npx prisma generate
npx prisma migrate dev
npm run dev
```

### 2. AI Engine Setup
```bash
cd ai-engine
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # Configure environment keys
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env   # Configure VITE_API_BASE_URL, VITE_AI_ENGINE_URL
npm run dev
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
