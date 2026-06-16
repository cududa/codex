# Prompt Reviews

This directory stores narrow prompt-review documents created from explicit
targets. The tool does not scan commits or decide what is important; give it
the exact file or line range you want to compare.

```bash
python prompt_reviews/prompt-review.py extract <commit> <name=path[:start-end]>...
```

Example:

```bash
python prompt_reviews/prompt-review.py extract 96836e15ed \
  continuation=codex-rs/core/templates/goals/continuation.md \
  budget_limit=codex-rs/core/templates/goals/budget_limit.md
```

Each target creates one Markdown file:

```text
prompt_reviews/<shortsha>/<target>.prompt-review.md
```

The document contains front matter, stable `same-###` and `change-###` block
IDs, the same text, the changed diff blocks, and append-only structured
comments. Comments are fenced `comment` blocks so agents and editor extensions
can parse them without needing to infer meaning from prose.

Useful comment commands:

```bash
python prompt_reviews/prompt-review.py comment prompt_reviews/96836e15ed/continuation.prompt-review.md \
  --target change-001 \
  --type block \
  --body "This whole replacement changes the completion contract."

python prompt_reviews/prompt-review.py comment prompt_reviews/96836e15ed/continuation.prompt-review.md \
  --target change-001 \
  --type string \
  --side after \
  --text "audit must prove completion" \
  --body "This phrase is the pressure point."
```
