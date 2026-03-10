# Product Roadmap

This roadmap outlines the phased build-out of the VC Internal Tools platform. Priorities are set by the investment team and reviewed quarterly.

---

## Phase 1 — Foundation (Months 1–2)

**Goal:** Replace spreadsheets and email threads with a structured deal pipeline.

- [ ] User auth via SSO (Google Workspace / Okta)
- [ ] Deal creation and basic CRUD (company name, stage, sector, lead partner)
- [ ] Pipeline board view (Kanban by stage)
- [ ] Deal list view with search and filter
- [ ] Timestamped notes on deals (author-attributed)
- [ ] Document upload (pitch decks, financials)
- [ ] Role-based access control (analyst, associate, partner, admin)
- [ ] Audit log for deal record changes

**Success metric:** All active deals tracked in the platform; no new deals in spreadsheets.

---

## Phase 2 — AI-Assisted Research (Months 3–4)

**Goal:** Cut research time per deal by automating information gathering and first-draft memos.

- [ ] Claude API integration for deal research
- [ ] Pitch deck summarization (upload PDF → get structured summary)
- [ ] Auto-populated company profile from public data (Crunchbase / web)
- [ ] First-draft investment memo generation from deal data + notes
- [ ] Q&A interface: ask questions about a company or market, grounded in uploaded docs
- [ ] News and recent funding monitoring for pipeline companies

**Success metric:** Partners spend less time on research aggregation, more time on judgment calls.

---

## Phase 3 — Scoring & Consistency (Months 5–6)

**Goal:** Standardize how deals are evaluated so decisions are defensible and comparable.

- [ ] Configurable scoring rubric per deal type (B2B SaaS, deep tech, consumer, etc.)
- [ ] Scoring UI — partners fill out rubric fields, scores aggregate automatically
- [ ] Deal comparison view — stack rank active pipeline deals side-by-side
- [ ] IC (Investment Committee) memo template with structured sections
- [ ] Decision recording — pass/invest with required rationale
- [ ] Historical decision log for LP reporting

**Success metric:** Every IC-reviewed deal has a completed scorecard and written rationale on record.

---

## Phase 4 — Collaboration & Workflow (Months 7–9)

**Goal:** Make the platform the team's operating system for deals, not just a database.

- [ ] Task assignment on deals (due diligence checklist items)
- [ ] @mentions in notes with notifications
- [ ] Deal activity feed (team-wide and per-deal)
- [ ] Weekly pipeline digest email
- [ ] Founder relationship tracking (communication history)
- [ ] Reference check workflow

**Success metric:** Investment team uses the platform daily without prompting.

---

## Phase 5 — Analytics & Portfolio (Months 10–12)

**Goal:** Use accumulated data to improve future decisions and report to LPs.

- [ ] Funnel analytics — conversion rates by stage, sector, source
- [ ] Decision latency metrics — time from first meeting to decision by deal type
- [ ] Portfolio company view — track companies post-investment
- [ ] LP-ready reporting exports
- [ ] Integration with Affinity CRM or similar (two-way sync)

**Success metric:** Quarterly LP reports generated directly from the platform with no manual data assembly.

---

## Icebox (Future Consideration)

These are ideas not yet scheduled but worth revisiting:

- Mobile app (read-only, for deal review on the go)
- Co-investment partner portal (limited external access)
- Automated cap table modeling
- Real-time collaborative memo editing
- Custom AI fine-tuning on historical investment decisions

---

## How This Roadmap Is Updated

- Reviewed and re-prioritized each quarter by the investment team
- Individual items moved between phases as priorities shift
- New ideas added to the Icebox first, then promoted to a phase when prioritized
