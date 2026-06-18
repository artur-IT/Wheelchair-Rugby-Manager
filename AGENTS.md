# Project handbook — Wheelchair Rugby Manager

_Single source of truth for humans and AI: project context, structure, conventions, and workflow._

---

The app helps planing and managing wheelchair rugby tournaments.

## Project structure

Domain screens live under `src/features/<module>/`.
Shared layout, providers, hooks, and generic UI stay in `src/components/`.
Astro routes in `src/pages/` import React components from features (use `.tsx` in imports). Full layout: see `.cursor/rules/shared.mdc`.

## Testing

When writing or changing tests use detailed testing rules: see `.cursor/rules/testing.mdc`.

## Development workflow
