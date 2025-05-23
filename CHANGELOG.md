# Changelog

## Version 0.2.13

### Added

* support deleting user (#93)

## Version 0.2.13

### Fixed

* fix responsive design on mobile (#134)
* fix translation (#132)
* fix latest docker tag auto build (#131)

## Version 0.2.12

### Added

* 🌍 Added multi-language support! Users can now select their preferred language in settings.
* Supported languages: English, Español (Spanish), Deutsch (German), Français (French), Русский (Russian), 简体中文 (Simplified Chinese) and 日本語 (Japanese).

## Version 0.2.11

### Added

* support searching and sorting in habit list

### Improved

* Show overdue tasks in daily overview
* Context menu option for tasks changed from "Move to Today" to "Move to Tomorrow"
* More context menu items in daily overview
* code refactor for context menu and daily overview item section


## Version 0.2.10

### Improved

* performance optimization: faster load time for large data set

## Version 0.2.9

### Added

* Auto backup feature: Automatically backs up data
* Backup rotation: Keeps the last 7 daily backups
* Setting to enable/disable auto backup.

## Version 0.2.8

### Added

* notification for admin users on shared habit / wishlist completion (#92)

## Version 0.2.7

### Added

* visual pin indicators for pinned habits/tasks
* pin/unpin options in context menus
* support click and right-click context menu in dailyoverview

## Version 0.2.6

### Added

* support weekly / monthly intervals for recurring frequency (#99)
* show error when frequency is unsupported (#56)
* add task / habit button in habit view

### Fixed

* make user select modal scrollable

## Version 0.2.5

### Changed

* bumped Nextjs version (cve-2025-29927)

## Version 0.2.4

### Added

* admin can select user to view coins for that user

### Fixed

* fix disable password in demo instance (#74)

## Version 0.2.3

### Fixed

* gracefully handle invalid rrule (#76)
* fix long habit name overflow in daily (#75)
* disable password in demo instance (#74)

## Version 0.2.2

### Changed

* persist "show all" settings in browser (#72)

### Fixed

* nav bar spacing
* completion count badge

## Version 0.2.1

### Changed

* Added bottom padding for nav bar on iOS devices (#63)

## Version 0.2.0

### Added

* Multi-user support with permissions system
* Sharing habits and wishlist items with other users
* show both tasks and habits in dashboard (#58)
* show tasks in completion streak (#57)

### BREAKING CHANGE

* PLEASE BACK UP `data/` DIRECTORY BEFORE UPGRADE.
* Requires AUTH_SECRET environment variable for user authentication. Generate a secure secret with: `openssl rand -base64 32`
* Previous coin balance will be hidden. If this is undesirable, consider using manual adjustment to adjust coin balance after upgrade.

## Version 0.1.30

### Fixed

- fix responsive layout on mobile for habits and wishlist when has archived items

## Version 0.1.29

### Fixed

- actually working redeem link for wishlist items (#52)

## Version 0.1.28

### Added

- redeem link for wishlist items (#52)
- sound effect for habit / task completion (#53)

### Fixed

- fail habit create or edit if frequency is not set (#54)
- archive task when completed (#50)

## Version 0.1.27

### Added

- dark mode toggle (#48)
- notification badge for tasks (#51)

## Version 0.1.26

### Added

- archiving habits and wishlists (#44)
- wishlist item now supports redeem count (#36)

### Fixed

- pomodoro skip should update label

## Version 0.1.25

### Added

- added support for tasks (#41)

## Version 0.1.24

### Fixed

- completed habits atom should not store partially completed habits (#46)

## Version 0.1.23

### Added

- settings to adjust week start day for calendar (#45)

## Version 0.1.22

### Added

- start pomodoro from habit view
- complete past habit in calendar view (#32)

## Version 0.1.21

### Added

- auto cut github release for new version

## Version 0.1.20

### Changed

- improved UI for habits and wishlist on mobile

### Fixed

- fix pomodoro break timer from triggering completions
- don't show progress on pomodoro for single completion habit

## Version 0.1.19

### Added

- PWA support to allow installing app to mobile (#39)
- right click context menu for habits
- Pomodoro clock

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
