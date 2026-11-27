# Local SVG icons

`astro-icon` looks here for project-local icons, referenced as `<Icon name="filename" />`
(no collection prefix). There are none yet: every icon on the site comes from an Iconify
collection (`tabler:*`, `simple-icons:*`), from Starlight's built-ins, which
`src/components/starlight/Icon.astro` resolves before astro-icon sees them, or from the nav
sprite (`NavIcon`).

The directory must exist even when empty — astro-icon 1.2 aborts its setup step without it,
including the icon type definitions it generates, and warns on every build and dev server start.
