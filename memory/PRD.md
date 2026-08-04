# Gharana — Indian Quick-Commerce Grocery App

## Problem statement
Build a native Expo mobile grocery app for quality-first Indian pantry staples. The app must combine trusted sourcing and purity cues with the fast, scan-friendly shopping experience users expect from Blinkit, Swiggy Instamart, and Zomato.

## Product direction
- Dense, high-conversion quick-commerce interface rather than an editorial heritage layout
- Orange action color, green trust/delivery states, white cards, neutral app background
- Plus Jakarta Sans across headings, body, prices, and controls for clean mobile legibility
- Fast add/quantity controls, persistent floating cart access, clear delivery ETA and offer cues

## Architecture
- Frontend: Expo Router / React Native (SDK 54), Context API, AsyncStorage, expo-image, Reanimated
- Backend: FastAPI with all routes under `/api`
- Database: MongoDB through `MONGO_URL`
- Authentication: JWT email/password
- Frontend API base: `EXPO_PUBLIC_BACKEND_URL`

## Implemented
- Quick-commerce Home with ETA/location, search, promotional cards, 4-column categories, offers, product rails, product grid, and floating cart bar
- Shop with left category rail, fixed two-column product grid, category switching, add/quantity controls, and floating cart
- Compact product cards with 10-minute cue, quality badge, rating, weight switching, price, ADD, and quantity stepper
- Product detail, Cart, Account, Search, Login, and bottom tabs aligned to the new visual system
- Cart promotions, delivery choice, bill details, mock checkout, order history/tracking, addresses, subscriptions, referrals, and profile preferences
- Unique screen-scoped test IDs to prevent hidden Expo Router screens from causing ambiguous automation
- FastAPI catalog, auth, address, order, subscription, referral, recipe, promo, and delivery-zone APIs

## Verification
- TypeScript and ESLint pass
- Python backend lint passes
- Phone-sized UI flow verified: login, Home, Shop, category switch, Shop ADD to stepper, floating cart, Cart item/totals, Product Detail, Search, Account, and checkout navigation
- External Sona Masuri image 404 corrected in seed and existing database migration

## Backlog
### P0
- Google Maps address autocomplete and map pin selection in Address and Checkout
- Replace remote catalog photography with optimized owned/local product packshots

### P1
- Deeper ingredient-linked recipes on Product Detail
- Recurring subscription scheduling and delivery management
- Referral deep links and credit ledger

### P2
- Gharana Pass membership
- Batch transparency QR scanner
- WhatsApp reorder
- Personalized suggestions from order history