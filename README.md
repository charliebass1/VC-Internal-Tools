# RefCheck — AI-Powered Reference Checking for VCs

An internal tool for venture capital firms to automate customer reference checks during due diligence. The most manual, least automated step in VC diligence — now with AI.

---

## What It Does

1. **Track deals** — lightweight deal pipeline with stage tracking
2. **Discover customers** — AI suggests likely customers to contact independently (not just the ones the founder picks)
3. **Draft outreach** — AI-generated personalized emails to potential references
4. **Interview guides** — tailored question sets for each reference call
5. **Capture notes** — structured note-taking during/after reference calls
6. **Synthesize signals** — AI analyzes all reference notes and produces a signal report with red/green flags

---

## Quick Start

```bash
# 1. Clone and enter the repo
git clone https://github.com/<your-org>/VC-Internal-Tools.git
cd VC-Internal-Tools

# 2. Set up environment
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env for AI features

# 3. Run everything
./scripts/dev.sh
```

This starts:
- Backend API at `http://localhost:8000` (FastAPI + SQLite)
- Frontend at `http://localhost:5173` (React + Tailwind)

### Manual Setup

```bash
# Backend
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Tailwind CSS + Vite |
| Backend | Python + FastAPI |
| Database | SQLite (local) / PostgreSQL (production) |
| AI | Claude API (Anthropic) |

---

## Project Structure

```
VC-Internal-Tools/
├── backend/
│   ├── main.py           # FastAPI app entry
│   ├── database.py       # SQLAlchemy + SQLite
│   ├── models.py         # Deal, ReferenceContact, ReferenceNote, SignalReport
│   ├── schemas.py        # Pydantic request/response models
│   └── routers/
│       ├── deals.py      # Deal CRUD
│       ├── references.py # Reference + note management
│       └── synthesis.py  # AI endpoints (discovery, outreach, guide, synthesis)
├── frontend/
│   └── src/
│       ├── App.tsx       # Routes
│       ├── api.ts        # API client
│       ├── types.ts      # TypeScript types
│       ├── components/   # Layout
│       └── pages/        # DealList, DealDetail
├── docs/
│   ├── ARCHITECTURE.md   # System design
│   └── ROADMAP.md        # Feature plan
├── scripts/
│   └── dev.sh            # One-command dev setup
├── requirements.txt
├── .env.example
└── CONTRIBUTING.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/deals` | List all deals |
| `POST` | `/api/deals` | Create a deal |
| `GET` | `/api/deals/:id` | Get deal details |
| `PATCH` | `/api/deals/:id` | Update a deal |
| `DELETE` | `/api/deals/:id` | Delete a deal |
| `GET` | `/api/deals/:id/references` | List references for a deal |
| `POST` | `/api/deals/:id/references` | Add a reference contact |
| `PATCH` | `/api/references/:id` | Update reference status |
| `POST` | `/api/references/:id/notes` | Add call notes |
| `POST` | `/api/deals/:id/discover` | AI: discover likely customers |
| `POST` | `/api/references/:id/outreach` | AI: generate outreach email |
| `POST` | `/api/deals/:id/interview-guide` | AI: generate interview guide |
| `POST` | `/api/deals/:id/synthesize` | AI: synthesize signal report |
| `GET` | `/api/deals/:id/signals` | Get signal reports |

---

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — system design and data model
- [Roadmap](docs/ROADMAP.md) — V1 through V4 feature plan
- [Contributing](CONTRIBUTING.md) — dev workflow and conventions

---

## License

See [LICENSE](LICENSE).
