# Text Component

A Higher-Order Component (HOC) over React Native's built-in `Text` component with theming, i18n support, and preset styles.

**Location:** `app/components/Text.tsx`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tx` | `TxKeyPath` | - | Translation key for i18n lookup |
| `text` | `string` | - | Static text to display (used if `tx` is not provided) |
| `txOptions` | `TOptions` | - | Options passed to i18n for interpolation or locale settings |
| `style` | `StyleProp<TextStyle>` | - | Style override for padding, margin, etc. |
| `preset` | `Presets` | `"default"` | Predefined style preset |
| `weight` | `Weights` | - | Font weight modifier |
| `size` | `Sizes` | - | Font size modifier |
| `children` | `ReactNode` | - | Child components (used if `tx` and `text` are not provided) |

All standard React Native `TextProps` are also supported.

---

## Presets

| Preset | Font Size | Line Height | Font Weight | Use Case |
|--------|-----------|-------------|-------------|----------|
| `default` | 16 (sm) | 24 | normal | Body text |
| `bold` | 16 (sm) | 24 | bold | Emphasized body text |
| `heading` | 36 (xxl) | 44 | bold | Screen titles, main headings |
| `subheading` | 20 (lg) | 32 | medium | Section headers |
| `formLabel` | 16 (sm) | 24 | medium | Form field labels |
| `formHelper` | 16 (sm) | 24 | normal | Helper text below form fields |

---

## Sizes

| Size | Font Size | Line Height |
|------|-----------|-------------|
| `xxl` | 36 | 44 |
| `xl` | 24 | 34 |
| `lg` | 20 | 32 |
| `md` | 18 | 26 |
| `sm` | 16 | 24 |
| `xs` | 14 | 21 |
| `xxs` | 12 | 18 |

---

## Weights

- `light`
- `normal`
- `medium`
- `semiBold`
- `bold`

---

## Usage Examples

### Basic Text

```tsx
<Text>Hello World</Text>
```

### With Translation Key

```tsx
<Text tx="common:welcome" />
```

### With Interpolation

```tsx
<Text tx="common:greeting" txOptions={{ name: "John" }} />
```

### Using Presets

```tsx
<Text preset="heading">Dashboard</Text>
<Text preset="subheading">Recent Activity</Text>
<Text preset="formLabel">Email Address</Text>
<Text preset="formHelper">We'll never share your email</Text>
```

### Custom Size and Weight

```tsx
<Text size="lg" weight="semiBold">Important Notice</Text>
```

---

## Content Priority

1. `tx` - Translated text from i18n key
2. `text` - Static string prop
3. `children` - Child components/text

---

## Notes

- Automatically applies RTL styling when configured for RTL languages
- Uses `useAppTheme()` for theme-aware colors (adapts to light/dark mode)
- Default text color is `theme.colors.text`
