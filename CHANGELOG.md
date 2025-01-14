# Changelog

## Version 0.1.19

### Added

- PWA support to allow installing app to mobile
- right click context menu for habits
- Pomodoro clock for habits

### Fixed

- disable today's earned SSR (#38)

## Version 0.1.18

### Added

- flexible recurrence rule using natural language (#1)

### Fixed

- add modal state not cleared after adding habit (#34)
- daily overview habit count should not show target completions

### Improved

- habits and wishlist presentation in daily overview

## Version 0.1.17

### Added

- transactions note

### Fixed

- coin statistics

## Version 0.1.16

### Fixed

- fix performance

## Version 0.1.15

### Fixed

- fix responsive layout for header and coins page in small viewport

## Version 0.1.14

### Added

- show today earned coins in balance and header

## Version 0.1.13

### Added

- habits now support daily completion target (e.g. 7 cups of water)
- Added emoji picker for habit and wishlist names

### Changed

- habit completion now stores as ISO format

## Version 0.1.12

### Added

- show total coins in header
- pagination for coin transactions history

## Version 0.1.11

### Added

- profile button
- settings to update profile image

### Changed

- Move settings and about to under profile button

## Version 0.1.10

### Fixed

- fix navigation

## Version 0.1.9

### Fixed

- fix timezone for "today's transactions"

## Version 0.1.8

### Changed

- use jotai for all state management

## Version 0.1.7

### Fixed

- fixed settings unable to change

## Version 0.1.6

### Added

- make links clickable in habit, wishlist and calendar

## Version 0.1.5

### Added

- docker-compose.yaml
- timezone settings
- use jotai for state management

### Fixed

- completing habits now respect timezone settings
- coin and settings display now respect timezone settings
- performance improvements by caching settings

## Version 0.1.4

### Changed

- new effect when redeeming wishlist

## Version 0.1.3

### Fixed

- updated Dockerfile to include CHANGELOG

## Version 0.1.2

### Added

- About modal
  - display changelog and version info

### Changed

- show number of redeemable wishlist items on dashboard

## Version 0.1.1

### Added

- Settings:
  - added button to show settings
  - coin display settings
- Features:
  - Enabled calendar in large viewport

### Fixed

- format big coin number

## Version 0.1.0

### Added

- Features:
  - dashboard
  - habits
  - coins
  - wishlist
- Demo
- README
- License
