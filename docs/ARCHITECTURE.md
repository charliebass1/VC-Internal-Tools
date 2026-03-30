# Architecture Overview

This document describes the high-level design of **Teton** -- an AI-powered deal intelligence platform for venture capital firms. The core workflow automates customer discovery and reference checking during due diligence. The platform extends this with company auto-enrichment, relationship tracking, meeting timelines, conviction scoring, and a real-time dashboard.

---

## Goals

- **Automate the hardest part of diligence** -- finding and talking to real customers, not just the ones the founder picks
- **Structured data capture** -- every reference call follows a standard framework so signals are comparable across deals
- **AI synthesis** -- turn raw call notes into actionable red/green flags automatically
- **Speed** -- compress a 2-week reference check cycle into days
- **Intelligence** -- auto-enrich company profiles, track relationships across the firm's network, compute conviction scores
- **Alive feel** -- real-time updates, smooth animations, proactive AI suggestions

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
│        React / TypeScript / Tailwind / shadcn/ui           │
│        framer-motion / recharts / @dnd-kit                 │
└───────────────────────┬─────────────────────────────────────┘
                        │ Supabase Client SDK
┌───────────────────────▼─────────────────────────────────────┐
│                     Supabase                                │
│                                                             │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────┐   │
│  │  PostgreSQL   │  │  Edge         │  │  Realtime      │   │
│  │  Database     │  │  Functions    │  │  (WebSocket)   │   │
│  └──────────────┘  └───────────────┘  └────────────────┘   │
│                                                             │
│  Database: deals, reference_contacts, reference_notes,      │
│            signal_reports, company_profiles, contacts,       │
│            touchpoints, activity_events, deal_scores         │
│                                                             │
│  Edge Functions:                                            │
│  - discover (AI customer discovery)                         │
│  - outreach (AI email drafts)                               │
│  - interview-guide (AI question generation)                 │
│  - synthesize (AI signal synthesis)                         │
│  - enrich-company (AI company profile generation)           │
│  - compute-score (AI conviction scoring)                    │
│  - copilot (AI proactive suggestions)                       │
│  - seed-tutorial (demo data population)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
               ┌───────▼───────┐
               │  Claude API   │
               │  (Anthropic)  │
               └───────────────┘
```

---

## Key Design Decisions

### Architecture: Supabase-First
Frontend talks directly to Supabase for CRUD operations via the Supabase JS client. AI-powered features run as Supabase Edge Functions (Deno). Supabase Realtime provides live updates via WebSocket subscriptions. This eliminates the need for a separate backend server in production.

### AI Layer: Claude API
Used for:
- **Customer discovery** -- given a company name, generate likely customer profiles and search strategies
- **Interview guide generation** -- create tailored reference check questions based on the company's sector, stage, and product
- **Call synthesis** -- turn raw notes from reference calls into structured signals (sentiment, churn risk, competitive positioning, product gaps)
- **Signal aggregation** -- analyze all references for a deal and surface the most important patterns
- **Company enrichment** -- auto-generate company profiles (funding, team, competitors) from name and website
- **Conviction scoring** -- compute a 0-100 deal score from all available signals and data
- **Proactive intelligence** -- surface contextual suggestions (stale reports, missing references, meeting prep)

All AI calls happen server-side via Edge Functions. No API keys in the frontend.

### Frontend: React + shadcn/ui + framer-motion
- **shadcn/ui** for the component system (copy-paste components, Radix primitives, full design control)
- **framer-motion** for animations (page transitions, staggered lists, counter animations, layout animations)
- **@dnd-kit** for Kanban drag-and-drop
- **recharts** for data visualization
- **cmdk** for the command palette
- **TanStack Query** for server state caching and optimistic updates

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
├── conviction_score       integer (0-100, cached from deal_scores)
├── last_activity_at       timestamptz
├── priority               string (high | medium | low)
├── tags                   jsonb
├── created_at / updated_at

CompanyProfile (1:1 with Deal)
├── id                     UUID
├── deal_id                FK → Deal
├── logo_url               string
├── founded_year           integer
├── team_size_range        string
├── funding_stage          string
├── total_raised           string
├── competitors            jsonb (string array)
├── key_people             jsonb (array of {name, title, linkedin_url})
├── ai_summary             text
├── enriched_at            timestamptz

ReferenceContact
├── id                     UUID
├── deal_id                FK → Deal
├── name, title, company, email, linkedin_url
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

SignalReport
├── id                     UUID
├── deal_id                FK → Deal
├── summary                text (AI-generated synthesis)
├── signals                jsonb [{category, signal, sentiment, evidence}]
├── red_flags              jsonb [string]
├── green_flags            jsonb [string]
├── generated_at           timestamptz

Contact (firm's network, independent of deals)
├── id                     UUID
├── name, title, company, email, linkedin_url
├── relationship_strength  string (strong | warm | cold)
├── tags                   jsonb
├── notes                  text
├── last_contact_date      timestamptz

Touchpoint (meetings, calls, emails linked to deals + contacts)
├── id                     UUID
├── deal_id                FK → Deal (nullable)
├── contact_id             FK → Contact (nullable)
├── type                   string (meeting | email | call | intro | note)
├── title                  string
├── content                text
├── occurred_at            timestamptz
├── created_by             string

ActivityEvent (powers the activity feed)
├── id                     UUID
├── deal_id                FK → Deal (nullable)
├── event_type             string
├── title                  string
├── metadata               jsonb
├── created_at             timestamptz

DealScore (AI conviction scoring)
├── id                     UUID
├── deal_id                FK → Deal
├── score                  integer (0-100)
├── confidence             string (low | medium | high)
├── reasoning              text
├── factors                jsonb
├── scored_at              timestamptz
```

### Core Workflows

```
1. Create Deal
   └→ Enter company name, website, sector
   └→ Auto-enrichment fires: Claude generates company profile
   └→ Activity event logged

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
   └→ Conviction score computed

6. Track Relationships
   └→ Log meetings, calls, intros as touchpoints
   └→ Build firm's contact network over time
   └→ Relationship graph shows who connects to whom
```

---

## Security Considerations

- API keys and secrets in environment variables only
- Deal data and reference contact info treated as confidential
- No PII logged
- Claude API called with data retention disabled where possible
- Supabase Row-Level Security (RLS) enabled for all tables

---

## V1 Scope (Current Build)

The v1 is a locally-runnable app:
- SQLite database (via FastAPI backend, for local dev)
- Supabase for production deployment
- No auth (local-only, multi-user via Supabase in production)
- Full reference check workflow
- Claude API integration for AI features (requires API key)
- Graceful fallback when no API key is set (demo mode)
