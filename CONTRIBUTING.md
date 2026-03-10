# Contributing Guide

This document covers how the team develops and ships changes to the VC Internal Tools platform.

---

## Branching Strategy

We use a **trunk-based development** model with short-lived feature branches.

| Branch | Purpose |
|---|---|
| `main` | Production-ready code. Protected — no direct pushes. |
| `feature/<short-description>` | New features or enhancements |
| `fix/<short-description>` | Bug fixes |
| `chore/<short-description>` | Dependency updates, config changes, refactors |

### Branch Rules

- Branch off `main` for all new work
- Keep branches focused — one concern per branch
- Delete branches after merging
- Never commit directly to `main`

---

## Development Workflow

1. **Create a branch** from the latest `main`
   ```bash
   git checkout main && git pull origin main
   git checkout -b feature/my-feature
   ```

2. **Make changes** in small, logical commits

3. **Write or update tests** for any changed behavior

4. **Open a Pull Request** against `main`
   - Fill out the PR template
   - Link the relevant issue if one exists
   - Request at least one reviewer from the investment team

5. **Address review feedback**, then merge after approval

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

**Examples:**
```
feat(deals): add scoring rubric to deal detail view
fix(auth): resolve session expiry on SSO redirect
docs(roadmap): add Phase 2 milestone dates
```

---

## Code Review Standards

Reviewers should check for:

- **Correctness** — does it do what it says?
- **Security** — no secrets, no injection vectors, input validation at boundaries
- **Clarity** — is the logic easy to follow?
- **Tests** — are new behaviors covered?

Reviewers should NOT block on stylistic preferences outside of the agreed linter config.

---

## Security Practices

- Never commit `.env` files, API keys, tokens, or credentials
- Use `.env.example` with placeholder values for documentation
- Treat deal data and founder information as confidential — do not log PII
- All external API integrations must go through the backend; no API keys in the frontend

---

## Running Tests

```bash
# Run the full test suite
pytest

# Run with coverage
pytest --cov=. --cov-report=term-missing
```

All tests must pass before a PR can be merged.

---

## Questions

Open an internal GitHub Discussion or ping the `#eng` channel.
