# @spicy/skills-library

Reusable Anthropic Skills bundled with Product Maker.

Phase 1 scaffolding — skills are authored in Phase 4 (`visual-qa`) and Phase 5 (`nextjs-supabase`). See `.claude/ROADMAP.md` at the repo root.

## Layout (target)

```
skills/
├── visual-qa/              # Playwright screenshots + Opus 4.7 vision analysis
├── nextjs-supabase/        # Next.js + Supabase + Tailwind stack knowledge
└── project-conventions/    # Template users copy into their own repo
```

Each skill is a folder with at least a `SKILL.md` (the progressive-disclosure entrypoint).
