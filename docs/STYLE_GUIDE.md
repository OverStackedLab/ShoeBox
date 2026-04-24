# ShoeBox Coding Style Guide

A working document for keeping the codebase consistent. Add rules as we discover them — each entry should say what to do, and briefly why.

## Core principle: always reuse before you create

**Always prefer existing styles, components, and typography over new ones.** Before writing any JSX, `StyleSheet`, or `Text` with custom `size`/`weight`, search the codebase for an existing primitive, preset, theme token, or shared style utility that already covers the need. New custom styling is the last resort, not the first instinct.

This applies to:

- **Components** — reach for `Text`, `Button`, `Card`, `ListItem`, `Screen`, `TextField`, `Icon`, `EmptyState`, `Header` before building your own.
- **Typography** — use a `Text` `preset` before composing `size` + `weight` + `style` yourself.
- **Colors & spacing** — use `colors.*` and `spacing.*` from the theme; never hardcode.
- **Style fragments** — check [`app/theme/typography.ts`](../app/theme/typography.ts) and sibling files for helpers like `$tabularNums` before duplicating.

If an existing primitive almost fits, prefer adding a prop to it over forking a new component. See [When a custom component *is* appropriate](#when-a-custom-component-is-appropriate) for the narrow cases where new code is warranted.

## Prefer existing components and theme over custom styles

**Rule:** Before writing a new component or a new `StyleSheet`, check if the design system already covers it. Only fall back to custom styles when no existing primitive fits.

**Why:** The app already ships with themed, presetted building blocks (`Text`, `Button`, `Card`, `Header`, `Icon`, `ListItem`, `Screen`, `TextField`). Bypassing them produces visual drift (different font sizes for "the same" heading), breaks theming (hardcoded colors don't flip in dark mode), and duplicates work when the design changes.

### Components — use these first

| Need | Use | Not |
|---|---|---|
| Any text | [`Text`](../app/components/Text.tsx) with a `preset` | raw `<Text>` from `react-native` |
| Text input | [`TextField`](../app/components/TextField.tsx) | raw `<TextInput>` |
| Buttons | [`Button`](../app/components/Button.tsx) | `TouchableOpacity` + styled text |
| Screen container | [`Screen`](../app/components/Screen.tsx) | `<SafeAreaView>` + `<ScrollView>` |
| App icons | [`Icon`](../app/components/Icon.tsx) / `PressableIcon` | raw `<Image>` for icon assets |
| List rows | [`ListItem`](../app/components/ListItem.tsx) | custom row `View` |
| Empty states | [`EmptyState`](../app/components/EmptyState.tsx) | ad-hoc empty view |

ESLint enforces the first two via `no-restricted-imports` — `Text`, `Button`, and `TextInput` can't be imported from `react-native`.

### Typography — use presets, not raw `size` + `weight`

Available presets in [`Text.tsx`](../app/components/Text.tsx):

- `heading`, `subheading` — page headings
- `displayTitle` — 28/36 bold (screen titles)
- `sectionHeading` — sm bold uppercase (section labels)
- `modalTitle` — md bold (modal headers)
- `formLabel`, `formHelper` — form fields
- `bold`, `default`

```tsx
// Good
<Text preset="sectionHeading" text="Details" />

// Avoid — a preset already exists for this
<Text text="Details" size="sm" weight="bold" uppercase />
```

### Colors — always go through the theme

```tsx
// Good
const $row: ThemedStyle<ViewStyle> = ({ colors }) => ({ backgroundColor: colors.background })

// Avoid — hardcoded colors skip dark mode
const $row: ViewStyle = { backgroundColor: "#FFFFFF" }
```

The palette lives in [`app/theme/colors.ts`](../app/theme/colors.ts) and [`colorsDark.ts`](../app/theme/colorsDark.ts). Prefer semantic names (`colors.text`, `colors.border`, `colors.tint`) over palette entries (`palette.neutral200`).

**Never hardcode color values.** Don't introduce hex/rgb literals or local constants like `const ACCENT_RED = "#E66565"` inside a screen or component. If no existing token fits, pause and ask whether to (a) reuse an existing close match, (b) add a new entry to both `colors.ts` and `colorsDark.ts`, or (c) hardcode as a documented exception — don't decide unilaterally. This keeps dark mode working and the palette auditable in one place.

### Shared style utilities

Check [`app/theme/typography.ts`](../app/theme/typography.ts) for shared helpers like `$tabularNums` before duplicating style fragments across screens.

## When a custom component *is* appropriate

Build one when:

1. The same JSX + styling pattern appears in **3+ places** and none of the existing primitives covers it.
2. You'd need to fork an existing primitive to add the behavior (prefer a new prop on the primitive over a parallel component).
3. It's a screen-specific composition — those stay as local sub-components in the screen file, not in `components/`.
