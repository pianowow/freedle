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

### Updating Node.js Dependencies

- npm outdated — Lists outdated dependencies. Current is installed, Wanted is the newest version permitted by package.json, and Latest is the registry's latest release.

- npm update — Upgrades installed dependencies to newer versions within the version constraints of package.json. Also updates package-lock.json, but normally leaves package.json unchanged.

- npx npm-check-updates — Shows available upgrades beyond the existing package.json version constraints, including major releases. Does not modify anything.

- npx npm-check-updates -u — Updates version constraints in package.json to allow newer releases. Follow with npm install to update installed packages and package-lock.json.

- npm ci — Performs a clean, reproducible installation from package-lock.json. Fails if the lockfile is inconsistent with package.json, rather than modifying it.

- After upgrading, run lint, tests, and build to verify compatibility. Major version upgrades may introduce breaking changes or peer dependency conflicts.

Commit both package.json and package-lock.json when they change.
