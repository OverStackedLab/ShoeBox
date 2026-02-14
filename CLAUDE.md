# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ShoeBox is a React Native mobile app built with Expo (SDK 54) using the Ignite CLI boilerplate. It uses TypeScript with strict mode, targets iOS, Android, and web, and runs on the New Architecture with Hermes.

## Commands

- **Start dev server**: `yarn start`
- **Run on iOS/Android/Web**: `yarn ios` / `yarn android` / `yarn web`
- **Type check**: `yarn compile`
- **Lint**: `yarn lint` (with auto-fix) / `yarn lint:check` (check only)
- **Run all tests**: `yarn test`
- **Run tests in watch mode**: `yarn test:watch`
- **Run a single test**: `yarn test -- path/to/file.test.ts`
- **E2E tests (Maestro)**: `yarn test:maestro`
- **EAS builds**: `yarn build:ios:sim`, `yarn build:ios:device`, `yarn build:android:sim`, etc.

## Architecture

### Path Aliases
- `@/*` maps to `./app/*`
- `@assets/*` maps to `./assets/*`

### Key Directories
- **`app/`** — All application source code
- **`app/components/`** — Reusable UI components (Text, Button, TextField, Icon, Screen, Header, etc.)
- **`app/screens/`** — Screen components, one per route
- **`app/navigators/`** — React Navigation setup (native stack + bottom tabs)
- **`app/services/api/`** — API client using apisauce
- **`app/context/`** — React Context providers (AuthContext for auth state with MMKV persistence)
- **`app/theme/`** — Design tokens (colors, spacing, typography, timing) with light/dark theme support
- **`app/i18n/`** — i18next internationalization (en, ar, es, fr, ja, ko, hi)
- **`app/utils/storage/`** — MMKV-based persistent key-value storage
- **`app/config/`** — Environment-based config (base, dev, prod)
- **`app/devtools/`** — Reactotron setup for development debugging

### Important Conventions
- **Do not import `Text`, `Button`, or `TextInput` from `react-native`** — use the custom components from `@/components` instead (enforced by ESLint).
- **Do not import `SafeAreaView` from `react-native`** — use `react-native-safe-area-context`.
- **Do not import React as default** — use named imports: `import { useState } from "react"`.
- **Import ordering** is enforced: react → react-native → expo → external → `@/` internal → relative.
- **Themed styling**: Components use function-based styles `(theme) => ({...})` via the `ThemedStyle` type for dark/light mode support.
- **Prefer component props over style overrides**: Always use existing component props (presets, size, weight, heading, text, LeftComponent, RightComponent, bottomSeparator, etc.) before adding custom styles. Only add style overrides for properties not covered by the component API. For example, `Text` presets already set `color: colors.text`, so don't re-declare it in a style; `Card` has `heading`/`ContentComponent` props; `ListItem` has `text`/`LeftComponent`/`RightComponent`/`bottomSeparator` props.

### Formatting
- No semicolons, double quotes disabled (single quotes), trailing commas everywhere, 100 char print width (Prettier).
