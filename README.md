# FediSuite Android App

Mobile client for **FediSuite**, the Fediverse management platform.

FediSuite helps users manage multiple Fediverse accounts in one place, including:

- posting and scheduling
- queue and post management
- account analytics and insights
- account connection and status monitoring
- mobile-friendly access to the FediSuite workflow

Project website: [https://www.fedisuite.com](https://www.fedisuite.com)  
Official hosted instance: [https://app.fedisuite.com](https://app.fedisuite.com)

## What FediSuite Is

FediSuite is an all-in-one management platform for the Fediverse. It is designed to work with platforms such as:

- Mastodon
- Pixelfed
- Friendica
- Misskey and related forks
- PeerTube
- Loops
- additional compatible Fediverse platforms

The core idea is to give users one central management hub for posting, planning, analytics and account administration across different Fediverse services.

This repository contains the **Android app** for that ecosystem.

## What This Repository Contains

This repository contains the source code for the mobile app built with:

- Expo
- React Native
- TypeScript
- React Navigation
- TanStack Query
- Zustand

It is a real mobile application, not:

- a WebView wrapper
- a responsive shell around the desktop frontend
- a copy of the desktop layout squeezed onto a phone

The app is mobile-first and touch-first.

## Important Product Model

The app always connects to a **specific FediSuite instance URL** selected by the user.

That means:

- the user starts with instance selection
- all API requests are scoped to that chosen instance
- tokens, caches and sessions are bound to that instance
- the app works with the official hosted instance and with self-hosted instances

Important clarification:

- `https://app.fedisuite.com` is the official public FediSuite instance
- self-hosted FediSuite instances are also supported
- the app must still not hardcode one backend internally

## Current Feature Set

Implemented in the current app:

- instance URL input and validation
- recent-instance persistence
- login against the chosen instance
- secure JWT storage via SecureStore
- session restore
- bootstrap dashboard via `/api/mobile/bootstrap`
- account analytics via `/api/mobile/accounts/{id}/dashboard`
- queue view via `/api/posts`
- edit, delete and repost actions for queue entries
- composer with media support, alt text and scheduling
- connected accounts overview
- account disconnect
- settings and mobile preferences
- admin-tab gating based on the authenticated user

## Mobile UX Principles

This app is intentionally designed as a native-feeling mobile client.

Key UI principles:

- bottom tab navigation
- large touch targets
- card-based screens
- dark-mode-first visual language
- compact but readable analytics
- explicit loading, error and empty states

## Repository Structure

```text
src/
  api/
  components/
  core/
  hooks/
  navigation/
  screens/
    accounts/
    admin/
    auth/
    composer/
    dashboard/
    instance/
    queue/
    settings/
  store/
  theme/
  utils/
```

Important files:

- `App.tsx`
- `app.config.js`
- `app.json`
- `android/app/build.gradle`
- `AGENTS.md`

## Architecture Overview

### Instance Layer

Responsible for:

- instance URL entry
- normalization
- validation
- persistence of active and recent instances

### Auth Layer

Responsible for:

- login
- token storage
- logout
- session restore
- auth failure recovery

### API Layer

Responsible for:

- typed HTTP requests
- bearer-token injection
- `Accept-Language` injection
- central error parsing
- instance-scoped request handling

### Feature Layer

Responsible for:

- dashboard
- analytics
- queue
- composer
- accounts
- settings
- admin-aware behavior

### UI Layer

Responsible for:

- navigation
- screen composition
- reusable mobile components
- visual states and touch-first interactions

## Important API Endpoints

Pre-login:

- `GET /api/health`
- `GET /api/public/config`
- `GET /api/public/notice`

Authentication:

- `POST /api/auth/login`

Preferred mobile bundle endpoints:

- `GET /api/mobile/bootstrap`
- `GET /api/mobile/accounts/{id}/dashboard`
- `PUT /api/mobile/preferences`

Post and account management:

- `GET /api/posts`
- `POST /api/posts`
- `POST /api/posts/publish-now`
- `PUT /api/posts/{id}`
- `DELETE /api/posts/{id}`
- `POST /api/posts/{id}/repost`
- `GET /api/accounts`
- `DELETE /api/accounts/{id}`

## Important Implementation Rules

These rules should not be broken lightly:

1. Do not remove the instance-selection flow.
2. Do not hardcode one backend into the app.
3. Do not store JWTs in plain AsyncStorage.
4. Do not bypass the typed API layer from screens.
5. Do not turn this app into a WebView or desktop clone.
6. Prefer the mobile bundle endpoints over older fragmented analytics calls.
7. Keep instance data isolated from each other.

## Development

### Requirements

- Node.js
- npm
- OpenJDK 17
- Android SDK
- `adb` for device installation

### Install dependencies

```bash
npm install
```

### Start Expo development server

```bash
npm run start
```

### Typecheck

```bash
npm run typecheck
```

### Export Android bundle

```bash
npx expo export --platform android
```

### Build release APK

```bash
cd android
./gradlew assembleRelease
```

## Versioning

The app reads its version from the plain-text file `version`.

That version is used for:

- Expo app version
- Android `versionName`
- release APK filename
- visible version footer inside the app

Example output:

```text
android/app/build/outputs/apk/release/org.fedisuite.mobile-0.9.9.apk
```

## Installing on a Device

Example:

```bash
adb install -r /absolute/path/to/android/app/build/outputs/apk/release/org.fedisuite.mobile-0.9.9.apk
```

`-r` replaces the existing installation while preserving app data as long as package id and signing key remain compatible.

## Branding

The Android launcher icon and related assets are derived from the official FediSuite logo in this repository.

If branding changes, update both:

- Expo asset files under `assets/`
- native Android launcher assets under `android/app/src/main/res/`

The branding, screenshots and store graphics shipped in this repository are documented in [ASSET_LICENSES.md](./ASSET_LICENSES.md).

## Release Versioning

The canonical app version is stored in the plain-text file `version`.

Android and F-Droid builds derive the numeric `versionCode` directly from that semantic version using this formula:

```text
MAJOR * 10000 + MINOR * 100 + PATCH
```

Examples:

- `0.9.12` -> `912`
- `1.2.3` -> `10203`

This keeps release tags, Fastlane changelogs and Android upgrade paths aligned.

## Related FediSuite URLs

- Website: [https://www.fedisuite.com](https://www.fedisuite.com)
- Hosted app instance: [https://app.fedisuite.com](https://app.fedisuite.com)
- Android app repository: [https://github.com/christinloehner/FediSuite-Android-App](https://github.com/christinloehner/FediSuite-Android-App)
- Self-hosting repository: [https://github.com/christinloehner/FediSuite](https://github.com/christinloehner/FediSuite)
- Main source/build repository for the full application stack: [https://github.com/christinloehner/FediSuite-Docker-Image](https://github.com/christinloehner/FediSuite-Docker-Image)

## Notes

- The app is close to production shape, but parts of the backend may still evolve.
- Some mobile analytics behavior depends on server-side endpoint quality.
- When in doubt, verify against the official hosted instance.

## License

FediSuite is licensed under the GNU GPL v3.0.
