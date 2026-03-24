# Contributing to FediSuite Android App

Thank you for your interest in contributing to the FediSuite Android App.
This document explains how to get involved and which technical and community expectations matter in this repository.

## Our Community

FediSuite is a free and open project for people who use and shape the decentralised Fediverse.

We are an **open, diverse, and welcoming community**. Contributions are welcome from people of all backgrounds, identities, and experiences, regardless of gender, sexual orientation, origin, religion, disability, age, or political conviction.

We value:

- respect
- solidarity
- clarity
- mutual support

### What we expect from each other

- Treat others with respect and kindness.
- Assume good intent and ask before judging.
- Criticise ideas, not people.
- Communicate clearly and constructively.
- Make room for perspectives different from your own.
- Take responsibility for your words and actions.

### What we do not tolerate

- discrimination or exclusion
- personal attacks or insults
- sexist, racist, homophobic, or transphobic statements
- harassment, intimidation, or stalking
- sharing private information without consent

Violations may lead to contributions being rejected and people being excluded from the project space.

## What This Repository Is For

This repository contains the **mobile Android app** for FediSuite.

Use this repository when you want to:

- work on the React Native / Expo mobile app
- improve instance handling, authentication, dashboard, queue, composer, accounts or settings
- improve Android packaging and release builds
- fix mobile-specific bugs
- improve mobile UX, accessibility or app performance

This repository is not the full Docker/source repository for the complete FediSuite stack.

Related repositories and URLs:

- Product website: [https://www.fedisuite.com](https://www.fedisuite.com)
- Official hosted instance: [https://app.fedisuite.com](https://app.fedisuite.com)
- Android app repository: [https://github.com/christinloehner/FediSuite-Android-App](https://github.com/christinloehner/FediSuite-Android-App)
- Self-hosting repository: [https://github.com/christinloehner/FediSuite](https://github.com/christinloehner/FediSuite)
- Main source/build repository: [https://github.com/christinloehner/FediSuite-Docker-Image](https://github.com/christinloehner/FediSuite-Docker-Image)

## Before You Start

Please read these files first:

- `README.md`
- `AGENTS.md`

Those two files explain what this app is, how it works, and which product constraints are important.

## Core Product Rules

These rules are essential and should not be broken by accident:

1. The app must always start with **instance selection**.
2. The app must work with `app.fedisuite.com` and with self-hosted FediSuite instances.
3. The app must still remain **instance-scoped** and must not hardcode one backend internally.
4. JWTs must only be stored in secure storage.
5. Tokens, caches and sessions must stay isolated per instance.
6. The app is mobile-first and must not become a WebView or desktop clone.
7. Prefer the mobile bundle endpoints over fragmented old desktop-style request patterns.

## Prerequisites

You need:

- a [GitHub account](https://github.com)
- Git
- Node.js
- npm
- OpenJDK 17
- Android SDK
- `adb` if you want to test on a real device

## Fork the Repository

Fork the repository on GitHub and then clone your fork locally:

```bash
git clone https://github.com/YOUR-USERNAME/FediSuite-Android-App.git
cd FediSuite-Android-App
```

Add the original repository as `upstream`:

```bash
git remote add upstream https://github.com/christinloehner/FediSuite-Android-App.git
```

## Create a Branch

Do not work directly on `main`.

Create a branch for your change:

```bash
git checkout -b my-feature-name
```

Examples:

- `fix/account-dashboard-error`
- `feature/composer-validation`
- `docs/update-readme`

## Local Development

Install dependencies:

```bash
npm install
```

Start the Expo development server:

```bash
npm run start
```

Typecheck:

```bash
npm run typecheck
```

Export Android bundle:

```bash
npx expo export --platform android
```

Build release APK:

```bash
cd android
./gradlew assembleRelease
```

## Testing on a Real Device

If your Android device is connected via USB debugging:

```bash
adb devices -l
adb install -r /absolute/path/to/android/app/build/outputs/apk/release/org.fedisuite.mobile-<version>.apk
```

Useful for debugging:

```bash
adb logcat -d | rg "org.fedisuite.mobile|AndroidRuntime|ReactNativeJS|FATAL EXCEPTION"
```

## Versioning

The app version is currently read from `APP_VERSION` in `.env`.

That version is used for:

- Expo version
- Android `versionName`
- release APK filename
- visible version footer in the app

If you change version handling, keep those outputs aligned.

## Commit Your Changes

Keep commits focused and understandable.

Use meaningful English commit messages:

```bash
git add .
git commit -m "fix: improve dashboard error handling"
```

Recommended commit prefixes:

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`

## Push Your Branch

```bash
git push origin my-feature-name
```

## Open a Pull Request

When opening a PR:

1. target the original repository’s `main` branch
2. explain what changed
3. explain why it changed
4. include verification steps
5. mention if the change affects:
   - Android build behavior
   - instance handling
   - authentication
   - API contracts
   - branding/assets
   - environment variables

## Sync Upstream Changes

To keep your fork current:

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

## Technical Guidelines

### General

- Do not commit secrets, `.env`, keystores, or local-only files.
- Do not commit generated build artefacts unless explicitly required.
- Do not casually change the Android package id `org.fedisuite.mobile`.
- Do not weaken secure token handling.

### App Architecture

- Keep API access inside `src/api/`.
- Do not add raw fetch logic directly inside screens if an API module is the correct place.
- Keep instance and session handling centralized in the stores and auth helpers.
- Prefer extending existing hooks over duplicating fetch/state logic.

### UI and UX

- Keep the app mobile-first.
- Preserve bottom-tab navigation as the main app shell.
- Always implement loading, error and empty states.
- Maintain strong contrast in dark mode.
- Do not reintroduce desktop-style multi-column layouts.

### Instance and Auth Handling

- Every request must remain relative to the active instance URL.
- Switching instances must invalidate the old auth context.
- On `401` and `403`, session recovery must remain centralized and consistent.
- Do not leak tokens across instances.

### API Behavior

- Prefer:
  - `/api/mobile/bootstrap`
  - `/api/mobile/accounts/{id}/dashboard`
  - `/api/mobile/preferences`
- Use the existing post/account endpoints through the typed API layer.
- If something looks broken, verify whether it is a client bug or a backend response bug before “fixing” it.

### Assets and Branding

- If you change app branding, update both Expo assets and native Android launcher resources.
- Do not leave launcher assets half-updated.

## Verification Expectations

At minimum, before opening a PR, verify:

```bash
npm run typecheck
npx expo export --platform android
cd android && ./gradlew assembleRelease
```

If your change affects device behavior, also verify on a real Android device when possible.

## Documentation Expectations

Update documentation when relevant.

Examples:

- update `README.md` when setup or behavior changes
- update `AGENTS.md` when project structure or important product rules change
- document new required environment variables
- document build-output naming changes

## Scope of Pull Requests

Please keep PRs narrow.

Good:

- one bug fix
- one UX improvement
- one feature slice
- one documentation improvement

Avoid:

- unrelated cleanup mixed into feature work
- broad refactors without strong justification
- multiple product decisions bundled into one PR

## License

By contributing, you agree that your changes will be published under the [GNU GPL v3.0](LICENSE).
