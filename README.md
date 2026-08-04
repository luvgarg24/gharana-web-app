# Gharana Web App

Vercel-ready web frontend for Gharana, ported from the original Expo mobile app while preserving the existing UI, layout, and shopping flow.

## Deploy

Set these Vercel environment variables when connecting Shopify:

- `EXPO_PUBLIC_SHOPIFY_STORE_DOMAIN`
- `EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN`
- `EXPO_PUBLIC_SHOPIFY_API_VERSION` (optional, defaults to `2026-01`)

The app can also run without Shopify credentials using the local fallback catalog, which keeps the UI available during migration.

## Local Development

```sh
cd frontend
yarn install
yarn start --web
```

## Production Build

```sh
cd frontend
yarn build
```

Vercel uses the root `vercel.json` and publishes `frontend/dist`.
