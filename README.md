# VC Internal Tools — Venture Diligence Platform

An internal toolset for venture capital firms to streamline and improve their due diligence process — from deal sourcing through investment decision.

---

## What This Does

The platform centralizes diligence workflows by providing:

- **Deal tracking** — a structured pipeline from inbound to pass/invest
- **Automated research** — pull company data, news, and market context into a single view
- **Scoring & memos** — standardized frameworks for evaluating deals consistently
- **Collaboration** — shared notes, tasks, and decisions across the investment team
- **Audit trail** — full history of evaluations and decisions for LP reporting

---

## Getting Started

### Prerequisites

- Python 3.11+ or Node 20+ (depending on the service you're running)
- PostgreSQL 15+
- A `.env` file based on `.env.example`

### Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/<your-org>/VC-Internal-Tools.git
cd VC-Internal-Tools

# 2. Copy environment config
cp .env.example .env
# Fill in the required values in .env

# 3. Install dependencies (backend)
pip install -r requirements.txt

# 4. Run database migrations
python manage.py migrate

# 5. Start the development server
python manage.py runserver
```

---

## Project Structure

```
VC-Internal-Tools/
├── docs/               # Architecture, roadmap, and decision records
├── backend/            # API server and business logic
├── frontend/           # Web UI
├── scripts/            # Dev and ops utilities
├── tests/              # Test suites
├── .env.example        # Environment variable template
└── README.md
```

---

## Documentation

| Document | Description |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | System design and technical decisions |
| [Roadmap](docs/ROADMAP.md) | Phased feature plan |
| [Contributing](CONTRIBUTING.md) | How to contribute to this project |

---

## Security

This tool handles sensitive deal data. Never commit secrets, API keys, or investor PII to the repository. See [CONTRIBUTING.md](CONTRIBUTING.md) for security practices.

---

## License

See [LICENSE](LICENSE).
