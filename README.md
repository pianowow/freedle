# Freedle 

Freedle is a free, open-source, and ad-free word game. 

## Development Toolchain

Use Node.js `22.22.2` with npm `10.9.7` for local development and lockfile updates.

This repository includes:

- `.mise.toml` for mise users;
- `.nvmrc` for nvm and other Node version managers;
- `packageManager` and `engines` entries in each npm project.

For routine installs, prefer `npm ci` inside each project directory. Use `npm install` only when intentionally changing dependencies or refreshing a lockfile.

Update the pinned Node/npm versions only when the development machines and CI are ready to move together.
