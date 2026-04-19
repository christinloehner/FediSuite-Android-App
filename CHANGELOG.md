# Changelog

All notable changes to this project are documented in this file.

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
