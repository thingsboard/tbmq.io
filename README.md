# TBMQ Docs

Source for [tbmq.io](https://tbmq.io/) — the website and documentation for **TBMQ**, the open-source MQTT broker by ThingsBoard. Built with [Astro](https://astro.build/) and [Starlight](https://starlight.astro.build/).

## Quickstart

Prerequisites: Node.js (any recent LTS) and [pnpm](https://pnpm.io/installation).

```bash
pnpm install
pnpm dev          # http://localhost:4321/
pnpm build:fast   # production build, skips OG image generation
```

## Repo layout

- `src/content/docs/` — documentation pages (Markdown / MDX)
- `src/content/_includes/` — shared content reused across product variants (CE / PE)
- `src/pages/` — marketing and landing pages
- `astro.sidebar.ts` — docs navigation tree
- `src/data/redirects.ts` — redirect source of truth (run `pnpm generate:redirects` after editing)
- `public/` — static assets and the generated redirect rules

See [`CLAUDE.md`](./CLAUDE.md) for the full content architecture reference.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for setup, the CI checks, content authoring conventions, and a playbook for common contributor tasks.

## Links

- [tbmq.io](https://tbmq.io/) — product homepage
- [tbmq.io/docs/](https://tbmq.io/docs/) — live documentation site
- [thingsboard/tbmq](https://github.com/thingsboard/tbmq) — TBMQ broker source

## License

Licensed under the terms in [`LICENSE`](./LICENSE).
