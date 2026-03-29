Push the current branch to GitHub with a well-formed commit. Follow these steps exactly:

## Step 1 — Check for changes

Run `git diff --stat HEAD` and `git status --short` to see what changed, including untracked files.

If the working tree is clean and there is nothing to stage, stop and tell the user:
> "Nothing to commit — your working tree is already clean. No push needed."

## Step 2 — Show a plain-English summary before committing

Display clearly:

```
Branch: <current branch>

Changed files:
<output of git diff --stat HEAD>

New/untracked files:
<list of ?? lines from git status --short, if any>
```

## Step 3 — Write a Conventional Commits message

Read the full diff (`git diff HEAD`) to understand what changed. Write a commit message in this format from CONTRIBUTING.md:

```
<type>(<scope>): <short summary, imperative mood, max 72 chars>
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

Scopes from this repo: `deals`, `tutorial`, `references`, `signals`, `layout`, `auth`, `api`, `push`

Good examples:
- `feat(tutorial): add scroll-driven product tour with section reveals`
- `fix(deals): replace loading text with skeleton pulse components`
- `chore(push): improve push skill with summary and conventional commits`

Show the proposed message to the user before proceeding.

## Step 4 — Stage, commit, and push

Run in sequence:

```bash
git add -A
git commit -m "<commit message from Step 3>"
git push -u origin <current-branch>
```

Get the current branch with `git branch --show-current` first.

## Step 5 — Confirm success

After a successful push, output:

```
✓ Pushed to origin/<branch-name>
  Commit: <hash from git rev-parse HEAD>
  Message: <the commit message>
```

## Error handling

- **Behind remote:** Tell the user to run `/pull` first to rebase, then try `/push` again.
- **Any other failure:** Show the raw error and suggest checking GitHub access.
