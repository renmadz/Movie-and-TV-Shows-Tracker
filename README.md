# After Credits

A full-stack movie and TV show tracker with a sci-fi inspired UI. Log what you've watched, track your status, rate entries, and keep a full rewatch history — all powered by TMDB for automatic poster and genre data.

**Live site:** [your-domain.vercel.app](https://aftercredits-db.vercel.app)

---

## Features

- **Status tracking** — Watched, Watching, Plan to Watch, Dropped
- **TMDB integration** — Auto-fills posters and genres as you type a title
- **Season tracking** — Log which season you're up to for TV shows, with an option to bulk-add remaining seasons as Plan to Watch
- **Rewatch history** — Log rewatches with individual dates and ratings, view a full history panel per entry including a rating timeline
- **Duplicate prevention** — Detects if a title already exists and prompts you to log a rewatch instead
- **Sort and filter** — Filter by type (Movies / TV Shows) and status tab, sort by date or rating
- **Edit and delete** — Full CRUD on every entry
- **Sci-fi UI** — Dark theme with cyan accents, Exo 2 + Share Tech Mono fonts, HUD-style card layout

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite, CSS Modules |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Hosting (frontend) | Vercel |
| Hosting (backend) | Render |
| External API | TMDB |

---

## Project Structure

```
├── frontend/          # React + Vite app
│   └── src/
│       ├── api/       # Fetch calls to backend and TMDB
│       ├── components/# All UI components
│       └── types/     # Shared TypeScript types
│
└── backend/           # Express API server
    ├── src/
    │   ├── controllers/
    │   ├── routes/
    │   └── index.ts
    └── prisma/
        └── schema.prisma
```

---

## Running Locally

### Prerequisites
- Node.js v18+
- PostgreSQL installed and running

### 1. Clone the repo

```bash
git clone https://github.com/renmadz/Movie-and-TV-Shows-Tracker.git
cd Movie-and-TV-Shows-Tracker
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/tracker_db"
PORT=3001
FRONTEND_URL=http://localhost:5173
```

Run the database migration:

```bash
npx prisma migrate dev
```

Start the backend:

```bash
npm run dev
```

### 3. Set up the frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend/` folder:

```
VITE_TMDB_TOKEN=your_tmdb_read_access_token
```

Get a free TMDB token at [themoviedb.org](https://www.themoviedb.org/settings/api).

Start the frontend:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Deployment

- **Frontend** — Vercel. Connects to GitHub, auto-deploys on every push to `main`.
- **Backend** — Render. Connects to GitHub, auto-deploys on every push to `main`.
- **Database** — Neon (managed PostgreSQL, free tier).

### Environment variables required

**Vercel (frontend):**
| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Render backend URL |
| `VITE_TMDB_TOKEN` | Your TMDB read access token |

**Render (backend):**
| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon connection string |
| `FRONTEND_URL` | Your Vercel app URL |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |

---

## License

MIT
