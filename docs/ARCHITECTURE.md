# Architecture Overview

This document describes the high-level design of the VC Internal Tools platform.

---

## Goals

- **Speed up diligence** — reduce the time from first meeting to investment decision
- **Consistency** — every deal evaluated against the same framework
- **Data integrity** — single source of truth for deal history, no data in spreadsheets or email threads
- **Security** — deal data is highly sensitive; confidentiality is a first-class concern

---

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Web Browser                          │
│                   (Internal Team Only)                      │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS
┌───────────────────────▼─────────────────────────────────────┐
│                    Frontend (SPA)                           │
│              React / TypeScript / Tailwind                  │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST / GraphQL
┌───────────────────────▼─────────────────────────────────────┐
│                   Backend API Server                        │
│                   Python / FastAPI                          │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Deal CRUD  │  │  AI Research │  │  Scoring Engine   │  │
│  │  & Pipeline │  │  Module      │  │  & Memo Generator │  │
│  └─────────────┘  └──────────────┘  └───────────────────┘  │
└──────┬─────────────────┬────────────────────────────────────┘
       │                 │
┌──────▼──────┐   ┌──────▼──────────────────────────────────┐
│ PostgreSQL  │   │          External Integrations           │
│  (primary   │   │  - Claude API (AI research & summaries) │
│   store)    │   │  - Crunchbase / PitchBook API            │
│             │   │  - LinkedIn                              │
│             │   │  - News / web search APIs                │
└─────────────┘   └──────────────────────────────────────────┘
```

---

## Key Design Decisions

### Backend: Python / FastAPI
FastAPI provides async support, automatic OpenAPI docs, and strong typing with Pydantic — well-suited for an internal tool with a small team.

### Database: PostgreSQL
Structured deal data benefits from relational modeling. PostgreSQL's JSONB columns give flexibility for variable fields (e.g., custom scoring criteria per deal type) without sacrificing query capability.

### AI Layer: Claude API
Used for:
- Summarizing pitch decks and meeting notes
- Generating first-draft investment memos
- Answering research questions about companies and markets

The AI module calls Claude as a backend service; no AI calls happen from the frontend.

### Authentication
SSO via the firm's identity provider (Google Workspace / Okta). All users must be authenticated; there is no public-facing surface.

### Data Isolation
All deal data is scoped to the firm's tenant. If multi-tenancy is ever needed (e.g., for a platform play), row-level security in PostgreSQL will be the enforcement mechanism.

---

## Data Model (Draft)

```
Deal
├── id
├── company_name
├── stage                  # inbound | screening | deep_dive | ic_review | closed
├── sector
├── lead_partner
├── created_at / updated_at
├── notes[]                # timestamped, author-attributed
├── score_card             # JSONB — flexible rubric fields
└── documents[]            # links to uploaded pitch decks, financials

Company
├── id
├── name
├── website
├── founding_year
├── hq_location
├── description
└── external_data          # JSONB — pulled from Crunchbase, LinkedIn, etc.

Memo
├── id
├── deal_id
├── version
├── content                # Markdown
├── generated_by           # human | ai_draft
└── created_at
```

---

## Security Considerations

- All traffic over TLS; no HTTP
- API keys and secrets in environment variables only, never in code
- Role-based access: `analyst`, `associate`, `partner`, `admin`
- Audit log for all writes to deal records
- No deal data stored in AI provider logs (use API-level data handling settings)

---

## Future Considerations

- **Real-time collaboration** — WebSockets for live co-editing of memos
- **Mobile** — read-only native app for deal review on the go
- **Integrations** — two-way sync with Affinity CRM or similar
- **Analytics** — funnel metrics, decision latency, portfolio tracking
