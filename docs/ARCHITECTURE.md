# Architecture Overview

This document describes the high-level design of the VC Reference Check tool — an AI-powered platform that helps venture firms automate customer discovery and reference checking during due diligence.

---

## Goals

- **Automate the hardest part of diligence** — finding and talking to real customers, not just the ones the founder picks
- **Structured data capture** — every reference call follows a standard framework so signals are comparable across deals
- **AI synthesis** — turn raw call notes into actionable red/green flags automatically
- **Speed** — compress a 2-week reference check cycle into days

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
                        │ REST API
┌───────────────────────▼─────────────────────────────────────┐
│                   Backend API Server                        │
│                   Python / FastAPI                          │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Deal CRUD  │  │  Customer    │  │  AI Synthesis     │  │
│  │  & Pipeline │  │  Discovery   │  │  & Signal Engine  │  │
│  └─────────────┘  └──────────────┘  └───────────────────┘  │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────────────────┐     │
│  │  Reference Check │  │  Interview Guide Generator   │     │
│  │  Management      │  │  (AI-powered)                │     │
│  └──────────────────┘  └──────────────────────────────┘     │
└──────┬─────────────────┬────────────────────────────────────┘
       │                 │
┌──────▼──────┐   ┌──────▼──────────────────────────────────┐
│   SQLite    │   │          External Integrations           │
│  (v1 local) │   │  - Claude API (synthesis, guides, disc.)│
│  PostgreSQL │   │  - G2 / Capterra (review scraping)      │
│  (prod)     │   │  - LinkedIn (customer identification)   │
│             │   │  - Web search APIs                      │
└─────────────┘   └──────────────────────────────────────────┘
```

---

## Key Design Decisions

### Backend: Python / FastAPI
FastAPI provides automatic OpenAPI docs and strong typing with Pydantic — well-suited for an internal tool with a small team. SQLite for local development, PostgreSQL for production.

### AI Layer: Claude API
Used for:
- **Customer discovery** — given a company name, generate likely customer profiles and search strategies
- **Interview guide generation** — create tailored reference check questions based on the company's sector, stage, and product
- **Call synthesis** — turn raw notes from reference calls into structured signals (sentiment, churn risk, competitive positioning, product gaps)
- **Signal aggregation** — analyze all references for a deal and surface the most important patterns

All AI calls happen server-side. No API keys in the frontend.

### Data Model

```
Deal
├── id                     UUID
├── company_name           string
├── company_website        string
├── sector                 string
├── stage                  string (screening | deep_dive | ic_review | closed)
├── lead_partner           string
├── description            text
├── created_at / updated_at

ReferenceContact
├── id                     UUID
├── deal_id                FK → Deal
├── name                   string
├── title                  string
├── company                string (where they work — the customer)
├── email                  string
├── linkedin_url           string
├── source                 string (company_provided | discovered | backchannel)
├── status                 string (identified | outreach_sent | scheduled | completed | declined)
├── outreach_template      text (AI-generated email draft)
├── created_at / updated_at

ReferenceNote
├── id                     UUID
├── reference_id           FK → ReferenceContact
├── content                text (raw call notes or transcript)
├── call_date              datetime
├── interviewer            string
├── created_at

SignalReport
├── id                     UUID
├── deal_id                FK → Deal
├── summary                text (AI-generated synthesis)
├── signals                JSON [{category, signal, sentiment, evidence}]
├── red_flags              JSON [string]
├── green_flags            JSON [string]
├── generated_at           datetime
```

### Reference Check Workflow

```
1. Create Deal
   └→ Enter company name, website, sector

2. Discover Customers
   └→ AI suggests likely customers from web presence
   └→ Manual entry for company-provided refs

3. Outreach
   └→ AI drafts personalized emails per contact
   └→ Track status: sent → scheduled → completed

4. Conduct Calls
   └→ AI generates tailored interview guide
   └→ Record notes during/after the call

5. Synthesize
   └→ AI analyzes all notes for this deal
   └→ Produces signal report with red/green flags
   └→ Dashboard view for IC presentation
```

---

## Security Considerations

- API keys and secrets in environment variables only
- Deal data and reference contact info treated as confidential
- No PII logged
- Claude API called with data retention disabled where possible

---

## V1 Scope (Local)

The v1 is a locally-runnable app for a single user:
- SQLite database (no server setup)
- No auth (local-only)
- Full reference check workflow
- Claude API integration for AI features (requires API key)
- Graceful fallback when no API key is set (manual-only mode)
