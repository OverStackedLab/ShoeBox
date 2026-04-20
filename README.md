# Welcome to your new ignited app!

> The latest and greatest boilerplate for Infinite Red opinions

This is the boilerplate that [Infinite Red](https://infinite.red) uses as a way to test bleeding-edge changes to our React Native stack.

- [Quick start documentation](https://github.com/infinitered/ignite/blob/master/docs/boilerplate/Boilerplate.md)
- [Full documentation](https://github.com/infinitered/ignite/blob/master/docs/README.md)

## Getting Started

### Environment Setup

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL (found in Project Settings → API) |
| `EXPO_PUBLIC_SUPABASE_KEY` | Your Supabase publishable (anon) key |

```bash
yarn install
yarn start
```

To make things work on your local simulator, or on your phone, you need first to [run `eas build`](https://github.com/infinitered/ignite/blob/master/docs/expo/EAS.md). We have many shortcuts on `package.json` to make it easier:

```bash
yarn build:ios:sim # build for ios simulator
yarn build:ios:device # build for ios device
yarn build:ios:prod # build for ios device
```

### `./assets`

This directory is designed to organize and store various assets, making it easy for you to manage and use them in your application. The assets are further categorized into subdirectories, including `icons` and `images`:

```tree
assets
├── icons
└── images
```

**icons**
This is where your icon assets will live. These icons can be used for buttons, navigation elements, or any other UI components. The recommended format for icons is PNG, but other formats can be used as well.

Ignite comes with a built-in `Icon` component. You can find detailed usage instructions in the [docs](https://github.com/infinitered/ignite/blob/master/docs/boilerplate/app/components/Icon.md).

**images**
This is where your images will live, such as background images, logos, or any other graphics. You can use various formats such as PNG, JPEG, or GIF for your images.

Another valuable built-in component within Ignite is the `AutoImage` component. You can find detailed usage instructions in the [docs](https://github.com/infinitered/ignite/blob/master/docs/Components-AutoImage.md).

How to use your `icon` or `image` assets:

```typescript
import { Image } from 'react-native';

const MyComponent = () => {
  return (
    <Image source={require('assets/images/my_image.png')} />
  );
};
```

## Supabase Edge Functions

### `categorize-receipt`

Classifies a scanned receipt into one of the user's categories using Anthropic Claude via the Vercel AI SDK.

**Location:** [supabase/functions/categorize-receipt/index.ts](supabase/functions/categorize-receipt/index.ts)

**Request body:**

```ts
{
  text?: string          // OCR'd receipt text
  storeName?: string     // Parsed merchant name
  total?: number         // Parsed total
  categories: { id: string; label: string }[]  // Allowed category ids
}
```

**Response:**

```ts
{ categoryId: string; confidence: number }
```

The function uses `generateObject` with a Zod `z.enum(ids)` schema so the model is constrained to return one of the provided category ids.

**Client usage:** [app/services/ai/categorizeReceipt.ts](app/services/ai/categorizeReceipt.ts) wraps `supabase.functions.invoke("categorize-receipt", …)`. It's called automatically after scanning a receipt in [HomeScreen.tsx](app/screens/HomeScreen.tsx), and manually via the magic-wand header action in [ReceiptDetailScreen.tsx](app/screens/ReceiptDetailScreen.tsx).

**Setup:**

```bash
# Set the Anthropic API key as a function secret (once)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# Deploy
supabase functions deploy categorize-receipt
```

**Local development:**

```bash
supabase functions serve categorize-receipt --env-file supabase/.env.local
# .env.local must contain ANTHROPIC_API_KEY=sk-ant-...
```

**Security note:** by default the function accepts any caller presenting your Supabase anon key (which ships in the app bundle). To restrict to authenticated users, verify the JWT from the `Authorization` header inside the handler with `supabase.auth.getUser()`.

## Running Maestro end-to-end tests

Follow our [Maestro Setup](https://ignitecookbook.com/docs/recipes/MaestroSetup) recipe.

## Next Steps

### Ignite Cookbook

[Ignite Cookbook](https://ignitecookbook.com/) is an easy way for developers to browse and share code snippets (or “recipes”) that actually work.

### Upgrade Ignite boilerplate

Read our [Upgrade Guide](https://ignitecookbook.com/docs/recipes/UpdatingIgnite) to learn how to upgrade your Ignite project.

## Community

⭐️ Help us out by [starring on GitHub](https://github.com/infinitered/ignite), filing bug reports in [issues](https://github.com/infinitered/ignite/issues) or [ask questions](https://github.com/infinitered/ignite/discussions).

💬 Join us on [Slack](https://join.slack.com/t/infiniteredcommunity/shared_invite/zt-1f137np4h-zPTq_CbaRFUOR_glUFs2UA) to discuss.

📰 Make our Editor-in-chief happy by [reading the React Native Newsletter](https://reactnativenewsletter.com/).
