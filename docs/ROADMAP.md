# Teton: Product Roadmap

> **From reference checking tool to the VC deal intelligence platform.**

## Context

The current product ("RefCheck") automates customer reference checks for VC firms using AI. It works -- deals flow through a pipeline, Claude discovers customers, generates outreach, builds interview guides, and synthesizes call notes into red/green flag signal reports.

But it's a single-workflow tool. To showcase to a VC firm, it needs to become **Teton** -- a living deal intelligence platform where reference checking is the crown jewel, surrounded by auto-enrichment, relationship tracking, meeting timelines, conviction scoring, and a UI that feels like the system is working for you even when you're not using it.

**The Sequoia benchmark:** Their CRM auto-populates when a startup is founded. It knows who in the firm has met the founder. It tracks every touchpoint. The data is always fresh. The interface is clean, fast, and anticipatory. Teton should create that same feeling.

**Architecture:** Supabase-first. Frontend talks directly to Supabase for CRUD, Supabase Edge Functions for AI. Supabase Realtime for live updates.

---

## What Exists Today (RefCheck v1)

- Deal CRUD with pipeline stages (screening / deep_dive / ic_review / closed)
- Reference contact management with status tracking
- AI customer discovery via Claude
- AI outreach email generation
- AI interview guide generation
- Call note capture with timestamps
- AI signal synthesis (structured signals with red/green flags)
- Tutorial/onboarding flow with demo mode
- **Stack:** React 18 + TypeScript + Tailwind + Vite | Supabase (DB + Edge Functions) | Claude API (Haiku)
- **UI:** Clean but static. Tailwind utilities, basic card animations, skeleton loaders. No component library, no toast system, no real-time features, no search.

---

## Phase 0: Rebrand + Design System Foundation

**Goal:** Establish the brand and component system. Everything after this looks premium.

### Rebrand
- Rename to **Teton** throughout
- New logo treatment in sidebar
- Update page titles, meta tags, README

### Design System
| Task | Effort |
|------|--------|
| Install + configure shadcn/ui (components live in repo, Radix primitives for accessibility) | S |
| Install framer-motion (replace CSS keyframe animations with motion components) | S |
| Install sonner (toast notifications, replaces inline error banners) | S |
| Define design tokens in Tailwind config: brand color palette, typography scale, dark mode | S |
| Dark mode via `darkMode: 'class'` + toggle with localStorage persistence | M |
| `cn()` utility for class merging (clsx + tailwind-merge) | S |

### Why These Choices
- **shadcn/ui:** Components live in the repo (not node_modules) -- full control over design. Radix handles keyboard nav and ARIA.
- **framer-motion:** Replaces the 3 CSS keyframes in `index.css` with a proper animation system: page transitions, staggered lists, animated counters, layout animations for drag-and-drop.
- **sonner:** One import, global toasts. Replaces the inline error `<div>` blocks in DealList and DealDetail.

---

## Phase 1: Command Center Dashboard

**Goal:** The first screen defines the impression. Replace the flat deal grid with an executive command center.

| Feature | Demo Impact | Effort |
|---------|-------------|--------|
| **Dashboard home page** at `/` with summary metrics row | Very High | M |
| **Pipeline Kanban** -- drag-and-drop deal cards across stage columns | Very High | M |
| **Activity feed** -- timestamped stream of recent events | Very High | M |
| **Command palette** (Cmd+K) -- search deals, navigate, quick actions | Very High | M |
| **Sparkline charts** -- pipeline funnel, deal velocity, sector breakdown | High | M |
| **AI Suggestions section** -- proactive prompts ("3 deals have stale signal reports") | High | M |
| **Sidebar navigation** -- replace top nav with collapsible sidebar (Dashboard, Pipeline, Deals, Network) | High | S |

### Dashboard Layout
```
+--sidebar--+------------------------------------------+
|            |  [Active Deals] [Refs Done] [Signals] [Closed] |  <- animated counter cards
| Dashboard  |                                          |
| Pipeline   |  +-- Screening --+-- Deep Dive --+-- IC Review --+-- Closed --+
| Deals      |  |  Deal Card    |  Deal Card    |  Deal Card    |            |  <- Kanban
| Network    |  |  Deal Card    |               |               |            |
|            |  +--------------+---------------+---------------+            |
| Settings   |                                          |
|            |  [AI Suggestions: "Synthesize signals for Acme?"]           |
+------------+------------------------------------------+
```

### New Data: `activity_events` table
```sql
id          UUID PK
deal_id     FK -> deals (nullable)
event_type  TEXT (deal_created | stage_changed | reference_added | signal_generated | note_added | meeting_logged)
title       TEXT
metadata    JSONB
created_at  TIMESTAMPTZ DEFAULT now()
```

### Tech
- **@dnd-kit/core** for Kanban drag-and-drop (modern, accessible)
- **recharts** for sparkline charts (lightweight, React-native)
- **cmdk** (via shadcn Command component) for the palette
- Drag-drop calls existing `updateDeal(id, { stage: newStage })` -- no new API needed

---

## Phase 2: Company Auto-Enrichment

**Goal:** Type a company name. The system fills in everything. This is the jaw-drop moment.

| Feature | Demo Impact | Effort |
|---------|-------------|--------|
| **Auto-enrich on deal creation** -- Claude generates structured company profile | Very High | M |
| **Company profile card** on DealDetail (logo, founded, funding, team size, competitors) | Very High | M |
| **Founder/key people cards** with titles and LinkedIn | High | M |
| **"Re-enrich" button** to refresh stale profiles | Medium | S |
| **Streaming AI responses** (SSE) so enrichment text flows in live | High | M |

### New Data: `company_profiles` table
```sql
id              UUID PK
deal_id         FK -> deals (unique, 1:1)
logo_url        TEXT
founded_year    INTEGER
team_size_range TEXT
funding_stage   TEXT
total_raised    TEXT
competitors     JSONB     -- ["Competitor A", "Competitor B"]
key_people      JSONB     -- [{name, title, linkedin_url}]
ai_summary      TEXT
enriched_at     TIMESTAMPTZ
```

### How It Works
1. User creates deal with company name + website
2. Supabase Edge Function fires enrichment: Claude generates structured profile from the company name/website
3. Profile card renders above the tabs on DealDetail -- logo, one-line description, funding badge, team avatars, competitor chips
4. Demo mode: pre-populated rich profiles (same pattern as existing `DEMO_DISCOVER`)
5. For logos: `https://logo.clearbit.com/{domain}` (free, no API key)

### Visual Impact
Before: DealDetail opens with a sparse text header (company name, sector, partner).
After: DealDetail opens with a rich company card -- logo, AI summary, funding stage pill, team photos, competitive landscape. Feels like Crunchbase + Notion.

---

## Phase 3: Relationship & Meeting Tracking

**Goal:** Track all touchpoints, not just reference calls. This is what makes it a CRM.

| Feature | Demo Impact | Effort |
|---------|-------------|--------|
| **Contacts table** (people in the firm's network, independent of deals) | Medium | M |
| **Touchpoints table** (meetings, emails, calls linked to deals + contacts) | Medium | M |
| **Meeting timeline** on DealDetail -- all interactions chronologically | High | M |
| **Contacts page** with search, filters, relationship strength indicators | High | L |
| **Relationship graph visualization** -- force-directed network of who knows whom | Very High | L |
| **"Log Meeting"** quick action from command palette | High | S |

### New Data Models
```sql
-- People in the firm's network (distinct from reference_contacts which are deal-specific)
contacts
  id                    UUID PK
  name                  TEXT NOT NULL
  title                 TEXT
  company               TEXT
  email                 TEXT
  linkedin_url          TEXT
  relationship_strength TEXT (strong | warm | cold)
  tags                  JSONB
  notes                 TEXT
  last_contact_date     TIMESTAMPTZ
  created_at            TIMESTAMPTZ
  updated_at            TIMESTAMPTZ

-- Every interaction: founder meetings, reference calls, emails, intros
touchpoints
  id              UUID PK
  deal_id         FK -> deals (nullable)
  contact_id      FK -> contacts (nullable)
  type            TEXT (meeting | email | call | intro | note)
  title           TEXT
  content         TEXT
  occurred_at     TIMESTAMPTZ
  created_by      TEXT
  created_at      TIMESTAMPTZ
```

### Key Design Decision
`ReferenceContact` stays as-is for the reference checking workflow. `Contact` is the broader CRM entity -- people in the firm's network across all deals. A contact can be linked to multiple deals via touchpoints. This preserves the existing reference check flow while adding CRM depth.

### Relationship Graph
Use **@xyflow/react** (React Flow) or **d3-force** for a force-directed graph. Nodes = people + companies. Edges = relationships. Color-coded by type (founder, reference, investor, advisor). Hovering shows a tooltip card. This is the single most visually impressive feature for demos.

---

## Phase 4: AI Copilot & Conviction Scoring

**Goal:** Make the AI proactive. The system surfaces insights before you ask.

| Feature | Demo Impact | Effort |
|---------|-------------|--------|
| **Conviction Score** -- 0-100 gauge synthesizing all signals, enrichment, and activity for a deal | Very High | M |
| **AI Insights panel** on Dashboard -- proactive suggestions surfaced automatically | Very High | M |
| **AI meeting prep** -- generate a briefing before an upcoming touchpoint | High | M |
| **Sort pipeline by conviction score** | High | S |

### Conviction Score
The single most powerful demo feature. A radial gauge on each deal card and detail page showing a 0-100 score with confidence level (low/medium/high). Computed from:
- Signal report sentiment distribution
- Reference completion rate
- Enrichment data quality
- Recency of activity
- Red flag count

Partners can sort the Kanban by conviction score. The score updates as new data arrives.

### New Data: `deal_scores` table
```sql
id          UUID PK
deal_id     FK -> deals
score       INTEGER (0-100)
confidence  TEXT (low | medium | high)
reasoning   TEXT
factors     JSONB
scored_at   TIMESTAMPTZ
```

### Deals Table Additions
```sql
ALTER TABLE deals ADD COLUMN conviction_score INTEGER;
ALTER TABLE deals ADD COLUMN last_activity_at TIMESTAMPTZ;
ALTER TABLE deals ADD COLUMN priority TEXT DEFAULT 'medium';
ALTER TABLE deals ADD COLUMN tags JSONB DEFAULT '[]';
```

---

## Phase 5: Polish & "Alive" Feel

**Goal:** The final layer that makes VCs say "I need this."

| Feature | Demo Impact | Effort |
|---------|-------------|--------|
| **Supabase Realtime** -- live updates across tabs/users | Very High | M |
| **Rich demo seed data** -- 8-10 deals, 15-20 contacts, 30+ touchpoints, conviction scores | Very High | M |
| **Page transitions** with framer-motion AnimatePresence | High | S |
| **Animated number counters** on dashboard metrics | High | S |
| **Keyboard shortcuts** throughout (Cmd+K, Cmd+N, etc.) | High | M |
| **Shimmer skeleton loaders** (upgraded from basic pulse) | Medium | S |
| **Empty states** with clear CTAs | Medium | S |

### Supabase Realtime
The biggest "alive" win with minimal effort. The Supabase client is already initialized. Subscribe to Postgres changes:
```typescript
supabase.channel('deals')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, handler)
  .subscribe()
```
- Activity feed updates live when a colleague adds a note
- Deal cards update when someone moves a deal stage
- Signal reports appear the instant they finish generating
- Zero backend changes required

### Demo Seed Data
The first-load experience must be powerful. Seed with:
- 8-10 deals across all pipeline stages
- 2-3 deals with complete reference workflows (references, notes, signal reports)
- Company profiles with enrichment data pre-populated
- 15-20 contacts with relationship strengths
- 30+ touchpoints creating a rich activity feed
- Conviction scores for completed deals
- Mix of "hot" deals (high conviction, recent activity) and "stale" deals

---

## Target Architecture

### Frontend
```
src/
  components/
    ui/          -- shadcn (Button, Card, Dialog, Command, Tabs, Badge, etc.)
    layout/      -- Layout, Sidebar, CommandPalette
    dashboard/   -- MetricCard, ActivityFeed, PipelineChart
    deal/        -- DealCard, ConvictionScore, FounderCard, CompanyProfile
    pipeline/    -- PipelineKanban, KanbanColumn, KanbanCard
    timeline/    -- Timeline, TimelineEvent
    contacts/    -- ContactCard, RelationshipGraph
    shared/      -- AnimatedNumber, EmptyState, SkeletonCard
  pages/
    Dashboard.tsx    -- new home (/)
    Pipeline.tsx     -- Kanban view (/pipeline)
    DealDetail.tsx   -- expanded with enrichment, timeline, score
    Contacts.tsx     -- network CRM (/network)
    Tutorial.tsx     -- keep existing
  hooks/
    useRealtimeSubscription.ts
    useCommandPalette.ts
    useDarkMode.ts
  lib/
    supabase.ts      -- existing, add Realtime subscriptions
    utils.ts         -- cn() helper
  api.ts             -- expanded (enrichment, contacts, touchpoints, activity, scoring)
  types.ts           -- expanded with new interfaces
```

### Supabase
```
supabase/
  migrations/
    001_initial_schema.sql          -- existing
    002_activity_events.sql         -- Phase 1
    003_company_profiles.sql        -- Phase 2
    004_contacts_touchpoints.sql    -- Phase 3
    005_deal_scores.sql             -- Phase 4
  functions/
    discover/           -- existing
    outreach/           -- existing
    interview-guide/    -- existing
    synthesize/         -- existing
    seed-tutorial/      -- existing
    enrich-company/     -- Phase 2 (new)
    compute-score/      -- Phase 4 (new)
    copilot/            -- Phase 4 (new)
```

### Key Libraries
| Library | Purpose | Size |
|---------|---------|------|
| shadcn/ui + Radix | Component system | ~0 (copy-paste, no bundle) |
| framer-motion | Animations, page transitions | ~30KB gzip |
| @dnd-kit/core | Kanban drag-and-drop | ~10KB gzip |
| cmdk | Command palette | ~5KB gzip |
| sonner | Toast notifications | ~5KB gzip |
| recharts | Charts and data viz | ~40KB gzip |
| @xyflow/react | Relationship graph | ~45KB gzip |
| TanStack Query | Server state, optimistic updates | ~12KB gzip |

---

## Priority Matrix

| # | Feature | Demo Impact | Effort | Phase |
|---|---------|-------------|--------|-------|
| 1 | shadcn/ui + design system + dark mode | High | M | 0 |
| 2 | Sidebar navigation | High | S | 1 |
| 3 | Dashboard with animated metrics | Very High | M | 1 |
| 4 | Pipeline Kanban (drag-and-drop) | Very High | M | 1 |
| 5 | Command palette (Cmd+K) | Very High | M | 1 |
| 6 | Activity feed | Very High | M | 1 |
| 7 | Company auto-enrichment | Very High | M | 2 |
| 8 | Streaming AI responses | High | M | 2 |
| 9 | Conviction score gauge | Very High | M | 4 |
| 10 | Meeting timeline | High | M | 3 |
| 11 | Contacts/network CRM | High | L | 3 |
| 12 | Relationship graph | Very High | L | 3 |
| 13 | AI Insights panel | Very High | M | 4 |
| 14 | Supabase Realtime | Very High | M | 5 |
| 15 | Rich demo seed data | Very High | M | 5 |
| 16 | Page transitions + micro-interactions | High | S | 5 |

---

## Demo Flow (V1 Showcase)

1. **Open Teton** -- Dashboard loads with animated metric counters, Kanban pipeline populated with deals, activity feed scrolling with recent events
2. **Cmd+K** -- Command palette opens. Type "Acme". Navigate instantly.
3. **Create a new deal** -- Type company name. Watch enrichment stream in: logo, funding stage, team, AI summary. The system already knows about the company.
4. **Drag to Deep Dive** -- Move the deal card on the Kanban. Activity feed updates live. Toast confirms the stage change.
5. **Open deal detail** -- Rich company profile card. Reference checking workflow below. Meeting timeline showing all touchpoints.
6. **Run AI discovery** -- Claude suggests customers. Add them as references. Generate outreach emails.
7. **View signal report** -- Red/green flags from completed reference calls. Conviction score gauge shows 73/100 with "Medium-High" confidence.
8. **Switch to Network** -- Force-directed graph lights up showing who in the firm's network connects to this deal.
9. **Toggle dark mode** -- Everything transitions smoothly. The product feels premium.
10. **Open second tab** -- Change a deal stage in tab 1. Watch it update live in tab 2 via Supabase Realtime.

This is the demo that makes a VC partner say: *"This is better than what we built internally."*
