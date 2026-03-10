# Product Roadmap — VC Reference Check Tool

An AI-powered reference check platform for venture capital firms. The core insight: customer reference checks are the most manual, least automated step in VC diligence — and the most valuable signal.

---

## V1 — Local MVP (Current Build)

**Goal:** A working local tool that demonstrates the full reference check workflow.

- [x] Deal creation and listing
- [x] Reference contact management (add, track status)
- [x] Customer discovery via AI (suggest likely customers given a company)
- [x] AI-generated outreach email drafts
- [x] AI-generated interview guides tailored to the company
- [x] Call note capture
- [x] AI synthesis — turn notes into structured signals
- [x] Signal dashboard with red/green flags per deal

**Stack:** FastAPI + SQLite + React + Tailwind + Claude API

---

## V2 — Production Web App

**Goal:** Deploy as a hosted web app, ready for teams to use and for Twitter launch.

- [ ] PostgreSQL migration
- [ ] User authentication (email/password + Google OAuth)
- [ ] Multi-user collaboration (shared deals, assigned references)
- [ ] Deploy to Railway / Fly.io / Vercel
- [ ] Polished UI with animations and loading states
- [ ] Email sending integration (actually send outreach, not just draft)
- [ ] File upload for pitch decks and call recordings

---

## V3 — Growth Features

**Goal:** Make it sticky for VC teams and worth paying for.

- [ ] Real-time notifications when reference status changes
- [ ] Transcript upload and auto-parsing (Otter.ai / Fireflies integration)
- [ ] G2 and Capterra review scraping for automated customer discovery
- [ ] LinkedIn integration for contact enrichment
- [ ] Deal comparison — stack rank by reference signal strength
- [ ] IC memo generation from reference signals
- [ ] Portfolio intelligence — cross-reference data across all deals
- [ ] Team analytics — deals evaluated, reference velocity, conversion rates

---

## V4 — Platform

**Goal:** Expand beyond reference checks to become the VC diligence OS.

- [ ] Market thesis builder with evidence tracking
- [ ] Founder backchannel reference module
- [ ] Scoring rubrics and investment frameworks
- [ ] LP reporting and audit trail
- [ ] CRM integration (Affinity, Attio)
- [ ] API for custom integrations
