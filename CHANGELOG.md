# Changelog

All notable changes to this project are documented in this file.

## v0.9.12

### Added

- Added English language support. Switching to English in Settings now updates the entire app UI immediately, including all screens, tabs and error messages. (#3)
- Added a local app settings store persisted via AsyncStorage for language and theme preferences so these settings stay on-device and are no longer sent to the FediSuite API. (#3)
- Added a Light theme option to Settings. The app now supports System, Dark and Light mode selection that applies instantly across the whole UI. (#3)
- Added a deterministic Android and F-Droid `versionCode` strategy derived from the repository `version` file so each release now gets a monotonic numeric build version instead of a constant `1`. (#3)
- Added localized Fastlane metadata for German and Italian plus a repository-local `.fdroid.yml` to make the app metadata and release tracking more F-Droid-friendly. (#3)
- Added explicit repository documentation for the licensing and redistribution rights of the FediSuite branding, screenshots and store assets used in the app and Fastlane metadata. (#3)
- Added a concrete `fdroiddata` metadata template for `org.fedisuite.mobile` plus a repository-local submission guide covering the current F-Droid merge-request workflow. (#3)
- Added F-Droid build steps for the Expo/React-Native toolchain so the metadata now provisions `npm`, runs `npm ci` before Gradle and cleans `node_modules` through F-Droid build metadata instead of relying on a preconfigured environment. (#3)

### Fixed

- Fixed light and dark mode switching so the selected theme is now respected by all UI components instead of leaving most components in dark mode because they read the system color scheme directly. (#3)
- Fixed Fastlane changelog numbering so the current release metadata now follows the real Android `versionCode` instead of a stale `1.txt` placeholder. (#3)

## v0.9.11

### Added

- Added a functional admin area to the Android app that is wired to the real instance-scoped backend endpoints for global notices and registered users, including search and pagination for the user list.
- Added dedicated typed admin API modules and query hooks so admin notice and admin user data are loaded through the app's central API layer instead of screen-local requests.
- Added localized admin UI strings for German, English and Italian to cover the new notice and user-management flows.
- Added native chart components for account analytics, including vertical bar charts, horizontal comparison bars and a best-times heatmap for mobile dashboards.

### Fixed

- Fixed the `Queue` tab crash by normalizing `/api/posts` responses from compatible backend shapes before the queue screen reads them and by guarding against non-array payloads in the UI.
- Fixed account analytics hashtag combinations so the Android app now reads the real backend fields `tag_a` and `tag_b` instead of showing `Unbekannt` for every combination.
- Fixed multiple Android analytics data models so charts and summary widgets now match the actual mobile dashboard payload returned by FediSuite instances, including `media_performance`, hashtag overview data and top hashtag metrics.
- Fixed analytics chart rendering crashes caused by non-numeric API values by normalizing incoming chart values before formatting and drawing them.
- Fixed Android environment setup documentation in practice by aligning the app build, package output and installed device version with the current `0.9.11` release state.
